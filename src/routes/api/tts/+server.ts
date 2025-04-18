import type { RequestHandler } from '@sveltejs/kit';
import { ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID } from '$env/static/private';
import { ElevenLabsClient } from 'elevenlabs';

export const POST: RequestHandler = async ({ request }) => {
  // Parse the incoming JSON payload for `text`
  const { text } = await request.json();

  // Initialize ElevenLabs client
  const client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });

  // Call the streaming TTS with timestamps endpoint
  const messageStream = await client.textToSpeech.streamWithTimestamps(ELEVENLABS_VOICE_ID, {
    output_format: 'pcm_16000',
    model_id: 'eleven_flash_v2_5',
    text
  });

  // Proxy the SDK stream into a web ReadableStream for SvelteKit response
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        for await (const message of messageStream) {
          // Each `message` is a JSON-able object; send as newline-delimited JSON
          const chunk = JSON.stringify(message) + '\n';
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Allow streaming
      'Transfer-Encoding': 'chunked'
    }
  });
};
