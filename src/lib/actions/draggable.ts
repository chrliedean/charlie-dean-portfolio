// /src/lib/actions/draggable.ts
import { soundCommand } from "$lib/components/SoundEffects.svelte";

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(value, max));
}

function calculateBounds(node: HTMLElement) {
    const parent = node.parentElement;
    if (!parent) return null;

    const rect = parent.getBoundingClientRect();
    const areaWidth = rect.width;
    const areaHeight = rect.height;
    const elementWidth = node.offsetWidth;
    const elementHeight = node.offsetHeight;

    return { areaWidth, areaHeight, elementWidth, elementHeight };
}

function getPositionRelativeToParent(node: HTMLElement) {
    const parent = node.parentElement;
    if (!parent) return { left: 0, top: 0 };

    const nodeRect = node.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    
    return {
        left: nodeRect.left - parentRect.left,
        top: nodeRect.top - parentRect.top
    };
}

function updatePosition(node: HTMLElement, left: number, top: number) {
    const bounds = calculateBounds(node);
    if (!bounds) return;

    const { areaWidth, areaHeight, elementWidth, elementHeight } = bounds;
    const clampedLeft = clamp(left, 0, areaWidth - elementWidth);
    const clampedTop = clamp(top, 0, areaHeight - elementHeight);

    node.style.left = `${clampedLeft}px`;
    node.style.top = `${clampedTop}px`;
}

export function draggable(node: HTMLElement) {
    let startX = 0, startY = 0;
    let cumulativeX = 0, cumulativeY = 0;
    let dragging = false;
    let soundStarted = false;

    // Store initial position relative to parent
    const initialPosition = getPositionRelativeToParent(node);
    cumulativeX = initialPosition.left;
    cumulativeY = initialPosition.top;

    function handleMouseDown(event: MouseEvent) {
        if (event.button !== 0) return; // Only respond to left-click
        dragging = true;
        // Get current position relative to parent before starting drag
        const currentPosition = getPositionRelativeToParent(node);
        startX = event.clientX - currentPosition.left;
        startY = event.clientY - currentPosition.top;
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

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        cumulativeX = dx;
        cumulativeY = dy;

        updatePosition(node, dx, dy);
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

    function handleResize() {
        if (!dragging) {
            // Get current position relative to parent
            const currentPosition = getPositionRelativeToParent(node);
            cumulativeX = currentPosition.left;
            cumulativeY = currentPosition.top;
            updatePosition(node, cumulativeX, cumulativeY);
        }
    }

    node.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('resize', handleResize);

    return {
        destroy() {
            node.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('resize', handleResize);
        }
    };
}