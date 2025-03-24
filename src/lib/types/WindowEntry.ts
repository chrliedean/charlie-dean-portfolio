export interface WindowEntry {
    id: string;
    title: string;
    route: string;
    defaultSize?: { width: number; height: number };
    resizable?: boolean;
    ref?: any;
    component: any;
    currentSize?: { width: number; height: number };
    currentPosition?: { x: number; y: number };
  }