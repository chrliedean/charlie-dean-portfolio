import { writable } from 'svelte/store';

const STORAGE_KEY = 'charlie-portfolio-open-windows';

export interface WindowState {
  id: string;
  title: string;
  route: string;
  defaultSize?: { width: number; height: number };
  resizable?: boolean;
}

function createPersistentWindows() {
  const initial = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    : null;

  const store = writable<WindowState[]>(initial ?? []);

  store.subscribe((windows) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(windows));
    }
  });

  return store;
}

export const openWindows = createPersistentWindows();