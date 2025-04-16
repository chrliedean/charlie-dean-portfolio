// src/lib/state/windowState.svelte.ts
import { browser } from '$app/environment';
import type { WindowEntry } from '../types/window';
import { goto, disableScrollHandling, afterNavigate } from "$app/navigation";
import { tick } from "svelte";

// State
let windows = $state<WindowEntry[]>([]);
let focusedWindowId = $state<string | null>(null);
let shouldDisableScroll = $state(false);
// --- NEW: State to track the highest z-index assigned ---
let highestZIndex = $state(100); // Start at base z-index

// Getters
export function getWindows() {
    return windows;
}

export function getFocusedWindow() {
    return windows.find(w => w.id === focusedWindowId);
}

// Actions
export function addWindow(window: WindowEntry) {
    // When adding a window, assign it the current highest z-index + 1 initially
    highestZIndex += 1;
    const windowWithZ = { ...window, initialZ: highestZIndex }; // Store initial z? might not be needed

    // Add to array (order doesn't matter as much for rendering now)
    windows = [...windows, windowWithZ];

    // Focus the new window (which will also set its final z-index)
    focusWindow(window.id); 
}

export function defocusAllWindows() {
    focusedWindowId = null;
    // Update all windows to be inactive
    windows.forEach(w => {
        if (w.ref?.classList) {
            w.ref.classList.remove('active');
            w.ref.classList.add('inactive');
            // Optionally reset z-index to a base level? Or leave them stacked?
            // Leaving them stacked might be visually better.
        }
    });
}

export function removeWindow(id: string) {
    const windowToRemove = windows.find(w => w.id === id);
    if (!windowToRemove) return;

    const removedZIndex = parseInt(windowToRemove.ref?.style.zIndex || '0');

    // Remove the window from the array
    windows = windows.filter(w => w.id !== id);
    
    // If the removed window was focused, focus the window with the next highest z-index
    if (focusedWindowId === id) {
        if (windows.length > 0) {
            // Find the window with the highest z-index among the remaining ones
            let nextFocusedWindow = windows[0];
            let maxZ = 0;
            windows.forEach(w => {
                const currentZ = parseInt(w.ref?.style.zIndex || '0');
                if (currentZ > maxZ) {
                    maxZ = currentZ;
                    nextFocusedWindow = w;
                }
            });
            if (nextFocusedWindow) {
                focusWindow(nextFocusedWindow.id); // Focus window with highest Z
            } else {
                 focusedWindowId = null; // No windows left or error finding max Z
            }
        } else {
            // If no windows left, clear focus and reset base z-index
            focusedWindowId = null;
            highestZIndex = 100; // Reset base z-index
        }
    }

    // Optional: Reset highestZIndex if the removed window had the highest value
    // This prevents z-index from growing indefinitely if not needed.
    if (windows.length === 0) {
         highestZIndex = 100;
    } else if (removedZIndex === highestZIndex) {
        // Find the new highest z-index among remaining windows
        highestZIndex = Math.max(100, ...windows.map(w => parseInt(w.ref?.style.zIndex || '0')));
    }

}

export function updateWindow(id: string, updates: Partial<WindowEntry>) {
    // Make sure we don't accidentally overwrite the ref or z-index managed here
    const { ref, style, ...otherUpdates } = updates; 
    windows = windows.map(w =>
        w.id === id ? { ...w, ...otherUpdates } : w
    );
}

// --- MODIFIED focusWindow ---
export function focusWindow(id: string) {
    console.log("🪟 windowState called focusWindow (Z-index mode)", id);
    
    const win = windows.find((w) => w.id === id);
    if (!win || !win.ref) { // Ensure we have the window and its ref
        console.error("❌ Window or window ref not found:", id);
        // Attempt to find ref after tick if not immediately available
        tick().then(() => {
             const winAfterTick = windows.find((w) => w.id === id);
             if (winAfterTick && winAfterTick.ref) {
                 console.log("Ref found after tick, retrying focus logic for", id)
                 applyFocusStyles(id);
             } else {
                  console.error("❌ Ref still not found after tick for:", id);
             }
        });
        return; 
    }

    // Apply the focus styles (active/inactive classes and z-index)
    applyFocusStyles(id);

    // Update focused window state *after* applying styles
    focusedWindowId = id;

    // --- URL Update Logic (kept from before, still skips /e-charlie if needed) ---
    if (browser && window.location.pathname !== win.route) {
        // Keep scroll restoration logic if needed, but `goto` might still be risky
        // Consider if URL sync is truly necessary when focusing e-charlie
        shouldDisableScroll = true;
        // Store scroll positions before potential navigation
         const scrollPositions = new Map<string, number>();
         windows.forEach(w => {
            if (w.ref?.querySelector('.window-body')) {
                const body = w.ref.querySelector('.window-body') as HTMLElement;
                if (body) scrollPositions.set(w.id, body.scrollTop);
            }
         });

        goto(win.route, { 
            replaceState: true,
            noScroll: true, // Keep noScroll
            keepFocus: true // Keep keepfocus
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

    // Update document title
    if (browser && win.title) {
        document.title = `${win.title} - Charlie Dean`;
    }
}

// --- NEW Helper Function to apply styles ---
function applyFocusStyles(focusedId: string) {
     const win = windows.find((w) => w.id === focusedId);
     if (!win || !win.ref) return; // Should have ref here

     // Check for alert window interference
     const alertWindow = windows.find(w => w.style === 'alert');
     if (alertWindow && alertWindow.id !== focusedId) {
        // If there's an alert window and we're not focusing it, prevent style changes
        console.log("Alert window present, focus change prevented.");
        return;
     }

     // --- Z-Index Management ---
     // Increment highestZIndex *before* assigning it to the newly focused window
     highestZIndex += 1; 
     win.ref.style.zIndex = `${highestZIndex}`;
     console.log(`Assigning z-index ${highestZIndex} to ${focusedId}`);

     // --- Active/Inactive Class Management ---
     win.ref.classList.remove('inactive');
     win.ref.classList.add('active');

     // Apply inactive class to all other windows
     windows.forEach(w => {
        if (w.id !== focusedId && w.ref) {
            w.ref.classList.remove('active');
            w.ref.classList.add('inactive');
            // We don't need to change their z-index here, they just become inactive below the focused one.
        }
     });
}


export function initializeWindows(initialWindows: WindowEntry[]) {
    // Assign initial z-index when initializing if needed, or rely on addWindow
    let currentZ = 100;
    windows = initialWindows.map(w => {
        currentZ++;
        // Note: The ref won't exist yet here, will be set later by Svelte's binding
        // We will set the z-index properly when the window is first focused or added.
        return { ...w }; 
    });
     highestZIndex = currentZ; // Track the highest starting Z
}