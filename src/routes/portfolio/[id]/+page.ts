// File: /portfolio/[id]/+page.ts
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  try {
    // Make sure this path is correct - use the same structure as in your API
    const post = await import(`$/portfolio-files/${params.id}.md`);
    return {
      content: post.default,
      meta: {
        ...post.metadata,
        id: params.id
      }
    };
  } catch (e) {
    console.error(`Error loading post ${params.id}:`, e);
    error(404, `Could not find ${params.id}`);
  }
}