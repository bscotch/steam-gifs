import { exists, readFile } from "@tauri-apps/plugin-fs";
import { Command } from "@tauri-apps/plugin-shell";
import { assert } from "./errors.js";

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  codec: string;
  frameRate: number;
}
export const videoMetadataFields = [
  "width",
  "height",
  "duration",
  "frameRate",
  "codec",
] as const;

export async function loadVideoMetadata(path: string): Promise<VideoMetadata> {
  assert(await exists(path), `Video not found!`);
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
  const framesPerSecond = Number(frames) / Number(seconds);
  console.log(streamInfo);
  return {
    width,
    height,
    duration: Number(duration),
    codec: codec_name,
    frameRate: framesPerSecond,
  };
}

export async function loadVideo(path: string) {
  assert(await exists(path), `Video not found!`);
  const data = await readFile(path);
  assert(data?.length, "Failed to read video file");
  return data;
}
