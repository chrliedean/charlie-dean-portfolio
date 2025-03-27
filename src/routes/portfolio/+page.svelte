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
  import SmartLink from "$lib/components/SmartLink.svelte";
  import { formatDate } from "$lib/utils";
  import Icon from "$lib/components/Icon.svelte";
  
  export let data;
</script>

<svelte:head>
  <title>Charlie Dean - Portfolio</title>
  <meta name="description" content="Portfolio of Charlie Dean's work" />
</svelte:head>

<section>
  <h2>Portfolio</h2>
  
  <ul class="posts">
    {#if data.posts && data.posts.length > 0}
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
</section>