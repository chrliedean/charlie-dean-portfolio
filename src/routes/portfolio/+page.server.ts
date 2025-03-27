// File: /routes/portfolio/+page.server.ts
import type { WindowEntry } from '$lib/types/WindowEntry';

/**
 * Server-side load function for portfolio page
 */
export async function load() {
  const posts = await getPosts();
  return { posts };
}

/**
 * Get portfolio posts from markdown files
 */
async function getPosts() {
  let posts: WindowEntry[] = [];
  const paths = import.meta.glob('/src/portfolio-files/*.md', { eager: true });
  
  for (const path in paths) {
    const file = paths[path];
    const id = path.split('/').at(-1)?.replace('.md', '') ?? '';
    
    if (file && typeof file === 'object' && 'metadata' in file && id) {
      // Ensure metadata includes the required properties
      const metadata = file.metadata as Record<string, unknown>;
      
      // Create a post object with consistent route pattern
      const post = { 
        ...metadata, 
        id,
        // Ensure route has correct format
        route: `/portfolio/${id}`
      } as WindowEntry;
      
      // Only include published posts
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
  
  return posts;
}