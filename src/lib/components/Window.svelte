<script context="module" lang="ts">
  let highestZIndex = 100;
</script>

<script lang="ts">
  import { onMount, tick, createEventDispatcher } from "svelte";
  import { goto } from "$app/navigation";
  import { soundCommand } from "./SoundEffects.svelte";
  import { getContext, setContext } from "svelte";
  import Icon from "./Icon.svelte";
  import { focusWindow } from "$lib/state/windowState.svelte";

  export let id: string;
  export let title = "";
  export let defaultSize = { width: 400, height: 300 };
  export let minHeight: number;
  export let minWidth: number;
  export let resizable = true;
  export let icon = "";
  export let minimized = false;
  export let xyorigin: { x: number; y: number } | null = null;
  export let maxSize: { width: number; height: number } | null = null;

  export let style = "";
  // New exported props for persisted size/position.
  export let currentSize: { width: number; height: number } | null = null;
  export let currentPosition: { x: number; y: number } | null = null;
  export let ref: HTMLDivElement | null = null;

  let closing = false;
  let opening = false;
  let borderTransform = "scale(1)";
  let isZoomed = false;
  let previousSize: { width: number; height: number } | null = null;
  let previousPosition: { x: number; y: number } | null = null;

  let windowEl: HTMLDivElement;
  let overlayEl: HTMLDivElement;
  let showOverlay = false;
  let windowBody: HTMLDivElement;

  // Update ref whenever windowEl changes
  $: if (windowEl) {
    ref = windowEl;
  }

  let offset = { x: 0, y: 0 };
  let isDragging = false;
  let dragOccurred = false;
  const topPadding = 26;
  const padding = 10;
  const dispatch = createEventDispatcher();

  export let closeWindow: (id: string) => void;

  let lightboxMode = false;
  let lightboxScrollPosition = 0;

  let zIndex = 0;
  
  // Explicitly track which event handlers are attached
  let eventHandlersAttached = false;

  // ---------------------------
  // Overlay Animation Functions
  // ---------------------------
  // Helper to get the window's bounding rectangle (relative to the parent's coordinate system).
  async function getWindowRect() {
    return windowEl.getBoundingClientRect();
  }

  // Animate overlay on window open.
  async function animateOverlayOpen() {
    // Wait until overlayEl is defined (i.e. rendered in the DOM)
    while (!overlayEl) {
      await tick();
    }

    // Use provided origin or fallback to the viewport center.
    const origin = xyorigin || {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    soundCommand.set("wopn"); // Trigger open sound.

    // Get windowEl's bounding rectangle (in viewport coordinates)
    const rect = windowEl.getBoundingClientRect();
    // Get parent's bounding rectangle (assuming parent is relatively positioned)
    const parentRect = windowEl.parentElement
      ? windowEl.parentElement.getBoundingClientRect()
      : { left: 0, top: 0 };

    // Compute target position of the window relative to its parent.
    const targetLeft = rect.left - parentRect.left;
    const targetTop = rect.top - parentRect.top;

    // Convert the origin (viewport coordinates) to parent's coordinate space.
    const originLeft = origin.x - parentRect.left;
    const originTop = origin.y - parentRect.top;

    // Set the overlay's initial state: positioned at the origin with zero size.
    overlayEl.style.transition = "none";
    overlayEl.style.left = `${originLeft}px`;
    overlayEl.style.top = `${originTop}px`;
    overlayEl.style.width = `0px`;
    overlayEl.style.height = `0px`;
    overlayEl.style.opacity = "1";
    // Force reflow.
    overlayEl.getBoundingClientRect();

    // Now animate to the window's position and size.
    overlayEl.style.transition = "all 0.3s ease";
    overlayEl.style.left = `${targetLeft}px`;
    overlayEl.style.top = `${targetTop}px`;
    overlayEl.style.width = `${rect.width}px`;
    overlayEl.style.height = `${rect.height}px`;
    // Optionally, fade the overlay out.
    overlayEl.style.opacity = "0";

    // Wait for the animation to finish.
    await new Promise((resolve) => setTimeout(resolve, 300));
    showOverlay = false;
  }

  // Animate overlay on window close.
  async function animateOverlayClose() {
    windowEl.style.opacity = "0";
    const rect = await getWindowRect();
    // Determine origin: if xyorigin not provided, use center of viewport.
    const origin = xyorigin || {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    // Initially, position overlay to match the window.
    overlayEl.style.transition = "none";
    overlayEl.style.left = `${rect.left}px`;
    overlayEl.style.top = `${rect.top}px`;
    overlayEl.style.width = `${rect.width}px`;
    overlayEl.style.height = `${rect.height}px`;
    overlayEl.style.opacity = "1";
    overlayEl.getBoundingClientRect();

    // Animate to the origin with zero size.
    overlayEl.style.transition = "all 0.5s ease";
    overlayEl.style.left = `${origin.x}px`;
    overlayEl.style.top = `${origin.y}px`;
    overlayEl.style.width = `0px`;
    overlayEl.style.height = `0px`;
    overlayEl.style.opacity = "0";

    await new Promise((resolve) => setTimeout(resolve, 300));
    showOverlay = false;
  }

  // Center the window within the viewport.
  export async function centerWindow() {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        const winWidth = windowEl.offsetWidth;
        const winHeight = windowEl.offsetHeight;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const left = (screenWidth - winWidth) / 2;
        const top = topPadding + (screenHeight - topPadding - winHeight) / 2;
        windowEl.style.left = `${left}px`;
        windowEl.style.top = `${top}px`;
        resolve();
      });
    });
  }

  // Function to handle windowZoom event
  function handleLightboxMode(event: CustomEvent) {
    if (event.detail.windowId === id) {
      if (!lightboxMode) {
        lightboxMode = true;
        windowBody.style.overflow = "hidden";
        lightboxScrollPosition = windowBody.scrollTop;
        windowBody.scrollTop = 0;
        toggleZoom();
      } else {
        lightboxMode = false;
        windowBody.style.overflow = "scroll";
        windowBody.scrollTop = lightboxScrollPosition;
        toggleZoom();
      }
    }
  }

  onMount(() => {
    // Set the ref to the windowEl
    ref = windowEl;
    
    // console.log(`🪟 Window mounted for ${id}`, {
    //   hasComponent: !!$$slots.default,
    //   data: $$props.data,
    //   hasRef: !!ref,
    //   refElement: ref
    // });
    
    // Start with a proper z-index
    zIndex = ++highestZIndex;
    windowEl.style.zIndex = `${zIndex}`;
    
    (async () => {
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
        await centerWindow();
      }

      // Setup global event handlers
      setupEventHandlers();
      
      // Setup direct DOM event handlers
      setupDirectEventHandlers();
      
      showOverlay = true;
      await tick();
      await animateOverlayOpen();
    })();
    
    // Add event listener for windowZoom
    document.addEventListener('lightboxMode', handleLightboxMode as EventListener);
    
    return () => {
      // console.log(`🧹 Cleaning up window: ${id}`);
      removeEventHandlers();
      // Clear the ref when unmounting
      ref = null;
      document.removeEventListener('lightboxMode', handleLightboxMode as EventListener);
    };
  });
  
  function setupDirectEventHandlers() {
    if (windowEl) {
      // Mouse events
      windowEl.addEventListener('mousedown', handleWindowMouseDown as EventListener);
      windowEl.querySelector('.titlebar')?.addEventListener('mousedown', handleTitleBarMouseDown as EventListener);
      windowEl.querySelector('.resize-handle')?.addEventListener('mousedown', handleResizeMouseDown as EventListener);
      
      // Touch events
      windowEl.addEventListener('touchstart', handleWindowTouchStart as EventListener);
      windowEl.querySelector('.titlebar')?.addEventListener('touchstart', handleTitleBarTouchStart as EventListener);
      windowEl.querySelector('.resize-handle')?.addEventListener('touchstart', handleResizeTouchStart as EventListener);
    }
  }

  function setupEventHandlers() {
    if (eventHandlersAttached) return;
    eventHandlersAttached = true;
    window.addEventListener("resize", clampPositionToViewport);
  }
  
  function removeEventHandlers() {
    if (!eventHandlersAttached) return;
    eventHandlersAttached = false;
    
    window.removeEventListener("resize", clampPositionToViewport);
    
    // Clean up all event listeners
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("touchmove", handleTouchMove);
    window.removeEventListener("touchend", handleTouchEnd);
    window.removeEventListener("mousemove", handleResizing);
    window.removeEventListener("mouseup", handleResizeMouseUp);
    window.removeEventListener("touchmove", handleResizeTouchMove);
    window.removeEventListener("touchend", handleResizeTouchEnd);
    
    if (windowEl) {
      windowEl.removeEventListener('mousedown', handleWindowMouseDown as EventListener);
      windowEl.removeEventListener('touchstart', handleWindowTouchStart as EventListener);
      windowEl.querySelector('.titlebar')?.removeEventListener('mousedown', handleTitleBarMouseDown as EventListener);
      windowEl.querySelector('.titlebar')?.removeEventListener('touchstart', handleTitleBarTouchStart as EventListener);
      windowEl.querySelector('.resize-handle')?.removeEventListener('mousedown', handleResizeMouseDown as EventListener);
      windowEl.querySelector('.resize-handle')?.removeEventListener('touchstart', handleResizeTouchStart as EventListener);
    }
  }

  // Touch event handlers
  function handleWindowTouchStart(event: TouchEvent) {
    // Only prevent default if we're not in the window body
    if (!(event.target as HTMLElement).closest('.window-body')) {
      event.preventDefault();
    }
    if (isDragging || isResizing) return;
    if ((event.target as HTMLElement).closest(".titlebar-button")) return;
    if ((event.target as HTMLElement).closest("a")) return;
    if (windowEl.classList.contains("active")) return;
    
    // For alert windows, always focus
    if (style === 'alert') {
      focusWindow(id);
      return;
    }
    
    focusWindow(id);
  }

  function handleTitleBarTouchStart(event: TouchEvent) {
    event.preventDefault();
    if ((event.target as HTMLElement).closest(".titlebar-button")) return;
    
    // For alert windows, don't allow dragging
    if (style === 'alert') {
      event.stopPropagation();
      return;
    }
    
    focusWindow(id);
    startDragging(event.touches[0]);
    event.stopPropagation();
  }

  function handleResizeTouchStart(event: TouchEvent) {
    event.preventDefault();
    bringToFront();
    isResizing = true;
    resizeStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    startSize = {
      width: windowEl.offsetWidth,
      height: windowEl.offsetHeight,
    };
    window.addEventListener("touchmove", handleResizeTouchMove);
    window.addEventListener("touchend", handleResizeTouchEnd);
    soundCommand.set("drag-start");
    event.stopPropagation();
  }

  function handleTouchMove(event: TouchEvent) {
    if (!isDragging) return;
    event.preventDefault();
    dragOccurred = true;
    
    const winWidth = windowEl.offsetWidth;
    const winHeight = windowEl.offsetHeight;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    let x = event.touches[0].clientX - offset.x;
    let y = event.touches[0].clientY - offset.y;
    
    x = Math.max(0, Math.min(x, screenWidth - winWidth));
    y = Math.max(topPadding, Math.min(y, screenHeight - winHeight));
    
    windowEl.style.left = `${x}px`;
    windowEl.style.top = `${y}px`;
  }

  function handleTouchEnd() {
    if (isDragging) {
      soundCommand.set("drag-end");
      isDragging = false;
      updateWindowState();
    }
    
    window.removeEventListener("touchmove", handleTouchMove);
    window.removeEventListener("touchend", handleTouchEnd);
  }

  function handleResizeTouchMove(event: TouchEvent) {
    if (!isResizing) return;
    event.preventDefault();
    const deltaX = event.touches[0].clientX - resizeStart.x;
    const deltaY = event.touches[0].clientY - resizeStart.y;
    let newWidth = Math.max(minWidth, startSize.width + deltaX);
    let newHeight = Math.max(minHeight, startSize.height + deltaY);
    if (maxSize) {
      newWidth = Math.min(newWidth, maxSize.width);
      newHeight = Math.min(newHeight, maxSize.height);
    }
    windowEl.style.width = `${newWidth}px`;
    windowEl.style.height = `${newHeight}px`;
  }

  function handleResizeTouchEnd() {
    isResizing = false;
    window.removeEventListener("touchmove", handleResizeTouchMove);
    window.removeEventListener("touchend", handleResizeTouchEnd);
    updateWindowState();
    soundCommand.set("drag-end");
  }

  // Update startDragging to handle both mouse and touch events
  function startDragging(event: MouseEvent | Touch) {
    soundCommand.set("drag-start");
    isDragging = true;
    dragOccurred = false;
    
    const rect = windowEl.getBoundingClientRect();
    offset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
  }

  // Set window as inactive
  export function makeInactive() {
    windowEl.classList.remove("active");
    windowEl.classList.add("inactive");
  }

  // Safe function to bring window to front
  function bringToFront() {
    zIndex = ++highestZIndex;
    windowEl.style.zIndex = `${zIndex}`;
    windowEl.classList.add("active");
    windowEl.classList.remove("inactive");
  }

  // Handle window focus
  function handleWindowMouseDown(event: MouseEvent) {
    // Don't process if we're dragging or resizing
    if (isDragging || isResizing) return;
    
    // Don't process clicks on buttons
    if ((event.target as HTMLElement).closest(".titlebar-button")) return;
    
    // Don't process clicks on links
    if ((event.target as HTMLElement).closest("a")) return;
    
    // Don't process if window is already focused
    if (windowEl.classList.contains("active")) return;
    
    // For alert windows, always focus
    if (style === 'alert') {
      focusWindow(id);
      return;
    }
    
    // Focus the window without triggering scroll reset
    focusWindow(id);
  }

  // Title bar drag handler
  function handleTitleBarMouseDown(event: MouseEvent) {
    // Don't process clicks on buttons
    if ((event.target as HTMLElement).closest(".titlebar-button")) return;
    
    // For alert windows, don't allow dragging
    if (style === 'alert') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    
    // First focus the window
    focusWindow(id);
    
    // Then start dragging
    startDragging(event);
    
    // Make sure the event doesn't propagate up
    event.stopPropagation();
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
    if (isDragging) {
      soundCommand.set("drag-end");
      isDragging = false;
      updateWindowState();
    }
    
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }

  function clampPositionToViewport() {
    if (!windowEl) return;
    const winWidth = windowEl.offsetWidth;
    const winHeight = windowEl.offsetHeight;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const currentLeft = windowEl.offsetLeft;
    const currentTop = windowEl.offsetTop;

    // First, handle position clamping
    const clampedLeft = Math.min(currentLeft, screenWidth - winWidth);
    const clampedTop = Math.min(currentTop, screenHeight - winHeight);
    windowEl.style.left = `${Math.max(0, clampedLeft)}px`;
    windowEl.style.top = `${Math.max(topPadding, clampedTop)}px`;

    // Then, handle size clamping if window is too large
    let newWidth = winWidth;
    let newHeight = winHeight;

    // If window is wider than viewport, resize it
    if (winWidth > screenWidth) {
      newWidth = Math.max(minWidth, screenWidth - padding * 2);
    }

    // If window is taller than viewport, resize it
    if (winHeight > screenHeight - topPadding) {
      newHeight = Math.max(minHeight, screenHeight - topPadding - padding * 2);
    }

    // Only apply size changes if they're different from current size
    if (newWidth !== winWidth || newHeight !== winHeight) {
      windowEl.style.width = `${newWidth}px`;
      windowEl.style.height = `${newHeight}px`;
      updateWindowState();
    }
  }

  let isResizing = false;
  let resizeStart = { x: 0, y: 0 };
  let startSize = { width: 0, height: 0 };

  function handleResizeMouseDown(event: MouseEvent) {
    if (event.button !== 0) return;
    
    // First focus the window
    bringToFront();
    
    isResizing = true;
    resizeStart = { x: event.clientX, y: event.clientY };
    startSize = {
      width: windowEl.offsetWidth,
      height: windowEl.offsetHeight,
    };
    
    window.addEventListener("mousemove", handleResizing);
    window.addEventListener("mouseup", handleResizeMouseUp);
    
    soundCommand.set("drag-start");
    
    // Stop propagation to prevent the main window's mousedown handler
    event.stopPropagation();
  }

  function handleResizing(event: MouseEvent ) {
  if (!isResizing) return;
  const deltaX = event.clientX - resizeStart.x;
  const deltaY = event.clientY - resizeStart.y;
  let newWidth = Math.max(minWidth, startSize.width + deltaX);
  let newHeight = Math.max(minHeight, startSize.height + deltaY);
  if (maxSize) {
    newWidth = Math.min(newWidth, maxSize.width);
    newHeight = Math.min(newHeight, maxSize.height);
  }
  windowEl.style.width = `${newWidth}px`;
  windowEl.style.height = `${newHeight}px`;
}

  function handleResizeMouseUp() {
    isResizing = false;
    window.removeEventListener("mousemove", handleResizing);
    window.removeEventListener("mouseup", handleResizeMouseUp);
    updateWindowState();
    soundCommand.set("drag-end");
  }

  // Update currentSize and currentPosition and dispatch an event.
  function updateWindowState() {
    const currentSize = {
      width: windowEl.offsetWidth,
      height: windowEl.offsetHeight,
    };
    const currentPosition = { x: windowEl.offsetLeft, y: windowEl.offsetTop };
    dispatch("update", { id, currentSize, currentPosition });
  }

  function minimizeWindow(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if (minimized) {
      windowEl.classList.remove("minimized");
      minimized = false;
      soundCommand.set("wexp");
    } else {
      windowEl.classList.add("minimized");
      minimized = true;
      soundCommand.set("wcol");
    }
  }

  // ---------------------------
  // Close Button & Animation
  // ---------------------------
  async function closeWindowButton(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();
    soundCommand.set("wcls"); // Trigger close sound.
    showOverlay = true;
    await tick();
    await animateOverlayClose();
    // After the close animation, actually close the window.
    closeWindow(id);
  }

  function toggleZoom() {

    if (minimized) {
      windowEl.classList.remove("minimized");
      minimized = false;
    }
    
    if (!isZoomed) {
      // Store current size and position before zooming
      previousSize = {
        width: windowEl.offsetWidth,
        height: windowEl.offsetHeight
      };
      previousPosition = {
        x: windowEl.offsetLeft,
        y: windowEl.offsetTop
      };

      // Calculate maximum available size
      const maxWidth = maxSize ? Math.min(maxSize.width, window.innerWidth - padding * 2) : window.innerWidth - padding * 2;
      const maxHeight = maxSize ? Math.min(maxSize.height, window.innerHeight - padding * 2) : window.innerHeight - padding * 2;

      // Set window to maximum size
      windowEl.style.width = `${maxWidth}px`;
      windowEl.style.height = `${maxHeight - topPadding}px`;
      windowEl.style.left = `${padding}px`;
      windowEl.style.top = `${topPadding + padding}px`;
    } else if (previousSize && previousPosition) {
      // Restore previous size and position
      windowEl.style.width = `${previousSize.width}px`;
      windowEl.style.height = `${previousSize.height}px`;
      windowEl.style.left = `${previousPosition.x}px`;
      windowEl.style.top = `${previousPosition.y}px`;
    }

    isZoomed = !isZoomed;
    updateWindowState();
    soundCommand.set(isZoomed ? "wzmi" : "wzmo");
  }

  setContext("windowId", id);
