<script>
	let time = '';

// function to get time in 12-hour format
function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // convert 0 to 12
    const minsStr = minutes < 10 ? `0${minutes}` : minutes;
    time = `${hours}:${minsStr} ${ampm}`;
}

// update every minute
const interval = setInterval(updateTime, 1000);
updateTime();

// cleanup when component unmounts
import { onDestroy } from 'svelte';
onDestroy(() => clearInterval(interval));
import SmartLink from './SmartLink.svelte';
</script>

<nav class="menubar">
    <div class="menubar-left">
      <div data-hover="false" data-delay="0" data-w-id="1dbb2355-11a9-dab4-84a3-319e893797e4" class="menubar-item logo w-dropdown">
        <div class="dropdown-toggle w-dropdown-toggle">
          <div class="menubar-item-contents"></div>
        </div>
        <nav class="dropdown-menu w-dropdown-list">
          <a href="#" class="dropdown-link w-dropdown-link">Go to Homepage</a>
          <a href="#" class="dropdown-link w-dropdown-link">Enter Password...</a>
          <a href="#" class="dropdown-link w-dropdown-link">About this Website</a>
        </nav>
      </div>
      <SmartLink href="/" classname="menubar-item w-inline-block">
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
      <a href="#" class="menubar-item website w-inline-block">
        <div class="menubar-item-contents">Website</div>
      </a>
    </div>
  </nav>