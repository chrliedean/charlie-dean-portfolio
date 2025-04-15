<script lang="ts">
  import { onMount, tick } from "svelte";
  import { getContext } from "svelte";
  import { page } from "$app/stores";
  import { pushState, replaceState, goto } from "$app/navigation";
  import Lightbox from "./Lightbox.svelte";

  // Props
  let {
    folderPath = "/img",
    pageSize = 12,
    captions = {} as Record<number, string>,
    paragraphs = {} as Record<number, string>,
  } = $props();

  // Get window context
  const windowId = getContext("windowId");

  // State
  let currentPage = $state(1);
  let lightboxOpen = $state(false);

  let images = $state<Array<{ 
    path: string; 
    alt: string; 
    filename: string;
    folder?: string;
    parentFolder?: string;
  }>>([]);
  
  let isLoading = $state(false);
  let hasMore = $state(true);
  let error = $state<string | null>(null);
  let folders = $state<string[]>([]);
  let parentFolders = $state<string[]>([]);

  // Get current image ID from URL
  let imageId = $derived(
    $page.url.searchParams.get("id")
      ? parseInt($page.url.searchParams.get("id")!)
      : null
  );

  let currentImage = $derived(imageId !== null ? images[imageId] : null);

  // Function to handle image click
  function handleLightboxOpen(event: MouseEvent) {
    if (lightboxOpen) return;
    const target = event.currentTarget as HTMLAnchorElement;
    const id = target.getAttribute("href")?.split("id=")[1];
    if (id) {
      pushState(`?gallery&id=${id}`, { keepfocus: false });

      // Dispatch lightboxMode event
      const event = new CustomEvent("lightboxMode", {
        bubbles: true,
        detail: { windowId },
      });
      document.dispatchEvent(event);
      lightboxOpen = true;
    }
  }

  // Function to handle lightbox close
  function handleLightboxClose() {
    if (!lightboxOpen) return;
    lightboxOpen = false;
    pushState("?", { keepfocus: true });

    // Dispatch lightboxMode event
    const event = new CustomEvent('lightboxMode', { 
      bubbles: true,
      detail: { windowId }
    });
    document.dispatchEvent(event);
  }

  // Function to handle lightbox next image
  function handleLightboxNextImage() {
    const currentId = $page.url.searchParams.get("id") ? parseInt($page.url.searchParams.get("id")!) : null;
    if (currentId !== null) {
      const nextId = (currentId + 1) % images.length;
      goto(`?gallery&id=${nextId}`, { keepFocus: true });
    }
  }

  // Function to handle lightbox previous image
  function handleLightboxPreviousImage() {
    const currentId = $page.url.searchParams.get("id") ? parseInt($page.url.searchParams.get("id")!) : null;
    if (currentId !== null) {
      const previousId = (currentId - 1 + images.length) % images.length;
      goto(`?gallery&id=${previousId}`, { keepFocus: true });
    }
  }

  // Fetch images for current page
  async function fetchImages() {
    if (isLoading || !hasMore) return;

    isLoading = true;
    error = null;

    try {
      // Encode the folder path properly
      const encodedPath = encodeURIComponent(folderPath);
      const apiUrl = `/api/gallery?folder=${encodedPath}&page=${currentPage}&pageSize=${pageSize}`;
      
      // console.log(`Fetching images from: ${apiUrl}`);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}): ${errorText}`);
        throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // console.log(`Received ${data.images.length} images, total: ${data.total}`);
      
      images = [...images, ...data.images];
      hasMore = data.hasMore;
      folders = data.folders;
      parentFolders = data.parentFolders;
    } catch (e) {
      console.error('Gallery fetch error:', e);
      error = e instanceof Error ? e.message : "Failed to load images";
    } finally {
      isLoading = false;
    }
  }

  // Load more images when scrolling to bottom
  function handleScroll(event: Event) {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
      currentPage++;
      fetchImages();
    }
  }

  // Initial load
  onMount(async () => {
    await fetchImages();
    
    // Check if we should open lightbox from URL
    const id = $page.url.searchParams.get("id");
    if (id) {
      lightboxOpen = true;
      // Dispatch lightboxMode event
      const event = new CustomEvent("lightboxMode", {
        bubbles: true,
        detail: { windowId },
      });
      document.dispatchEvent(event);
    }
  });
</script>

{#if currentImage && lightboxOpen}
  <div class="lightbox-container">
    <Lightbox
      imagePath={currentImage.path}
      imageAlt={currentImage.alt}
      onClose={handleLightboxClose}
      onNextImage={handleLightboxNextImage}
      onPreviousImage={handleLightboxPreviousImage}
      imageCaption={imageId !== null ? captions[imageId] : undefined}
    />
  </div>
{/if}

{#each images as { path, alt }, i}
  {#if paragraphs[i]}
    {@html paragraphs[i]}
  {/if}
  <figure>
    <a href="?gallery&id={i}" onclick={handleLightboxOpen} class="image-button">
      <img src={path} {alt} loading="lazy" />
    </a>
    {#if captions[i]}
      <figcaption>{captions[i]}</figcaption>
    {/if}
  </figure>
{/each}

{#if isLoading}
  <div>Loading...</div>
{/if}

{#if error}
  <div>{error}</div>
{/if}

<style>
  .image-button {
    display: block;
    width: 100%;
    height: 100%;
    text-decoration: none;
  }

  .lightbox-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
  }
</style>
