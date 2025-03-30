import { browser } from '$app/environment';
import type { WindowEntry } from '../types/window';

// State
let windows = $state<WindowEntry[]>([]);
let focusedWindowId = $state<string | null>(null);
let lastClickOrigin = $state<{ x: number; y: number } | null>(null);

// Computed values
const focusedWindow = $derived(
  windows.find(w => w.id === focusedWindowId)
);

const sortedWindows = $derived(
  windows.sort((a, b) => (a.minimized === b.minimized ? 0 : a.minimized ? -1 : 1))
);

// Actions
function addWindow(window: WindowEntry) {
  windows = [...windows, window];
  focusedWindowId = window.id;
}

function removeWindow(id: string) {
  windows = windows.filter(w => w.id !== id);
  if (focusedWindowId === id) {
    const lastWindow = windows[windows.length - 1];
    focusedWindowId = lastWindow?.id ?? null;
  }
}

function updateWindow(id: string, updates: Partial<WindowEntry>) {
  windows = windows.map(w => 
    w.id === id ? { ...w, ...updates } : w
  );
}

function focusWindow(id: string) {
  if (focusedWindowId !== id) {
    focusedWindowId = id;
    const win = windows.find(w => w.id === id);
    if (win?.minimized) {
      updateWindow(id, { minimized: false });
    }
  }
}

// Persistence
if (browser) {
  // Load initial state
  try {
    const saved = localStorage.getItem('windows');
    if (saved) {
      const parsed = JSON.parse(saved);
      windows = parsed;
    }
  } catch (error) {
    console.error('Failed to load window state:', error);
  }

  // Save state changes
  $effect(() => {
    const persistable = windows.map(({ 
      id, title, route, defaultSize, currentSize, 
      currentPosition, minimized, icon 
    }) => ({
      id, title, route, defaultSize, currentSize,
      currentPosition, minimized, icon
    }));
    
    localStorage.setItem('windows', JSON.stringify(persistable));
  });
}

export {
  windows,
  focusedWindow,
  focusedWindowId,
  lastClickOrigin,
  sortedWindows,
  addWindow,
  removeWindow,
  updateWindow,
  focusWindow
};
