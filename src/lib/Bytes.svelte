<script lang="ts">
  let { bytes }: { bytes: number } = $props();

  let pretty: { number: string; unit: string } = $derived.by(() => {
    let num = `${bytes}`;
    let unit = "B";
    if (bytes / 1_000_000 >= 1) {
      num = (bytes / 1_000_000).toFixed(1);
      unit = "MB";
    } else if (bytes / 1_000 >= 1) {
      num = (bytes / 1_000).toFixed(1);
      unit = "KB";
    }
    return { number: num, unit };
  });
</script>

<data value={bytes}
  ><span class="number">{pretty.number}</span><span class="unit"
    >{pretty.unit}</span
  ></data
>

<style>
  data {
    font-family: var(--font-family-code);
  }
</style>
