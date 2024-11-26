# Steam Store Page GIF Generator

Download it from the [latest GitHub Release](https://github.com/bscotch/steam-gifs/releases).

https://github.com/user-attachments/assets/6a253723-0861-4f7b-acd8-df8869d422f3

The long-form descriptions on Steam Store pages allow GIFs, but not videos. GIFs are a garbage format: it's very hard to get a GIF that looks good but isn't enormous, and enormous files are terrible for user experience.

To have decent animated content on store pages, without kicking viewers out due to slow loading times, you need to find some balance between quality and size.

This project helps to create quality GIFs at (relatively) small sizes, by using ffmpeg to perform a series of transformations on a source video.

For the best results, your source video should:

- Be super short in duration (a few seconds)
- Be designed to loop nicely
- Look decent when scaled down to ~600px wide

If you've got a good starting point, these generators should give you respectable results!

## Requires ffmpeg

If you don't already have `ffmpeg` (and `ffprobe`, which typically comes with it) on your system and in your `PATH`, you'll need to get it. I'll leave you to the Internet to figure that out, but here's some _rough_ guidance:

- Download `ffmpeg` if you don't have it. It doesn't have an installer, and consists of 3 `.exe` files. You can get them from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) as 7zip archives. Note that if you use a package manager things might not work as expected on your path. My strategy is to unzip the archive, rename the archive's folder to `ffmpeg`, and then drop that whole thing into my `C:\Program Files\` directory.
- Ensure that the folder containing the ffmpeg binaries is in your Path variables (may require some googling if you aren't familiar). I added `C:\Program Files\ffmpeg\bin\`, for example.
- Open up a terminal and try running `ffmpeg` to make sure it gets discovered. If it isn't found, then your `PATH` variables aren't set up properly. (Note you may have to restart your terminal to reload your Path variables.)

## Usage

Run the executable, and it should be straight forward from there!

## Development, Compiling, and Distribution

This is a [Tauri app](https://v2.tauri.app/), so it's built on Rust. It uses [Svelte](https://svelte.dev/) for the UI.

To run the project locally, you'll need to follow Tauri's setup instructions, have Node installed, have `pnpm` installed, and then run `pnpm install` followed by `pnpm tauri dev` in this folder. Then it'll be running!

Note that Tauri is a cross-platform system and this project doesn't use any Windows-only features, so you should be able to compile it for Linux or Mac. It seems to work when compiled for Linux, but I haven't tried it on MacOS.

## Contributing

Feel free to fork this project and make your own modifications. If those changes either have tests or aren't likely to need long-term maintenance, submit a Pull Request! For complex changes, make an [Issue](https://github.com/bscotch/steam-gifs/issues) first for discussion.

I'd definitely appreciate help automating releases, in particular for non-Windows builds.

## How it works

This app is just a GUI on top of some ffmpeg transformations. Those commands look something like this:

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

You can run related commands yourself without needing this app at all. It just gets tedious and error-prone: this app takes care of the annoying bits for you.
