<!-- /+layout.svelte -->
<script>
    import '../webflow.css';
    import '../app.css';

    import MenuBar from '$lib/components/MenuBar.svelte';
    import WindowManager from '$lib/components/WindowManager.svelte';
    import SoundEffects from '$lib/components/SoundEffects.svelte';
    import  WindowEntry  from '$lib/components/WindowManager.svelte';
    import Desktop from '$lib/components/Desktop.svelte';

    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import { windowConfig } from '$lib/config/windows';

    // if (browser) {
    //     const path = $page.url.pathname;
    //     document.title = (windowConfig[path]?.title ?? "Charlie Dean Portfolio") + " - Charlie Dean";
    // }

</script>
<SoundEffects />
<section class="section">
    <MenuBar />
    <Desktop />
    <WindowManager />
</section>
