<script lang="ts">
  import { onMount, onDestroy, setContext } from "svelte";
  import SmartLink from "./SmartLink.svelte";
  import { getFocusedWindow, getWindows } from "$lib/state/windowState.svelte";
  import Dropdown from "./Dropdown.svelte";
  import Icon from "./Icon.svelte";
  import { writable } from "svelte/store";
  import { browser } from "$app/environment";

  // Create a global dropdown manager store and share it via context
  const globalDropdownState = writable<{
    dragging: boolean;
    originDropdownId: string | null;
    currentSelectedItem: HTMLElement | null;
    lastSoundTime: number;
    lastHoveredItem: HTMLElement | null;
  }>({
    dragging: false,
    originDropdownId: null,
    currentSelectedItem: null,
    lastSoundTime: 0,
    lastHoveredItem: null
  });
  setContext('globalDropdownState', globalDropdownState);

  // State
  let time = $state("");
  let isFullscreen = $state(false);
  let activeMenuItem = $state<string | null>(null);

  // Function to get time in 12-hour format
  function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // convert 0 to 12
    const minsStr = minutes < 10 ? `0${minutes}` : minutes;
    time = `${hours}:${minsStr} ${ampm}`;
  }

  // Update every minute
  const interval = setInterval(updateTime, 1000);
  updateTime();

  // Cleanup when component unmounts
  onDestroy(() => clearInterval(interval));
  
  // Close dropdowns handler - now moved to a proper interactive element
  function preventEventBubbling(e: MouseEvent) {
    // This prevents the document click handler from closing menus
    // when clicking within the menu bar, allowing our more specific
    // handlers to control the behavior
    e.stopPropagation();
  }

  function toggleFullscreen() {
    if (!browser) return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        isFullscreen = true;
      }).catch(err => console.error("Error going fullscreen:", err));
    } else {
      document.exitFullscreen().then(() => {
        isFullscreen = false;
      }).catch(err => console.error("Error exiting fullscreen:", err));
    }
  }

  // Function to handle keyboard navigation
  function handleKeyDown(e: KeyboardEvent) {
    if (!activeMenuItem) return;

    const menuItems = document.querySelectorAll('.menubar-item');
    const currentIndex = Array.from(menuItems).findIndex(item => item.id === activeMenuItem);

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
        (menuItems[prevIndex] as HTMLElement).focus();
        break;
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % menuItems.length;
        (menuItems[nextIndex] as HTMLElement).focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        const currentItem = menuItems[currentIndex];
        const dropdownToggle = currentItem.querySelector('.dropdown-toggle');
        if (dropdownToggle) {
          (dropdownToggle as HTMLElement).click();
        }
        break;
      case 'Escape':
        e.preventDefault();
        if (activeMenuItem) {
          const currentItem = document.getElementById(activeMenuItem);
          if (currentItem) {
            currentItem.blur();
            activeMenuItem = null;
          }
        }
        break;
    }
  }

  // Function to handle menu item focus
  function handleMenuItemFocus(e: FocusEvent) {
    const target = e.target as HTMLElement;
    const menuItem = target.closest('.menubar-item');
    if (menuItem) {
      activeMenuItem = menuItem.id;
    }
  }

  onMount(() => {
    if (browser) {
      document.addEventListener('fullscreenchange', () => {
        isFullscreen = !!document.fullscreenElement;
      });
      document.addEventListener('keydown', handleKeyDown);
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('keydown', handleKeyDown);
    }
  });
</script>

<!-- Made the menubar a div instead of nav to avoid accessibility warnings -->
<div 
  class="menubar" 
  role="menubar" 
  aria-label="Main Menu" 
  onfocusin={handleMenuItemFocus}
