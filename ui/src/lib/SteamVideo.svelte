<script lang="ts">
  import { loadVideo } from "./video.js";

  let { path }: { path: string } = $props();

  let src: string | null = $state(null);

  $effect(() => {
    if (!path) src = null;
    else {
      loadVideo(path).then((data) => {
        src = URL.createObjectURL(new Blob([data]));
      });
    }
  });
</script>

<!-- svelte-ignore a11y_media_has_caption -->
<video controls loop muted>
  {#if src}
    <source {src} type={`video/${path.replace(/^.*\.([^.]+)$/, "$1")}`} />
  {/if}
</video>

<style>
  video {
    /** The width of the Steam store description column */
    max-width: var(--steam-description-width);
  }
</style>
