<script lang="ts" context="module">
  // Create stores at the module level so they're shared across all instances
  import { writable } from "svelte/store";
  
  // Define the global stores outside component to ensure they exist for all instances
  export const activeDropdownStore = writable<string | null>(null);
  export const globalDropdownState = writable<{
    dragging: boolean;
    originDropdownId: string | null;
    currentSelectedItem: HTMLElement | null;
    lastSoundTime: number;
  }>({
    dragging: false,
    originDropdownId: null,
    currentSelectedItem: null,
    lastSoundTime: 0
  });
</script>

<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount, onDestroy, setContext, getContext } from "svelte";
  import { soundCommand } from "./SoundEffects.svelte";
  import { get } from "svelte/store";

  // Make stores available via context for any child components
  setContext('activeDropdown', activeDropdownStore);
  setContext('globalDropdownState', globalDropdownState);

  // Local state
  let isOpen = false;
  let container: HTMLDivElement;
  let dropdownContent: HTMLDivElement;
  let toggleElement: HTMLElement;
  let justOpened = false;
  
  // Props
  export let className = "";
  export let id: string = crypto.randomUUID();
  
  // Subscribe to active dropdown changes
  const unsubscribe = activeDropdownStore.subscribe((activeId: string | null) => {
    if (activeId !== null && activeId !== id && isOpen) {
      isOpen = false;
    }
  });

  // Play sound only if enough time has passed (debounce)
  function playMenuItemSound() {
    const state = get(globalDropdownState);
    const now = Date.now();
    
    // Only play sound at most every 50ms
    if (now - state.lastSoundTime > 50) {
      soundCommand.set("mnui");
      globalDropdownState.update(s => ({ ...s, lastSoundTime: now }));
    }
  }

  function openMenu() {
    if (!isOpen) {
      isOpen = true;
      activeDropdownStore.set(id);
      justOpened = true;
      setTimeout(() => { justOpened = false; }, 100);
      soundCommand.set("mnuo");
    }
  }

  function closeMenu() {
    if (isOpen) {
      isOpen = false;
      const currentActive = get(activeDropdownStore);
      if (currentActive === id) {
        activeDropdownStore.set(null);
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
      globalDropdownState.update(s => ({
        ...s,
        dragging: true,
        originDropdownId: id,
        currentSelectedItem: null
      }));
      
      // Add global listeners
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp, { once: true });
    }
  }

  function handleGlobalMouseMove(e: MouseEvent) {
    const state = get(globalDropdownState);
    if (!state.dragging) return;
    
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
          if (state.currentSelectedItem !== item) {
            playMenuItemSound();
          }
          
          // Update selection
          item.classList.add('selected');
          globalDropdownState.update(s => ({ ...s, currentSelectedItem: item as HTMLElement }));
        }
      });
    });
    
    // If no item found, clear selection
    if (!foundItem) {
      globalDropdownState.update(s => ({ ...s, currentSelectedItem: null }));
    }
  }

  function handleGlobalMouseUp(e: MouseEvent) {
    document.removeEventListener("mousemove", handleGlobalMouseMove);
    
    const state = get(globalDropdownState);
    
    // If we have a selected item
    if (state.currentSelectedItem) {
      (state.currentSelectedItem as HTMLElement).click();
    }
    // Click was in the toggle that started the drag, and no item selected
    else if (state.originDropdownId === id && toggleElement.contains(e.target as Node)) {
      // Don't close if we just opened it
      if (!justOpened && isOpen) {
        closeMenu();
      }
    }
    
    // Reset drag state
    globalDropdownState.update(s => ({
      ...s,
      dragging: false,
      originDropdownId: null,
      currentSelectedItem: null
    }));
  }

  function handleMenuHover(e: MouseEvent) {
    // If we're dragging, this is handled by global handler
    const state = get(globalDropdownState);
    if (state.dragging) return;
    
    const target = e.target as HTMLElement;
    if (!target.classList.contains('dropdown-link')) return;
    
    // Make sure dropdownContent exists before using it
    if (!dropdownContent) return;
    
    // Clear all selections in this dropdown
    const allItems = dropdownContent.querySelectorAll('.dropdown-link');
    allItems.forEach(item => item.classList.remove('selected'));
    
    // Add selection to current item
    target.classList.add('selected');
    playMenuItemSound();
  }

  function handleMouseEnter() {
    const activeId = get(activeDropdownStore);
    if (activeId !== null && activeId !== id) {
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
      unsubscribe();
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
