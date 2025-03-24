<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Window from './Window.svelte';
	import { windowConfig } from '../config/windows';
	import type { WindowEntry } from '$lib/types/WindowEntry';
	import { openWindows, focusedWindow, updateWindow } from '$lib/stores/windows';
	import { get } from 'svelte/store';
	import { setContext } from 'svelte';

	// Load saved state from localStorage
	let savedState: any[] = [];
	if (typeof localStorage !== 'undefined') {
		const saved = localStorage.getItem('openWindows');
		if (saved) {
			try {
				savedState = JSON.parse(saved);
			} catch (e) {
				savedState = [];
			}
		}
	}

	// Merge saved state with windowConfig to restore missing props (like component)
	let mergedWindows: WindowEntry[] = savedState.map((saved) => {
		const config = windowConfig[saved.route];
		return config ? { ...config, ...saved, ref: null } : saved;
	});

	const currentRoute = $page.url.pathname;
	// If current route isn’t in the saved state, add it from default config
	if (!mergedWindows.some((win) => win.route === currentRoute) && windowConfig[currentRoute]) {
		mergedWindows.push({ ...windowConfig[currentRoute], ref: null });
	}

	openWindows.set(mergedWindows);

	// Bring a window to the front based on its route.
	const focusWindowForRoute = (route: string) => {
		openWindows.update((windows) => {
			const targetIndex = windows.findIndex((win) => win.route === route);
			if (targetIndex > -1) {
				// Move the target to the end so it appears on top.
				const [target] = windows.splice(targetIndex, 1);
				windows.push(target);
				focusedWindow.set(target);
				goto(target.route);
			}
			return windows;
		});
	};

	onMount(() => {
		focusWindowForRoute(currentRoute);
	});

	function updateDocumentTitle(id: string) {
		openWindows.update((ws) => {
			const win = ws.find((w) => w.id === id);
			document.title = win ? `${win.title} - Charlie Dean` : "Charlie Dean Portfolio - Charlie Dean";
			return ws;
		});
	}

	function handleWindowFocus(id: string) {
		const win = get(openWindows).find((w) => w.id === id);
		if (win) {
			focusedWindow.set(win);
			updateDocumentTitle(id);
			goto(win.route);
			console.log('Focused window:', id);
		}
	}

	function bringWindowToFront(id: string) {
		openWindows.update((ws) => {
			const win = ws.find((w) => w.id === id);
			if (win && win.ref && typeof win.ref.focus === 'function') {
				win.ref.focus();
			}
			return ws;
		});
	}

	async function handleOpenWindow(event: CustomEvent<{ config: WindowEntry }>) {
		const { config } = event.detail;
		// Normalize the id by stripping any leading slash.
		const normalizedId = config.id.replace(/^\//, '');
		openWindows.update((ws) => {
			const existingWindow = ws.find((w) => w.id === normalizedId);
			if (!existingWindow) {
				ws.push({ ...config, id: normalizedId, ref: null });
			} else {
				bringWindowToFront(normalizedId);
			}
			return ws;
		});
		await tick();
		openWindows.update((ws) => {
			const newWindow = ws.find((w) => w.id === normalizedId);
			if (newWindow && newWindow.ref && typeof newWindow.ref.focus === 'function') {
				newWindow.ref.focus();
			}
			return ws;
		});
		window.dispatchEvent(new CustomEvent('open-window-handled'));
	}

	onMount(() => {
		const handleOpenWindowListener = handleOpenWindow as unknown as EventListener;
		window.addEventListener('open-window', handleOpenWindowListener);
		return () => {
			window.removeEventListener('open-window', handleOpenWindowListener);
		};
	});

	function closeWindow(id: string) {
		openWindows.update((ws) => {
			const updated = ws.filter((win) => win.id !== id);
			if (updated.length > 0) {
				const last = updated[updated.length - 1];
				if (last.ref && typeof last.ref.focus === 'function') {
					last.ref.focus();
					// updateDocumentTitle(last.id), etc. if you have that code
					focusedWindow.set(last);
				}
			} else {
				// If no windows left, reset document title, etc.
			}
			return updated;
		});

	}

	// Listen for window updates (dragging/resizing) and update the store.
	function handleWindowUpdate(
		event: CustomEvent<{
			id: string;
			currentSize: { width: number; height: number };
			currentPosition: { x: number; y: number };
		}>
	) {
		updateWindow(event.detail.id, {
			currentSize: event.detail.currentSize,
			currentPosition: event.detail.currentPosition
		});
	}

	// function closeWindow() {
	// 	console.log("windowManager recieved closeWindow")
	// }
</script>

{#each $openWindows as win (win.id)}
	<Window
		closeWindow={closeWindow}
		{...win}
		on:focus={(event) => handleWindowFocus(event.detail.id)}
		on:update={handleWindowUpdate}
		bind:this={win.ref}
		minHeight={150}
		minWidth={300}
		
	>
	<svelte:component this={win.component} />

	</Window>
{/each}