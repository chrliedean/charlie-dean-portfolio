<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { getWindows, initializeWindows } from '$lib/state/windowState.svelte';

  if (browser) {
    // Load initial state
    try {
      const saved = localStorage.getItem('windows');
      if (saved) {
        const parsed = JSON.parse(saved);
        initializeWindows(parsed);
      }
    } catch (error) {
      console.error('❌ Failed to load window state:', error);
    }
  }

  // Save state changes
  $effect(() => {
    if (!browser) return;
    
    const persistable = getWindows().map(({
      id, title, route, defaultSize, currentSize,
      currentPosition, minimized, icon
    }) => ({
      id, title, route, defaultSize, currentSize,
      currentPosition, minimized, icon
    }));

    localStorage.setItem('windows', JSON.stringify(persistable));
  });
</script>
