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