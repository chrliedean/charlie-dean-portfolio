import { error } from '@sveltejs/kit';

export async function load({ params }) {
  try {
    // Import the markdown file matching the ID
    const post = await import(`../../../portfolio-files/${params.id}.md`);
    
    return {
      content: post.default,
      meta: {
        ...post.metadata,
        id: params.id
      }
    };
  } catch (e) {
    console.error(`Error loading post ${params.id}:`, e);
    throw error(404, `Could not find portfolio item: ${params.id}`);
  }
}