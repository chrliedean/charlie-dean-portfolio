import { readdir, writeFile, stat, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

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

async function ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    try {
        await stat(dir);
    } catch (error) {
        // Directory doesn't exist, create it
        await mkdir(dir, { recursive: true });
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
            // Extract folder paths - make sure it always starts with /
            const normPath = relativePath.startsWith('/') ? relativePath : '/' + relativePath;
            const pathParts = normPath.split('/').filter(Boolean);
            
            // Ensure we only generate path parts if there are parts available
            let folder: string | undefined = undefined;
            let parentFolder: string | undefined = undefined;
            
            // For folder, join all parts except the filename
            if (pathParts.length > 1) {
                // If we have multiple path parts, it's in a folder
                folder = '/' + pathParts.slice(0, -1).join('/');
                // For parentFolder, just take the first part (the top-level directory)
                parentFolder = pathParts[0];
                
                console.log(`Processing ${file}: folder=${folder}, parentFolder=${parentFolder}`);
            } else {
                // For top-level files, folder is root
                folder = '/';
                // No parent folder for top-level files
                parentFolder = undefined;
                
                console.log(`Processing ${file}: top-level file, folder=${folder}`);
            }
            
            const metadata: ImageMetadata = {
                path: `/img${normPath}`,
                alt: file.split('.')[0],
                filename: file
            };
            
            if (folder) metadata.folder = folder;
            if (parentFolder) metadata.parentFolder = parentFolder;
            
            images.push(metadata);
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
        
        // Log parent folders for debugging
        const parentFolders = [...new Set(images
            .map(img => img.parentFolder)
            .filter(Boolean)
        )];
        console.log('Parent folders:', parentFolders);
        
        const galleryData = JSON.stringify({ images }, null, 2);
        
        // Write to static for public access
        const staticOutputPath = join(process.cwd(), 'static', 'gallery.json');
        await writeFile(staticOutputPath, galleryData);
        
        // Write to lib for importing
        const libOutputPath = join(process.cwd(), 'src', 'lib', 'gallery.json');
        await ensureDirectoryExists(libOutputPath);
        await writeFile(libOutputPath, galleryData);
        
        console.log(`Generated gallery.json with ${images.length} images in both static/ and src/lib/`);
    } catch (error) {
        console.error('Error generating gallery.json:', error);
        process.exit(1);
    }
}

generateGalleryJson(); 