import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { enhancedImages } from '@sveltejs/enhanced-img';


export default defineConfig({
	plugins: [
		sveltekit(),
		enhancedImages()
	],
	server: {
		host: true, // OR you can set this to '0.0.0.0'
		allowedHosts: ['charlies-macbook-pro.local']
	  }
});
