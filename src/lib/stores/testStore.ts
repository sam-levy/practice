import { writable } from 'svelte/store';

export interface TestImage {
	url: string;
	description: string;
}

export interface QuestionOption {
	content: string;
	images: TestImage[];
}

export interface Question {
	id: number;
	type: 'multiple_choice' | 'free_response';
	question: string;
	images: TestImage[];
	/** Multiple choice only. Keys are option ids (`a`, `b`, …) in display order. */
	options?: Record<string, QuestionOption>;
	/** Option id for multiple choice; expected prose for free response. */
	correct_answer: string;
	explanation: string;
	reference: string;
	case_context?: string;
}

export function listOptions(question: Question): [string, QuestionOption][] {
	return Object.entries(question.options ?? {});
}

export interface TestData {
	id: string;
	test_title: string;
	questions: Question[];
}

export interface SessionState {
	testId: string | null;
	testData: TestData | null;
	answers: Record<number, string>;
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