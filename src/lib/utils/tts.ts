// tts.ts
export async function* generateSpeech(text: string) {
    console.log("generating speech for", text);
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error('TTS failed');
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = '';
  
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop()!; // Keep potentially incomplete line
  
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
  
          // --- Audio Part ---
          const rawBytes = Uint8Array.from(atob(msg.audio_base64), c => c.charCodeAt(0));
          const pcmBuffer = rawBytes.buffer; // ArrayBuffer with 16-bit LE PCM
  
          // --- Word Timing Derivation ---
          const wordTimings: { word: string; start_ms: number; duration_ms: number }[] = [];
          // Use the alignment data provided by the user
          const alignment = msg.normalized_alignment;
          const nonNormalizedAlignment = msg.alignment;
  
          if (alignment && alignment.characters && alignment.character_start_times_seconds && alignment.character_end_times_seconds) {
            let currentWord = '';
            let wordStartIndex = -1;
  
            for (let i = 0; i < alignment.characters.length; i++) {
              const char = alignment.characters[i];
              const isSpaceOrPunc = (char.trim() === '' || /^[.,!?;:]$/.test(char)); // Treat space and basic punctuation as delimiters
  
              if (!isSpaceOrPunc) {
                // Part of a word
                if (currentWord === '') {
                  wordStartIndex = i; // Mark the start of a new word
                }
                currentWord += char;
              }
  
              // If we hit a delimiter OR it's the end of the characters array, AND we have a word buffered
              if ((isSpaceOrPunc || i === alignment.characters.length - 1) && currentWord !== '') {
                const wordEndTimeIndex = i - (isSpaceOrPunc ? 1 : 0); // Index of the last char of the word
  
                if (wordStartIndex !== -1 && wordEndTimeIndex >= wordStartIndex) {
                    const startTimeSec = alignment.character_start_times_seconds[wordStartIndex];
                    const endTimeSec = alignment.character_end_times_seconds[wordEndTimeIndex];
                    const durationSec = endTimeSec - startTimeSec;
  
                     // Add the derived word timing (converting to ms)
                    if (durationSec >= 0) { // Basic sanity check
                       wordTimings.push({
                          word: currentWord,
                          start_ms: Math.round(startTimeSec * 1000),
                          duration_ms: Math.round(durationSec * 1000)
                       });
                    } else {
                        console.warn("Calculated negative duration for word:", currentWord, startTimeSec, endTimeSec);
                    }
                }
                // Reset for next word
                currentWord = '';
                wordStartIndex = -1;
              }
            }
          }
  
          // --- Yield PCM and derived Word Timings ---
          if (pcmBuffer && pcmBuffer.byteLength > 0) {
            yield {
              pcmBuffer: pcmBuffer,
              wordTimings: wordTimings
            };
          } else if (wordTimings.length > 0) {
             // Yield timings even if there's no audio in this specific message
             yield {
              pcmBuffer: null,
              wordTimings: wordTimings
            };
          }
        } catch (e) {
          console.error("Failed to parse TTS stream line:", line, e);
        }
      }
    }
  }