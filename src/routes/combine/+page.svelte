<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { testManifest } from "$lib/data/tests/index.js";
  import { testSession } from "$lib/stores/testStore";
  import type { TestData, Question } from "$lib/stores/testStore";

  let selectedIds = $state<Set<string>>(new Set());
  let maxQuestions = $state(15);
  let generating = $state(false);
  let questionCounts = $state<Record<string, number>>({});

  // Load question counts for each test
  async function loadQuestionCounts() {
    const counts: Record<string, number> = {};
    for (const test of testManifest) {
      const module = await test.file();
      counts[test.id] = module.default.questions.length;
    }
    questionCounts = counts;
  }

  loadQuestionCounts();

  function toggleTest(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    selectedIds = next;

    // Reset maxQuestions if it exceeds the new total
    const total = selectedTestsTotalQuestions();
    if (maxQuestions > total) {
      maxQuestions = total;
    }
  }

  function selectedTestsTotalQuestions(): number {
    let total = 0;
    for (const id of selectedIds) {
      total += questionCounts[id] || 0;
    }
    return total;
  }

  let totalAvailable = $derived(selectedTestsTotalQuestions());
  let canGenerate = $derived(
    selectedIds.size >= 2 &&
      maxQuestions >= 1 &&
      maxQuestions <= totalAvailable,
  );

  function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async function generateCombinedTest() {
    if (!canGenerate) return;
    generating = true;

    try {
      // Load all selected tests
      const selectedTests = testManifest.filter((t) => selectedIds.has(t.id));
      const allQuestions: Question[] = [];
      const titles: string[] = [];

      for (const test of selectedTests) {
        const module = await test.file();
        const data = module.default as TestData;
        titles.push(data.test_title);
        allQuestions.push(...data.questions);
      }

      // Shuffle and take maxQuestions
      const shuffled = shuffle(allQuestions);
      const selected = shuffled.slice(0, maxQuestions);

      // Re-map IDs sequentially
      const remapped = selected.map((q, i) => ({ ...q, id: i + 1 }));

      const combinedTitle = `Combined Test: ${titles.join(" + ")}`;
      const combinedData: TestData = {
        id: "combined",
        test_title: combinedTitle,
        questions: remapped,
      };

      testSession.startTest("combined", combinedData);
      goto(`${base}/test/combined`);
    } finally {
      generating = false;
    }
  }
</script>

<svelte:head>
  <title>Combine Tests</title>
</svelte:head>

<div class="container mx-auto p-8 max-w-4xl">
  <h1 class="text-3xl font-bold mb-2">Combine Tests</h1>
  <p class="text-base-content/60 mb-6">
    Select at least 2 tests to combine their questions into a custom practice
    test.
  </p>

  <div class="grid gap-4 md:grid-cols-2 mb-8">
    {#each testManifest as test}
      {@const isSelected = selectedIds.has(test.id)}
      {@const count = questionCounts[test.id] || 0}
      <label
        class="card bg-base-100 shadow-xl cursor-pointer {isSelected
          ? 'ring-2 ring-primary'
          : ''}"
      >
        <div class="card-body">
          <div class="flex items-start gap-3">
            <input
              type="checkbox"
              class="checkbox checkbox-primary mt-1"
              checked={isSelected}
              onchange={() => toggleTest(test.id)}
            />
            <div class="flex-1">
              <h2 class="card-title text-base">{test.title}</h2>
              <p class="text-sm text-base-content/60">{count} questions</p>
            </div>
          </div>
        </div>
      </label>
    {/each}
  </div>

  {#if selectedIds.size >= 2}
    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body">
        <h2 class="card-title text-lg mb-4">Test Settings</h2>

        <div class="form-control">
          <div class="label">
            <span class="label-text">
              Total available questions: <strong>{totalAvailable}</strong>
            </span>
          </div>
          <label class="label" for="max-questions">
            <span class="label-text"
              >Number of questions (max {totalAvailable})</span
            >
          </label>
          <input
            id="max-questions"
            type="number"
            class="input input-bordered w-full max-w-xs"
            min="1"
            max={totalAvailable}
            bind:value={maxQuestions}
          />
        </div>

        <div class="card-actions justify-end mt-4">
          <button
            class="btn btn-primary btn-lg"
            disabled={!canGenerate || generating}
            onclick={generateCombinedTest}
          >
            {#if generating}
              <span class="loading loading-spinner"></span>
              Generating...
            {:else}
              Generate Combined Test
            {/if}
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="alert alert-info">
      <span>Select at least 2 tests to continue.</span>
    </div>
  {/if}
</div>
