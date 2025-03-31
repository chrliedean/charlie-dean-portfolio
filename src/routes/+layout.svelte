<!-- /+layout.svelte -->
<script>
    import '../css/webflow.css';
    import '../css/app.scss';

    import MenuBar from '$lib/components/MenuBar.svelte';
    import WindowManager from '$lib/components/WindowManager.svelte';
    import WindowStatePersistence from '$lib/components/WindowStatePersistence.svelte';
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
    <WindowStatePersistence />
    <MenuBar />
    <Desktop />
    <WindowManager />
</section>
