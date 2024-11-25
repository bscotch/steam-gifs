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

export interface EditedVideoParams {
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  trim: {
    start: number;
    end: number;
  };
}

export interface GifOutputSettings {
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
  edits: EditedVideoParams
): Promise<string> {
  const sourceMetadata = await loadVideoMetadata(sourcePath);
  const sourceParts = pathParts(sourcePath);
  let outNameSuffix = "-steam";
  const ffmpegArgs: string[] = ["-i", sourcePath];
  let filters: string = "";
  if (
    edits.crop.x !== 0 ||
    edits.crop.y !== 0 ||
    edits.crop.width !== sourceMetadata.width ||
    edits.crop.height !== sourceMetadata.height
  ) {
    const cropString = `${edits.crop.width}:${edits.crop.height}:${edits.crop.x}:${edits.crop.y}`;
    filters += `crop=${cropString},`;
    outNameSuffix += `-${cropString}`;
  }
  filters += "scale=616:-2";
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
  const outDir = `${await workingDir()}${sourceParts.name}`;
  console.log("Creating directory", outDir);
  await mkdir(outDir, { recursive: true });
  console.log("Created directory", outDir);
  let outPath = `${outDir}${sep()}${sourceParts.name}${outNameSuffix}.${
    sourceParts.ext
  }`;
  ffmpegArgs.push(outPath);
  console.log("Preparing to run ffmpeg with args", ffmpegArgs);
  const ffmpegResult = await Command.create("ffmpeg", ffmpegArgs).execute();
  if (ffmpegResult.code !== 0) {
    console.error(ffmpegResult);
  }
  assert(
    ffmpegResult.code === 0,
    "Failed to create edited video. Make sure ffmpeg is available in your PATH."
  );
  return outPath;
}

export async function createGif(
  sourcePath: string,
  settings: GifOutputSettings
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
  return new Date(Number(seconds) * 1000).toISOString().slice(11, 8);
}

function pathParts(path: string): {
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
): EditedVideoParams {
  return {
    crop: {
      x: 0,
      y: 0,
      width: videoMetadata?.width || 0,
      height: videoMetadata?.height || 0,
    },
    trim: {
      start: 0,
      end: videoMetadata?.duration || 0,
    },
  };
}

/**
 * Given the path to the original video, create a path in the cache directory for the palette file or final GIF, based on the settings.
 */
async function computeGifOutputPath(
  sourcePath: string,
  config: GifOutputSettings,
  extension = "gif"
) {
  const sourceParts = pathParts(sourcePath);
  let suffix = "";
  for (const [field, value] of Object.entries(config)) {
    if (!value) {
      continue;
    }
    suffix += `-${field}:${value}`;
  }
  return `${await workingDir()}${sourceParts.name}${suffix}.${extension}`;
}

export async function pathToObjectUrl(path: string): Promise<string> {
  const data = await readFile(path);
  return URL.createObjectURL(new Blob([data]));
}
