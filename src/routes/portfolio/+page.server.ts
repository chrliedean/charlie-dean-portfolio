// File: /portfolio/+page.server.ts
import { json } from '@sveltejs/kit';
import type { WindowEntry } from '$lib/types/WindowEntry';

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
      post.published && posts.push(post);
    }
  }
  posts = posts.sort((a, b) => new Date(b.date ?? '1970-01-01').getTime() - new Date(a.date ?? '1970-01-01').getTime());
  return posts;
}

export async function load({ fetch }) {
  const posts = await getPosts();
  return { posts };
}