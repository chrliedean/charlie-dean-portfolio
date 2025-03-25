<script context="module" lang="ts">
	let highestZIndex = 1;
</script>
<script lang="ts">
	import { onMount, tick, createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';
	import { soundCommand } from './SoundEffects.svelte';
	import { getContext, setContext } from 'svelte';
	import  Icon  from './Icon.svelte';

	export let id: string;
	export let title = '';
	export let route = '';
	export let defaultSize = { width: 400, height: 300 };
	export let minHeight: number;
	export let minWidth: number;
	export let resizable = true;
	export let icon = '';
	
  export let style = '';
	// New exported props for persisted size/position.
	export let currentSize: { width: number; height: number } | null = null;
	export let currentPosition: { x: number; y: number } | null = null;

	let windowEl: HTMLDivElement;
	let offset = { x: 0, y: 0 };
	let isDragging = false;
	let dragOccurred = false;
	const topPadding = 26;
	const padding = 10;
	const dispatch = createEventDispatcher();

	export let closeWindow: (id: string) => void;
	


	// Center the window within the viewport.
	export async function centerWindow() {
		await tick();
		requestAnimationFrame(() => {
			const winWidth = windowEl.offsetWidth;
			const winHeight = windowEl.offsetHeight;
			const screenWidth = window.innerWidth;
			const screenHeight = window.innerHeight;
			const left = (screenWidth - winWidth) / 2;
			const top = topPadding + ((screenHeight - topPadding) - winHeight) / 2;
			windowEl.style.left = `${left}px`;
			windowEl.style.top = `${top}px`;
		});
	}

	onMount(() => {
		const vw = window.innerWidth - padding * 2;
		const vh = window.innerHeight - padding * 2;
		let width: number, height: number;
		if (currentSize) {
			width = currentSize.width;
			height = currentSize.height;
		} else {
			width = Math.min(defaultSize.width, vw);
			height = Math.min(defaultSize.height, vh);
			width = Math.max(minWidth, width);
			height = Math.max(minHeight, height);
		}
		windowEl.style.width = `${width}px`;
		windowEl.style.height = `${height}px`;
		
		if (currentPosition) {
			windowEl.style.left = `${currentPosition.x}px`;
			windowEl.style.top = `${currentPosition.y}px`;
		} else {
			centerWindow();
		}

		// Bring window to front when clicked.
		windowEl.addEventListener('mousedown', bringToFront);

		// Manage active/inactive window classes.
		const handleDocumentClick = (event: MouseEvent) => {
			if (windowEl.contains(event.target as Node)) {
				windowEl.classList.add('active');
				windowEl.classList.remove('inactive');
			} else {
				windowEl.classList.remove('active');
				windowEl.classList.add('inactive');
			}
		};

		document.addEventListener('mousedown', handleDocumentClick);
		window.addEventListener('resize', clampPositionToViewport);

		return () => {
			document.removeEventListener('mousedown', handleDocumentClick);
			window.removeEventListener('resize', clampPositionToViewport);
		};
	});

	function handleTitleMouseDown(event: MouseEvent) {
		if ((event.target as HTMLElement).closest('.titlebar-button')) return;
		startDragging(event);
	}

	function startDragging(event: MouseEvent) {
		soundCommand.set('drag-start');
		isDragging = true;
		dragOccurred = false;
		const rect = windowEl.getBoundingClientRect();
		offset = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging) return;
		dragOccurred = true;
		const winWidth = windowEl.offsetWidth;
		const winHeight = windowEl.offsetHeight;
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;
		let x = event.clientX - offset.x;
		let y = event.clientY - offset.y;
		x = Math.max(0, Math.min(x, screenWidth - winWidth));
		y = Math.max(topPadding, Math.min(y, screenHeight - winHeight));
		windowEl.style.left = `${x}px`;
		windowEl.style.top = `${y}px`;
	}

	function handleMouseUp() {
		soundCommand.set('drag-end');
		isDragging = false;
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
		updateWindowState();
	}

	function clampPositionToViewport() {
		if (!windowEl) return;
		const winWidth = windowEl.offsetWidth;
		const winHeight = windowEl.offsetHeight;
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;
		const currentLeft = windowEl.offsetLeft;
		const currentTop = windowEl.offsetTop;
		const clampedLeft = Math.min(currentLeft, screenWidth - winWidth);
		const clampedTop = Math.min(currentTop, screenHeight - winHeight);
		windowEl.style.left = `${Math.max(0, clampedLeft)}px`;
		windowEl.style.top = `${Math.max(topPadding, clampedTop)}px`;
	}

	let isResizing = false;
	let resizeStart = { x: 0, y: 0 };
	let startSize = { width: 0, height: 0 };

	function handleResizeMouseDown(event: MouseEvent) {
		isResizing = true;
		resizeStart = { x: event.clientX, y: event.clientY };
		startSize = {
			width: windowEl.offsetWidth,
			height: windowEl.offsetHeight
		};
		window.addEventListener('mousemove', handleResizing);
		window.addEventListener('mouseup', handleResizeMouseUp);
		soundCommand.set('drag-start');
	}

	function handleResizing(event: MouseEvent) {
		if (!isResizing) return;
		const deltaX = event.clientX - resizeStart.x;
		const deltaY = event.clientY - resizeStart.y;
		const newWidth = Math.max(minWidth, startSize.width + deltaX);
		const newHeight = Math.max(minHeight, startSize.height + deltaY);
		windowEl.style.width = `${newWidth}px`;
		windowEl.style.height = `${newHeight}px`;
	}

	function handleResizeMouseUp() {
		isResizing = false;
		window.removeEventListener('mousemove', handleResizing);
		window.removeEventListener('mouseup', handleResizeMouseUp);
		updateWindowState();
		soundCommand.set('drag-end');
	}

	// Update currentSize and currentPosition and dispatch an event.
	function updateWindowState() {
		const currentSize = { width: windowEl.offsetWidth, height: windowEl.offsetHeight };
		const currentPosition = { x: windowEl.offsetLeft, y: windowEl.offsetTop };
		dispatch('update', { id, currentSize, currentPosition });
	}

	// Bring this window to the front.
	function bringToFront() {
		highestZIndex++;
		windowEl.style.zIndex = `${highestZIndex}`;
		windowEl.classList.add('active');
		windowEl.classList.remove('inactive');
		dispatch('focus', { id });
	}

	function handleTitleClick(event: MouseEvent) {
		if (!dragOccurred && route) {
			goto(route);
		}
	}

	let minimized = false;
	function minimizeWindow(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (minimized) {
			windowEl.classList.remove('minimized');
			minimized = false;
			soundCommand.set('wexp');
		} else {
			windowEl.classList.add('minimized');
			minimized = true;
			soundCommand.set('wcol');
		}
	}

	export function focus() {
		windowEl.classList.remove('minimized');
		bringToFront();
	}

	function closeWindowButton(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		closeWindow(id);
		console.log('closing window:', id);
	}
	setContext('windowId', id);
