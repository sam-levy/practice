# Practice Test App — Implementation Plan

## Goal
A frontend-only SvelteKit app (adapter-static, Bun, deployed to GitHub Pages) with three pages:
1. **Test Selector** — list available practice tests, pick one
2. **Test Runner** — answer questions one by one (or all on one page), track answers
3. **Results** — show score, calculated ONLY from `multiple_choice` questions (free_response is excluded from scoring but still shown for review)

This is a client-only SPA. There is no backend. All state lives in a Svelte store during the session and is not persisted across reloads (unless noted as optional below).

---

## Step 0 — Install and configure Tailwind + daisyUI

Run in the `Practice` project root:

```bash
bun add -D tailwindcss @tailwindcss/vite daisyui@latest
```

Update `vite.config.ts` to include the Tailwind Vite plugin:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()]
});
```

Create `src/app.css`:

```css
@import 'tailwindcss';
@plugin 'daisyui';
```

Import `src/app.css` in `src/routes/+layout.svelte` (create this file if it doesn't exist):

```svelte
<script>
	import '../app.css';
	let { children } = $props();
</script>

<div class="min-h-screen bg-base-200">
	{@render children()}
</div>
```

Pick a daisyUI theme (e.g. `light`, `corporate`, `winter`) by setting `data-theme` on the `<html>` tag in `src/app.html`.

---

## Step 1 — Configure adapter-static for SPA-style routing

Since this app has a dynamic route (`/test/[id]`), configure the adapter with a fallback so GitHub Pages can serve any route to the same `index.html`, and the app handles routing client-side.

`svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-static';

const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html', // SPA fallback — required for dynamic routes on static hosting
			precompress: false
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/Practice' : ''
		}
	}
};

export default config;
```

In `src/routes/+layout.ts` (create it), disable SSR and prerendering globally since this is a pure client app:

```ts
export const ssr = false;
export const prerender = false;
```

> Note on `base`: adjust `/Practice` to match the actual GitHub repo name used for Pages.

---

## Step 2 — Data layer

### 2.1 File structure for test data

```
src/lib/data/tests/
  practice_test.json          <- the file already generated (P1 Pediatria)
  index.js                    <- manifest of all available tests
```

`practice_test.json` is the file already created. Its shape:

```json
{
  "id": "string",
  "test_title": "string",
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice" | "free_response",
      "question": "string",
      "options": ["string", ...],   // only present for multiple_choice
      "correct_answer": "string",
      "explanation": "string",
      "reference": "string",
      "case_context": "string"      // optional, only on some free_response items
    }
  ]
}
```

### 2.2 Manifest file — `src/lib/data/tests/index.js`

This lets the Test Selector page list tests without importing every JSON file's full content up front.

```js
export const testManifest = [
	{
		id: 'p1-pediatria',
		title: 'P1 Pediatria T9A/B SBC 2026.1',
		file: () => import('./practice_test.json')
	}
	// Add more tests here later, following the same shape
];
```

When adding new tests in the future: drop the new `.json` file in this folder and add one entry to `testManifest`.

---

## Step 3 — Svelte store for session state

Create `src/lib/stores/testStore.ts`:

```ts
import { writable } from 'svelte/store';

export interface Question {
	id: number;
	type: 'multiple_choice' | 'free_response';
	question: string;
	options?: string[];
	correct_answer: string;
	explanation: string;
	reference: string;
	case_context?: string;
}

export interface TestData {
	id: string;
	test_title: string;
	questions: Question[];
}

export interface SessionState {
	testId: string | null;
	testData: TestData | null;
	answers: Record<number, string>; // question id -> user's selected/typed answer
}

function createTestSession() {
	const { subscribe, set, update } = writable<SessionState>({
		testId: null,
		testData: null,
		answers: {}
	});

	return {
		subscribe,
		startTest: (testId: string, testData: TestData) =>
			set({ testId, testData, answers: {} }),
		setAnswer: (questionId: number, answer: string) =>
			update((s) => ({ ...s, answers: { ...s.answers, [questionId]: answer } })),
		reset: () => set({ testId: null, testData: null, answers: {} })
	};
}

export const testSession = createTestSession();
```

This store is the single source of truth passed between the Test Runner and Results pages. Because there's no backend and no route params carrying data, **the Results page must redirect back to `/` if `testData` is null** (e.g. user navigated directly to `/results` without taking a test).

---

## Step 4 — Routes

```
src/routes/
  +layout.svelte
  +layout.ts
  +page.svelte              <- Test Selector (route: /)
  test/[id]/+page.svelte    <- Test Runner (route: /test/p1-pediatria)
  test/[id]/+page.ts        <- loads the right JSON based on [id]
  results/+page.svelte      <- Results (route: /results)
