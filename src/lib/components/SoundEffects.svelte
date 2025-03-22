<script lang="ts">
    import { onMount } from 'svelte';

    let mouseDownAudio : HTMLAudioElement | null = null;
    let mouseUpAudio : HTMLAudioElement | null = null;
  
    onMount(() => {
        const AudioContext = window.AudioContext;
        const audioCtx = new AudioContext();
      mouseDownAudio = new Audio('/media/mousedown.mp3');
      mouseUpAudio = new Audio('/media/mouseup.mp3');
        mouseDownAudio.volume = 0.5;
        mouseUpAudio.volume = 0.5;
    });
  
    function handleMouseDown() {
      if (mouseDownAudio) mouseDownAudio.play();
    }
  
    function handleMouseUp() {
      if (mouseUpAudio) mouseUpAudio.play();
    }
  </script>
  
  <svelte:window on:mousedown={handleMouseDown} on:mouseup={handleMouseUp} />