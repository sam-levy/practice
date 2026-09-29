<script lang="ts">
  import type { TestImage } from "$lib/stores/testStore";

  let { images }: { images: TestImage[] } = $props();
</script>

{#if images.length > 0}
  <div class="my-3 space-y-3">
    {#each images as image}
      <figure class="flex! w-full flex-col! items-stretch! justify-start! gap-1">
        <img
          src={image.url}
          alt={image.description}
          class="h-auto w-auto max-w-full self-start rounded-lg border border-base-300"
        />
        {#if image.description}
          <figcaption class="text-sm text-base-content/70">
            {image.description}
          </figcaption>
        {/if}
      </figure>
    {/each}
  </div>
{/if}
