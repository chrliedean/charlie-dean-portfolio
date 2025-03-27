// File: /routes/api/portfolio-post/[id]/+server.ts
import { json, error } from '@sveltejs/kit';

/**
 * Get metadata for a single portfolio post
 */
export async function GET({ params }) {
  try {
    const { id } = params;
    
    // Import the markdown file
    const post = await import(`/src/portfolio-files/${id}.md`);
    
    // Return just the metadata
    return json({
      ...post.metadata,
      id
    });
  } catch (e) {
    console.error(`Error loading post metadata for ${params.id}:`, e);
    throw error(404, `Post not found: ${params.id}`);
  }
}