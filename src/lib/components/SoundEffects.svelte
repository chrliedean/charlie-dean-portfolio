<script context="module" lang="ts">
  import { writable } from "svelte/store";
  import { soundEnabled } from "$lib/stores/settings";
  export type SoundCommand =
    | "stopall"
    | "drag-start"
    | "drag-end"
    | "wcol"
    | "wexp"
    | "mnuo"
    | "mnuc"
    | "mnui"
    | "wcls"
    | "wopn"
    | "wzmi"
    | "wzmo"
    | "dscr1"
    | "dscr2"
    | "sosumi";
  export const soundCommand = writable<SoundCommand | null>(null);
</script>

<script lang="ts">
  import { onMount } from "svelte";

  let audioCtx: AudioContext;
  const buffers: Record<string, AudioBuffer> = {};
  // For looping sounds (e.g. drag sound)
  const sources: Record<string, AudioBufferSourceNode | null> = { drag: null };
  const gains: Record<string, GainNode> = {};
  let suppressMouseUp = false;
  let keyDown = false;

  // Load an audio file into a buffer and create its gain node.
  async function load(name: string, url: string, volume = 0.5) {
    const resp = await fetch(url);
    const data = await resp.arrayBuffer();
    buffers[name] = await audioCtx.decodeAudioData(data);
    gains[name] = audioCtx.createGain();
    gains[name].gain.value = volume;
    gains[name].connect(audioCtx.destination);
  }

  // Play a sound by name. If loop is true, ensure we don’t create multiple looping sources.
  function play(name: string, loop = false) {
    if (!buffers[name]) return;
    // For looping sounds, if one is already playing, don't start another.
    if (loop && sources[name]) return;
    const src = audioCtx.createBufferSource();
    src.buffer = buffers[name];
    src.loop = loop;
    src.connect(gains[name]);
    src.start(0);
    if (loop) sources[name] = src;
  }

  // Stop a looping sound by name.
  function stop(name: string) {
    const src = sources[name];
    if (!src) return;
    try {
      src.stop(0);
    } catch (e) {
      console.error("Error stopping sound", e);
    }
    src.disconnect();
    sources[name] = null;
  }

  // A dedicated helper to stop the drag sound.
  function stopDragSound() {
    stop("drag");
  }

  // Stop all currently playing sounds.
  function stopAllSounds() {
    stopDragSound();
    // (Add other sounds if needed.)
  }

  onMount(() => {
    audioCtx = new AudioContext({ latencyHint: "interactive" });

    // Ensure AudioContext is resumed on first interaction.
    const resumeAudioContext = () => {
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
    };
    window.addEventListener("mousedown", resumeAudioContext, { once: true });
    window.addEventListener("touchstart", resumeAudioContext, { once: true });

    // Load required sounds.
    (async () => {
      await Promise.all([
        load("down", "/media/mousedown.mp3", 0.3),
        load("up", "/media/mouseup.mp3", 0.3),
        load("drag", "/media/wmov.mp3", 0.25),
        load("end", "/media/delay.mp3", 0.4),
        load("wcol", "/media/wcol.mp3", 0.4),
        load("wexp", "/media/wexp.mp3", 0.4),
        load("mnuo", "/media/mnuo.mp3", 0.4),
        load("mnuc", "/media/mnuc.mp3", 0.4),
        load("mnui", "/media/mnui.mp3", 0.4),
        load("wcls", "/media/wcls.mp3", 0.4),
        load("wopn", "/media/wopn.mp3", 0.4),
        load("wzmi", "/media/wzmi.mp3", 0.4),
        load("wzmo", "/media/wzmo.mp3", 0.4),
        load("dscr1", "/media/dscr1.mp3", 0.4),
        load("dscr2", "/media/dscr2.mp3", 0.4),
        load("sosumi", "/media/sosumi.mp3", 0.4),
        load("keydown1", "/media/keydown1.mp3", 0.4),
        load("keydown2", "/media/keydown2.mp3", 0.4),
        load("keydown3", "/media/keydown3.mp3", 0.4),
        load("keyup1", "/media/keyup1.mp3", 0.4),
        load("keyup2", "/media/keyup2.mp3", 0.4),
        load("keyup3", "/media/keyup3.mp3", 0.4) 
      ]);
    })();

    // Subscribe to sound commands.
    const unsubscribe = soundCommand.subscribe((cmd) => {
      if (!cmd) return;
      if (!$soundEnabled) return;
      suppressMouseUp = true;
      switch (cmd) {
        case "drag-start":
          play("drag", true);
          break;
        case "drag-end":
          stopDragSound();
          play("end");
          break;
        case "wcol":
          play("wcol");
          break;
        case "wexp":
          play("wexp");
          break;
        case "mnuo":
          play("mnuo");
          break;
        case "mnuc":
          play("mnuc");
          break;
        case "mnui":
          play("mnui");
          break;
        case "wcls":
          play("wcls");
          break;
        case "wopn":
          play("wopn");
          break;
        case "wzmi":
          play("wzmi");
          break;
        case "wzmo":
          play("wzmo");
          break;
        case "dscr1":
          play("dscr1");
          break;
        case "dscr2":
          play("dscr2");
          break;
        case "sosumi":
          play("sosumi");
          break;
        case "stopall":
          stopAllSounds();
          break;
      }
      soundCommand.set(null);
    });

    return unsubscribe;
  });

  // Global handlers: any left click will stop all sounds.
  function handleMouseDown(event: MouseEvent) {
    if (!$soundEnabled) return;
    play("down");
  }
  function handleMouseUp(event: MouseEvent) {
    if (!$soundEnabled) return;
    stopAllSounds();
    if (!suppressMouseUp) {
      play("up");
    }
    suppressMouseUp = false;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!$soundEnabled || keyDown) return;
    //plays a random keydown sound
    const randomIndex = Math.floor(Math.random() * 3);
    play(`keydown${randomIndex + 1}`);
    keyDown = true;
  }

  function handleKeyUp(event: KeyboardEvent) {
    if (!$soundEnabled) return;
    //plays a random keyup sound
    const randomIndex = Math.floor(Math.random() * 3);
    play(`keyup${randomIndex + 1}`);
    keyDown = false;
  }
  
</script>

<svelte:window on:mousedown={handleMouseDown} on:mouseup={handleMouseUp} on:keydown={handleKeyDown} on:keyup={handleKeyUp} />
