// File: /portfolio/+page.server.ts
import type { WindowEntry } from '$lib/types/window';

async function getPosts() {
  let posts: WindowEntry[] = [];
  const paths = import.meta.glob('/src/portfolio-files/*.md', { eager: true });
  
  for (const path in paths) {
    const file = paths[path];
    const id = path.split('/').at(-1)?.replace('.md', '') ?? '';
    
    if (file && typeof file === 'object' && 'metadata' in file && id) {
      // Assume file.metadata has the needed properties.
      const metadata = file.metadata as Record<string, unknown>;
      const post = { ...metadata, id } as WindowEntry;
      
      // Only push if the post is marked as published.
      if (post.published) {
        // Ensure route is properly set if not already
        if (!post.route && id) {
          post.route = `/portfolio/${id}`;
        }
        posts.push(post);
      }
    }
  }
  
  // Sort posts by date, newest first
  posts = posts.sort((a, b) => 
    new Date(b.date ?? '1970-01-01').getTime() - new Date(a.date ?? '1970-01-01').getTime()
  );
  
  console.log(`Server loaded ${posts.length} portfolio posts`);
  return posts;
}

export async function load() {
  const posts = await getPosts();
  return { posts };
}