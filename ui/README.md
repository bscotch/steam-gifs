# Steam Store Page GIF Generator (UI Version)

_For the CLI version, [see its README](../cli/README.md)._

_See the [General Info & Requirements](../README.md)._

Download it from the [latest GitHub Release](https://github.com/bscotch/steam-gifs/releases).

## Requirements

- Only runs on Windows!
- `ffmpeg` (and `ffprobe`, which often comes with it) must be available on your path.

## Usage

Run the executable, and it should be straight forward from there!

## Development

This is a [Tauri app](https://v2.tauri.app/), so it's built on Rust. It uses [Svelte](https://svelte.dev/) for the UI.

To run the project locally, you'll need to follow Tauri's setup instructions, have Node installed, have `pnpm` installed, and then run `pnpm install` followed by `pnpm tauri dev` in this folder. Then you should be good to go!

Note that Tauri is a cross-platform system and this project doesn't use any Windows-only features, so you should be able to compile it for Linux or Mac. It seems to work when compiled for Linux, but I haven't tried it on MacOS.
