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
}

declare namespace svelte.JSX {
	interface HTMLAttributes<T> {
	  onwindowcancel?: (event: CustomEvent<any>) => void;
	}
  }

export {};
