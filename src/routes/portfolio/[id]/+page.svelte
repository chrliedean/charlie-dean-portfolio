<script lang="ts">
    import { onMount } from 'svelte';
    import { getYear } from '$lib/utils.js';
    import { updateWindow } from '$lib/stores/windows';
    import { page } from '$app/stores';
    
    // Accept data from both props and the page store
    export let data;

    // Use SvelteKit's page store as a fallback
    $: pageData = data || $page.data;
    
    console.log("Portfolio post component data sources:", {
      propData: data ? 'Present' : 'Missing',
      pageStoreData: $page.data ? 'Present' : 'Missing'
    });
    
    onMount(() => {
      console.log("Portfolio post component mounted with data:", pageData);
      
      if (pageData && pageData.meta) {
        // Update the window with dynamic metadata
        updateWindow(window.location.pathname, {
          title: pageData.meta.title || 'Portfolio Post',
          icon: pageData.meta.icon || 'document',
          // Also update the data property so it's available if the window is reused
          data: pageData
        });
        console.log("Window updated with title:", pageData.meta.title);
      } else {
        console.error("Post data is missing or incomplete:", pageData);
      }
    });
  </script>
  
  <script context="module">
    export const windowMeta = {
      id: 'portfolio-post',
      title: 'Portfolio Post',
      route: '/portfolio/[id]',
      defaultSize: { width: 1000, height: 800 },
      maxSize: { width: 1200, height: 1000 },
      icon: 'folder',
      style: 'reader',
    };
  </script>
  
  <svelte:head>
    <title>{pageData?.meta?.title || 'Portfolio Post'}</title>
    <meta property="og:type" content="article" />
    <meta property="og:title" content={pageData?.meta?.title || 'Portfolio Post'} />
  </svelte:head>
  
  {#if pageData && pageData.meta}
    <article>
      <hgroup>
        <h1 class="editorial-headline">{pageData.meta.title || 'No title'}</h1>
        <p class="portfolio-year">{pageData.meta.date ? getYear(pageData.meta.date) : 'Unknown'}, {pageData.meta.medium}</p>
      </hgroup>
      
      
      
      <div class="prose">
        {#if pageData.content}
          <svelte:component this={pageData.content} />
        {:else}
          <p>Content not available - data.content is missing</p>
        {/if}
      </div>
    </article>
  {:else}
    <div class="loading">
      <p>Loading post... (If this persists, there might be an issue with data flow)</p>
    </div>
  {/if}