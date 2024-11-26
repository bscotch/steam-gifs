# Steam Store Page GIF Generator (CLI Version)

_For the UI version, [see its README](../ui/README.md)._

_See the [General Info & Requirements](../README.md)._

Download it from the [latest GitHub Release](https://github.com/bscotch/steam-gifs/releases).

## Usage

Run the [`steam-gifs.exe` executable](https://github.com/bscotch/steam-gifs/releases). It'll prompt you for a path to your source video, then ask for an output FPS. And that's it! A new video and GIF file will be output at the same location, with the same name as the source except post-fixed with `_steam.gif`.
Run the `steam-gifs.exe` executable. It'll prompt you for a path to your source video, then prompt you to override some defaults:

- **FPS**. The frames/second in the output GIF. Dramatically impacts smoothness and output size, so this is a powerful level to balance.
- **Trim**
  - **Start time**. The output video will be clipped starting at this time. Must match the format pattern, e.g `00:00:01` to start after the first second, or `00:00:00.5` to start after the first half-second.
  - **End time**. Same idea!
- **Crop**. If you need to crop the video, you can specify those dimensions. Must match the format `width:height:x:y`. For example, to crop out a 616x300px region, where that region's top-left corner starts at (33px, 120px), you'd have `616:300:33:120`.
- **Colors**. If you limit the colors in the palette you can get significantly smaller outputs. Can go up to 256. For most videos you can get pretty low without things getting noticeably worse.

And that's it! A new video and GIF file will be output at the same location, with the same name as the source except post-fixed with `_steam.gif`.

> [!WARNING]  
> Output files are always overwritten, without confirmation. Make sure you have backups!

## Development

Ensure you've got a compatible version of Rust installed, then just run `cargo run` to compile and run the program.

Update `src/main.rs` to fix bugs or add features.

## Creating releases

Since this isn't intended to be a complex project, things are quite manual!

1. Compile a release executable: `cargo build --release`
2. Zip up `./target/release/steam-gifs.exe`
3. Upload it as a release on GitHub
