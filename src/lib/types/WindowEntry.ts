import Icon from '$lib/components/Icon.svelte';

export type Categories = 'sveltekit | svelte'

export interface WindowEntry {
    id: string;
    title: string;
    route: string;
    defaultSize?: { width: number; height: number };
    resizable?: boolean;
    ref?: any;
    component: any;
    currentSize?: { width: number; height: number };
    maxSize?: { width: number; height: number };
    xyorigin? : { x: number; y: number };
    currentPosition?: { x: number; y: number };
    style?: string;
    icon?: string;
    minimized?: boolean;
    date?: string | null;
    medium?: string;
    categories?: Categories[];
    published?: boolean;
    data?: any;
  }