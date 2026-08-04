<script lang="ts">
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { testSession } from "$lib/stores/testStore";
  import type { Question, TestData } from "$lib/stores/testStore";

  let { testData }: { testData: TestData } = $props();

  function handleAnswerChange(questionId: number, value: string) {
    testSession.setAnswer(questionId, value);
  }

  function submitTest() {
    goto(`${base}/results`);
  }

  let answeredCount = $derived(
    testData.questions.filter((q: Question) => $testSession.answers[q.id])
      .length,
  );

  let totalCount = $derived(testData.questions.length);
  let progressPercent = $derived(
    Math.round((answeredCount / totalCount) * 100),
  );
</script>

<svelte:head>
  <title>{testData.test_title}</title>
</svelte:head>

<div class="container mx-auto p-4 pb-32 max-w-4xl">
  <h1 class="text-2xl font-bold mb-2">{testData.test_title}</h1>

  <div class="mb-6">
    <div class="flex justify-between text-sm mb-1">
      <span>{answeredCount} of {totalCount} answered</span>
      <span>{progressPercent}%</span>
    </div>
    <progress
      class="progress progress-primary w-full"
      value={progressPercent}
      max="100"
    ></progress>
  </div>

  <div class="space-y-6">
    {#each testData.questions as question, i}
      <div class="card bg-base-100 shadow-md">
        <div class="card-body">
          <h3 class="card-title text-sm font-semibold text-base-content/70">
            Question {i + 1}
            {#if question.type === "free_response"}
              <span class="badge badge-ghost badge-sm">Free Response</span>
            {:else}
              <span class="badge badge-primary badge-sm">Multiple Choice</span>
            {/if}
          </h3>

          {#if question.case_context}
            <div class="bg-base-200 rounded-lg p-3 mb-2 text-sm italic">
              {question.case_context}
            </div>
          {/if}

          <p class="mb-4">{question.question}</p>

          {#if question.type === "multiple_choice" && question.options}
            <div class="space-y-2">
              {#each question.options as option, optIdx}
                <label
                  class="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-base-200"
                >
                  <input
                    type="radio"
                    name="q-{question.id}"
                    class="radio radio-primary mt-0.5"
                    value={option}
                    checked={$testSession.answers[question.id] === option}
                    onchange={() => handleAnswerChange(question.id, option)}
                  />
                  <span class="text-sm"
                    >{String.fromCharCode(65 + optIdx)}. {option}</span
                  >
                </label>
              {/each}
            </div>
          {:else if question.type === "free_response"}
            <textarea
              class="textarea textarea-bordered w-full"
              rows="4"
              placeholder="Type your answer here..."
              value={$testSession.answers[question.id] || ""}
              oninput={(e) =>
                handleAnswerChange(
                  question.id,
                  (e.target as HTMLTextAreaElement).value,
                )}></textarea>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<div class="sticky bottom-0 bg-base-100 border-t border-base-300 p-4 shadow-lg">
  <div class="container mx-auto max-w-4xl flex justify-end">
    <button class="btn btn-success btn-lg" onclick={submitTest}>
      Submit Test
    </button>
  </div>
</div>