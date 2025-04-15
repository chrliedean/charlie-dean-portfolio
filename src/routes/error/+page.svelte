<script context="module">
    export const windowMeta = {
        id: 'error',
        title: 'Error',
        route: 'error',
        style: 'alert',
        resizable: false,
    };
</script>

<script lang="ts">
    import { getContext } from 'svelte';
    import { onMount } from 'svelte';
    import { soundCommand } from '$lib/components/SoundEffects.svelte';
    import { page } from '$app/stores';

    // Retrieve the closeWindow function and windowId from context.
    const closeWindow = getContext('windowManager') as (id: string) => void;
    const windowId = getContext('windowId') as string;

    onMount(() => {
        soundCommand.set('sosumi');
    });

    // Get the original route that caused the 404
    $: originalRoute = $page.url.pathname;
</script>

<div class="alert">
    <div class="icon-container"></div>
    <div class="alert-content">
        <h2>Error 404</h2>
        <span>The page "{originalRoute}" does not exist.</span>
        <button type="button" class="button primary" on:click={() => closeWindow(windowId)}>OK</button>
    </div>
</div>