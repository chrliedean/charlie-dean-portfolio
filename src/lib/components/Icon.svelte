<!-- Icon.svelte -->
<script lang="ts">
  let {name, size } = $props()

  // Import your icon components
  let src = name ? `/img/icns/${name}.png` : '';
  
  function handleError(event: Event) {
    // If image fails to load, set a fallback or empty image
    const img = event.target as HTMLImageElement;
    console.error(`Failed to load icon: ${src}`);
    img.src = '/img/icns/default.png'; // Fallback icon
    img.onerror = null; // Prevent infinite error loop
  }
  // Add more imports as needed
</script>

<img
  {src}
  alt={name || ''}
  class="icon"
  style="width: {size}; height: {size}; vertical-align: middle; user-select: none; -webkit-user-select: none; draggable"
  on:error={handleError}
/>
