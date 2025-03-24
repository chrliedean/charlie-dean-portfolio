  import { browser } from '$app/environment'; 
  import type { SvelteComponent } from 'svelte'; // SvelteKit: true on client, false on SSR

  // Define the shape of a window state object (optional, for TypeScript)
  export interface WindowState {
    id: string;
    title: string;
    route: string;
    defaultSize?: { width: number; height: number };
    resizable?: boolean; // optional boolean; if it's always provided, you could leave it as boolean
    ref?: SvelteComponent | null;  // now typed as a Svelte component instance
    component: typeof SvelteComponent;  // add the missing property for the window's component
  }

  // Load initial state from localStorage if running in the browser
  let initialWindows: WindowState[] = [];
  if (browser) {
    const saved = localStorage.getItem('openWindows');
    if (saved) {
      try {
        initialWindows = JSON.parse(saved);
      } catch {
        initialWindows = [];
      }
    }
    // (If needed, set a non-empty default list here when no saved state)
  }

  // Create a reactive state store for the windows list using the $state rune
  export const openWindows = $state(initialWindows);

  // Whenever openWindows changes, save it to localStorage (browser-only)
  if (browser) {
    $: {
      // Create a new array containing only serializable fields
      const persistable = openWindows.map(({ id, title, route, defaultSize, resizable }) => ({
        id, title, route, defaultSize, resizable
      }));
      console.log('Saving windows:', persistable);
      localStorage.setItem('openWindows', JSON.stringify(persistable));
    }
  }