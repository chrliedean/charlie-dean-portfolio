<!-- Icon.svelte -->
<script lang="ts">
  let {name, size } = $props()

  // Import your icon components
  let src = `/img/icns/${name}.png`;
  // Add more imports as needed
</script>

<img
  {src}
  alt={name}
  class="icon"
  style="width: {size}; height: {size}; vertical-align: middle; user-select: none; -webkit-user-select: none; draggable"
/>
