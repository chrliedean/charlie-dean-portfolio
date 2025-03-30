import type { SvelteComponent } from 'svelte';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowMeta {
  id: string;
  title: string;
  route: string;
  icon?: string;
}

export interface WindowEntry extends WindowMeta {
  component: typeof SvelteComponent;
  defaultSize?: WindowSize;
  currentSize?: WindowSize;
  currentPosition?: WindowPosition;
  minSize?: WindowSize;
  maxSize?: WindowSize;
  resizable?: boolean;
  minimized?: boolean;
  data?: unknown;
  ref?: SvelteComponent | null;
  xyorigin?: WindowPosition;
}

export type WindowUpdateEvent = CustomEvent<{
  id: string;
  currentSize: WindowSize;
  currentPosition: WindowPosition;
}>;
