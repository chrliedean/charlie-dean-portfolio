
<script module>
    export const windowMeta = {
        id: "browser",
        title: "Browser",
        route: "/browser",
        defaultSize: { width: 600, height: 400 },
        icon: "folder",
        style: 'browser'
    };
</script>
<script lang="ts">
    import { page } from "$app/stores";
  import { updateWindow } from "$lib/stores/windows";
    const params = $page.url.searchParams;
    const url = params.get("url");
    console.log("Browser URL:", url);
    const urlstring = url?.toString();
    const newRoute = "/browser?url=" + urlstring 
    console.log("New route:", newRoute);

    updateWindow(window.location.pathname, {
        route: newRoute
    });

    
</script>


{#if url}
<iframe title="Browser" src={urlstring} style="width: 100%; height: 100%; border: none;">
    <p>Your browser does not support iframes.</p>
</iframe>
{/if}