<script lang="ts">
  import { open } from "@tauri-apps/plugin-dialog";
  import EmptyVideo from "../lib/EmptyVideo.svelte";
  import { assert } from "../lib/errors.js";
  import GifSettings from "../lib/GifSettings.svelte";
  import SteamVideo from "../lib/SteamVideo.svelte";
  import {
    computeDefaultVideoEditParams,
    createEditedVideo,
    createGif,
    loadVideoMetadata,
    pathToObjectUrl,
    supportedVideoExtensions,
    videoMetadataFields,
    type EditedVideoParams,
    type GifOutputSettings,
    type VideoMetadata,
  } from "../lib/video.js";

  // import { invoke } from "@tauri-apps/api/core";

  let videoPath: string | null = $state(null);
  let videoMetadata: VideoMetadata | null = $state(null);

  let editedVideoPath: string | null = $state(null);
  let editedVideoParams: EditedVideoParams = $state(
    computeDefaultVideoEditParams()
  );
  let editedVideoMetadata: VideoMetadata | null = $state(null);

  let gifSettings: GifOutputSettings = $state({ colors: 90, fps: 20 });
  let createdGifs: {
    path: string;
    objectUrl: string;
    settings: GifOutputSettings;
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
      videoPath = await open({
        multiple: false,
        directory: false,
        title: "Choose a video file",
        filters: [{ name: "Videos", extensions: supportedVideoExtensions }],
      });
      assert(videoPath, "No video file selected");
      videoMetadata = await loadVideoMetadata(videoPath);
      // Update the edit params
      editedVideoParams = computeDefaultVideoEditParams(videoMetadata);
      editedVideoPath = null;
      editedVideoMetadata = null;
      createdGifs = [];
    });
  }

  async function editVideo() {
    await logOnError(async () => {
      editedVideoPath = null;
      editedVideoMetadata = null;
      editedVideoPath = await createEditedVideo(videoPath!, editedVideoParams);
      editedVideoMetadata = await loadVideoMetadata(editedVideoPath);
    });
  }
</script>

<main class="container">
  {#key videoPath}
    <div id="videos">
      <section id="source" class="video">
        {#if videoPath}
          <SteamVideo path={videoPath} />
        {:else}
          <EmptyVideo text="Source Video" />
        {/if}
        <section class="details">
          {#if videoMetadata}
            <ul class="reset">
              {#each videoMetadataFields as field}
                <li>
                  <b>{field}:</b> <span>{videoMetadata[field]}</span>
                </li>
              {/each}
            </ul>
          {/if}
          <button
            class:secondary={!!videoPath}
            type="button"
            onclick={chooseVideo}
            >{videoPath ? "Change" : "Choose"} Source Video</button
          >
        </section>
      </section>

      <section id="edited" class="video">
        {#if editedVideoPath}
          <SteamVideo path={editedVideoPath} />
        {:else}
          <EmptyVideo
            width={editedVideoMetadata?.width || videoMetadata?.width}
            height={editedVideoMetadata?.height || videoMetadata?.height}
            text="Edited Video"
          />
        {/if}

        {#if videoMetadata}
          <form class="details">
            <label class="crop">
              Crop
              <input
                title="x coordinate of the top-left corner"
                name="x"
                type="number"
                placeholder="x"
                bind:value={editedVideoParams.crop.x}
              />
              <input
                title="y coordinate of the top-left corner"
                name="y"
                type="number"
                placeholder="y"
                bind:value={editedVideoParams.crop.y}
              />
              <input
                title="width of the cropped area"
                name="width"
                type="number"
                placeholder="width"
                bind:value={editedVideoParams.crop.width}
              />
              <input
                title="height of the cropped area"
                name="height"
                type="number"
                placeholder="height"
                bind:value={editedVideoParams.crop.height}
              />
            </label>

            <label class="trim">
              Trim
              <input
                title="start time (seconds)"
                name="start"
                type="number"
                placeholder="start"
                bind:value={editedVideoParams.trim.start}
                max={editedVideoParams.trim.end}
              />
              <input
                title="end time (seconds)"
                name="end"
                type="number"
                placeholder="end"
                bind:value={editedVideoParams.trim.end}
                max={videoMetadata?.duration}
                min={editedVideoParams.trim.start}
              />
            </label>

            <button type="button" onclick={editVideo}>Apply Edits</button>
          </form>
        {/if}
      </section>
    </div>
    {#if editedVideoPath}
      <div id="gifs">
        <section class="gif">
          <GifSettings
            {...gifSettings}
            maxFps={editedVideoMetadata?.fps || 30}
            height={editedVideoMetadata?.height}
            width={editedVideoMetadata?.width}
            generate={async (config) => {
              await logOnError(async () => {
                assert(editedVideoPath, "No edited video to generate GIF from");
                const settings = { ...config };
                const outfile = await createGif(editedVideoPath!, settings);
                createdGifs.push({
                  path: outfile,
                  objectUrl: await pathToObjectUrl(outfile),
                  settings,
                });
              });
            }}
          />
        </section>
        {#each createdGifs as gif (gif.path)}
          <section class="gif">
            <img src={gif.objectUrl} alt="GIF" />
          </section>
        {/each}
      </div>
    {/if}
  {/key}
  <footer>
    <!-- LOGS -->
    <section id="errors">
      {#each logs as log}
        <p>{log}</p>
      {/each}
    </section>
  </footer>
</main>

<style>
  main {
    /* Center everything */
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100dvw;
    padding: 6px;
  }
  #videos,
  #gifs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    width: 100%;
  }
  #gifs {
    margin-top: 12px;
  }
  .video,
  .gif {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }
  .details {
    padding-inline: 12px;
  }
  #source .details {
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  #source .details > ul {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 3px;
    justify-content: center;
  }
  #source .details > ul > li > span {
    color: var(--color-text-secondary);
    font-family: var(--font-family-code);
  }
  #edited input {
    width: 5em;
    font-family: var(--font-family-code);
  }
  #edited label {
    display: block;
    font-family: var(--font-family-code);
  }
  #edited .details {
    width: 100%;
  }
  #edited .details label {
    margin-bottom: 6px;
  }

  #errors {
    color: red;
  }
</style>