```

### 4.1 `src/routes/+page.svelte` — Test Selector

- Import `testManifest` from `$lib/data/tests/index.js`
- Render a daisyUI `card` for each test in the manifest, showing `title` and a "Start Test" button
- Use daisyUI classes: `card`, `card-body`, `card-title`, `btn btn-primary`
- Button `on:click` navigates to `/test/{id}` using SvelteKit's `goto()`

Example layout (for the agent to follow structurally, not copy verbatim):

```svelte
<script>
	import { goto } from '$app/navigation';
	import { testManifest } from '$lib/data/tests/index.js';
</script>

<div class="container mx-auto p-8">
	<h1 class="text-3xl font-bold mb-6">Choose a Practice Test</h1>
	<div class="grid gap-4 md:grid-cols-2">
		{#each testManifest as test}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">{test.title}</h2>
					<div class="card-actions justify-end">
						<button class="btn btn-primary" onclick={() => goto(`/test/${test.id}`)}>
							Start Test
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
```

### 4.2 `src/routes/test/[id]/+page.ts` — loader

```ts
import { testManifest } from '$lib/data/tests/index.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const entry = testManifest.find((t) => t.id === params.id);
	if (!entry) throw error(404, 'Test not found');
	const module = await entry.file();
	return {
		testId: entry.id,
		testData: module.default
	};
}
```

### 4.3 `src/routes/test/[id]/+page.svelte` — Test Runner

Logic:
1. On mount, call `testSession.startTest(data.testId, data.testData)` using the data from the loader (only if not already started — guard against re-running on navigation back).
2. Render ALL questions on one scrollable page (simpler for a "dumb" agent than paginating one-by-one — recommend this unless the user asks for one-per-page).
3. For each question:
   - If `multiple_choice`: render `question.options` as a daisyUI radio group (`form-control`, `label`, `radio radio-primary`), bound to `$testSession.answers[question.id]`
   - If `free_response`: render a `textarea` (daisyUI `textarea textarea-bordered`) bound the same way — answer is stored but never graded
   - Call `testSession.setAnswer(question.id, value)` on change
4. A sticky/fixed "Submit Test" button (`btn btn-success btn-lg`) at the bottom navigates to `/results` via `goto('/results')`
5. Optionally show a progress indicator (`X of N answered`) using daisyUI `progress` bar — count only answered questions vs total

Important UX note for the agent: use `bind:group` for radio buttons within each question's option list, keyed by `question.id`, so selecting an option only affects that question.

### 4.4 `src/routes/results/+page.svelte` — Results

Logic:
1. On mount: `if (!$testSession.testData) goto('/')` — guard against direct navigation.
2. Compute score using ONLY `multiple_choice` questions:

```ts
$: mcQuestions = $testSession.testData?.questions.filter(q => q.type === 'multiple_choice') ?? [];
$: correctCount = mcQuestions.filter(q => $testSession.answers[q.id] === q.correct_answer).length;
$: totalMC = mcQuestions.length;
$: scorePercent = totalMC > 0 ? Math.round((correctCount / totalMC) * 100) : 0;
```

3. Display:
   - Big score summary at top: `X / Y correct (Z%)` using a daisyUI `stat` block or `radial-progress` showing `scorePercent`
   - Below, a review list of ALL questions (both types):
     - For `multiple_choice`: show the question, user's answer, correct answer, and use `alert alert-success` / `alert alert-error` styling depending on correctness. Show `explanation` and `reference` in a collapsed daisyUI `collapse` component.
     - For `free_response`: show the question, user's typed answer, and the reference `correct_answer` side-by-side as "Sample answer" — clearly labeled as **not scored**, e.g. a badge (`badge badge-ghost`) saying "Not graded".
4. A "Try Another Test" button (`btn btn-outline`) that calls `testSession.reset()` and navigates to `/`.

---

## Step 5 — Scoring rule (explicit, do not deviate)

- Score = `(number of multiple_choice questions where testSession.answers[id] === correct_answer) / (total multiple_choice questions)`
- `free_response` questions are **never** included in the numerator or denominator.
- Unanswered multiple_choice questions count as incorrect (simply won't match `correct_answer`).

---

## Step 6 — Build & verify

```bash
bun run build
bun run preview
```

Click through: Selector → pick test → answer some questions (mix of correct/incorrect/skipped) → Submit → verify score math is right and free-response questions show but don't affect the score → Try Another Test → back at Selector.

---

## Task Checklist (for the agent to work through in order)

- [ ] Install Tailwind + daisyUI, wire up `app.css` and `+layout.svelte`
- [ ] Configure `svelte.config.js` for adapter-static with SPA fallback
- [ ] Set `ssr = false`, `prerender = false` in root `+layout.ts`
- [ ] Place `practice_test.json` in `src/lib/data/tests/`
- [ ] Create `src/lib/data/tests/index.js` manifest
- [ ] Create `src/lib/stores/testStore.ts`
- [ ] Build `/` Test Selector page
- [ ] Build `/test/[id]/+page.ts` loader
- [ ] Build `/test/[id]/+page.svelte` Test Runner
- [ ] Build `/results/+page.svelte` Results page with scoring logic from Step 5
- [ ] Test full flow locally with `bun run dev`
- [ ] Build and preview with `bun run build && bun run preview`
