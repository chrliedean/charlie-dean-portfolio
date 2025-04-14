<script lang="ts">
    import DesktopIcon from "./DesktopIcon.svelte";
    import { onMount } from "svelte";
    import { defocusAllWindows } from "$lib/state/windowState.svelte";

    let icons = [
        { icon: "folder", label: "Portfolio", href: "/portfolio" },
        { icon: "charlie", label: "E-Charlie", href: "/e-charlie" }
    ];

    let positions: { left: string; top: number }[] = [];

    // Grid configuration
    const gridSize = 100; // Size of each grid cell (in pixels)
    const gridPadding = 20; // Padding around the grid (in pixels)
    const rows = 4; // Number of rows in the grid

    onMount(() => {
        // Calculate positions for each icon (top-right to bottom-left, column-first)
        positions = icons.map((_, index) => {
            const col = Math.floor(index / rows); // Column index
            const row = index % rows; // Row index
            return {
                left: `calc(100% - ${gridPadding + (col + 1) * gridSize}px)`, // Start from the right
                top: gridPadding + row * gridSize // Move down in rows
            };
        });
    });

    function handleDesktopClick(event: MouseEvent) {
        // Only defocus if clicking directly on the desktop (not on an icon)
        if (event.target === event.currentTarget) {
            defocusAllWindows();
        }
    }
</script>

<div class="desktop" on:click={handleDesktopClick}>
    {#each icons as icon, index}
        <DesktopIcon
            icon={icon.icon}
            label={icon.label}
            href={icon.href}
            style="position: absolute; left: {positions[index]?.left}; top: {positions[index]?.top}px;"
        />
    {/each}
</div>