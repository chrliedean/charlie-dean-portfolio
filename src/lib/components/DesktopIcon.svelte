<script>
  import { goto } from "$app/navigation";
  import { draggable } from "$lib/actions/draggable";
  import Icon from "./Icon.svelte";
  let { icon, label, href, style } = $props();

  function handleDblClick() {
    goto(href);
  }
</script>

<figure style ={style} class="desktop-icon" role='presentation' tabindex="-1" ondblclick={handleDblClick} use:draggable>
  <div class="desktop-icon-image">
    <Icon name={icon} size="48px" />
  </div>
  <figcaption>{label}</figcaption>
</figure>
