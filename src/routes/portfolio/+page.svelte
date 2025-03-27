<script context="module">
  export const windowMeta = {
    id: 'portfolio',
    title: 'Portfolio',
    route: '/portfolio',
    defaultSize: {width: 600, height: 400},
    icon: 'folder'
  };
</script>


<script lang="ts">
  import { onMount } from "svelte";
  import SmartLink from "$lib/components/SmartLink.svelte";
  import { formatDate } from "$lib/utils";
  import Icon from "$lib/components/Icon.svelte";
  
  export let data = { posts: [] };
  let loading = true;
  
  onMount(async () => {
    console.log("Portfolio page data on mount:", data);
    
    // If data.posts is empty or undefined, try to fetch from API
    if (!data?.posts || data.posts.length === 0) {
      console.log("No posts in data, trying API fetch");
      try {
        const response = await fetch('/api/portfolio-files');
        if (response.ok) {
          const posts = await response.json();
          console.log("Fetched posts from API:", posts);
          data = { posts };
        } else {
          console.error("Failed to fetch posts from API");
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    }
    
    loading = false;
  });
</script>

<svelte:head>
  <title>Charlie Dean - Portfolio</title>
  <meta name="description" content="Portfolio of Charlie Dean's work" />
</svelte:head>

<section>
  <h2>Portfolio</h2>
  
  {#if loading}
    <p>Loading portfolio items...</p>
  {:else}
    <ul class="posts">
      {#if data?.posts && data.posts.length > 0}
        {#each data.posts as post}
          <li class="post">
            <SmartLink href={post.route} classname="post-link">
              {#if post.icon}<Icon name={post.icon} size="16px" />{/if}
              <span class="title">{post.title}</span>
            </SmartLink>
            <p class="date">{formatDate(post.date ?? '')}</p>
            <p class="description">{post.medium ?? ''}</p>
          </li>
        {/each}
      {:else}
        <li>No portfolio items found.</li>
      {/if}
    </ul>
  {/if}
</section>