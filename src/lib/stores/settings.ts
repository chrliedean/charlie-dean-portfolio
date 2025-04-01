import { writable, derived } from 'svelte/store';

// Define settings interface
interface Settings {
  soundEnabled: boolean;
}

// Initialize settings with default values
const defaultSettings: Settings = {
  soundEnabled: true
};

// Create a function to sync with localStorage
function createSettingsStore() {
  // Check for browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // Try to get settings from localStorage, or use defaults
  let initialSettings: Settings;
  
  if (isBrowser) {
    const storedSettings = localStorage.getItem('userSettings');
    initialSettings = storedSettings ? JSON.parse(storedSettings) : defaultSettings;
  } else {
    initialSettings = defaultSettings;
  }
  
  // Create the writable store
  const { subscribe, set, update } = writable<Settings>(initialSettings);
  
  return {
    subscribe,
    update: (key: keyof Settings, value: boolean) => {
      update(settings => {
        const updatedSettings = { ...settings, [key]: value };
        // Save to localStorage
        if (isBrowser) {
          localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
        }
        return updatedSettings;
      });
    },
    reset: () => {
      set(defaultSettings);
      if (isBrowser) {
        localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
      }
    }
  };
}

export const settings = createSettingsStore();

// Create derived stores for individual settings for easier access
export const soundEnabled = derived(settings, $settings => $settings.soundEnabled); 