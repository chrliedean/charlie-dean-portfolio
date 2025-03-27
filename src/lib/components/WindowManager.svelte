<script lang="ts">
  import { onMount, tick, setContext } from "svelte";
  import { page } from "$app/stores";
  import { get } from "svelte/store";
  import Window from "./Window.svelte";
  import type { WindowEntry } from "$lib/types/WindowEntry";
  import {
    openWindows,
    focusedWindow,
    updateWindow,
  } from "$lib/stores/windows";
  import { windowConfig } from "$lib/config/windows";
  import { goto } from "$app/navigation";
  let data = windowConfig.data;

  // Global variable to record last left-click coordinates.
  let lastOrigin: { x: number; y: number } | null = null;

  // Record left-click coordinates whenever the user clicks.
  function recordOrigin(event: MouseEvent) {
    if (event.button === 0) {
      // only for left clicks
      lastOrigin = { x: event.clientX, y: event.clientY };
    }
  }

  onMount(() => {
    window.addEventListener("mousedown", recordOrigin);
    return () => {
      window.removeEventListener("mousedown", recordOrigin);
    };
  });

  // -------------------------------
  // Helper: Load saved window state from localStorage
  // -------------------------------
  function loadSavedState(): any[] {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("openWindows");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          console.error("Error parsing saved windows state", error);
        }
      }
    }
    return [];
  }

  //-------------------------
  // Helper: Normalize route
  //-------------------------
  function normalizeRoute(route: string): string {
    return route
  }

  // -------------------------------
  // Merge dynamic config with saved state
  // -------------------------------
  const savedState: any[] = loadSavedState();
  let mergedWindows: WindowEntry[] = savedState
    .filter((saved) => {
      const normRoute = normalizeRoute(saved.route);
      // Skip dynamic post windows (e.g. /portfolio/some-post) so they are not loaded from localStorage
      if (normRoute.startsWith('/portfolio/') && normRoute !== '/portfolio') {
        return false;
      }
      return windowConfig[normRoute] !== undefined;
    })
    .map((saved) => {
      const config = windowConfig[normalizeRoute(saved.route)];
      return { ...config, ...saved, id: normalizeRoute(saved.route), route: normalizeRoute(saved.route), ref: null };
    });
  openWindows.set(mergedWindows);

  // Initialize store with merged windows.
  openWindows.set(mergedWindows);

  // -------------------------------
  // Helper: Update document title based on focused window
  // -------------------------------
  function updateDocumentTitle(id: string) {
    openWindows.update((windows) => {
      const win = windows.find((w) => w.id === id);
      document.title = win
        ? `${win.title} - Charlie Dean`
        : "Charlie Dean Portfolio - Charlie Dean";
      return windows;
    });
  }

  // -------------------------------
  // Handle route changes from $page
  // -------------------------------


  async function handleRouteChange(route: string) {
  route = normalizeRoute(route);
  console.log(`🔄 Handling route change to: ${route}`);
  
  // Get current page data from the SvelteKit store
  const currentPageData = get(page).data;
  console.log("Current page data from SvelteKit:", currentPageData);
  
  let baseConfig = windowConfig[route];
  console.log(`Found baseConfig for route ${route}:`, baseConfig ? 'Yes' : 'No');
  
  // If no static config is found, check if it's a dynamic post route
  if (!baseConfig) {
    if (route.startsWith('/portfolio/') && route !== '/portfolio') {
      console.log(`👉 Detected dynamic portfolio post route: ${route}`);
      
      // Use the base config for dynamic posts
      baseConfig = windowConfig['/portfolio/[id]'];
      console.log(`Found dynamic route config:`, baseConfig ? 'Yes' : 'No');
      
      const postId = route.split('/').pop();
      console.log(`Post ID: ${postId}`);
      
      if (baseConfig) {
        console.log(`Using base config for post: ${postId}`, baseConfig);
        
        // Create a copy of the base config with a unique ID
        baseConfig = {
          ...baseConfig,
          id: route, // Use full route as ID for uniqueness
          route: route,
          title: currentPageData?.meta?.title || `Loading ${postId}...`,
          icon: currentPageData?.meta?.icon || 'folder',
        };
      } else {
        console.error(`❌ No base config found for dynamic route at /portfolio/[id]`);
        return;
      }
    } else {
      console.log("404 - no page for route:", route);
      return;
    }
  }
  
  openWindows.update((windows) => {
    const windowId = route;
    const existing = windows.find((w) => w.id === windowId);
    
    if (existing) {
      console.log(`🔍 Found existing window for ${route}, bringing to front`);
      if (get(focusedWindow)?.id !== existing.id) {
        // If we have new data, update the existing window
        if (currentPageData && Object.keys(currentPageData).length > 0) {
          console.log("Updating existing window with new data:", currentPageData);
          existing.data = currentPageData;
        }
        
        const others = windows.filter((w) => w.id !== windowId);
        windows = [...others, existing];
        focusedWindow.set(existing);
        updateDocumentTitle(existing.id);
      }
    } else {
      console.log(`🆕 Creating new window for route ${route}`);
      
      // Create a new window with the current page data
      const newWindow: WindowEntry = {
        ...baseConfig,
        id: windowId,
        route: windowId,
        ref: null,
        xyorigin: lastOrigin || undefined,
        data: currentPageData // Set the SvelteKit page data here
      };
      
      console.log(`New window config with data:`, {
        ...newWindow,
        data: currentPageData ? 'Data exists' : 'No data'
      });
      
      windows = [...windows, newWindow];
      focusedWindow.set(newWindow);
      updateDocumentTitle(newWindow.id);
      lastOrigin = null;
    }
    return windows;
  });
  
  await tick();
  const win = get(openWindows).find((w) => normalizeRoute(w.route) === route);
  if (win && win.ref && typeof win.ref.focus === "function") {
    console.log(`Focusing window for ${route}`);
    win.ref.focus();
  }
}

  // Subscribe to $page changes so that when the URL changes, we open/focus the corresponding window.
  onMount(() => {
    const currentRoute = $page.url.pathname;
    handleRouteChange(currentRoute);

    const unsubscribe = page.subscribe(($page) => {
      const newRoute = $page.url.pathname;
      handleRouteChange(newRoute);
    });
    return unsubscribe;
  });

  // -------------------------------
  // Additional Window Functions (optional)
  // -------------------------------

  function handleWindowFocus(id: string) {
    const win = get(openWindows).find((w) => w.id === id);
    if (win && get(focusedWindow)?.id !== id) {
      focusedWindow.set(win);
      updateDocumentTitle(win.id);
      goto(win.route);
      if (win.ref && typeof win.ref.focus === "function") {
        win.ref.focus();
      }
    }
  }

  function bringWindowToFront(id: string) {
    openWindows.update((windows) => {
      const win = windows.find((w) => w.id === id);
      if (win && win.ref?.focus) {
        win.ref.focus();
      }
      return windows;
    });
  }

  function closeWindow(id: string) {
    openWindows.update((windows) => {
      const updated = windows.filter((win) => win.id !== id);
      if (updated.length > 0) {
        const last = updated[updated.length - 1];
        if (last.ref?.focus) {
          last.ref.focus();
          focusedWindow.set(last);
        }
      }
      return updated;
    });
  }

  function handleWindowUpdate(
    event: CustomEvent<{
      id: string;
      currentSize: { width: number; height: number };
      currentPosition: { x: number; y: number };
    }>
  ) {
    updateWindow(event.detail.id, {
      currentSize: event.detail.currentSize,
      currentPosition: event.detail.currentPosition,
    });
  }

  // Expose closeWindow via context if needed.
  setContext("windowManager", closeWindow);
</script>

<!-- Render all open windows -->
{#each $openWindows as win (win.id)}
  <Window
    {closeWindow}
    {...win}
    on:focus={(event) => handleWindowFocus(event.detail.id)}
    on:update={handleWindowUpdate}
    bind:this={win.ref}
    minHeight={150}
    minWidth={300}
    icon={win.icon}
  >
    <!-- Render the page component defined in the page module -->
    <svelte:component this={win.component} data={win.data}/>
  </Window>
{/each}
