import { appCacheDir, sep } from "@tauri-apps/api/path";
import { exists, mkdir, readFile } from "@tauri-apps/plugin-fs";
import { Command } from "@tauri-apps/plugin-shell";
import { assert } from "./errors.js";

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  fps: number;
}
export const videoMetadataFields = [
  "width",
  "height",
  "duration",
  "fps",
] as const;

export interface Crop {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

export interface GifOutputParams {
  crop: Crop;
  trim: {
    start: number;
    end: number;
  };
  colors: number;
  fps: number;
}

export const supportedVideoExtensions = [
  "mp4",
  // Not actually sure the rest of these work...
  "mov",
  "avi",
  "wmv",
  // "webm", // doesn't work -- can't probe etc
  "mkv",
  "flv",
  "vob",
  "ogv",
  "ogg",
];

export async function loadVideoMetadata(path: string): Promise<VideoMetadata> {
  assert(await exists(path), `Video not found!`);
  console.log("Preparing to run ffprobe on", path);
  let ffprobeResult = await Command.create("ffprobe", [
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_streams",
    "-select_streams",
    "v:0",
    path,
  ]).execute();
  console.log("ffprobe result", ffprobeResult);
  assert(
    ffprobeResult.code === 0,
    "Failed to get video metadata. Make sure ffprobe is available in your PATH."
  );
  const metadata = JSON.parse(ffprobeResult.stdout);
  assert("streams" in metadata, "No video streams found in metadata");
  assert(Array.isArray(metadata.streams), "Video streams is not an array");
  assert(metadata.streams.length > 0, "No video streams found in metadata");
  const streamInfo = metadata.streams[0];
  const { width, height, duration, codec_name, avg_frame_rate } = streamInfo;
  const [frames, seconds] = avg_frame_rate.split("/");
  assert(frames && seconds, "Failed to parse frame rate");
  const fps = Number(frames) / Number(seconds);
  console.log(streamInfo);
  return {
    width,
    height,
    duration: Number(duration),
    fps,
  };
}

export async function loadVideo(path: string) {
  assert(await exists(path), `Video not found!`);
  const data = await readFile(path);
  assert(data?.length, "Failed to read video file");
  return data;
}

/**
 * Create a new video file with the specified edits applied,
 * plus the default resizing for Steam. Saves the file to temporary files.
 * @returns The path to the new video file.
 */
export async function createEditedVideo(
  sourcePath: string,
  edits: GifOutputParams
): Promise<string> {
  const sourceMetadata = await loadVideoMetadata(sourcePath);
  const sourceParts = pathParts(sourcePath);
  let outNameSuffix = "-steam";
  const ffmpegArgs: string[] = ["-i", sourcePath];
  let filters: string = "";
  let widthAfterCrop = sourceMetadata.width;
  if (
    edits.crop.left ||
    edits.crop.right ||
    edits.crop.top ||
    edits.crop.bottom
  ) {
    widthAfterCrop =
      sourceMetadata.width - orZero(edits.crop.left) - orZero(edits.crop.right);
    const height =
      sourceMetadata.height -
      orZero(edits.crop.top) -
      orZero(edits.crop.bottom);
    const cropString = `${widthAfterCrop}:${height}:${edits.crop.left || 0}:${
      edits.crop.top || 0
    }`;
    filters += `crop=${cropString},`;
    outNameSuffix += `-${cropString}`;
  }
  // The output should be UP TO 616 pixels for Steam, but can be
  // smaller if the source would be (after cropping).
  const scaledWidth = Math.min(widthAfterCrop, 616);
  filters += `scale=${scaledWidth}:-2`;
  ffmpegArgs.push("-vf", filters);
  if (edits.trim.start !== 0) {
    const start = secondsToFfmpegTimeString(edits.trim.start);
    ffmpegArgs.push("-ss", start);
    outNameSuffix += `-${start}`;
  }
  if (edits.trim.end !== sourceMetadata.duration) {
    const end = secondsToFfmpegTimeString(edits.trim.end);
    ffmpegArgs.push("-to", end);
    outNameSuffix += `-${end}`;
  }
  ffmpegArgs.push("-an"); // Remove audio

  const outDir = `${await workingDir()}${sourceParts.name}`;
  console.log("Creating directory", outDir);
  await mkdir(outDir, { recursive: true });
  console.log("Created directory", outDir);
  let outPath = `${outDir}${sep()}${sourceParts.name}${outNameSuffix.replaceAll(
    ":",
    "."
  )}.mp4`;
  ffmpegArgs.push(outPath);
  console.log("Preparing to run ffmpeg with args", ffmpegArgs);
  const ffmpegResult = await Command.create("ffmpeg", ffmpegArgs).execute();
  if (ffmpegResult.code !== 0) {
    console.error(ffmpegResult);
    console.error(ffmpegResult.stderr);
  }
  assert(
    ffmpegResult.code === 0,
    "Failed to create edited video. Make sure ffmpeg is available in your PATH."
  );
  return outPath;
}

export async function createGif(
  sourcePath: string,
  settings: GifOutputParams
): Promise<string> {
  const palettePath = await computeGifOutputPath(sourcePath, settings, "png");
  const gifPath = await computeGifOutputPath(sourcePath, settings);

  // Create the palette file
  const ffmpegPaletteArgs = [
    "-i",
    sourcePath,
    "-vf",
    `fps=${settings.fps},palettegen=max_colors=${settings.colors}`,
    palettePath,
  ];
  console.log("Preparing to run ffmpeg with args", ffmpegPaletteArgs);
  let ffmpegResult = await Command.create(
    "ffmpeg",
    ffmpegPaletteArgs
  ).execute();
  console.log("ffmpeg result", ffmpegResult);
  assert(
    ffmpegResult.code === 0,
    "Failed to create palette. Make sure ffmpeg is available in your PATH."
  );

  // Create the GIF
  const ffmpegGifArgs = [
    "-i",
    sourcePath,
    "-i",
    palettePath,
    "-filter_complex",
    `[0:v]fps=${settings.fps}[v];[v][1:v]paletteuse`,
    gifPath,
  ];
  console.log("Preparing to run ffmpeg with args", ffmpegGifArgs);
  ffmpegResult = await Command.create("ffmpeg", ffmpegGifArgs).execute();
  console.log("ffmpeg result", ffmpegResult);
  assert(
    ffmpegResult.code === 0,
    "Failed to create GIF. Make sure ffmpeg is available in your PATH."
  );
  return gifPath;
}

function secondsToFfmpegTimeString(seconds: number | string): string {
  // Create a HH:MM:SS string from a number of seconds
  let timeString = "";
  let remaining = Number(seconds);
  const hours = Math.floor(remaining / 3600);
  remaining -= hours * 3600;
  const minutes = Math.floor(remaining / 60);
  remaining -= minutes * 60;
  const secondsInt = Math.floor(remaining);
  if (hours > 0) {
    timeString += `${hours}:`;
  }
  if (minutes < 10) {
    timeString += "0";
  }
  timeString += `${minutes}:`;
  if (secondsInt < 10) {
    timeString += "0";
  }
  timeString += `${secondsInt}`;
  return timeString;
}

export function pathParts(path: string): {
  dir: string;
  base: string;
  name: string;
  ext: string;
} {
  path = path.replace(/\\/g, "/");
  const match = path.match(/^(.*\/)(([^\/]+)\.([^\/.]+))$/);
  if (!match) {
    throw new Error(`Failed to parse path: ${path}`);
  }
  const [, dir, base, name, ext] = match;
  return { dir, name, base, ext };
}

export async function workingDir(): Promise<string> {
  let cache = await appCacheDir();
  if (!cache.endsWith(sep())) {
    cache += sep();
  }
  return `${cache}videos${sep()}`;
}

export function computeDefaultVideoEditParams(
  videoMetadata?: VideoMetadata
): GifOutputParams {
  return {
    crop: {},
    trim: {
      start: 0,
      end: videoMetadata?.duration || 0,
    },
    fps: videoMetadata?.fps || 30,
    colors: 90,
  };
}

/**
 * Given the path to the original video, create a path in the cache directory for the palette file or final GIF, based on the settings.
 */
async function computeGifOutputPath(
  sourcePath: string,
  config: GifOutputParams,
  extension = "gif"
) {
  const sourceParts = pathParts(sourcePath);
  let suffix = "";
  for (const [field, value] of Object.entries(config)) {
    if (!value) {
      continue;
    }
    suffix += `-${field}`;
    if (typeof value === "object") {
      for (const [innerField, innerValue] of Object.entries(value)) {
        if (!innerValue) continue;
        suffix += `.${innerField}.${innerValue}`;
      }
    } else {
      suffix += `.${value}`;
    }
  }
  return `${await workingDir()}${sourceParts.name}${suffix}.${extension}`;
}

export async function pathToObjectUrl(
  path: string
): Promise<{ data: Uint8Array; objectUrl: string }> {
  const data = await readFile(path);
  return { data, objectUrl: URL.createObjectURL(new Blob([data])) };
}

export function orZero(val: number | undefined | null): number {
  return val || 0;
}
