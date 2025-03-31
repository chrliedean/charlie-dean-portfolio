import { browser } from '$app/environment';
import type { WindowEntry } from '../types/window';
import { goto, disableScrollHandling } from "$app/navigation";
import { tick } from "svelte";

// State
let windows = $state<WindowEntry[]>([]);
let focusedWindowId = $state<string | null>(null);

// Getters
export function getWindows() {
    return windows;
}

export function getFocusedWindow() {
    return windows.find(w => w.id === focusedWindowId);
}

// Actions
export function addWindow(window: WindowEntry) {
    windows = [...windows, window];
    focusWindow(window.id);
}

export function removeWindow(id: string) {
    // Find the index of the window being removed
    const removedIndex = windows.findIndex(w => w.id === id);
    
    // Remove the window
    windows = windows.filter(w => w.id !== id);
    
    // If the removed window was focused, focus the window behind it
    if (focusedWindowId === id) {
        // If there are windows left and the removed window wasn't the last one,
        // focus the window that was behind it
        if (windows.length > 0 && removedIndex > 0) {
            const windowBehind = windows[removedIndex - 1];
            focusWindow(windowBehind.id);
        } else if (windows.length > 0) {
            // If the removed window was the last one, focus the new last window
            focusWindow(windows[windows.length - 1].id);
        } else {
            // If no windows left, clear focus
            focusedWindowId = null;
        }
    }
}

export function updateWindow(id: string, updates: Partial<WindowEntry>) {
    windows = windows.map(w =>
        w.id === id ? { ...w, ...updates } : w
    );
}

// Main focus function that handles both state and visual updates
export function focusWindow(id: string) {
    console.log("🪟 windowState called focusWindow", id);
    
    // Find the window
    const win = windows.find((w) => w.id === id);
    if (!win) {
        console.error("❌ Window not found:", id);
        return;
    }

    // Store current scroll position of all windows
    const scrollPositions = new Map<string, number>();
    windows.forEach(w => {
        if (w.ref?.querySelector('.window-body')) {
            const body = w.ref.querySelector('.window-body') as HTMLElement;
            if (body) {
                scrollPositions.set(w.id, body.scrollTop);
                console.log(`📜 Stored scroll position for ${w.id}: ${body.scrollTop}`);
            }
        }
    });

    // Update focused window state
    focusedWindowId = id;

    // Move window to end of array (top of stack)
    windows = [...windows.filter(w => w.id !== id), win];

    // Only update URL if it doesn't match the current route
    if (browser && window.location.pathname !== win.route) {
        console.log(`🔄 Updating URL from ${window.location.pathname} to ${win.route}`);
        goto(win.route, { 
            replaceState: true,
            noScroll: true
        });

    }

    // Update z-indices for all windows based on their position in the array
    windows.forEach((w, index) => {
        if (w.ref?.classList) {
            // Set z-index based on position (last window gets highest z-index)
            const zIndex = 100 + index;
            w.ref.style.zIndex = `${zIndex}`;
            
            // Update active/inactive classes
            if (w.id === id) {
                w.ref.classList.remove('inactive');
                w.ref.classList.add('active');
                console.log(`✅ Window ${w.id} focused with z-index ${zIndex}`);
            } else {
                w.ref.classList.remove('active');
                w.ref.classList.add('inactive');
                console.log(`⏭️ Window ${w.id} unfocused with z-index ${zIndex}`);
            }
        } else {
            console.warn(`⚠️ Window ${w.id} has no ref, waiting for next tick`);
            // Wait for next tick to ensure ref is set
            tick().then(() => {
                if (w.ref?.classList) {
                    const zIndex = 100 + index;
                    w.ref.style.zIndex = `${zIndex}`;
                    if (w.id === id) {
                        w.ref.classList.remove('inactive');
                        w.ref.classList.add('active');
                        console.log(`✅ Window ${w.id} focused with z-index ${zIndex} (after tick)`);
                    } else {
                        w.ref.classList.remove('active');
                        w.ref.classList.add('inactive');
                        console.log(`⏭️ Window ${w.id} unfocused with z-index ${zIndex} (after tick)`);
                    }
                }
            });
        }
    });


    // Log final window state
    console.log("📊 Final window state:", windows.map(w => ({
        id: w.id,
        focused: w.id === id,
        hasRef: !!w.ref
    })));
}

export function initializeWindows(initialWindows: WindowEntry[]) {
    windows = initialWindows;
}