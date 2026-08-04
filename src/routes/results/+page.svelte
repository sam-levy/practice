<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { testSession } from '$lib/stores/testStore';
  import type { Question } from '$lib/stores/testStore';

  onMount(() => {
    if (!$testSession.testData) {
      goto(`${base}/`);
    }
  });

  let mcQuestions = $derived(
    $testSession.testData?.questions.filter((q: Question) => q.type === 'multiple_choice') ?? []
  );

  let correctCount = $derived(
    mcQuestions.filter((q: Question) => $testSession.answers[q.id] === q.correct_answer).length
  );

  let totalMC = $derived(mcQuestions.length);
  let scorePercent = $derived(totalMC > 0 ? Math.round((correctCount / totalMC) * 100) : 0);

  function tryAnother() {
    testSession.reset();
    goto(`${base}/`);
  }
</script>

<svelte:head>
  <title>Results</title>
</svelte:head>

{#if $testSession.testData}
  <div class="container mx-auto p-4 max-w-4xl">
    <h1 class="text-2xl font-bold mb-6">Results</h1>

    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body items-center text-center">
        <h2 class="card-title text-lg">{$testSession.testData.test_title}</h2>
        <div class="radial-progress text-primary" style="--value:{scorePercent};--size:8rem;--thickness:8px;" role="progressbar">
          {scorePercent}%
        </div>
        <div class="stats stats-horizontal shadow mt-4">
          <div class="stat">
            <div class="stat-title">Correct</div>
            <div class="stat-value text-success">{correctCount}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Total (MC)</div>
            <div class="stat-value">{totalMC}</div>
          </div>
        </div>
        <p class="text-sm text-base-content/60 mt-2">
          Score based on {totalMC} multiple-choice questions. Free-response questions are shown for review but not graded.
        </p>
      </div>
    </div>

    <h2 class="text-xl font-bold mb-4">Question Review</h2>

    <div class="space-y-4 mb-8">
      {#each $testSession.testData.questions as question, i}
        {@const userAnswer = $testSession.answers[question.id] || ''}
        {@const isMC = question.type === 'multiple_choice'}
        {@const isCorrect = isMC && userAnswer === question.correct_answer}

        <div class="card bg-base-100 shadow-md" class:border-success={isCorrect} class:border-error={isMC && !isCorrect}>
          <div class="card-body">
            <div class="flex items-start justify-between gap-2">
              <h3 class="card-title text-sm font-semibold">
                Question {i + 1}
                {#if isMC}
                  {#if isCorrect}
                    <span class="badge badge-success badge-sm">Correct</span>
                  {:else}
                    <span class="badge badge-error badge-sm">Incorrect</span>
                  {/if}
                {:else}
                  <span class="badge badge-ghost badge-sm">Not graded</span>
                {/if}
              </h3>
            </div>

            {#if question.case_context}
              <div class="bg-base-200 rounded-lg p-3 mb-2 text-sm italic">
                {question.case_context}
              </div>
            {/if}

            <p class="mb-3">{question.question}</p>

            {#if isMC}
              <div class="space-y-1 mb-3">
                {#each question.options as option, optIdx}
                  {@const isUserChoice = userAnswer === option}
                  {@const isCorrectOption = option === question.correct_answer}
                  <div
                    class="p-2 rounded text-sm {isCorrectOption ? 'bg-success/10 border border-success' : ''} {isUserChoice && !isCorrectOption ? 'bg-error/10 border border-error' : ''}"
                  >
                    <span class="font-medium">{String.fromCharCode(65 + optIdx)}.</span> {option}
                    {#if isCorrectOption}
                      <span class="text-success font-bold ml-1">✓</span>
                    {/if}
                    {#if isUserChoice && !isCorrectOption}
                      <span class="text-error font-bold ml-1">✗ (your answer)</span>
                    {/if}
                  </div>
                {/each}
              </div>
            {:else}
              <div class="grid gap-3 mb-3">
                <div class="bg-base-200 rounded-lg p-3">
                  <div class="text-xs font-semibold text-base-content/60 mb-1">Your answer</div>
                  <div class="text-sm">{userAnswer || '(no answer)'}</div>
                </div>
                <div class="bg-base-200 rounded-lg p-3">
                  <div class="text-xs font-semibold text-base-content/60 mb-1">Sample answer</div>
                  <div class="text-sm">{question.correct_answer}</div>
                </div>
              </div>
            {/if}

            <details class="collapse collapse-arrow bg-base-200 rounded-lg">
              <summary class="collapse-title text-sm font-medium">Explanation & Reference</summary>
              <div class="collapse-content text-sm space-y-2">
                <p>{question.explanation}</p>
                <p class="text-base-content/60 italic">{question.reference}</p>
              </div>
            </details>
          </div>
        </div>
      {/each}
    </div>

    <div class="flex justify-center pb-8">
      <button class="btn btn-outline btn-lg" onclick={tryAnother}>
        Try Another Test
      </button>
    </div>
  </div>
{/if}