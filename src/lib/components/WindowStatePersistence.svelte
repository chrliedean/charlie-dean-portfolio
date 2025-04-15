<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { getWindows, initializeWindows, updateWindow } from '$lib/state/windowState.svelte';
  import { windowConfig } from '$lib/config/windows';
  import type { WindowEntry } from '$lib/types/window';

  // Storage key constant
  const STORAGE_KEY = 'openWindows';

  // Normalize route helper
  function normalizeRoute(route: string): string {
    return route;
  }

  // Helper to load portfolio post data with content
  async function loadPortfolioPost(postId: string) {
    try {
      // console.log(`WindowStatePersistence: Loading portfolio post ${postId}`);
      
      // Use dynamic import to get both metadata and content component
      const post = await import(`/src/portfolio-files/${postId}.md`);
      
      // console.log(`Post ${postId} loaded:`, { 
      //   hasDefault: !!post.default, 
      //   hasMetadata: !!post.metadata 
      // });
      
      if (post.default && post.metadata) {
        return {
          content: post.default,
          meta: {
            ...post.metadata,
            id: postId
          }
        };
      }
      
      console.error(`Failed to load complete post ${postId}`);
      return null;
    } catch (error) {
      console.error(`Error loading post ${postId}:`, error);
      return null;
    }
  }

  // Load data for portfolio posts
  async function loadPortfolioPostsData(windows: WindowEntry[]) {
    // console.log("WindowStatePersistence: Loading data for portfolio posts");
    for (const window of windows) {
      if (window.route.startsWith("/portfolio/") && window.route !== "/portfolio") {
        const postId = window.route.split("/").pop();
        if (postId) {
          // console.log(`Loading data for post: ${postId}`);
          const data = await loadPortfolioPost(postId);
          if (data) {
            // console.log(`Updating window ${window.id} with post data`);
            updateWindow(window.id, { 
              data,
              title: data.meta.title || 'Portfolio Post'
            });
          }
        }
      }
    }
  }

  if (browser) {
    // Load initial state
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<WindowEntry>[];
        
        // Filter and merge with window config
        const mergedWindows = parsed
          .filter((saved: Partial<WindowEntry>) => {
            const normRoute = normalizeRoute(saved.route || '');

            // Check if this is a portfolio post
            if (normRoute.startsWith("/portfolio/") && normRoute !== "/portfolio") {
              return true;
            }

            // For standard routes, check if they exist in windowConfig
            return windowConfig[normRoute] !== undefined;
          })
          .map((saved: Partial<WindowEntry>) => {
            const normRoute = normalizeRoute(saved.route || '');

            // For portfolio posts, use the [id] config
            if (normRoute.startsWith("/portfolio/") && normRoute !== "/portfolio") {
              const baseConfig = windowConfig["/portfolio/[id]"];
              if (baseConfig) {
                return {
                  ...baseConfig,
                  ...saved,
                  id: normRoute,
                  route: normRoute,
                  ref: null,
                };
              }
            }

            // For standard routes, use the normal config
            const config = windowConfig[normRoute];
            return {
              ...config,
              ...saved,
              id: normRoute,
              route: normRoute,
              ref: null,
            };
          });

        // Initialize windows with merged config
        initializeWindows(mergedWindows);
        
        // Load portfolio post content
        loadPortfolioPostsData(mergedWindows);
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

    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  });
</script>
