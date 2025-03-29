<script module>
  export const windowMeta = {
    id: "browser",
    title: "Browser",
    route: "/browser",
    defaultSize: { width: 600, height: 400 },
    icon: "ie4",
    style: "browser",
  };
</script>

<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { updateWindow } from "$lib/stores/windows";
  import Icon from "$lib/components/Icon.svelte";
  const params = $page.url.searchParams;
  let inputUrl = params.get("url") || "";
  let currentUrl = inputUrl;
  let iframeRef: HTMLIFrameElement | null = null;

  function goToUrl() {
    currentUrl = inputUrl;
    updateWindow(window.location.pathname, {
      route: "/browser?url=" + inputUrl,
    });
  }

  function handleIframeLoad(event: Event): void {
    const iframe = event.target as HTMLIFrameElement;
    try {
      inputUrl = iframe.contentWindow?.location.href || "";
    } catch(e) {
      console.error("Cannot access iframe URL", e);
    }
  }
</script>

<div class="browser-controls">
    <button class="button" on:click={() => iframeRef?.contentWindow?.history.back()}>
        <Icon size="1em" name="back" /> 
      </button>
      <button class="button" on:click={() => iframeRef?.contentWindow?.history.forward()}>
        <Icon size="1em" name="forward" /> 
      </button>
  <input type="text" bind:value={inputUrl} />
  <button
    class="button"
    on:click={goToUrl}>Go</button>

  <button class="button" on:click={() => {
      window.open(currentUrl, "_blank");
  }}>
      <Icon size="1em" name="browseinternet"/> Open in Broswer
  </button>
</div>
{#if inputUrl}
  <div class="iframe-container">
    <iframe
      bind:this={iframeRef}
      title="Browser"
      src={currentUrl}
      style="width: 100%; height: 100%; border: none;"
      on:load={handleIframeLoad}
    >
      <p>Your browser does not support iframes.</p>
    </iframe>
  </div>
{/if}
