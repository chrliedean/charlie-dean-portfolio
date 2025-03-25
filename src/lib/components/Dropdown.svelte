<script lang="ts">
    import { browser } from '$app/environment';
    import { onMount, onDestroy } from 'svelte';
    import { soundCommand } from './SoundEffects.svelte';
  
    let isOpen = false;
    let container: HTMLDivElement;
    export let className = '';

    let lastHovered: EventTarget | null = null;
  
    function toggleMenu(e: MouseEvent) {
      e.stopPropagation();
      isOpen = !isOpen;
    }
  
    function handleClickOutside(e: MouseEvent) {
      if (isOpen && container && !container.contains(e.target as Node)) {
        isOpen = false;
      }
    }

    function handleHover(e: MouseEvent) {
      const target = e.target as HTMLElement;
    if (target !== lastHovered) {
      lastHovered = target;
      soundCommand.set('mnui');
    }
    }
  
    function handleOptionClick(e: MouseEvent) {
      // If you have interactive elements inside the dropdown that shouldn't close it,
      // consider adding on:click|stopPropagation to them.
      isOpen = false;
    }
  
    // Automatically trigger the appropriate sound effect whenever isOpen changes.
    $: soundCommand.set(isOpen ? 'mnuo' : 'mnuc');
  
    if (browser) {
      onMount(() => {
        document.addEventListener('click', handleClickOutside);
      });
      onDestroy(() => {
        document.removeEventListener('click', handleClickOutside);
      });
    }
  </script>
  
  <div bind:this={container} class={className} class:open={isOpen}>
    <div onclick={toggleMenu} role="button" aria-expanded={isOpen} tabindex="0" style="display: flex;">
      <slot name="toggle">Toggle</slot>
    </div>
  
    {#if isOpen}
      <!-- Dropdown content closes automatically on click -->
      <div class="dropdown-content" onclick={handleOptionClick} onmouseover={handleHover} role="button" tabindex="1">
        <slot></slot>
      </div>
    {/if}
  </div>