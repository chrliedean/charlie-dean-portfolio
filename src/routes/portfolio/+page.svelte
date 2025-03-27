<!-- /portfolio/+page.svelte-->
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
import { portfolioStore } from "$lib/stores/portfolioStore";

// When loaded normally, SvelteKit injects load data as the 'data' prop
export let data: { posts: any[] } | null = null;

// Create a reactive posts list that will update the UI when changed
let posts: any[] = [];

// Use a reactive statement to update posts whenever data changes
$: if (data && data.posts) {
  posts = data.posts;
  portfolioStore.set(data);
}

onMount(async () => {
  // If posts aren't available from the server data, fetch them
  if (!posts.length) {
    try {
      console.log("Fetching posts from API");
      const res = await fetch('/api/portfolio-files');
      if (res.ok) {
        const fetchedPosts = await res.json();
        posts = fetchedPosts;
        portfolioStore.set({ posts: fetchedPosts });
        console.log("Posts fetched successfully:", posts);
      } else {
        console.error("Failed to fetch posts, status:", res.status);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  } else {
    console.log("Using server-provided posts:", posts);
  }
});
</script>

<section>
{#if posts.length > 0}
  <ul class="posts">
    {#each posts as post}
      <li class="post">
        <SmartLink href={post.route} classname="title">{post.title}</SmartLink>
        <p class="date">{formatDate(post.date ?? '')}</p>
        <p class="description">{post.medium}</p>
      </li>
    {/each}
  </ul>
{:else}
  <p>Loading portfolio items...</p>
{/if}
</section>