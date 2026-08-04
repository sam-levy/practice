import { testManifest } from '$lib/data/tests/index.js';
import { error } from '@sveltejs/kit';
import type { TestData } from '$lib/stores/testStore';

export async function load({ params }) {
  const entry = testManifest.find((t) => t.id === params.id);
  if (!entry) throw error(404, 'Prova não encontrada');
  const module = await entry.file();
  return {
    testId: entry.id,
    testData: module.default as TestData
  };
}
