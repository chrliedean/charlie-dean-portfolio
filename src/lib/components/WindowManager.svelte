<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import Window from './Window.svelte';
    import { windowConfig } from '../config/windows';
    //import { openWindows } from '$lib/stores/windows';
  
    interface WindowEntry {
        id: string;
        title: string;
        component: any;
        route: string;
        ref?: Window | null;
        resizable?: boolean;
        defaultSize?  : { width: number; height: number };

    }
  
    let openWindows: WindowEntry[] = $state([]);

    const path = $page.url.pathname;

    if (windowConfig[path]) {
        openWindows = [{ ...windowConfig[path], ref: null }];
    } else if (path === '/') {
        openWindows = [{ ...windowConfig['/'], ref: null }];
    }

    function updateDocumentTitle(id: string) {
        const win = openWindows.find(w => w.id === id);
        if (win) {
        document.title = `${win.title} - Charlie Dean`;
        } else {
        document.title = "Charlie Dean Portfolio - Charlie Dean";
        }
    }

    function handleWindowFocus(id: string) {
        updateDocumentTitle(id);
        if (id === 'home') goto('/');
        else goto(id);
        console.log('Focused window:', id);
    }
  
    function bringWindowToFront(id: string) {
      const win = openWindows.find(w => w.id === id);
      if (win && win.ref && typeof win.ref.focus === 'function') {
        win.ref.focus();
      }
    }

    async function handleOpenWindow(event: CustomEvent<{ config: WindowEntry }>) {
      const { config } = event.detail;
      const existingWindow = openWindows.find(w => w.id === config.id);
      if (!existingWindow) {
        openWindows = [...openWindows, { ...config, ref: null }];
        await tick();
        const newWindow = openWindows.find(w => w.id === config.id);
        if (newWindow && newWindow.ref && typeof newWindow.ref.focus === 'function') {
          newWindow.ref.focus();
        }
      } else {
        bringWindowToFront(config.id);
      }
            window.dispatchEvent(new CustomEvent('open-window-handled'));
    }

    onMount(() => {
      const handleOpenWindowListener = handleOpenWindow as unknown as EventListener;
      window.addEventListener('open-window', handleOpenWindowListener);

      return () => {
        window.removeEventListener('open-window', handleOpenWindowListener);
      };
    });

    function handleWindowClose(event: CustomEvent<{ id: string }>) {
    const { id } = event.detail;
    openWindows = openWindows.filter(win => win.id !== id);
    const last = openWindows[openWindows.length - 1];
    if (last?.ref && typeof last.ref.focus === 'function') {
        last.ref.focus();
        updateDocumentTitle(last.id);
    } else {
        document.title = "Charlie Dean Portfolio - Charlie Dean";
    }
  }


  </script>
  
  {#each openWindows as win (win.id)}
    <Window
      {...win}
      on:focus={(event) => handleWindowFocus(event.detail.id)}
      on:close={handleWindowClose}
      bind:this={win.ref}
      minHeight={150}
      minWidth={300}
    >
      <win.component />
    </Window>
  {/each}