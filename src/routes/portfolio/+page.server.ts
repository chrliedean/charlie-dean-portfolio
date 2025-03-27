// File: /routes/portfolio/+page.server.ts
import type { WindowEntry } from '$lib/types/WindowEntry';

/**
 * Server-side load function for portfolio page
 */
export async function load() {
  const posts = await getPosts();
  console.log('Server-side load function posts:', posts);
  return { posts };
}

/**
 * Get portfolio posts from markdown files
 */
async function getPosts() {
  let posts: WindowEntry[] = [];
  
  try {
    console.log('Starting to load markdown files');
    // Try different glob patterns to find the markdown files
    let paths: Record<string, any> = {};
    
    try {
      // Pattern 1: Absolute path
      paths = import.meta.glob('/src/portfolio-files/*.md', { eager: true });
      console.log('Pattern 1 results:', Object.keys(paths));
    } catch (e) {
      console.error('Pattern 1 failed:', e);
    }
    
    if (Object.keys(paths).length === 0) {
      try {
        // Pattern 2: Relative path
        paths = import.meta.glob('../../../portfolio-files/*.md', { eager: true });
        console.log('Pattern 2 results:', Object.keys(paths));
      } catch (e) {
        console.error('Pattern 2 failed:', e);
      }
    }
    
    if (Object.keys(paths).length === 0) {
      try {
        // Pattern 3: Another approach
        paths = import.meta.glob('../../portfolio-files/*.md', { eager: true });
        console.log('Pattern 3 results:', Object.keys(paths));
      } catch (e) {
        console.error('Pattern 3 failed:', e);
      }
    }
    
    if (Object.keys(paths).length === 0) {
      console.error('No patterns matched! Falling back to empty paths object');
    }
    console.log('Found paths:', Object.keys(paths));
    
    for (const path in paths) {
      console.log('Processing path:', path);
      const file = paths[path];
      const id = path.split('/').at(-1)?.replace('.md', '') ?? '';
      
      console.log('File structure:', JSON.stringify({
        hasFile: !!file,
        isObject: typeof file === 'object',
        hasMetadata: file && typeof file === 'object' && 'metadata' in file,
        id
      }));
      
      if (file && typeof file === 'object' && 'metadata' in file && id) {
        // Ensure metadata includes the required properties
        const metadata = file.metadata as Record<string, unknown>;
        console.log('Metadata for', id, ':', metadata);
        
        // Create a post object with consistent route pattern
        const post = { 
          ...metadata, 
          id,
          // Ensure route has correct format
          route: `/portfolio/${id}`
        } as WindowEntry;
        
        // Check if published before adding
        console.log('Is published?', post.published);
        if (post.published) {
          posts.push(post);
        }
      }
    }
    
    // Sort posts by date (newest first)
    posts = posts.sort((a, b) => 
      new Date(b.date ?? '1970-01-01').getTime() - 
      new Date(a.date ?? '1970-01-01').getTime()
    );
    
    console.log('Final posts array:', posts);
    
  } catch (error) {
    console.error('Error getting posts:', error);
  }
  
  return posts;
}