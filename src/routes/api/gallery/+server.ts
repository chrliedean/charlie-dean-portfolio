import { readdir } from 'fs/promises';
import { join } from 'path';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface ImageMetadata {
    path: string;
    alt: string;
    filename: string;
}

interface GalleryResponse {
    images: ImageMetadata[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

export const GET: RequestHandler = async ({ url }) => {
    const folderPath = url.searchParams.get('folder') || '/images';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '12');

    try {
        // Normalize the path to be relative to static directory
        const normalizedPath = folderPath.startsWith('/') ? folderPath.slice(1) : folderPath;
        const fullPath = join(process.cwd(), 'static', normalizedPath);

        // Read directory contents
        const files: string[] = await readdir(fullPath);
        
        // Filter for image files
        const imageFiles = files.filter((file: string) => 
            /\.(avif|gif|heif|jpeg|jpg|png|tiff|webp|svg)$/i.test(file)
        );

        // Sort files (you can modify this sorting logic)
        imageFiles.sort();

        // Calculate pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedFiles = imageFiles.slice(startIndex, endIndex);

        // Create response with image metadata
        const images: ImageMetadata[] = paginatedFiles.map((file: string) => ({
            path: `/${normalizedPath}/${file}`,
            alt: file.split('.')[0],
            filename: file
        }));

        const response: GalleryResponse = {
            images,
            total: imageFiles.length,
            page,
            pageSize,
            hasMore: endIndex < imageFiles.length
        };

        return json(response);
    } catch (error) {
        console.error('Error reading gallery:', error);
        return json({ error: 'Failed to read gallery' }, { status: 500 });
    }
}; 