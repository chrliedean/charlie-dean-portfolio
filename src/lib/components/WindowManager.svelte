<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import Window from './Window.svelte';
    import { windowConfig } from '../config/windows';
  
    interface WindowEntry {
      id: string;
      title: string;
      component: any;
      route: string;
      ref?: Window | null;
    }
  
    let openWindows: WindowEntry[] = [];

    const path = $page.url.pathname;
    if (path === '/') {
        openWindows = [
            {
                id: 'home',
                title: '🏠    Home',
                component: windowConfig['/'].component,
                route: '/'
            }
        ];
    }

    function handleWindowFocus(id: string) {
      if (id === 'home') goto('/');
      else goto(`/${id}`);
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
    }

    onMount(() => {
      const handleOpenWindowListener = handleOpenWindow as unknown as EventListener;
      window.addEventListener('open-window', handleOpenWindowListener);

      return () => {
        window.removeEventListener('open-window', handleOpenWindowListener);
      };
    });
  </script>
  
  {#each openWindows as win (win.id)}
    <Window
      title={win.title}
      route={win.route}
      on:focus={() => handleWindowFocus(win.id)}
      bind:this={win.ref}
    >
      <svelte:component this={win.component} />
    </Window>
  {/each}