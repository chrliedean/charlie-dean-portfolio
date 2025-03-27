// /src/lib/stores/portfolioStore.ts
import { writable } from 'svelte/store';
import type { WindowEntry } from '$lib/types/WindowEntry';

// We expect an object with a posts property
export const portfolioStore = writable<{ posts: WindowEntry[] }>({ posts: [] });