// src/app.d.ts

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}

	}

	// Define the structure for the sessionRequest options object
	interface RapportSessionRequestOptions {
		projectId?: string; // Added
		projectToken?: string; // Added
		aiUserId?: string; // Added
		lobbyZoneId?: string; // Added
		openingText?: string; // Added
		enableCookies?: boolean; // Added from example
		micRequired?: boolean; // Added from previous example usage
		sessionConnected: () => void;
		sessionDisconnected: (ev: CustomEvent) => void;
		info: (ev: CustomEvent) => void;
		warning: (ev: CustomEvent) => void;
		backgroundColor?: string; // Added from previous example usage
	}

	// Update the RapportSceneElement interface
	interface RapportSceneElement extends HTMLElement {
		// Update sessionRequest to use the detailed options interface
		sessionRequest: (options: RapportSessionRequestOptions) => Promise<void>; // Made it async based on example

		// Add sessionDisconnect based on example
		sessionDisconnect: () => Promise<void>; 

		// Keep existing definitions
		animations: {
			get: () => string[];
			play: (animation: string, loop: boolean) => void;
		};
		modules: {
			commands: {
				data: { commands: string[] };
				trigger: (command: string) => void;
			};
			tts: {
				data: { tts: string[] };
				sendText: (text: string) => void;
			}
		};
		// Add other properties/methods if known or discovered
		setAttribute(name: string, value: string): void; // Keep this from previous usage
		getBoundingClientRect(): DOMRect; // Standard HTMLElement method
		addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
		addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void; // Generic fallback
		removeEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
		removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void; // Generic fallback
		style: CSSStyleDeclaration; // Standard HTMLElement property
	}

	// Keep the JSX definition if you need it elsewhere
	namespace svelte.JSX {
		interface HTMLAttributes<T> {
			onwindowcancel?: (event: CustomEvent<any>) => void;
		}
	}
}

export { }; // Ensure it's treated as a module