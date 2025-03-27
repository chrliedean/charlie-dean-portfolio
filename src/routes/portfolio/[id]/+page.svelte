<script lang="ts">
    import { onMount } from 'svelte';
    import { formatDate } from '$lib/utils.js';
    import { updateWindow } from '$lib/stores/windows';
    
    export let data;
    
    onMount(() => {
      if (data && data.meta) {
        // Update the window with dynamic metadata
        updateWindow(window.location.pathname, {
          title: data.meta.title || 'Portfolio Post',
          icon: data.meta.icon || 'document', // Use a default or specific icon from the post
        });
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
  
  <article>
    <hgroup>
      <h1>{data?.meta?.title || 'No title'}</h1>
      <p>Published at {data?.meta?.date ? formatDate(data.meta.date) : 'Unknown'}</p>
    </hgroup>
    <div class="tags">
      {#if data && data.meta && data.meta.categories}
        {#each data.meta.categories as category}
          <span class="surface-4">&num;{category}</span>
        {/each}
      {/if}
    </div>
    <div class="prose">
      {#if data && data.content}
        <svelte:component this={data.content} />
      {/if}
    </div>
  </article>