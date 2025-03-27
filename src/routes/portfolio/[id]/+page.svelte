<script lang="ts">
    import { onMount } from 'svelte';
    import { formatDate } from '$lib/utils.js';
    import { updateWindow } from '$lib/stores/windows';
    
    export let data;
    
    onMount(() => {
      if (data && data.meta) {
        // Update the window with dynamic metadata
        updateWindow(window.location.pathname, {
          title: data.meta.title || 'Portfolio Item',
          icon: data.meta.icon || 'document',
        });
      }
    });
  </script>
  
  <script context="module">
    export const windowMeta = {
      id: 'portfolio-post',
      title: 'Portfolio Item', // This will be updated dynamically after load
      route: '/portfolio/[id]',
      defaultSize: { width: 600, height: 500 },
      icon: 'document'
    };
  </script>
  
  <svelte:head>
    <title>{data?.meta?.title || 'Portfolio Item'} - Charlie Dean</title>
    <meta property="og:type" content="article" />
    <meta property="og:title" content={data?.meta?.title || 'Portfolio Item'} />
  </svelte:head>
  
  <article>
    <header>
      <h1>{data?.meta?.title || 'No title'}</h1>
      <p class="date">{data?.meta?.date ? formatDate(data.meta.date) : 'Unknown date'}</p>
      {#if data?.meta?.medium}
        <p class="medium">{data.meta.medium}</p>
      {/if}
    </header>
    
    {#if data?.meta?.categories && data.meta.categories.length > 0}
      <div class="categories">
        {#each data.meta.categories as category}
          <span class="category">#{category}</span>
        {/each}
      </div>
    {/if}
    
    <div class="content">
      {#if data && data.content}
        <svelte:component this={data.content} />
      {:else}
        <p>No content available.</p>
      {/if}
    </div>
  </article>