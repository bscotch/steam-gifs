<script lang="ts">
  let {
    width,
    height,
    text,
  }: { width?: number; height?: number; text: string } = $props();
</script>

<p style={`aspect-ratio: ${width || 16} / ${height || 9}`}>{text}</p>

<style>
  p {
    width: 100%;
    aspect-ratio: 16 / 9;
    max-width: var(--steam-description-width);
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid white;
  }
</style>
