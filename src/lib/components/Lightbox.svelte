<script lang="ts">
	import { getContext } from 'svelte';
	import { onMount } from 'svelte';
	
	const windowId = getContext('windowId');
	
	let { imagePath, imageAlt, imageCaption, onClose, onNextImage } = $props<{
		imagePath: string;
		imageAlt: string;
		imageCaption?: string;
		onClose: () => void;
		onNextImage: () => void;
	}>();
	
	function handleClick(event: MouseEvent) {
		// Only close if the click is NOT on the image
		const target = event.target as HTMLElement;
		if (!target?.closest('img')) {
			onClose();
		} else {
			onNextImage();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div role="presentation" class="lightbox" onclick={handleClick} >
	<img
		src={imagePath}
		alt={imageAlt}
		loading="eager"
	/>
	<span class="caption">{imageCaption}</span>
</div>

<style>


</style> 