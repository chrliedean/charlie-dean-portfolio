<script context="module">
    export const windowMeta= {
        id: 'settings',
        title: 'Settings',
        route: '/settings',
        resizable: false,
        icon: 'controls',
        defaultSize: {
            width: 300,
        },
    };
</script>

<script lang="ts">
    import { settings } from '$lib/stores/settings';
    import { onMount } from 'svelte';
    
    let soundEnabled: boolean = true;
    
    // Subscribe to the settings store
    onMount(() => {
        const unsubscribe = settings.subscribe(values => {
            soundEnabled = values.soundEnabled;
        });
        
        return unsubscribe;
    });
    
    // Update settings when checkbox changes
    function handleSoundToggle() {
        settings.update('soundEnabled', soundEnabled);
    }
</script>

<svelte:head>
    <title>Settings - Charlie Dean</title>
    <meta name="description" content="Adjust settings for Charlie Dean's website.">
</svelte:head>

<div class="settings-container">
    <div class="setting-item">
        <input 
            type="checkbox" 
            class="checkbox" 
            id="sound-toggle" 
            bind:checked={soundEnabled} 
            on:change={handleSoundToggle}
        >
        <label for="sound-toggle" class="checkbox-label">
            Enable Sound Effects
        </label>
    </div>
</div>

