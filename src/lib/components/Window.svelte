<script context="module" lang="ts">
    let highestZIndex = 1;
</script>
<script lang="ts">
    import { onMount, tick, createEventDispatcher } from 'svelte';
    import { goto } from '$app/navigation';
    import { soundCommand } from './SoundEffects.svelte';

    export let id: string;
    export let title = '';
    export let route = '';

    export let defaultSize = { width: 400, height: 300 };

    export let minHeight: number;
    export let minWidth: number;
    export let resizable = true;

    let windowEl: HTMLDivElement;
    let offset = { x: 0, y: 0 };
    let isDragging = false;
    let dragOccurred = false;
    const topPadding = 26; 

    const dispatch = createEventDispatcher();
  
    export async function centerWindow() {
      await tick();
      requestAnimationFrame(() => {
        const winWidth = windowEl.offsetWidth;
        const winHeight = windowEl.offsetHeight;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const topPadding = 26; // reserved top area
        const left = (screenWidth - winWidth) / 2;
        const top = topPadding + ((screenHeight - topPadding) - winHeight) / 2;
        windowEl.style.left = `${left}px`;
        windowEl.style.top = `${top}px`;
      });
    }
    const padding = 10;

    onMount(() => {

        const vw = window.innerWidth - padding * 2;
        const vh = window.innerHeight - padding * 2;

        const width = Math.min(defaultSize.width, vw);
        const height = Math.min(defaultSize.height, vh);

        windowEl.style.width = `${Math.max(minWidth, width)}px`;
        windowEl.style.height = `${Math.max(minHeight, height)}px`;
        centerWindow();

      // Add event listener to bring window to front when clicked
      windowEl.addEventListener('mousedown', bringToFront);

      // Add event listener to document to manage active/inactive classes
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
        handleMouseDown(event);
    }
  
    function handleMouseDown(event: MouseEvent) {
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
  
    function handleMouseUp() {
        soundCommand.set('drag-end');
      isDragging = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
  
    let isResizing = false;
    let resizeStart = { x: 0, y: 0 };
    let startSize = { width: 0, height: 0 };
  
    function handleResizeMouseDown(event: MouseEvent) {
      isResizing = true;
      //soundCommand.set('drag-start');
      resizeStart = { x: event.clientX, y: event.clientY };
      startSize = {
        width: windowEl.offsetWidth,
        height: windowEl.offsetHeight
      };
      window.addEventListener('mousemove', handleResizing);
      window.addEventListener('mouseup', handleResizeMouseUp);
    }
  
    function handleResizing(event: MouseEvent) {
      if (!isResizing) return;
      const deltaX = event.clientX - resizeStart.x;
      const deltaY = event.clientY - resizeStart.y;
      windowEl.style.width = `${Math.max(minWidth, startSize.width + deltaX)}px`;
      windowEl.style.height = `${Math.max(minHeight, startSize.height + deltaY)}px`;
    }
  
    function handleResizeMouseUp() {
      isResizing = false;
      //soundCommand.set('drag-end');
      window.removeEventListener('mousemove', handleResizing);
      window.removeEventListener('mouseup', handleResizeMouseUp);
    }
  
    // Bring this window to the front (only update z-index)
    function bringToFront() {
      highestZIndex++;
      windowEl.style.zIndex = `${highestZIndex}`;
      windowEl.classList.add('active');
      windowEl.classList.remove('inactive');
      dispatch('focus', { id });
    }
  
    // When the titlebar is clicked (and no drag occurred), update the URL.
    function handleTitleClick(event: MouseEvent) {
      if (!dragOccurred && route) {
        goto(route);
      }
    }

    function closeWindow(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        dispatch('close', { id });
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

  </script>
  
  <div bind:this={windowEl} class="window" class:resizable={resizable} role="presentation">
    <div class="titlebar" on:mousedown={handleTitleMouseDown} on:click={handleTitleClick} role="presentation">
      <div class="w-layout-hflex title-bar-flexbox">

        <div class="titlebar-button" on:click={closeWindow} role="presentation"></div>
        <div class="window-stripes">
          <div class="horizontal-window-stripe"></div>
          <div class="horizontal-window-stripe"></div>
          <div class="horizontal-window-stripe"></div>
          <div class="horizontal-window-stripe"></div>
          <div class="horizontal-window-stripe"></div>
          <div class="horizontal-window-stripe"></div>
        </div>

        <h1 class="window-title">{title}</h1>

        <div class="window-stripes">
          <div class="horizontal-window-stripe"></div>
          <div class="horizontal-window-stripe"></div>
          <div class="horizontal-window-stripe"></div>
          <div class="horizontal-window-stripe"></div>
          <div class="horizontal-window-stripe"></div>
          <div class="horizontal-window-stripe"></div>
        </div>
        <div class="titlebar-button">
          <div class="titlebar-button-zoom"></div>
        </div>
        <div class="titlebar-button" on:click={minimizeWindow} role="presentation">
          <div class="titlebar-button-minimize"></div>
        </div>
      </div>
    </div>
    <div class="window-body">
      <slot />
    </div>
    <div class="resize-handle" on:mousedown={handleResizeMouseDown} role="presentation"></div>
  </div>