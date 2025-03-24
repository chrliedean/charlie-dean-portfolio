import AboutPage from '../../routes/about/+page.svelte';
import HomePage from '../../routes/+page.svelte';
import ContactPage from '../../routes/contact/+page.svelte';

import type { WindowEntry }  from '../types/WindowEntry.ts';

export const windowConfig: Record<string, WindowEntry> = {
  '/about': {
    id: 'about',
    title: '📔 About',
    component: AboutPage,
    route: '/about',
  },
  '/': {
    id: 'home',
    title: '🏠 Home',
    component: HomePage,
    route: '/',
    defaultSize: {width: 800, height: 600}
  },
  '/contact': {
    id: 'contact',
    title: '📧 Contact',
    component: ContactPage,
    route: '/contact',
    resizable: false,
    defaultSize: { width: 300, height: 400 },
  }
};