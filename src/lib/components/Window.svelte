<script context="module" lang="ts">
    let highestZIndex = 1;
</script>
<script lang="ts">
    import { onMount, tick, createEventDispatcher } from 'svelte';
    import { goto } from '$app/navigation';
    export let title = '';
    export let route = '';
  
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

    onMount(async () => {
      const imgs = windowEl.querySelectorAll('img');
      const loadPromises = Array.from(imgs).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', resolve); // handle errors too
        });
      });

      await Promise.all(loadPromises);
      centerWindow();
    });
  
    function handleMouseDown(event: MouseEvent) {
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
      isDragging = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
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
    }
  
    function handleResizing(event: MouseEvent) {
      if (!isResizing) return;
      const deltaX = event.clientX - resizeStart.x;
      const deltaY = event.clientY - resizeStart.y;
      const minWidth = 300;
      const minHeight = 150;
      windowEl.style.width = `${Math.max(minWidth, startSize.width + deltaX)}px`;
      windowEl.style.height = `${Math.max(minHeight, startSize.height + deltaY)}px`;
    }
  
    function handleResizeMouseUp() {
      isResizing = false;
      window.removeEventListener('mousemove', handleResizing);
      window.removeEventListener('mouseup', handleResizeMouseUp);
    }
  
    // Bring this window to the front (only update z-index)
    function bringToFront() {
      highestZIndex++;
      windowEl.style.zIndex = `${highestZIndex}`;
    }
  
    // When the titlebar is clicked (and no drag occurred), update the URL.
    function handleTitleClick(event: MouseEvent) {
      if (!dragOccurred && route) {
        goto(route);
      }
    }
  
    export function focus() {
      bringToFront();
    }

    // Add event listener to bring window to front when clicked
    onMount(() => {
      windowEl.addEventListener('mousedown', bringToFront);
    });
  </script>
  
  <div bind:this={windowEl} class="window resizable" role="presentation">
    <div class="titlebar" on:mousedown={handleMouseDown} on:click={handleTitleClick} role="presentation">
      <div class="w-layout-hflex title-bar-flexbox">
        <div class="titlebar-button"></div>
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
          <div class="titlebar-button-minimize"></div>
        </div>
        <div class="titlebar-button">
          <div class="titlebar-button-close"></div>
        </div>
      </div>
    </div>
    <div class="window-body">
      <slot />
    </div>
    <div class="resize-handle" on:mousedown={handleResizeMouseDown} role="presentation"></div>
  </div>