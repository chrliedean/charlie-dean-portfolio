// File: src/lib/stores/windows.ts
import { writable } from 'svelte/store';
import type { WindowEntry } from '$lib/types/WindowEntry';

// Try to load saved state (only serializable fields)
const savedWindowsStr =
	typeof localStorage !== 'undefined' ? localStorage.getItem('openWindows') : null;
let initialWindows: WindowEntry[] = savedWindowsStr ? JSON.parse(savedWindowsStr) : [];

export const openWindows = writable<WindowEntry[]>(initialWindows);
export const focusedWindow = writable<WindowEntry | null>(null);

// Helper to update a window entry
export function updateWindow(id: string, updates: Partial<WindowEntry>) {
	openWindows.update(windows => {
	  return windows.map(window => {
		if (window.id === id || window.route === id) {
		  return { ...window, ...updates };
		}
		return window;
	  });
	});
}

// Persist only serializable fields to localStorage whenever openWindows changes.
openWindows.subscribe((windows) => {
	const persistable = windows.map(
		({ id, title, route, defaultSize, resizable, currentSize, currentPosition, minimized, icon }) => ({
			id,
			title,
			route,
			defaultSize,
			resizable,
			currentSize,
			currentPosition,
			minimized,
			icon, // Include icon to preserve post icons
		})
	);
	
	if (typeof localStorage !== 'undefined') {
		console.log('Saving windows to localStorage:', persistable.length);
		localStorage.setItem('openWindows', JSON.stringify(persistable));
	}
});