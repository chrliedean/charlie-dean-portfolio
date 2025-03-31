<script lang="ts">
	import { onMount } from 'svelte';
	
	// Props
	let { 
		folderPath = '/images', 
		pageSize = 12,
		captions = {} as Record<number, string>
	} = $props();
	
	// State
	let currentPage = $state(1);
	let images = $state<Array<{ path: string; alt: string; filename: string }>>([]);
	let isLoading = $state(false);
	let hasMore = $state(true);
	let error = $state<string | null>(null);

	// Fetch images for current page
	async function fetchImages() {
		if (isLoading || !hasMore) return;
		
		isLoading = true;
		error = null;
		
		try {
			const response = await fetch(
				`/api/gallery?folder=${encodeURIComponent(folderPath)}&page=${currentPage}&pageSize=${pageSize}`
			);
			
			if (!response.ok) throw new Error('Failed to fetch images');
			
			const data = await response.json();
			images = [...images, ...data.images];
			hasMore = data.hasMore;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load images';
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
	onMount(() => {
		fetchImages();
	});
</script>

{#each images as { path, alt }, i}
	<figure>
		<img
			src={path} 
			alt={alt}
			loading="lazy"
		/>
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
   
