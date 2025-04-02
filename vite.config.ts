import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';

// Custom plugin to preprocess gallery data at build time
function galleryPlugin() {
	return {
		name: 'vite-plugin-gallery-data',
		buildStart() {
			try {
				console.log('Processing gallery data for build...');
				
				// Read gallery.json from static directory
				const staticPath = join(process.cwd(), 'static', 'gallery.json');
				if (!existsSync(staticPath)) {
					console.warn('gallery.json not found in static directory');
					return;
				}
				
				const galleryData = readFileSync(staticPath, 'utf-8');
				
				// Create the server directory if it doesn't exist
				const outputDir = join(process.cwd(), 'src', 'lib', 'server');
				if (!existsSync(outputDir)) {
					mkdirSync(outputDir, { recursive: true });
				}
				
				// Create a TypeScript file with the gallery data embedded
				const outputPath = join(outputDir, 'galleryDataBuild.ts');
				const fileContent = `
// This file is auto-generated - do not edit
export const galleryData = ${galleryData};
`;
				writeFileSync(outputPath, fileContent);
				console.log('Gallery data processed successfully');
			} catch (error) {
				console.error('Error processing gallery data:', error);
			}
		}
	};
}

export default defineConfig({
	plugins: [
		sveltekit(),
		enhancedImages(),
		galleryPlugin()
	],
	server: {
		host: true, // OR you can set this to '0.0.0.0'
		allowedHosts: ['charlies-macbook-pro.local']
	}
});
