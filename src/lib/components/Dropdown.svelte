<script lang="ts" context="module">
  // Create global state at the module level so it's shared across all instances
  let dragging = $state(false);
  let originDropdownId = $state<string | null>(null);
  let currentSelectedItem = $state<HTMLElement | null>(null);
  let lastSoundTime = $state(0);
  let lastHoveredItem = $state<HTMLElement | null>(null);
  let activeDropdownId = $state<string | null>(null);

  // Export the state object for use in components
  export const globalDropdownState = {
    get dragging() { return dragging; },
    set dragging(value: boolean) { dragging = value; },
    get originDropdownId() { return originDropdownId; },
    set originDropdownId(value: string | null) { originDropdownId = value; },
    get currentSelectedItem() { return currentSelectedItem; },
    set currentSelectedItem(value: HTMLElement | null) { currentSelectedItem = value; },
    get lastSoundTime() { return lastSoundTime; },
    set lastSoundTime(value: number) { lastSoundTime = value; },
    get lastHoveredItem() { return lastHoveredItem; },
    set lastHoveredItem(value: HTMLElement | null) { lastHoveredItem = value; },
    get activeDropdownId() { return activeDropdownId; },
    set activeDropdownId(value: string | null) { activeDropdownId = value; }
  };
</script>

<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount, onDestroy, setContext, getContext } from "svelte";
  import { soundCommand } from "./SoundEffects.svelte";
  import { get } from "svelte/store";

  // Make global state available via context for any child components
  setContext('globalDropdownState', globalDropdownState);

  // Local state
  let isOpen = $state(false);
  let container: HTMLDivElement;
  let dropdownContent: HTMLDivElement;
  let toggleElement: HTMLElement;
  let justOpened = $state(false);
  
  // Props
  const { className = "", id = crypto.randomUUID() } = $props<{
    className?: string;
    id?: string;
  }>();
  
  // Subscribe to active dropdown changes
  $effect(() => {
    if (globalDropdownState.activeDropdownId !== null && globalDropdownState.activeDropdownId !== id && isOpen) {
      isOpen = false;
    }
  });

  // Play sound only if enough time has passed (debounce)
  function playMenuItemSound() {
    const now = Date.now();
    
    // Only play sound at most every 50ms
    if (now - globalDropdownState.lastSoundTime > 50) {
      soundCommand.set("mnui");
      globalDropdownState.lastSoundTime = now;
    }
  }

  function openMenu() {
    if (!isOpen) {
      isOpen = true;
      globalDropdownState.activeDropdownId = id;
      justOpened = true;
      setTimeout(() => { justOpened = false; }, 100);
      soundCommand.set("mnuo");
    }
  }

  function closeMenu() {
    if (isOpen) {
      isOpen = false;
      if (globalDropdownState.activeDropdownId === id) {
        globalDropdownState.activeDropdownId = null;
      }
      soundCommand.set("mnuc");
    }
  }

  function toggleMenu(e: MouseEvent) {
    e.stopPropagation();
    if (justOpened) return;
    
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function handleMouseDown(e: MouseEvent) {
    if (toggleElement && toggleElement.contains(e.target as Node)) {
      if (!isOpen) {
        openMenu();
      }
      
      // Set global state
      globalDropdownState.dragging = true;
      globalDropdownState.originDropdownId = id;
      globalDropdownState.currentSelectedItem = null;
      
      // Add global listeners
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp, { once: true });
    }
  }

  function handleGlobalMouseMove(e: MouseEvent) {
    if (!globalDropdownState.dragging) return;
    
    // Find all open dropdowns
    const dropdowns = document.querySelectorAll('.dropdown-content');
    if (!dropdowns.length) return;
    
    // Clear all selections first
    document.querySelectorAll('.dropdown-link').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Reset current selection
    let foundItem = false;
    
    // Check each dropdown
    dropdowns.forEach(dropdown => {
      if (foundItem) return;
      
      const menuItems = dropdown.querySelectorAll('.dropdown-link');
      menuItems.forEach(item => {
        const rect = item.getBoundingClientRect();
        if (
          e.clientX >= rect.left && 
          e.clientX <= rect.right && 
          e.clientY >= rect.top && 
          e.clientY <= rect.bottom
        ) {
          foundItem = true;
          
          // Only play sound if selection changed
          if (globalDropdownState.currentSelectedItem !== item) {
            playMenuItemSound();
          }
          
          // Update selection
          item.classList.add('selected');
          globalDropdownState.currentSelectedItem = item as HTMLElement;
        }
      });
    });
    
    // If no item found, clear selection
    if (!foundItem) {
      globalDropdownState.currentSelectedItem = null;
    }
  }

  function handleGlobalMouseUp(e: MouseEvent) {
    document.removeEventListener("mousemove", handleGlobalMouseMove);
    
    // If we have a selected item
    if (globalDropdownState.currentSelectedItem) {
      (globalDropdownState.currentSelectedItem as HTMLElement).click();
    }
    // Click was in the toggle that started the drag, and no item selected
    else if (globalDropdownState.originDropdownId === id && toggleElement.contains(e.target as Node)) {
      // Don't close if we just opened it
      if (!justOpened && isOpen) {
        closeMenu();
      }
    }
    
    // Reset drag state
    globalDropdownState.dragging = false;
    globalDropdownState.originDropdownId = null;
    globalDropdownState.currentSelectedItem = null;
  }

  function handleMenuHover(e: MouseEvent) {
    // If we're dragging, this is handled by global handler
    if (globalDropdownState.dragging) return;
    
    const target = e.target as HTMLElement;
    if (!target.classList.contains('dropdown-link')) return;
    
    // Make sure dropdownContent exists before using it
    if (!dropdownContent) return;
    
    // Only play sound if we're hovering over a different item
    if (globalDropdownState.lastHoveredItem !== target) {
      playMenuItemSound();
      globalDropdownState.lastHoveredItem = target;
    }
    
    // Clear all selections in this dropdown
    const allItems = dropdownContent.querySelectorAll('.dropdown-link');
    allItems.forEach(item => item.classList.remove('selected'));
    
    // Add selection to current item
    target.classList.add('selected');
  }

  function handleMouseEnter() {
    // If there's an active dropdown and it's not this one
    if (globalDropdownState.activeDropdownId !== null && globalDropdownState.activeDropdownId !== id) {
      // Close the previous dropdown by setting its ID to null
      globalDropdownState.activeDropdownId = null;
      // Open this dropdown
      openMenu();
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (isOpen && container && !container.contains(e.target as Node)) {
      closeMenu();
    }
  }

  function handleOptionClick() {
    closeMenu();
  }

  // Setup and cleanup
  if (browser) {
    onMount(() => {
      document.addEventListener("click", handleClickOutside);
    });
    
    onDestroy(() => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    });
  }
</script>

<div 
  bind:this={container} 
  class={className} 
  class:open={isOpen}
  on:mouseenter={handleMouseEnter}
  on:mousedown={handleMouseDown}
  role="presentation"
  data-dropdown-id={id}
>
  <div
    bind:this={toggleElement}
    on:click={toggleMenu}
    role="menuitem"
    aria-haspopup="true" 
    aria-expanded={isOpen}
    tabindex="0"
    style="display: flex;"
  >
    <slot name="toggle">Toggle</slot>
  </div>

  {#if isOpen}
    <div
      bind:this={dropdownContent}
      class="dropdown-content"
      on:click={handleOptionClick}
      on:mousemove={handleMenuHover}
      role="menu"
      aria-label="Menu Options"
      tabindex="-1"
    >
      <slot></slot>
    </div>
  {/if}
</div>
