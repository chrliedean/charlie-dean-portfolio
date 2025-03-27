import { error } from '@sveltejs/kit';

export async function load({ params }) {
  try {
    const post = await import(`/src/portfolio-files/${params.id}.md`);
    
    console.log(`Loading post ${params.id}`, {
      hasDefault: !!post.default,
      hasMetadata: !!post.metadata,
      metadata: post.metadata
    });
    
    return {
      content: post.default,
      meta: {
        ...post.metadata,
        id: params.id
      }
    };
  } catch (e) {
    console.error(`Error loading post ${params.id}:`, e);
    console.error("Full error:", JSON.stringify(e, null, 2));
    throw error(404, `Could not find ${params.id}`);
  }
}