</script>

<div bind:this={windowEl} class="window {style}" class:resizable={resizable} role="presentation">
	<div class="titlebar" onmousedown={handleTitleMouseDown} onclick={handleTitleClick} role="presentation">
		<div class="w-layout-hflex title-bar-flexbox">
			<div class="titlebar-button" onclick={closeWindowButton} role="presentation"></div>
			<div class="window-stripes">
				<div class="horizontal-window-stripe"></div>
				<div class="horizontal-window-stripe"></div>
				<div class="horizontal-window-stripe"></div>
				<div class="horizontal-window-stripe"></div>
				<div class="horizontal-window-stripe"></div>
				<div class="horizontal-window-stripe"></div>
			</div>
			<h1 class="window-title">
				{#if icon}
					<Icon name={icon} size="1em" />
				{/if}
				{title}
			</h1>
			<div class="window-stripes">
				<div class="horizontal-window-stripe"></div>
				<div class="horizontal-window-stripe"></div>
				<div class="horizontal-window-stripe"></div>
				<div class="horizontal-window-stripe"></div>
				<div class="horizontal-window-stripe"></div>
				<div class="horizontal-window-stripe"></div>
			</div>
			<div class="titlebar-button zoom-parent">
				<div class="titlebar-button-zoom"></div>
			</div>
			<div class="titlebar-button" onclick={minimizeWindow} role="presentation">
				<div class="titlebar-button-minimize"></div>
			</div>
		</div>
	</div>
	<div class="window-body" role="presentation">
		<slot {id}/>
	</div>
	<div class="resize-handle" onmousedown={handleResizeMouseDown} role="presentation"></div>
</div>