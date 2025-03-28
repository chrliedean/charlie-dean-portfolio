<script lang="ts">
  import { goto } from '$app/navigation';
  
  export let href: string;
  export let classname: string = '';
  // Add support for role attribute
  export let role: string = '';
  
  function handleClick(event: MouseEvent) {
    event.preventDefault();
    // Navigate to the new route.
    goto(href);
  }
</script>

<a href={href} on:click={handleClick} class={classname} {role}>
  <slot />
</a>