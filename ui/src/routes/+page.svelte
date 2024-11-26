<script lang="ts">
  import { open } from "@tauri-apps/plugin-dialog";
  import Bytes from "../lib/Bytes.svelte";
  import EmptyVideo from "../lib/EmptyVideo.svelte";
  import GithubIcon from "../lib/icons/GithubIcon.svelte";
  import SteamVideo from "../lib/SteamVideo.svelte";
  import {
    computeDefaultVideoEditParams,
    createEditedVideo,
    createGif,
    loadVideoMetadata,
    orZero,
    pathParts,
    pathToObjectUrl,
    supportedVideoExtensions,
    videoMetadataFields,
    type GifOutputParams,
    type VideoMetadata,
  } from "../lib/video.js";

  // import { invoke } from "@tauri-apps/api/core";

  let videoPath: string | null = $state(null);
  let videoMetadata: VideoMetadata | null = $state(null);

  let nextGifParams: GifOutputParams = $state(computeDefaultVideoEditParams());
  let awaitingGif = $state(false);
  let cropDims: { width: number; height: number } | null = $derived.by(() => {
    if (videoMetadata) {
      return {
        width:
          videoMetadata.width -
          orZero(nextGifParams.crop.left) -
          orZero(nextGifParams.crop.right),
        height:
          videoMetadata.height -
          orZero(nextGifParams.crop.top) -
          orZero(nextGifParams.crop.bottom),
      };
    }
    return null;
  });

  let createdGifs: {
    gifPath: string;
    gifObjectUrl: string;
    gifBytes: number;
    videoPath: string;
    videoObjectUrl: string;
    videoBytes: number;
    settings: GifOutputParams;
  }[] = $state([]);

  let logs: string[] = $state([]);

  function log(message: string) {
    logs = [message, ...logs];
  }

  async function logOnError(fn: () => any) {
    try {
      await fn();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      log(message);
    }
  }

  async function chooseVideo() {
    await logOnError(async () => {
      const newVideoPath = await open({
        multiple: false,
        directory: false,
        title: "Choose a video file",
        filters: [{ name: "Videos", extensions: supportedVideoExtensions }],
      });
      if (!newVideoPath) return;
      videoPath = newVideoPath;
      videoMetadata = await loadVideoMetadata(videoPath);
      // Update the edit params
      nextGifParams = computeDefaultVideoEditParams(videoMetadata);
      createdGifs = [];
    });
  }

  async function createNextGif() {
    awaitingGif = true;
    await logOnError(async () => {
      const settings = $state.snapshot(nextGifParams);
      console.log("Creating GIF with settings", settings);
      const editedVideoPath = await createEditedVideo(videoPath!, settings);
      const outputGifPath = await createGif(editedVideoPath, settings);
      const [gifData, videoData] = await Promise.all([
        pathToObjectUrl(outputGifPath),
        pathToObjectUrl(editedVideoPath),
      ]);
      createdGifs = [
        {
          gifPath: outputGifPath,
          gifObjectUrl: gifData.objectUrl,
          gifBytes: gifData.data.length,
          videoPath: editedVideoPath,
          videoObjectUrl: videoData.objectUrl,
          videoBytes: videoData.data.length,
          settings,
        },
        ...createdGifs,
      ];
    });
    awaitingGif = false;
  }

  /** Make sure that the crop params all make sense together. */
  function fixCropParams() {
    // Set undefineds to defaults
    for (const key of ["left", "right", "top", "bottom"] as const) {
      if (!nextGifParams.crop[key]) {
        nextGifParams.crop[key] = undefined;
      }
    }
    if (cropDims && cropDims.width <= 0) {
      // Not obvious how to fix, just reset
      nextGifParams.crop.right = undefined;
      nextGifParams.crop.left = undefined;
    }
    if (cropDims && cropDims.height <= 0) {
      // Not obvious how to fix, just reset
      nextGifParams.crop.top = undefined;
      nextGifParams.crop.bottom = undefined;
    }
  }
</script>

