// /src/lib/actions/draggable.ts
import { soundCommand } from "$lib/components/SoundEffects.svelte";

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(value, max));
}

export function draggable(node: HTMLElement) {
    let startX = 0, startY = 0;
    let cumulativeX = 0, cumulativeY = 0;
    let dragging = false;
    let soundStarted = false;

    function handleMouseDown(event: MouseEvent) {
        if (event.button !== 0) return; // Only respond to left-click
        const computedStyle = window.getComputedStyle(node);
        cumulativeX = parseFloat(computedStyle.left) || 0;
        cumulativeY = parseFloat(computedStyle.top) || 0;
        dragging = true;
        startX = event.clientX - cumulativeX;
        startY = event.clientY - cumulativeY;
        node.classList.add('dragging');
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        // Trigger drag-start sound
 
    }
    function handleMouseMove(event: MouseEvent) {
        if (!dragging) return;

        if (!soundStarted) {
            soundCommand.set('drag-start');
            soundStarted = true;
        }

        const parent = node.parentElement;
        if (!parent) return;

        const rect = parent.getBoundingClientRect();
        const areaWidth = rect.width;
        const areaHeight = rect.height;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        const elementWidth = node.offsetWidth;
        const elementHeight = node.offsetHeight;

        const clampedLeft = clamp(dx, 0, areaWidth - elementWidth);
        const clampedTop = clamp(dy, 0, areaHeight - elementHeight);

        cumulativeX = clampedLeft;
        cumulativeY = clampedTop;

        node.style.left = `${clampedLeft}px`;
        node.style.top = `${clampedTop}px`;
    }

    function handleMouseUp() {
        if (!dragging) return;
        dragging = false;

        // Trigger drag-end sound
        if (soundStarted) {
            soundCommand.set('drag-end');
            soundStarted = false;
        }

        node.classList.remove('dragging');
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }

    node.addEventListener('mousedown', handleMouseDown);

    return {
        destroy() {
            node.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
    };
}