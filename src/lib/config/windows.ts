interface WindowMeta {
  id: string;
  title: string;
  route: string;
  icon: string;
}

export default interface WindowEntry extends WindowMeta {
  route: string;
  component: any;
  data?: any;
}

const modules = import.meta.glob('/src/routes/**/+page.svelte', { eager: true }) as Record<string, any>;
const config: Record<string, WindowEntry> = {};

for (const path in modules) {
  const mod = modules[path];
  if (mod.windowMeta) {
    // Convert file path to route (e.g. "/src/routes/portfolio/+page.svelte" → "/portfolio")
    const route = path.replace('/src/routes', '').replace('/+page.svelte', '') || '/';
    config[route] = { ...mod.windowMeta, route, component: mod.default };
  }
}

export const windowConfig = config;