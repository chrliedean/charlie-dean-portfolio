// Live speech-driven lip-sync algorithm ported from Llorach et al. (2016)

const fBins = [0, 500, 700, 3000, 6000];
// Energy threshold constant
const threshold = 0.5;
// Sampling frequency for FFT (Hz)
const samplingFrequency = 44100;

// Utility to clamp values between 0 and 1
function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Analyze frequency-domain data to compute lip-sync blendshape weights.
 * @param spectrum - Float32Array of frequency bin magnitudes in dB (e.g., from AnalyserNode.getFloatFrequencyData)
 * @returns Object with kiss, lipsClosed, and jaw values in [0,1].
 */
export function analyzeVisemesFromFrequencyData(
  spectrum: Float32Array
): { kiss: number; lipsClosed: number; jaw: number } {
  const binCount = spectrum.length;
  const energy: number[] = [];

  // Compute average energy in each defined frequency band
  for (let i = 0; i < fBins.length - 1; i++) {
    const startFreq = fBins[i];
    const endFreq = fBins[i + 1];
    const startIndex = Math.round((startFreq / (samplingFrequency / 2)) * binCount);
    const endIndex = Math.round((endFreq / (samplingFrequency / 2)) * binCount);

    let sum = 0;
    for (let j = startIndex; j < endIndex; j++) {
      // Map dB spectrum value to energy with threshold
      let value = threshold + (spectrum[j] + 20) / 140;
      if (value < 0) value = 0;
      sum += value;
    }
    energy[i] = sum / (endIndex - startIndex);
  }

  // Kiss blendshape: influenced by mid-frequency band
  let kiss = (0.5 - energy[2]) * 2;
  if (energy[1] < 0.2) {
    kiss *= energy[1] * 5;
  }
  kiss = clamp(kiss);

  // Lips closed blendshape: high-frequency energy
  let lipsClosed = energy[3] * 3;
  lipsClosed = clamp(lipsClosed);

  // Jaw blendshape: difference between second and fourth band
  let jaw = energy[1] * 0.8 - energy[3] * 0.8;
  jaw = clamp(jaw);

  return { kiss, lipsClosed, jaw };
}