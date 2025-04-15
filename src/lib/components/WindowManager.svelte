<script lang="ts">
  import { onMount, tick, setContext } from "svelte";
  import { page } from "$app/stores";
  import { get } from "svelte/store";
  import { browser } from "$app/environment";
  import Window from "./Window.svelte";
  import type { WindowEntry } from "$lib/types/window";
  import { afterNavigate } from "$app/navigation";

  import {
    getWindows,
    addWindow,
    removeWindow,
    updateWindow,
    focusWindow,
    initializeWindows,
    getFocusedWindow,
  } from "$lib/state/windowState.svelte";
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
    //console.log("🪟 WindowManager mounted");
    
    window.addEventListener("mousedown", recordOrigin);
    return () => {
      window.removeEventListener("mousedown", recordOrigin);
      //console.log("🪟 WindowManager unmounted");
    };
  });

  //-------------------------
  // Helper: Normalize route
  //-------------------------
  function normalizeRoute(route: string): string {
    return route;
  }

  // -------------------------------
  // Helper: Update document title based on focused window
  // -------------------------------
  // function updateDocumentTitle(id: string) {
  //   updateWindows((getWindows()) => {
  //     const win = windows.find((w) => w.id === id);
  //     document.title = win
  //       ? `${win.title} - Charlie Dean`
  //       : "Charlie Dean Portfolio - Charlie Dean";
  //     return windows;
  //   });
  // }

  // -------------------------------
  // Helper: Load Portfolio Posts
  // -------------------------------
  async function loadPortfolioPost(postId: string) {
    try {
      // First try to get the post data through the API
      const response = await fetch(`/api/portfolio-files/${postId}`);
      console.log(`🔍 Loading post ${postId} from API`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }

      // // If that fails, try to import the markdown file directly
      // const post = await import(`/src/portfolio-files/${postId}.md`);
      // if (post && post.metadata) {
      //   return {
      //     content: post.default,
      //     meta: {
      //       ...post.metadata,
      //       id: postId,
      //     },
      //   };
      // }

      console.error(`Failed to load post ${postId}`);
      return null;
    } catch (error) {
      console.error(`Error loading post ${postId}:`, error);
      return null;
    }
  }

  // -------------------------------
  // Handle route changes from $page
  // -------------------------------

  async function handleRouteChange(route: string) {
    route = normalizeRoute(route);
    console.log("🔍 Handling route change for:", route);
    // Get current page data from the SvelteKit store
    const currentPageData = get(page).data;
    console.log("🔍 Current page data:", currentPageData);
    // Check if this window is already open
    const existingWindow = getWindows().find(w => w.id === route);
    
    if (existingWindow) {
      // Check if this window is already focused
      const focusedWindow = getFocusedWindow();
      if (focusedWindow?.id === route) {
        return;
      }
      
      // Ensure the window has a valid ref before focusing
      if (!existingWindow.ref) {
        await tick();
      }
      
      focusWindow(route);
      return;
    }

    // If no window exists for this route, create one
    let baseConfig = windowConfig[route];

    // If no static config is found, check if it's a dynamic post route
    if (!baseConfig) {
      if (route.startsWith("/portfolio/") && route !== "/portfolio") {
        baseConfig = windowConfig["/portfolio/[id]"];
        const postId = route.split("/").pop();

        if (baseConfig) {
          // Create a unique config for this portfolio item
          const portfolioConfig = {
            ...baseConfig,
            id: route,
            route: route,
            title: currentPageData?.meta?.title || `Loading ${postId}...`,
            icon: currentPageData?.meta?.icon || baseConfig.icon || "folder",
            component: baseConfig.component,
            data: currentPageData,
            xyorigin: lastOrigin || undefined
          };
 
          baseConfig = portfolioConfig;
        } else {
          console.error(`❌ No base config found for dynamic route at /portfolio/[id]`);
          // Fall back to error window
          baseConfig = windowConfig['/error'];
          route = '/error';
        }
      } else {
        //console.log("404 - no page for route:", route);
        // Use error window for unknown routes
        baseConfig = windowConfig['/error'];
        route = '/error';
      }
    }

    // Create a new window with the current page data
    const newWindow: WindowEntry = {
      ...baseConfig,
      id: route,
      route: route,
      ref: null,
      data: currentPageData,
      xyorigin: lastOrigin || undefined
    };

    // console.log(`➕ Adding new window: ${route}`, {
    //   hasComponent: !!newWindow.component,
    //   data: newWindow.data,
    //   xyorigin: newWindow.xyorigin,
    //   icon: newWindow.icon
    // });
    addWindow(newWindow);
    
    // Ensure focus is set after adding the window
    await tick();
    focusWindow(route);
  }

  // Subscribe to $page changes
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

  let lastNavigationTime = 0;
  const NAVIGATION_COOLDOWN = 100; // 100ms cooldown between navigations

  // function handleWindowFocus(event: CustomEvent<{ id: string }>) {
  //   const windowId = event.detail.id;
  //   focusWindow(windowId);
  // }

  function closeWindow(id: string) {
    removeWindow(id);
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
{#each getWindows() as win (win.id)}
  <Window
    {closeWindow}
    {...win}
    on:update={handleWindowUpdate}
    bind:ref={win.ref}
    minHeight={150}
    minWidth={300}
    icon={win.icon}
  >
    <!-- Render the page component defined in the page module -->
    <svelte:component this={win.component} data={win.data} />
  </Window>
{/each}
