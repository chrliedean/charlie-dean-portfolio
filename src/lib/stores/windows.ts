// import { writable } from 'svelte/store';

// export interface WindowEntry {
//   id: string;
//   title: string;
//   component: any;
//   route: string;
//   ref?: any; // later you can type this more specifically
// }

// function createWindowsStore() {
//   const { subscribe, update } = writable<WindowEntry[]>([]);
//   return {
//     subscribe,
//     addWindow: (win: WindowEntry) =>
//       update((wins) => {
//         // Only add if it doesn't exist already
//         if (!wins.find((w) => w.id === win.id)) {
//           console.log(`Adding window: ${win.id}`);
//           return [...wins, win];
//         }
//         return wins;
//       }),
//     bringToFront: (id: string) =>
//       update((wins) => {
//         const win = wins.find((w) => w.id === id);
//         if (win && win.ref && typeof win.ref.focus === 'function') {
//           win.ref.focus();
//         }
//         return wins;
//       }),
//   };
// }

// export const windows = createWindowsStore();