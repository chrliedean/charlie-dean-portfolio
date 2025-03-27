<script lang="ts">
    import { onMount } from 'svelte';
    import { formatDate } from '$lib/utils.js';
    import { updateWindow } from '$lib/stores/windows';
    
    export let data;
    
    // Log the data as soon as it's received to see what we're getting
    console.log("Initial data in portfolio post component:", data);
    
    onMount(() => {
      console.log("Portfolio post component mounted with data:", data);
      
      if (data && data.meta) {
        // Update the window with dynamic metadata
        updateWindow(window.location.pathname, {
          title: data.meta.title || 'Portfolio Post',
          icon: data.meta.icon || 'document', 
        });
        console.log("Window updated with title:", data.meta.title);
      } else {
        console.error("Post data is missing or incomplete:", data);
      }
    });
  </script>
  
  <script context="module">
    export const windowMeta = {
      id: 'portfolio-post',
      title: 'Portfolio Post', // This will be updated dynamically after load
      route: '/portfolio/[id]',
      defaultSize: { width: 600, height: 400 },
      icon: 'folder'
    };
  </script>
  
  <svelte:head>
    <title>{data?.meta?.title || 'Portfolio Post'}</title>
    <meta property="og:type" content="article" />
    <meta property="og:title" content={data?.meta?.title || 'Portfolio Post'} />
  </svelte:head>
  
  <!-- Debug info to help troubleshoot -->
  <div style="background: #f5f5f5; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; display: none;">
    <p>Debug info:</p>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </div>
  
  {#if data && data.meta}
    <article>
      <hgroup>
        <h1>{data.meta.title || 'No title'}</h1>
        <p>Published at {data.meta.date ? formatDate(data.meta.date) : 'Unknown'}</p>
      </hgroup>
      
      {#if data.meta.categories && data.meta.categories.length > 0}
        <div class="tags">
          {#each data.meta.categories as category}
            <span class="surface-4">&num;{category}</span>
          {/each}
        </div>
      {/if}
      
      <p class="medium">{data.meta.medium || ''}</p>
      
      <div class="prose">
        {#if data.content}
          <svelte:component this={data.content} />
        {:else}
          <p>Content not available - data.content is missing</p>
        {/if}
      </div>
    </article>
  {:else}
    <div class="loading">
      <p>Loading post... (If this persists, there might be an issue loading the data)</p>
    </div>
  {/if}