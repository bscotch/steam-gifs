# Steam Store Page GIF Generator

The long-form descriptions on Steam Store pages allow GIFs, but not videos. GIFs are a garbage format: it's very hard to get a GIF that looks good but isn't enormous, and enormous files are terrible for user experience.

To have decent animated content on store pages, without kicking viewers out due to slow loading times, you need to find some balance between quality and size.

This project helps to create quality GIFs at (relatively) small sizes, by using ffmpeg to perform a series of transformations on a source video.

For the best results, your source video should:

- Be super short in duration (a few seconds)
- Be designed to loop nicely
- Look decent when scaled down to ~600px wide

If you've got a good starting point, this little CLI tool should give you respectable results!

## Usage

Run the `steam-gifs.exe` executable. It'll prompt you for a path to your source video, then ask for an output FPS. And that's it! A new video and GIF file will be output at the same location, with the same name as the source except post-fixed with `_steam.gif`.

> [!WARNING]  
> Output files are always overwritten, without confirmation. Make sure you have backups!

## Installation

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
