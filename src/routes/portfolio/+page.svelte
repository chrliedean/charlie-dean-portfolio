<!-- /portfolio/page.svelte-->
<script module>
    export const windowMeta= {
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
  import { get } from "svelte/store";

  interface PortfolioData {
    posts: any[]; // or use a more specific type if available
  }

  // When loaded normally, SvelteKit injects load data as the 'data' prop.
  export let data: PortfolioData | null = null;

  // We'll capture the data once in finalData.
  let finalData: PortfolioData;

  onMount(async () => {
  if (data && data.posts && data.posts.length) {
    finalData = data;
    portfolioStore.set(finalData);
  } else {
    try {
      const res = await fetch('/api/portfolio-files');
      if (res.ok) {
        const posts = await res.json();
        finalData = { posts };
        portfolioStore.set(finalData);
      } else {
        console.error("Failed to fetch posts from API, status:", res.status);
        finalData = { posts: [] };
      }
    } catch (error) {
      console.error("Error fetching posts from API:", error);
      finalData = { posts: [] };
    }
  }
  console.log("Portfolio page finalData onMount:", finalData);
});
</script>

<section>
  <ul class="posts">
    {#each finalData?.posts ?? [] as post}
      <li class="post">
        <a href={post.route} class="title">{post.title}</a>
        <p class="date">{formatDate(post.date ?? '')}</p>
        <p class="description">{post.medium}</p>
      </li>
    {/each}
  </ul>
</section>

<SmartLink href="/portfolio/shave-your-tongue">shave-your-tongue</SmartLink>