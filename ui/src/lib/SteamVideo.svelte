<script lang="ts">
  import { tick } from "svelte";
  import { loadVideo, loadVideoMetadata, orZero, type Crop } from "./video.js";

  let { path, crop }: { path: string; crop?: Crop } = $props();

  let src: string | null = $state(null);
  let sourceWidth: number | null = $state(null);
  let sourceHeight: number | null = $state(null);
  let el: HTMLVideoElement | null = $state(null);

  $effect(() => {
    if (!path) src = null;
    else {
      loadVideoMetadata(path).then(async (metadata) => {
        sourceWidth = metadata.width;
        sourceHeight = metadata.height;
        const data = await loadVideo(path);
        src = URL.createObjectURL(new Blob([data]));
        await tick();
        updateCropOverlay();
      });
    }
  });

  $effect(() => {
    crop; // re-run when crop changes
    updateCropOverlay();
  });

  function updateCropOverlay() {
    if (!el || !crop || !sourceWidth || !sourceHeight) {
      console.log("MISSING SOMETHING");

      return;
    }
    // Figure out how scaled the video is
    const scale = el.clientWidth / sourceWidth;
    // Use a clip-path: polygon() to crop the video
    const left = orZero(crop.left);
    const top = orZero(crop.top);
    const right = orZero(crop.right);
    const bottom = orZero(crop.bottom);

    el.style.clipPath = `polygon(
      ${left * scale}px ${top * scale}px,
      ${(sourceWidth - right) * scale}px ${top * scale}px,
      ${(sourceWidth - right) * scale}px ${(sourceHeight - bottom) * scale}px,
      ${left * scale}px ${(sourceHeight - bottom) * scale}px
    )`;
  }
</script>

<!-- svelte-ignore a11y_media_has_caption -->
<div class="viewer">
  <video bind:this={el} controls loop muted style={`width:${sourceWidth}px;`}>
    {#if src}
      <source {src} type={`video/${path.replace(/^.*\.([^.]+)$/, "$1")}`} />
    {/if}
  </video>
</div>

<style>
  .viewer {
    position: relative;
    border: 1px solid white;
  }
  video {
    /** The width of the Steam store description column */
    max-width: var(--steam-description-width);
  }
</style>
