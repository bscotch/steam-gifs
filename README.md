# Steam Store Page GIF Generators

- [GUI Version](./ui/README.md)
- [CLI Version](./cli/README.md)

The long-form descriptions on Steam Store pages allow GIFs, but not videos. GIFs are a garbage format: it's very hard to get a GIF that looks good but isn't enormous, and enormous files are terrible for user experience.

To have decent animated content on store pages, without kicking viewers out due to slow loading times, you need to find some balance between quality and size.

This project helps to create quality GIFs at (relatively) small sizes, by using ffmpeg to perform a series of transformations on a source video.

For the best results, your source video should:

- Be super short in duration (a few seconds)
- Be designed to loop nicely
- Look decent when scaled down to ~600px wide

If you've got a good starting point, these generators should give you respectable results!

## Requires ffmpeg!

- Download `ffmpeg` (and `ffprobe`, which typically comes with it) if you don't have it. It doesn't have an installer, and consists of 3 `.exe` files. You can get them from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) as 7zip archives. Note that if you use a package manager things might not work as expected on your path. My strategy is to unzip the archive, rename the archive's folder to `ffmpeg`, and then drop that whole thing into my `C:\Program Files\` directory.
- Ensure that the folder containing the ffmpeg binaries is in your Path variables (may require some googling if you aren't familiar). I added `C:\Program Files\ffmpeg\bin\`, for example.
- Open up a terminal and try running `ffmpeg` to make sure it gets discovered. If it isn't found, then your path variables aren't set up properly. (Note you may have to restart your terminal to reload your Path variables.)

## How it works

All these tools do is run a series of ffmpeg operations on your source video, something like this:

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

You can run these commands yourself without needing these tools at all. It just gets tedious and error-prone: these tools take care of the annoying bits for you (changing the commands to match your video name and target FPS).
