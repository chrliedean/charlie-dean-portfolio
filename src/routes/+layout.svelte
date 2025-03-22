<script>
    import '../webflow.css';
    import '../normalize.css';
    import '../app.css';

    import MenuBar from '$lib/components/MenuBar.svelte';
    import WindowManager from '$lib/components/WindowManager.svelte';
    import SoundEffects from '$lib/components/SoundEffects.svelte';
</script>
<SoundEffects />
<section class="section">
    <MenuBar />
    <WindowManager />
</section>