</script>

{#if showOverlay}
  <div bind:this={overlayEl} class="animate-overlay"></div>
{/if}

{#if style === 'alert'}
  <div class="alert-window-overlay"></div>
{/if}

<div
  bind:this={windowEl}
  class="window {style}"
  class:resizable
  role="presentation"
>
  <div class="titlebar" role="presentation">
    <div class="w-layout-hflex title-bar-flexbox">
      <div
        class="titlebar-button"
        onclick={closeWindowButton}
        ontouchstart={closeWindowButton}
        role="presentation"
      ></div>
      <div class="window-stripes">
        <div class="horizontal-window-stripe"></div>
        <div class="horizontal-window-stripe"></div>
        <div class="horizontal-window-stripe"></div>
        <div class="horizontal-window-stripe"></div>
        <div class="horizontal-window-stripe"></div>
        <div class="horizontal-window-stripe"></div>
      </div>
      <h1 class="window-title">
        {#if icon && icon !== "null"}
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
      {#if resizable}
      <div class="titlebar-button zoom-parent" onclick={toggleZoom} role="presentation">
        <div class="titlebar-button-zoom"></div>
      </div>
      {/if}
      <div class="titlebar-button" onclick={minimizeWindow} ontouchstart={minimizeWindow} role="presentation">
        <div class="titlebar-button-minimize"></div>
      </div>
    </div>
  </div>
  <div class="window-body" role="presentation" bind:this={windowBody}>
    <slot data={$$props.data} {id} />
  </div>
  <div
    class="resize-handle"
    role="presentation"
  ></div>
</div>

<style>
  .animate-overlay {
    position: absolute;
    z-index: 99999;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 3px dashed #000;
    pointer-events: none;
  }


  .alert-window-overlay {
    position: absolute;
    z-index: 9999;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(255, 255, 255, 0.5);
  }
  

  .window-wrapper {
    position: relative;
    background-color: red;
  }


</style>