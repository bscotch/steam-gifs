<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<form>
  {@render children()}
</form>

<style>
  form {
    width: 100%;
    aspect-ratio: 16 / 9;
    max-width: var(--steam-description-width);
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid white;
  }
</style>
