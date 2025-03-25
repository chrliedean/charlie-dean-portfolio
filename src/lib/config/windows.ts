import AboutPage from '../../routes/about/+page.svelte';
import HomePage from '../../routes/+page.svelte';
import ContactPage from '../../routes/contact/+page.svelte';
import EnterPassword from '../../routes/enter-password/+page.svelte';
import PortfolioPage from '../../routes/portfolio/+page.svelte';
import ShaveYourTonguePage from '../../routes/portfolio/shave-your-tongue/+page.svelte';

import type { WindowEntry } from '../types/WindowEntry.ts';

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
  },
  '/enter-password': {
    id: 'enter-password',
    title: '🔒 Enter Password',
    component: EnterPassword,
    route: '/enter-password',
    resizable: false,
    style: 'alert'
  },
  '/portfolio': {
    id: 'portfolio',
    title: 'Portfolio',
    component: PortfolioPage,
    route: '/portfolio',
    icon: 'folder',
  },
  '/portfolio/shave-your-tongue': {
    id: 'portfolio/shave-your-tongue',
    title: 'Shave Your Tongue',
    component: ShaveYourTonguePage,
    route: '/portfolio/shave-your-tongue',
  }
};