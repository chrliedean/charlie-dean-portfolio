// src/lib/stores/windows.ts
import { writable } from 'svelte/store';
import type { WindowEntry } from '$lib/types/WindowEntry';

// Try to load saved state (make sure you only load serializable fields)
const savedWindowsStr = typeof localStorage !== 'undefined' ? localStorage.getItem('openWindows') : null;
let initialWindows: WindowEntry[] = savedWindowsStr ? JSON.parse(savedWindowsStr) : [];

// Our store starts with the saved state, if any.
export const openWindows = writable<WindowEntry[]>(initialWindows);
export const focusedWindow = writable<WindowEntry | null>(null);

// Whenever openWindows changes, persist only serializable fields
openWindows.subscribe((windows) => {
  const persistable = windows.map(({ id, title, route, defaultSize, resizable, currentSize, currentPosition }) => ({
    id,
    title,
    route,
    defaultSize,
    resizable,
    currentSize,
    currentPosition
  }));
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('openWindows', JSON.stringify(persistable));
  }
});