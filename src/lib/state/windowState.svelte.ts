import { browser } from '$app/environment';
import type { WindowEntry } from '../types/window';
import { goto, disableScrollHandling, afterNavigate } from "$app/navigation";
import { tick } from "svelte";

// State
let windows = $state<WindowEntry[]>([]);
let focusedWindowId = $state<string | null>(null);
let shouldDisableScroll = $state(false);

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

export function defocusAllWindows() {
    focusedWindowId = null;
    // Update all windows to be inactive
    windows.forEach(w => {
        if (w.ref?.classList) {
            w.ref.classList.remove('active');
            w.ref.classList.add('inactive');
        }
    });
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
    // console.log("🪟 windowState called focusWindow", id);
    
    // Find the window
    const win = windows.find((w) => w.id === id);
    if (!win) {
        console.error("❌ Window not found:", id);
        return;
    }

    // Check if there's an alert window open
    const alertWindow = windows.find(w => w.style === 'alert');
    if (alertWindow && alertWindow.id !== id) {
        // If there's an alert window and we're not focusing it, prevent focus change
        return;
    }

    // Store current scroll position of all windows
    const scrollPositions = new Map<string, number>();
    windows.forEach(w => {
        if (w.ref?.querySelector('.window-body')) {
            const body = w.ref.querySelector('.window-body') as HTMLElement;
            if (body) {
                scrollPositions.set(w.id, body.scrollTop);
            }
        }
    });

    // Update focused window state
    focusedWindowId = id;

    // Move window to end of array (top of stack)
    windows = [...windows.filter(w => w.id !== id), win];

    // Only update URL if it doesn't match the current route
    if (browser && window.location.pathname !== win.route) {
        shouldDisableScroll = true;
        goto(win.route, { 
            replaceState: true,
            noScroll: true
        }).then(() => {
            // Restore scroll positions after navigation completes
            tick().then(() => {
                windows.forEach(w => {
                    if (w.ref?.querySelector('.window-body')) {
                        const body = w.ref.querySelector('.window-body') as HTMLElement;
                        const savedScroll = scrollPositions.get(w.id);
                        if (body && savedScroll !== undefined) {
                            body.scrollTop = savedScroll;
                        }
                    }
                });
            });
        });
    }

    // Update z-indices for all windows based on their position in the array
    windows.forEach((w, index) => {
        if (w.ref?.classList) {
            // Set z-index based on position (last window gets highest z-index)
            // Alert windows always get the highest z-index
            const zIndex = w.style === 'alert' ? 9999 : 100 + index;
            w.ref.style.zIndex = `${zIndex}`;
            
            // Update active/inactive classes
            if (w.id === id) {
                w.ref.classList.remove('inactive');
                w.ref.classList.add('active');
            } else {
                w.ref.classList.remove('active');
                w.ref.classList.add('inactive');
            }
        } else {
            console.warn(`⚠️ Window ${w.id} has no ref, waiting for next tick`);
            // Wait for next tick to ensure ref is set
            tick().then(() => {
                if (w.ref?.classList) {
                    const zIndex = w.style === 'alert' ? 9999 : 100 + index;
                    w.ref.style.zIndex = `${zIndex}`;
                    if (w.id === id) {
                        w.ref.classList.remove('inactive');
                        w.ref.classList.add('active');
                    } else {
                        w.ref.classList.remove('active');
                        w.ref.classList.add('inactive');
                    }
                }
            });
        }
    });

    // Log final window state
    // console.log("📊 Final window state:", windows.map(w => ({
    //     id: w.id,
    //     focused: w.id === id,
    //     hasRef: !!w.ref,
    //     style: w.style
    // })));

    // Update document title based on focused window
    if (browser && win.title) {
        document.title = `${win.title} - Charlie Dean`;
    }
}

export function initializeWindows(initialWindows: WindowEntry[]) {
    windows = initialWindows;
}

