import AboutPage from '../../routes/about/+page.svelte';
import HomePage from '../../routes/+page.svelte';

export interface WindowEntry {
  id: string;
  title: string;
  component: any;
  route: string;
  ref?: any; // later you can type this more specifically
}

export const windowConfig: Record<string, WindowEntry> = {
  '/about': {
    id: 'about',
    title: 'About',
    component: AboutPage,
    route: '/about',
  },
  '/': {
    id: 'home',
    title: 'Home',
    component: HomePage,
    route: '/home',
  },
};