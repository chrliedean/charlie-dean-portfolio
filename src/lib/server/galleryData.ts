import { readFileSync } from 'fs';
import { join } from 'path';

interface ImageMetadata {
  path: string;
  alt: string;
  filename: string;
  folder?: string;
  parentFolder?: string;
}

interface GalleryData {
  images: ImageMetadata[];
}

// Import pre-built gallery data if it exists (build time)
let prebuiltGalleryData: GalleryData | null = null;

try {
  // This will only be available in production builds
  // When this file is imported, it will attempt to load the built data
  const { galleryData } = await import('./galleryDataBuild.js');
  prebuiltGalleryData = galleryData;
  console.log('Using pre-built gallery data');
} catch (error) {
  // In development, this file won't exist, so we'll fall back to reading from disk
  console.log('No pre-built gallery data available, will load from disk');
}

// Function to get gallery data
export function getGalleryData(): GalleryData {
  // If we have pre-built data, use it
  if (prebuiltGalleryData) {
    return prebuiltGalleryData;
  }
  
  try {
    // Otherwise read from the static directory (development mode)
    const staticPath = join(process.cwd(), 'static', 'gallery.json');
    const rawData = readFileSync(staticPath, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading gallery data:', error);
    return { images: [] };
  }
} 