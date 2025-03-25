<script context="module" lang="ts">
  import { writable } from 'svelte/store';
  export type SoundCommand = 'stopall' |'drag-start' | 'drag-end' | 'wcol' | 'wexp' | 'mnuo' | 'mnuc' | 'mnui';
  export const soundCommand = writable<SoundCommand | null>(null);
</script>

<script lang="ts">
  import { onMount } from 'svelte';

  let audioCtx: AudioContext;
  const buffers: Record<string, AudioBuffer> = {};
  const sources: Record<string, AudioBufferSourceNode | null> = { drag: null };
  const gains: Record<string, GainNode> = {};
  let suppressMouseUp = false;

  async function load(name: string, url: string, volume = 0.5) {
    const resp = await fetch(url);
    const data = await resp.arrayBuffer();
    buffers[name] = await audioCtx.decodeAudioData(data);
    gains[name] = audioCtx.createGain();
    gains[name].gain.value = volume;
    gains[name].connect(audioCtx.destination);
  }

  function play(name: string, loop = false) {
    if (!buffers[name]) return;
    const src = audioCtx.createBufferSource();
    src.buffer = buffers[name];
    src.loop = loop;
    src.connect(gains[name]);
    src.start();
    if (loop) sources[name] = src;
  }

  function stop(name: string) {
    const src = sources[name];
    if (!src) return;
    src.stop();
    src.disconnect();
    sources[name] = null;
  }

  onMount(() => {
    audioCtx = new AudioContext({ latencyHint: 'interactive' });

    // Ensure the AudioContext is resumed on user interaction
    const resumeAudioContext = () => {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    };

    window.addEventListener('mousedown', resumeAudioContext, { once: true });
    window.addEventListener('touchstart', resumeAudioContext, { once: true });

    (async () => {
      await Promise.all([
        load('down', '/media/mousedown.mp3', 0.3),
        load('up', '/media/mouseup.mp3', 0.3),
        load('drag', '/media/wmov.mp3', 0.25),
        load('end', '/media/delay.mp3', 0.4),
        load('wcol', '/media/wcol.mp3', 0.4), 
        load('wexp', '/media/wexp.mp3', 0.4),
        load('mnuo', '/media/mnuo.mp3', 0.4),
        load('mnuc', '/media/mnuc.mp3', 0.4),
        load('mnui', '/media/mnui.mp3', 0.4),
      ]);
    })();

    const unsubscribe = soundCommand.subscribe(cmd => {
      if (!cmd) return;
      suppressMouseUp = true;
      if (cmd === 'drag-start') play('drag', true);
      if (cmd === 'drag-end') {
        stop('drag');
        play('end');
      }
      if (cmd === 'wcol') play('wcol');
      if (cmd === 'wexp') play('wexp');
      if (cmd === 'mnuo') play('mnuo');
      if (cmd === 'mnuc') play('mnuc');
      if (cmd === 'mnui') play('mnui');
      if (cmd === 'stopall') {
        for (const src of Object.values(sources)) {
          if (src) src.stop();
        }
      }
      soundCommand.set(null);
    });

    return unsubscribe;
  });

  function handleMouseDown() { play('down');  }
  function handleMouseUp() {
    if (!suppressMouseUp) {
      play('up');
    }
    suppressMouseUp = false;
  }
</script>

<svelte:window on:mousedown={handleMouseDown} on:mouseup={handleMouseUp} />