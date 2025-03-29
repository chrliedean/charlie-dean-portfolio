<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import videojs from "video.js";
  import "video.js/dist/video-js.css";
  import "$lib/styles/vjs-os9.css";
  import { browser } from "$app/environment";

  let { src, options } = $props();
  let videoElement: HTMLVideoElement;
  let player: typeof videojs.players;
  let overrideNative = false;

  let defaultOptions = {
    controls: true,
    autoplay: false,
    playsinline: true,
    fluid: true,
    preload: "auto",
    controlBar: {
      volumePanel: {
        inline: false,
        vertical: true,
      },
    },
    html5: {
    hls: {
      overrideNative: overrideNative
    },
    nativeVideoTracks: !overrideNative,
    nativeAudioTracks: !overrideNative,
    nativeTextTracks: !overrideNative
  }
  };

  onMount(async () => {
    const playerOptions = { ...defaultOptions, ...options };
    player = videojs(videoElement, playerOptions);

    player.ready(() => {
      console.log("Video.js player is ready");
    });
  });

  onDestroy(() => {
    if (player) {
      player.dispose();
    }
  });
</script>

<video bind:this={videoElement} class="video-js vjs-os9">
  <track kind="captions" />
  <source src={src} type="application/x-mpegURL" />
</video>
