import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGalleryData } from '$lib/server/galleryData';

interface ImageMetadata {
    path: string;
    alt: string;
    filename: string;
    folder?: string;
    parentFolder?: string;
}

interface GalleryResponse {
    images: ImageMetadata[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
    folders: string[];
    parentFolders: string[];
}

export const GET: RequestHandler = async ({ url }) => {
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '12');
    const folder = url.searchParams.get('folder');

    try {
        // Get gallery data from our server module
        const galleryData = getGalleryData();
        
        // Log some debug info
        console.log('Gallery API called:', { page, pageSize, folder });
        console.log('Total images in gallery:', galleryData.images.length);
        
        // Filter images by folder if specified
        let filteredImages = galleryData.images;
        if (folder) {
            // Check if the folder contains a slash (full path) or not (parent folder)
            if (folder.includes('/')) {
                filteredImages = galleryData.images.filter((img: ImageMetadata) => img.folder === folder);
            } else {
                filteredImages = galleryData.images.filter((img: ImageMetadata) => img.parentFolder === folder);
            }
        }
        
        // Get unique folders and parent folders
        const folders = [...new Set(galleryData.images
            .map((img: ImageMetadata) => img.folder)
            .filter(Boolean))];
            
        const parentFolders = [...new Set(galleryData.images
            .map((img: ImageMetadata) => img.parentFolder)
            .filter(Boolean))];
        
        // Handle pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedImages = filteredImages.slice(startIndex, endIndex);

        return json({
            images: paginatedImages,
            total: filteredImages.length,
            page,
            pageSize,
            hasMore: endIndex < filteredImages.length,
            folders,
            parentFolders
        });
    } catch (error) {
        console.error('Error reading gallery:', error);
        return json({ error: 'Failed to read gallery' }, { status: 500 });
    }
}; 