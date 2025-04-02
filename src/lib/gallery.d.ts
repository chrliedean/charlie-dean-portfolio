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

declare module '$lib/gallery.json' {
  const data: GalleryData;
  export default data;
} 