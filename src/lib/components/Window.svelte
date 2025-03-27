<script context="module" lang="ts">
  let highestZIndex = 1;
</script>

<script lang="ts">
  import { onMount, tick, createEventDispatcher } from "svelte";
  import { goto } from "$app/navigation";
  import { soundCommand } from "./SoundEffects.svelte";
  import { getContext, setContext } from "svelte";
  import Icon from "./Icon.svelte";

  export let id: string;
  export let title = "";
  export let defaultSize = { width: 400, height: 300 };
  export let minHeight: number;
  export let minWidth: number;
  export let resizable = true;
  export let icon = "";
  export let minimized = false;
  export let xyorigin: { x: number; y: number } | null = null;

  export let style = "";
  // New exported props for persisted size/position.
  export let currentSize: { width: number; height: number } | null = null;
  export let currentPosition: { x: number; y: number } | null = null;

  let closing = false;
  let opening = false;
  let borderTransform = "scale(1)";

  let windowEl: HTMLDivElement;
  let overlayEl: HTMLDivElement;
  let showOverlay = false;

  let offset = { x: 0, y: 0 };
  let isDragging = false;
  let dragOccurred = false;
  const topPadding = 26;
  const padding = 10;
  const dispatch = createEventDispatcher();

  export let closeWindow: (id: string) => void;

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
        const top = 26 + (screenHeight - 26 - winHeight) / 2;
        windowEl.style.left = `${left}px`;
        windowEl.style.top = `${top}px`;
        resolve();
      });
    });
  }

  onMount(() => {
    console.log(`Window mounted for ${id}`, {
      hasComponent: !!$$slots.default,
      data: $$props.data
    });
    const cleanup = () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      window.removeEventListener("resize", clampPositionToViewport);
      windowEl.removeEventListener("mousedown", bringToFront);
    };

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

      windowEl.addEventListener("mousedown", bringToFront);
      document.addEventListener("mousedown", handleDocumentClick);
      window.addEventListener("resize", clampPositionToViewport);

      showOverlay = true;
      await tick();
      await animateOverlayOpen();
    })();
    return cleanup;
  });

  

  function handleTitleMouseDown(event: MouseEvent) {
    if ((event.target as HTMLElement).closest(".titlebar-button")) return;
    startDragging(event);
  }

  const handleDocumentClick = (event: MouseEvent) => {
    if (windowEl.contains(event.target as Node)) {
      windowEl.classList.add("active");
      windowEl.classList.remove("inactive");
    } else {
      windowEl.classList.remove("active");
      windowEl.classList.add("inactive");
    }
  };

  function startDragging(event: MouseEvent) {
    if (event.button !== 0) return;

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
    soundCommand.set("drag-end");
    isDragging = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
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
    if (event.button !== 0) return;
    isResizing = true;
    resizeStart = { x: event.clientX, y: event.clientY };
    startSize = {
      width: windowEl.offsetWidth,
      height: windowEl.offsetHeight,
    };
    window.addEventListener("mousemove", handleResizing);
    window.addEventListener("mouseup", handleResizeMouseUp);
    soundCommand.set("drag-start");
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

  // Bring this window to the front.
  function bringToFront() {
    highestZIndex++;
    windowEl.style.zIndex = `${highestZIndex}`;
    windowEl.classList.add("active");
    windowEl.classList.remove("inactive");
    dispatch("focus", { id });
  }

  function minimizeWindow(event: MouseEvent) {
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

  export function focus() {
    windowEl.classList.remove("minimized");
    bringToFront();
  }

  // ---------------------------
  // Close Button & Animation
  // ---------------------------
  async function closeWindowButton(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    soundCommand.set("wcls"); // Trigger close sound.
    showOverlay = true;
    await tick();
    await animateOverlayClose();
    // After the close animation, actually close the window.
    closeWindow(id);
  }

  setContext("windowId", id);
</script>

{#if showOverlay}
  <div bind:this={overlayEl} class="animate-overlay"></div>
{/if}
<div
  bind:this={windowEl}
  class="window {style}"
  class:resizable
  role="presentation"
>
  <div class="titlebar" onmousedown={handleTitleMouseDown} role="presentation">
    <div class="w-layout-hflex title-bar-flexbox">
      <div
        class="titlebar-button"
        onclick={closeWindowButton}
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
    <slot data={$$props.data} {id} />
  </div>
  <div
    class="resize-handle"
    onmousedown={handleResizeMouseDown}
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

  .window-wrapper {
    position: relative;
    background-color: red;
  }
</style>