>
  <div class="menubar-left">
    <Dropdown className="menubar-item logo w-dropdown" id="app-menu">
      <div 
        class="dropdown-toggle w-dropdown-toggle" 
        slot="toggle"
        onclick={preventEventBubbling}
        role="menuitem"
        aria-haspopup="true"
        aria-expanded="false"
      >
        <div class="menubar-item-contents"></div>
      </div>

      <nav class="dropdown-menu w-dropdown-list" role="menu">
        <SmartLink href="/" classname="dropdown-link w-dropdown-link">
          Go to Homepage
        </SmartLink>
        
        <SmartLink
          href="/enter-password"
          classname="dropdown-link w-dropdown-link">
          Enter Password...
        </SmartLink>
        
        <a href="#" class="dropdown-link w-dropdown-link" role="menuitem">
          About this Website
        </a>

        <SmartLink href="/e-charlie" classname="dropdown-link w-dropdown-link" role="menuitem">
          E-Charlie...
        </SmartLink>

        <span class="dropdown-link w-dropdown-link" role="menuitem" onclick={toggleFullscreen}>
          {#if isFullscreen}
          Exit fullscreen
          {:else}
          Enter fullscreen
          {/if}
        </span>
      </nav>
    </Dropdown>
    
    <!-- Convert direct links to dropdowns with one item -->
    <Dropdown className="menubar-item w-dropdown" id="portfolio-menu">
      <div 
        class="dropdown-toggle w-dropdown-toggle" 
        slot="toggle"
        onclick={preventEventBubbling}
      >
        <div class="menubar-item-contents">Portfolio</div>
      </div>
      <nav class="dropdown-menu w-dropdown-list" role="menu">
        <SmartLink href="/portfolio" classname="dropdown-link w-dropdown-link">
          View Portfolio
        </SmartLink>
      </nav>
    </Dropdown>
    
    <Dropdown className="menubar-item w-dropdown" id="client-work-menu">
      <div 
        class="dropdown-toggle w-dropdown-toggle" 
        slot="toggle"
        onclick={preventEventBubbling}
      >
        <div class="menubar-item-contents">Client Work</div>
      </div>
      <nav class="dropdown-menu w-dropdown-list" role="menu">
        <a href="#" class="dropdown-link w-dropdown-link" role="menuitem">
          View Client Work
        </a>
      </nav>
    </Dropdown>
    
    <Dropdown className="menubar-item w-dropdown" id="about-menu">
      <div 
        class="dropdown-toggle w-dropdown-toggle" 
        slot="toggle"
        onclick={preventEventBubbling}
      >
        <div class="menubar-item-contents">About</div>
      </div>
      <nav class="dropdown-menu w-dropdown-list" role="menu">
        <SmartLink href="/about" classname="dropdown-link w-dropdown-link">
          About Charlie Dean
        </SmartLink>
      </nav>
    </Dropdown>
    
    <Dropdown className="menubar-item w-dropdown" id="contact-menu">
      <div 
        class="dropdown-toggle w-dropdown-toggle" 
        slot="toggle"
        onclick={preventEventBubbling}
      >
        <div class="menubar-item-contents">Contact</div>
      </div>
      <nav class="dropdown-menu w-dropdown-list" role="menu">
        <SmartLink href="/contact" classname="dropdown-link w-dropdown-link">
          Contact Information
        </SmartLink>
      </nav>
    </Dropdown>
  </div>
  
  <div class="menubar-right">
    <div class="menubar-item">
      <div id="clock" class="menubar-item-contents">{time}</div>
    </div>
    <div class="menubar-item divider">
      <div class="menubar-item-contents"></div>
    </div>

    <Dropdown className="menubar-item w-dropdown" id="windows-menu">
      <div 
        class="dropdown-toggle w-dropdown-toggle" 
        slot="toggle"
        onclick={preventEventBubbling}
      >
        <div class="menubar-item-contents">
          {#if getFocusedWindow()}
            {@const focusedWindow = getFocusedWindow()!}
            {#if focusedWindow.icon}
              <Icon name={focusedWindow.icon} size="1em" />
            {/if}
            {focusedWindow.title || 'Untitled Window'}
          {:else}
            No Windows Open
          {/if}
        </div>
      </div>

      <nav class="dropdown-menu w-dropdown-list" role="menu">
        {#each getWindows() as win (win.id)}
          <SmartLink href={win.route} classname="dropdown-link w-dropdown-link">
            {#if win.icon}
              <Icon name={win.icon} size="1em" />
            {/if}
            {win.title}
          </SmartLink>
        {/each}
      </nav>
    </Dropdown>
  </div>
</div>

