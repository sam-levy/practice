<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { testManifest } from '$lib/data/tests/index.js';
</script>

<svelte:head>
  <title>Practice Tests</title>
</svelte:head>

<div class="container mx-auto p-8">
  <h1 class="text-3xl font-bold mb-6">Choose a Practice Test</h1>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each testManifest as test}
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">{test.title}</h2>
          <div class="card-actions justify-end">
            <button class="btn btn-primary" onclick={() => goto(`${base}/test/${test.id}`)}>
              Start Test
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
