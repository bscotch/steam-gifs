use std::fs;
use std::io::{self, Write};
use std::path::Path;
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
    io::stdin()
        .read_line(&mut input_path)
        .expect("Failed to read input path");
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
    io::stdin()
        .read_line(&mut fps_input)
        .expect("Failed to read FPS");
    let fps: u32 = fps_input.trim().parse().unwrap_or(15);

    // Get the start time
    print!("Enter the start time (HH:MM:SS, default is 00:00:00): ");
    io::stdout().flush().unwrap();
    let mut start_time_input = String::new();
    io::stdin().read_line(&mut start_time_input).unwrap();
    let start_time = if start_time_input.trim().is_empty() {
        None
    } else {
        Some(start_time_input.trim())
    };

    // Get the end time time
    print!("Enter the end time (HH:MM:SS, default to the video's end): ");
    io::stdout().flush().unwrap();

    let mut end_time_input = String::new();
    io::stdin().read_line(&mut end_time_input).unwrap();
    let end_time = if end_time_input.trim().is_empty() {
        None
    } else {
        Some(end_time_input.trim())
    };

    // Get the crop filter
    print!("Enter crop filter (width:height:x:y, defaults to entire area): ");
    io::stdout().flush().unwrap();
    let mut crop_filter_input = String::new();
    io::stdin().read_line(&mut crop_filter_input).unwrap();
    let crop_filter = if crop_filter_input.trim().is_empty() {
        None
    } else {
        Some(crop_filter_input.trim())
    };

    // Get the number of colors from the user, defaulting to 128
    print!("Enter number of colors (default is 90): ");
    io::stdout().flush().unwrap();
    let mut colors_input = String::new();
    io::stdin()
        .read_line(&mut colors_input)
        .expect("Failed to read number of colors");
    let colors: u32 = colors_input.trim().parse().unwrap_or(90);

    // Prepare output file names
    let steam_video = format!("{}_steam.mp4", input_path_str.trim_end_matches(".mp4"));
    let palette_file = input_path.with_file_name("palette.png");
    let gif_output = format!("{}_steam.gif", input_path_str.trim_end_matches(".mp4"));

    let mut new_video_args = vec!["-y", "-i", input_path_str];

    let mut vf_filters: Vec<&str> = vec![];

    let crop_filter_str;
    if let Some(crop) = crop_filter {
        crop_filter_str = format!("crop={}", crop);
        vf_filters.push(&crop_filter_str);
    }
    vf_filters.push("scale=616:-2");

    let vf_filters_str = vf_filters.join(",");
    new_video_args.push("-vf");
    new_video_args.push(&vf_filters_str);

    if let Some(start) = start_time {
        new_video_args.push("-ss");
        new_video_args.push(start);
    }

    if let Some(end) = end_time {
        new_video_args.push("-to");
        new_video_args.push(end);
    }

    new_video_args.push(&steam_video);

    let scale_status = Command::new("ffmpeg")
        .args(&new_video_args)
        .status()
        .expect("Failed to execute ffmpeg scaling");

    if !scale_status.success() {
        eprintln!("Failed to scale video.");
        return;
    }

    // 2. Generate the palette in the source video directory
    let palette_command = format!(
        "ffmpeg -y -i {} -vf fps={},palettegen=max_colors={} {}",
        steam_video,
        fps,
        colors,
        palette_file.display()
    );
    println!("Running command: {}", palette_command);
    let palette_status = Command::new("ffmpeg")
        .args(&[
            "-y",
            "-i",
            &steam_video,
            "-vf",
            &format!("fps={},palettegen=max_colors={}", fps, colors),
            palette_file.to_str().unwrap(),
        ])
        .status()
        .expect("Failed to execute ffmpeg palette generation");

    if !palette_status.success() {
        eprintln!("Failed to generate palette.");
        return;
    }

    // 3. Create the GIF using the palette
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
