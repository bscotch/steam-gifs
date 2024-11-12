# Steam Store Page GIF Generator

## Ensure ffmpeg is available in your PATH variables

- Download ffmpeg if you don't have it. It doesn't have an installer, and consists of 3 `.exe` files. You can get them from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) as 7zip archives. Note that if you use a package manager things might not work as expected on your path. My strategy is to unzip the archive, rename the archive's folder to `ffmpeg`, and then drop that whole thing into my `C:\Program Files\` directory.
- Ensure that the folder containing the ffmpeg binaries is in your Path variables (may require some googling if you aren't familiar). I added `C:\Program Files\ffmpeg\bin\`, for example.
- Open up a terminal and try running `ffmpeg` to make sure it gets discovered. If it isn't found, then your path variables aren't set up properly. (Note you may have to restart your terminal to reload your Path variables.)
