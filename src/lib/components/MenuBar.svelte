<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import SmartLink from "./SmartLink.svelte";
  import { focusedWindow } from "$lib/stores/windows";
  import { openWindows } from "$lib/stores/windows";
  import Dropdown from "./Dropdown.svelte";
  import Icon from "./Icon.svelte";

  let time = $state("");

  // function to get time in 12-hour format
  function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // convert 0 to 12
    const minsStr = minutes < 10 ? `0${minutes}` : minutes;
    time = `${hours}:${minsStr} ${ampm}`;
  }

  // update every minute
  const interval = setInterval(updateTime, 1000);
  updateTime();

  // cleanup when component unmounts
  onDestroy(() => clearInterval(interval));
</script>

<nav class="menubar">
  <div class="menubar-left">
    <Dropdown className="menubar-item logo w-dropdown">
      <div class="dropdown-toggle w-dropdown-toggle" slot="toggle">
        <div class="menubar-item-contents"></div>
      </div>

      <nav class="dropdown-menu w-dropdown-list">
        <SmartLink href="/" classname="dropdown-link w-dropdown-link"
          >Go to Homepage</SmartLink
        >
        <SmartLink
          href="/enter-password"
          classname="dropdown-link w-dropdown-link">Enter Password...</SmartLink
        >
        <a href="#" class="dropdown-link w-dropdown-link">About this Website</a>
      </nav>
    </Dropdown>
    <SmartLink href="/portfolio" classname="menubar-item w-inline-block">
      <div class="menubar-item-contents">Portfolio</div>
    </SmartLink>
    <a href="#" class="menubar-item w-inline-block">
      <div class="menubar-item-contents">Client Work</div>
    </a>
    <SmartLink href="/about" classname="menubar-item w-inline-block">
      <div class="menubar-item-contents">About</div>
    </SmartLink>
    <SmartLink href="/contact" classname="menubar-item w-inline-block">
      <div class="menubar-item-contents">Contact</div>
    </SmartLink>
  </div>
  <div class="menubar-right">
    <div class="menubar-item">
      <div id="clock" class="menubar-item-contents">{time}</div>
    </div>
    <div class="menubar-item divider">
      <div class="menubar-item-contents"></div>
    </div>

    <Dropdown className="menubar-item w-dropdown">
      <div class="dropdown-toggle w-dropdown-toggle" slot="toggle">
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

      <nav class="dropdown-menu w-dropdown-list">
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
</nav>
