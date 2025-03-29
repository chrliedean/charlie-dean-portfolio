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
	
	interface RapportSceneElement extends HTMLElement {
		sessionRequest: (options: {
		  sessionConnected: () => void;
		  sessionDisconnected: () => void;
		}) => void;
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
	  }
}

declare namespace svelte.JSX {
	interface HTMLAttributes<T> {
		onwindowcancel?: (event: CustomEvent<any>) => void;
	}

}

export { };
