import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: true, // OR you can set this to '0.0.0.0'
		allowedHosts: ['charlies-macbook-pro.local']
	  }
});
