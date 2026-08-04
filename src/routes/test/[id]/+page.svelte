<script lang="ts">
  import { onMount } from "svelte";
  import { testSession } from "$lib/stores/testStore";
  import TestPlayer from "$lib/components/TestPlayer.svelte";

  let { data } = $props();

  let initialized = $state(false);

  onMount(() => {
    if (!initialized) {
      testSession.startTest(data.testId, data.testData);
      initialized = true;
    }
  });
</script>

<TestPlayer testData={data.testData} />
