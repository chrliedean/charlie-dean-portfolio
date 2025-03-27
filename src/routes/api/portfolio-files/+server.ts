// File: /api/portfoilio-files/+server.ts
import { json } from '@sveltejs/kit'
import type { WindowEntry } from '$lib/types/WindowEntry'

async function getPosts() {
	let posts: WindowEntry[] = []

	const paths = import.meta.glob('/src/portfolio-files/*.md', { eager: true })

	for (const path in paths) {
		const file = paths[path]
		const id = path.split('/').at(-1)?.replace('.md', '') ?? ''

		if (file && typeof file === 'object' && 'metadata' in file && id) {
			const metadata = file.metadata as Omit<WindowEntry, ''>
			const post = { ...metadata, id } satisfies WindowEntry
			post.published && posts.push(post)
		}
	}

	posts = posts.sort((first, second) =>
    new Date(second.date ?? '1970-01-01').getTime() - new Date(first.date ?? '1970-01-01').getTime()
	)

	return posts
}

export async function GET() {
	const posts = await getPosts()
	return json(posts)
}