// src/lib/utils/viseme-helper.ts (Updated)
import { LipsyncEn } from '$lib/utils/lipsync-en.mjs'; // Adjust path

// Instantiate the English lip-sync processor
const lipsyncProcessor = new LipsyncEn();

// Input/output interfaces
export interface WordTiming {
  word: string;
  start_ms: number;
  duration_ms: number;
}

export interface VisemeEvent {
  viseme: string;
  start: number;
  end: number;
}

// Interface for the object returned by wordsToVisemes
interface LipsyncResult {
  words: string;
  visemes: string[];
  times: number[];
  durations: number[];
  i?: number;
}

/**
 * Generates an absolute viseme timeline from word timings.
 */
export function generateVisemeTimeline(wordTimings: WordTiming[]): VisemeEvent[] {
  const visemeTimeline: VisemeEvent[] = [];
  if (!wordTimings || wordTimings.length === 0) {
    return visemeTimeline;
  }

  wordTimings.forEach(wordInfo => {
    if (!wordInfo.word || wordInfo.duration_ms <= 0) return;

    const processedWord = lipsyncProcessor.preProcessText(wordInfo.word);
    if (!processedWord) return;

    // Explicitly type the result here!
    const relativeVisemes: LipsyncResult = lipsyncProcessor.wordsToVisemes(processedWord) as LipsyncResult; //

    // Now TypeScript knows about these properties, and the errors should disappear
    if (!relativeVisemes || !relativeVisemes.visemes || relativeVisemes.visemes.length === 0) {
      return;
    }

    const lastVisemeIndex = relativeVisemes.visemes.length - 1;
    const totalRelativeDuration = relativeVisemes.times[lastVisemeIndex] + relativeVisemes.durations[lastVisemeIndex];

    if (totalRelativeDuration <= 0) return;

    for (let i = 0; i < relativeVisemes.visemes.length; i++) {
      const viseme = relativeVisemes.visemes[i];
      const relativeStartTime = relativeVisemes.times[i];
      const relativeDuration = relativeVisemes.durations[i];

      const absoluteStart = wordInfo.start_ms + (relativeStartTime / totalRelativeDuration) * wordInfo.duration_ms;
      const absoluteDuration = (relativeDuration / totalRelativeDuration) * wordInfo.duration_ms;
      const absoluteEnd = absoluteStart + absoluteDuration;

      if (visemeTimeline.length > 0) {
          const prevViseme = visemeTimeline[visemeTimeline.length - 1];
          if (absoluteStart < prevViseme.end) {
             prevViseme.end = Math.round(absoluteStart - 1);
          }
      }

      visemeTimeline.push({
        viseme: viseme,
        start: Math.round(absoluteStart),
        end: Math.round(absoluteEnd),
      });
    }
  });
  return visemeTimeline;
}