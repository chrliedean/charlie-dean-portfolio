// File: /routes/api/portfolio-files/+server.ts
import { json } from '@sveltejs/kit';
import type { WindowEntry } from '$lib/types/WindowEntry';

export async function GET() {
  const posts = await getPosts();
  console.log('API endpoint returning posts:', posts);
  return json(posts);
}

async function getPosts() {
  let posts: WindowEntry[] = [];
  
  try {
    // This approach uses a slightly different import.meta.glob pattern
    // which might help if there's a path resolution issue
    const paths = import.meta.glob('/src/portfolio-files/*.md', { eager: true });
    console.log('API: Found paths:', Object.keys(paths));
    
    for (const path in paths) {
      const file = paths[path];
      // Extract ID from path - pattern might need adjustment based on actual paths
      const id = path.split('/').pop()?.replace('.md', '') ?? '';
      
      if (file && typeof file === 'object' && 'metadata' in file && id) {
        const metadata = file.metadata as Record<string, unknown>;
        
        const post = { 
          ...metadata, 
          id,
          route: `/portfolio/${id}`
        } as WindowEntry;
        
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
    
  } catch (error) {
    console.error('API: Error getting posts:', error);
  }
  
  // If we still have no posts, add a fallback post for testing
  if (posts.length === 0) {
    posts.push({
      id: 'fallback-post',
      title: 'Fallback Post',
      date: '1970-01-01',
      medium: 'Testing',
      route: '/portfolio/fallback-post',
      published: true,
      icon: 'document'
    } as WindowEntry);
  }
  
  return posts;
}