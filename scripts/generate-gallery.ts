import { readdir, writeFile, stat } from 'fs/promises';
import { join } from 'path';

interface ImageMetadata {
    path: string;
    alt: string;
    filename: string;
    folder?: string;
    parentFolder?: string;
}

async function isDirectory(path: string): Promise<boolean> {
    try {
        const stats = await stat(path);
        return stats.isDirectory();
    } catch (error) {
        return false;
    }
}

async function scanDirectory(dirPath: string, basePath: string): Promise<ImageMetadata[]> {
    const files = await readdir(dirPath);
    const images: ImageMetadata[] = [];

    for (const file of files) {
        const fullPath = join(dirPath, file);
        const relativePath = fullPath.replace(basePath, '').replace(/\\/g, '/');
        
        if (await isDirectory(fullPath)) {
            // Recursively scan subdirectories
            const subImages = await scanDirectory(fullPath, basePath);
            images.push(...subImages);
        } else if (/\.(avif|gif|heif|jpeg|jpg|png|tiff|webp|svg)$/i.test(file)) {
            // Extract folder paths
            const pathParts = relativePath.split('/').slice(0, -1);
            const folder = pathParts.join('/');
            const parentFolder = pathParts[0]; // Get just the immediate parent folder
            
            images.push({
                path: `/img${relativePath}`,
                alt: file.split('.')[0],
                filename: file,
                ...(folder && { folder }),
                ...(parentFolder && { parentFolder })
            });
        }
    }

    return images;
}

async function generateGalleryJson() {
    try {
        const imageDir = join(process.cwd(), 'static', 'img');
        console.log('Reading images from:', imageDir);
        
        const images = await scanDirectory(imageDir, imageDir);
        console.log(`Found ${images.length} images in total`);
        
        const outputPath = join(process.cwd(), 'static', 'gallery.json');
        await writeFile(
            outputPath,
            JSON.stringify({ images }, null, 2)
        );
        
        console.log(`Generated gallery.json with ${images.length} images`);
    } catch (error) {
        console.error('Error generating gallery.json:', error);
        process.exit(1);
    }
}

generateGalleryJson(); 