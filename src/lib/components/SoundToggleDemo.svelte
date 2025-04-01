<script lang="ts">
    import { soundEnabled } from '$lib/stores/settings';
    
    // Example function that would play a sound if enabled
    function playSound() {
        if ($soundEnabled) {
            console.log('Sound would play here');
            // Actual sound implementation would go here
        } else {
            console.log('Sound is disabled');
        }
    }
</script>

<div>
    <button on:click={playSound}>
        Test Sound
    </button>
    <p>Sound is currently: {$soundEnabled ? 'Enabled' : 'Disabled'}</p>
</div>

<style>
    button {
        padding: 0.5rem 1rem;
        margin: 1rem 0;
        cursor: pointer;
    }
</style> 