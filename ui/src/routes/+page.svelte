<script lang="ts">
  import { open } from "@tauri-apps/plugin-dialog";
  import EmptyVideo from "../lib/EmptyVideo.svelte";
  import { assert } from "../lib/errors.js";
  import SteamVideo from "../lib/SteamVideo.svelte";
  import {
    loadVideoMetadata,
    videoMetadataFields,
    type VideoMetadata,
  } from "../lib/video.js";

  // import { invoke } from "@tauri-apps/api/core";

  let videoPath: string | null = $state(null);
  let editedVideoPath: string | null = $state(null);

  let videoMetadata: VideoMetadata | null = $state(null);
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
        filters: [
          {
            name: "Videos",
            extensions: [
              // Most common video format extensions that might work
              "mp4",
              "mov",
              "avi",
              "wmv",
              "webm",
              "mkv",
              "flv",
              "vob",
              "ogv",
              "ogg",
            ],
          },
        ],
      });
      assert(videoPath, "No video file selected");
      videoMetadata = await loadVideoMetadata(videoPath);
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
            width={videoMetadata?.width}
            height={videoMetadata?.height}
            text="Edited Video"
          />
        {/if}
      </section>
    </div>
  {/key}
  <footer>
    <!-- LOGS -->
    <section>
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
  #videos {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    width: 100%;
  }
  .video {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }
  .details {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
  }
  .details > ul {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 3px;
  }
  .details > ul > li > span {
    color: var(--color-text-secondary);
    font-family: var(--font-family-monospace);
  }
</style>
