# Steam Store Page GIF Generator

The long-form descriptions on Steam Store pages allow GIFs, but not videos. GIFs are a garbage format: it's very hard to get a GIF that looks good but isn't enormous, and enormous files are terrible for user experience.

To have decent animated content on store pages, without kicking viewers out due to slow loading times, you need to find some balance between quality and size.

This project helps to create quality GIFs at (relatively) small sizes, by using ffmpeg to perform a series of transformations on a source video.

For the best results, your source video should:

- Be super short in duration (a few seconds)
- Be designed to loop nicely
- Look decent when scaled down to ~600px wide

If you've got a good starting point, this little CLI tool should give you respectable results!

## How it works

All this CLI tool does is run a series of ffmpeg operations on your source video, like this:

```bash
# Create a down-scaled video.
# (Note that the -2 means autoscale the width, but round to an even number)
ffmpeg -y -i source-video.mp4 -vf "scale=616:-2" source-video_steam.mp4

# Create a color palette
# (You can experiment with different FPS values)
ffmpeg -y -i source-video_steam.mp4 -vf "fps=15,palettegen" palette.png

# Use the down-scaled video and color palette to
# generate a respectable GIF
ffmpeg -y -i source-video_steam.mp4 -i palette.png -filter_complex "[0:v]fps=15[v];[v][1:v]paletteuse" source-video_steam.gif
```

You can run these commands yourself without needing this CLI tool at all. It just gets tedious and error-prone: this little program takes care of the annoying bits for you (changing the commands to match your video name and target FPS).

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

## Installation

> [!NOTE]
> Only works on Windows. (It probably wouldn't be difficult to port it to Mac/Linux, if someone wants to contribute!)

Download [the latest `steam-gifs.exe`](https://github.com/bscotch/steam-gifs/releases) executable somewhere on your machine. Depending on your setup, you might be able to double-click it to run it directly, or you can run it via a terminal.

### Ensure ffmpeg is available in your PATH variables

- Download ffmpeg if you don't have it. It doesn't have an installer, and consists of 3 `.exe` files. You can get them from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) as 7zip archives. Note that if you use a package manager things might not work as expected on your path. My strategy is to unzip the archive, rename the archive's folder to `ffmpeg`, and then drop that whole thing into my `C:\Program Files\` directory.
- Ensure that the folder containing the ffmpeg binaries is in your Path variables (may require some googling if you aren't familiar). I added `C:\Program Files\ffmpeg\bin\`, for example.
- Open up a terminal and try running `ffmpeg` to make sure it gets discovered. If it isn't found, then your path variables aren't set up properly. (Note you may have to restart your terminal to reload your Path variables.)

## Development

Ensure you've got a compatible version of Rust installed, then just run `cargo run` to compile and run the program.

Update `src/main.rs` to fix bugs or add features.

## Creating releases

Since this isn't intended to be a complex project, things are quite manual!

1. Compile a release executable: `cargo build --release`
2. Zip up `./target/release/steam-gifs.exe`
3. Upload it as a release on GitHub