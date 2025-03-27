<!-- /portfolio/+layout.svelte -->
<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { LayoutData } from './$types';

    let { data, children }: { data: LayoutData, children: Snippet } = $props();

    interface postData {
        year: string;
        medium: string;
    }
</script>

{@render children()}