<script lang="ts">
  import type { GifOutputSettings } from "./video.js";

  let {
    width,
    height,
    colors = $bindable(),
    fps = $bindable(),
    maxFps,
    generate,
  }: {
    width?: number;
    height?: number;
    colors: number;
    fps: number;
    maxFps: number;
    generate: (config: GifOutputSettings) => any;
  } = $props();
</script>

<section style={`aspect-ratio: ${width || 16} / ${height || 9}`}>
  <form>
    <label for="input:gif-maxcolors"> Colors </label>
    <input
      id="input:gif-maxcolors"
      name="colors"
      type="number"
      title="Max Colors"
      bind:value={colors}
      max="256"
      min="2"
      step="1"
      placeholder="colors"
    />
    <label for="input:gif-fps"> FPS </label>
    <input
      id="input:gif-fps"
      name="fps"
      type="number"
      title="Frames Per Second"
      bind:value={fps}
      max={maxFps}
      min="1"
      step="1"
      placeholder="fps"
    />
  </form>
  <button onclick={() => generate({ colors, fps })}> Generate GIF </button>
</section>

<style>
  section {
    width: 100%;
    max-width: var(--steam-description-width);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: 1px solid white;
    gap: 6px;
  }
  form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  input {
    width: 3em;
    font-family: var(--font-family-code);
  }
</style>
