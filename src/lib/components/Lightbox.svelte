<script lang="ts">
	import { getContext } from 'svelte';
	import { onMount } from 'svelte';
	import { soundCommand } from './SoundEffects.svelte';
	
	const windowId = getContext('windowId');
	
	let { imagePath, imageAlt, imageCaption, onClose, onNextImage, onPreviousImage } = $props<{
		imagePath: string;
		imageAlt: string;
		imageCaption?: string;
		onClose: () => void;
		onNextImage: () => void;
		onPreviousImage: () => void;
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

	function handleMouseDown() {
		soundCommand.set('dscr1');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
		if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
			soundCommand.set('dscr1');
			return;
		}
	}

	function handleKeyup(event: KeyboardEvent) {
		soundCommand.set('dscr2');
		if (event.key === 'ArrowRight') {
			onNextImage();
		}
		if (event.key === 'ArrowLeft') {
			onPreviousImage();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		window.addEventListener('keyup', handleKeyup);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
			window.removeEventListener('keyup', handleKeyup);
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