use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::process::Command;

// Function to strip surrounding quotes if present
fn strip_quotes(path: &str) -> &str {
    path.trim_matches('"')
}

fn main() {
    // Get the input video file path
    print!("Path to the source video file: ");
    io::stdout().flush().unwrap();
    let mut input_path = String::new();
    io::stdin().read_line(&mut input_path).expect("Failed to read input path");
    let input_path = input_path.trim();

    // Strip surrounding quotes if any
    let input_path = strip_quotes(input_path);
    let input_path = Path::new(input_path);

    // Check if the input file exists
    if !input_path.exists() {
        eprintln!("Error: Input file not found.");
        return;
    }

    let input_path_str = input_path.to_str().unwrap();

    // Get the FPS from the user, defaulting to 15
    print!("Enter FPS (default is 15): ");
    io::stdout().flush().unwrap();
    let mut fps_input = String::new();
    io::stdin().read_line(&mut fps_input).expect("Failed to read FPS");
    let fps: u32 = fps_input.trim().parse().unwrap_or(15);

    // Prepare output file names
    let steam_video = format!("{}_steam.mp4", input_path_str.trim_end_matches(".mp4"));
    let palette_file = input_path.with_file_name("palette.png");
    let gif_output = format!("{}_steam.gif", input_path_str.trim_end_matches(".mp4"));

    // Run the ffmpeg commands
    // 1. Scale the video
    let scale_command = format!("ffmpeg -y -i {} -vf scale=616:-2 {}", input_path_str, steam_video);
    println!("Running command: {}", scale_command);
    let scale_status = Command::new("ffmpeg")
        .args(&["-y", "-i", input_path_str, "-vf", "scale=616:-2", &steam_video])
        .status()
        .expect("Failed to execute ffmpeg scaling");

    if !scale_status.success() {
        eprintln!("Failed to scale video.");
        return;
    }

    // 2. Generate the palette in the source video directory
    let palette_command = format!(
        "ffmpeg -y -i {} -vf fps={},palettegen {}",
        steam_video, fps, palette_file.display()
    );
    println!("Running command: {}", palette_command);
    let palette_status = Command::new("ffmpeg")
        .args(&["-y", "-i", &steam_video, "-vf", &format!("fps={},palettegen", fps), palette_file.to_str().unwrap()])
        .status()
        .expect("Failed to execute ffmpeg palette generation");

    if !palette_status.success() {
        eprintln!("Failed to generate palette.");
        return;
    }

    // 3. Create the GIF using the palette
    let gif_command = format!(
        "ffmpeg -y -i {} -i {} -filter_complex [0:v]fps={}[v];[v][1:v]paletteuse {}",
        steam_video, palette_file.display(), fps, gif_output
    );
    println!("Running command: {}", gif_command);
    let gif_status = Command::new("ffmpeg")
        .args(&[
            "-y",
            "-i",
            &steam_video,
            "-i",
            palette_file.to_str().unwrap(),
            "-filter_complex",
            &format!("[0:v]fps={}[v];[v][1:v]paletteuse", fps),
            &gif_output,
        ])
        .status()
        .expect("Failed to execute ffmpeg GIF creation");

    if !gif_status.success() {
        eprintln!("Failed to create GIF.");
        return;
    }

    // Delete the palette file
    if let Err(e) = fs::remove_file(&palette_file) {
        eprintln!("Failed to delete palette file: {}", e);
    } else {
        println!("Palette file deleted successfully.");
    }

    println!("\nGIF created successfully: {}", gif_output);
}
