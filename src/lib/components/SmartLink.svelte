<script lang="ts">
    import { goto } from '$app/navigation';
    import { windowConfig } from '$lib/config/windows';
    
    export let href: string;
    export let classname: string = '';
    
    function handleClick(e: MouseEvent) {
      e.preventDefault();
      const config = windowConfig[href];
      if (config) {
        const event = new CustomEvent('open-window', {
          detail: { config },
          bubbles: true,
          composed: true
        });
        dispatchEvent(event);
      }
      goto(href);
    }
  </script>
  
  <a href={href} on:click={handleClick} class={classname}>
    <slot />
  </a>