<main class="container">
  {#key videoPath}
    <section id="source">
      <section id="source-video">
        {#if videoPath}
          <SteamVideo path={videoPath} crop={nextGifParams.crop} />
        {:else}
          <EmptyVideo>
            <button type="button" onclick={chooseVideo}
              >Choose Source Video</button
            >
          </EmptyVideo>
        {/if}
      </section>
      {#if videoPath}
        <section id="editor">
          <!-- Chooser -->

          <!-- Source Details -->
          {#if videoMetadata}
            <section id="source-details">
              <h2>
                <button
                  id="change-source"
                  title="Change Source Video"
                  class:secondary={!!videoPath}
                  type="button"
                  onclick={chooseVideo}>⚙️&#xFE0E;</button
                >
                Source
              </h2>
              [
              <ul class="reset">
                {#each videoMetadataFields as field}
                  <li>
                    <b>{field}:</b> <span>{videoMetadata[field]}</span>
                  </li>
                {/each}
              </ul>
              ]
            </section>
          {/if}

          {#if videoMetadata}
            <form class="details">
              <div id="edits">
                <label for="crop:left"> <b>Crop:</b> Left </label>
                <input
                  id="crop:left"
                  type="number"
                  bind:value={nextGifParams.crop.left}
                  title="Left (Pixels)"
                  placeholder="left"
                  min="0"
                  step="1"
                  oninput={() => {
                    fixCropParams();
                  }}
                />
                <label for="crop:right"> Right </label>
                <input
                  id="crop:right"
                  type="number"
                  bind:value={nextGifParams.crop.right}
                  title="Right (Pixels)"
                  placeholder="right"
                  min="0"
                  step="1"
                  oninput={() => {
                    fixCropParams();
                  }}
                />
                <label for="crop:top"> Top </label>
                <input
                  id="crop:top"
                  type="number"
                  bind:value={nextGifParams.crop.top}
                  title="Top (Pixels)"
                  placeholder="top"
                  min="0"
                  step="1"
                  oninput={() => {
                    fixCropParams();
                  }}
                />
                <label for="crop:bottom"> Bottom </label>
                <input
                  id="crop:bottom"
                  type="number"
                  bind:value={nextGifParams.crop.bottom}
                  title="Bottom (Pixels)"
                  placeholder="bottom"
                  min="0"
                  step="1"
                  oninput={() => {
                    fixCropParams();
                  }}
                />
                <label for="trim:start" class="trim">
                  <b>Trim:</b> Start
                </label>
                <input
                  id="trim:start"
                  title="start time (seconds)"
                  name="start"
                  type="number"
                  placeholder="start"
                  bind:value={nextGifParams.trim.start}
                  max={nextGifParams.trim.end}
                />
                <label for="trim:end" class="trim"> End </label>
                <input
                  id="trim:end"
                  title="end time (seconds)"
                  name="end"
                  type="number"
                  placeholder="end"
                  bind:value={nextGifParams.trim.end}
                  max={videoMetadata?.duration}
                  min={nextGifParams.trim.start}
                />
                <label for="input:gif-maxcolors"> <b>Colors</b> </label>
                <input
                  id="input:gif-maxcolors"
                  name="colors"
                  type="number"
                  title="Max Colors"
                  bind:value={nextGifParams.colors}
                  max="256"
                  min="2"
                  step="1"
                  placeholder="colors"
                />
                <!-- Placeholder for Grid -->
                <span></span><span></span>
                <label for="input:gif-fps"> <b>FPS</b> </label>
                <input
                  id="input:gif-fps"
                  name="fps"
                  type="number"
                  title="Frames Per Second"
                  bind:value={nextGifParams.fps}
                  max={videoMetadata.fps || 30}
                  min="1"
                  step="1"
                  placeholder="fps"
                />

                <!-- Placeholder for Grid -->
                <span></span><span></span>
                <button
                  class:secondary={awaitingGif}
                  disabled={awaitingGif}
                  type="button"
                  onclick={createNextGif}
                  >{awaitingGif ? "Working..." : "Create GIF"}</button
                >
              </div>
            </form>
          {/if}
        </section>
      {/if}
    </section>

    {#if createdGifs.length}
      <ul id="gifs" class="reset">
        {#each createdGifs as gif, i (gif)}
          <li class="gif">
            <img src={gif.gifObjectUrl} alt="GIF" />
            <p>
              💾&#xFE0E; <a
                title="Download GIF"
                href={gif.gifObjectUrl}
                download={pathParts(gif.gifPath).base}
              >
                GIF (<Bytes bytes={gif.gifBytes} />)
              </a>
              <a
                title="Download MP4 (Higher Quality)"
                href={gif.videoObjectUrl}
                download={pathParts(gif.videoPath).base}
              >
                MP4 (<Bytes bytes={gif.videoBytes} />)
              </a>
              <button
                class="delete"
                title="Delete"
                onclick={() => {
                  createdGifs = createdGifs.filter((_, idx) => {
                    return i !== idx;
                  });
                }}
              >
                ❌&#xFE0E;
              </button>
            </p>
          </li>
        {/each}
      </ul>
    {/if}
  {/key}
  <!-- LOGS -->
  <section id="errors">
    {#each logs as log}
      <p>{log}</p>
    {/each}
  </section>
  <footer>
    <a
      title="Visit this project on GitHub"
      href="https://github.com/bscotch/steam-gifs"
    >
      <GithubIcon />
    </a>
  </footer>
</main>

<style>
  main {
    /* Center everything */
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px;
    width: 100dvw;
    overflow-x: none;
  }
  #source {
    display: grid;
    width: 100%;
    grid-template-columns: 1fr 1fr;
  }
  #source-video {
    margin-right: 12px;
  }

  #editor {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  #source-details {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  #source-details h2 {
    font-size: 1em;
  }
  #source-details ul {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  #source-details ul span {
    font-family: var(--font-family-code);
  }

  #change-source {
    border: none;
    padding: 0;
    margin: 0;
  }

  .details {
    padding-inline: 12px;
  }
  .details button {
    margin-top: 6px;
  }
  #edits {
    display: grid;
    grid-template-columns: max-content max-content max-content max-content;
    gap: 6px;
    margin-bottom: 6px;
  }
  #edits input {
    width: 5em;
    font-family: var(--font-family-code);
    margin-right: 6px;
  }
  #edits label {
    /* align right inside grid */
    text-align: right;
  }

  #gifs {
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .gif {
    position: relative;
  }
  .gif p {
    display: inline-block;
    visibility: hidden;
    text-align: right;
    position: absolute;
    padding: 3px;
    background: rgba(0, 0, 0, 0.5);
    border-bottom-left-radius: 10px;
    top: 0;
    right: 0;
  }
  .gif:has(> img:hover) p {
    visibility: visible;
  }
  .gif p:hover {
    visibility: visible;
  }
  .gif a {
    color: var(--color-button-outline);
  }
  .gif button.delete {
    border: none;
    padding: 0;
  }
  #errors {
    color: red;
  }
  footer {
    position: fixed;
    bottom: 0;
    right: 0.25rem;
  }
</style>
