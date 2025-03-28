<script lang="ts">
  import { onMount, onDestroy, setContext } from "svelte";
  import SmartLink from "./SmartLink.svelte";
  import { focusedWindow } from "$lib/stores/windows";
  import { openWindows } from "$lib/stores/windows";
  import Dropdown from "./Dropdown.svelte";
  import Icon from "./Icon.svelte";
  import { writable } from "svelte/store";

  // Create a global dropdown manager store and share it via context
  const activeDropdownStore = writable<string | null>(null);
  setContext('activeDropdown', activeDropdownStore);

  let time = $state("");

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
</script>

<!-- Made the menubar a div instead of nav to avoid accessibility warnings -->
<div class="menubar" role="menubar" aria-label="Main Menu">
  <div class="menubar-left">
    <Dropdown className="menubar-item logo w-dropdown" id="app-menu">
      <div 
        class="dropdown-toggle w-dropdown-toggle" 
        slot="toggle"
        on:click={preventEventBubbling}
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
      </nav>
    </Dropdown>
    
    <!-- Convert direct links to dropdowns with one item -->
    <Dropdown className="menubar-item w-dropdown" id="portfolio-menu">
      <div 
        class="dropdown-toggle w-dropdown-toggle" 
        slot="toggle"
        on:click={preventEventBubbling}
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
        on:click={preventEventBubbling}
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
        on:click={preventEventBubbling}
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
        on:click={preventEventBubbling}
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
        on:click={preventEventBubbling}
      >
        <div class="menubar-item-contents">
          {#if $focusedWindow}
            {#if $focusedWindow.icon}
              <Icon name={$focusedWindow.icon} size="1em" />
            {/if}
            {$focusedWindow.title}
          {:else}
            Default Title
          {/if}
        </div>
      </div>

      <nav class="dropdown-menu w-dropdown-list" role="menu">
        {#each $openWindows as win (win.id)}
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

<style>
  /* Add any additional styling here */
  .menubar-item:hover {
    cursor: default;
  }
</style>