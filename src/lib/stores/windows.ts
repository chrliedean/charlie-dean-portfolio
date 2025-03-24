// src/lib/stores/windows.ts
import { writable } from 'svelte/store';
import type { WindowEntry } from '$lib/types/WindowEntry';

// Try to load saved state (only serializable fields)
const savedWindowsStr =
	typeof localStorage !== 'undefined' ? localStorage.getItem('openWindows') : null;
let initialWindows: WindowEntry[] = savedWindowsStr ? JSON.parse(savedWindowsStr) : [];

export const openWindows = writable<WindowEntry[]>(initialWindows);
export const focusedWindow = writable<WindowEntry | null>(null);

// Helper to update a window entry
export const updateWindow = (
	id: string,
	newData: Partial<WindowEntry>
) => {
	openWindows.update((windows) => {
		const index = windows.findIndex((win) => win.id === id);
		if (index !== -1) {
			windows[index] = { ...windows[index], ...newData };
		}
		return windows;
	});
};

// Persist only serializable fields to localStorage whenever openWindows changes.
openWindows.subscribe((windows) => {
	const persistable = windows.map(
		({ id, title, route, defaultSize, resizable, currentSize, currentPosition }) => ({
			id,
			title,
			route,
			defaultSize,
			resizable,
			currentSize,
			currentPosition
		})
	);
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('openWindows', JSON.stringify(persistable));
	}
});