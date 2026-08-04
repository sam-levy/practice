<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { testSession } from "$lib/stores/testStore";
  import TestPlayer from "$lib/components/TestPlayer.svelte";

  onMount(() => {
    if (!$testSession.testData || $testSession.testId !== "combined") {
      goto(`${base}/`);
    }
  });
</script>

{#if $testSession.testData && $testSession.testId === "combined"}
  <TestPlayer testData={$testSession.testData} />
{/if}