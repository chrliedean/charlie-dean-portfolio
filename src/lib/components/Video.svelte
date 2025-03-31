<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import videojs from "video.js";
  import "video.js/dist/video-js.css";
  import "../../css/vjs-os9.scss";
  import { browser } from "$app/environment";

  let { src, options } = $props();
  let videoElement: HTMLVideoElement;
  let player: typeof videojs.players;
  let isIOS = browser && /iPad|iPhone|iPod/.test(navigator.userAgent);

  let defaultOptions = {
    controls: true,
    autoplay: false,
    fluid: true,
    preload: "auto",
    playsinline: true,
    webkitplaysinline: true,
    x5playsinline: true,
    controlBar: {
      volumePanel: {
        inline: false,
        vertical: true,
      },
  
    },
    html5: {
      hls: {
        overrideNative: isIOS,
        enableLowInitialPlaylist: true,
        smoothQualityChange: true,
        handleManifestRedirects: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        lowLatencyMode: true
      },
      nativeVideoTracks: isIOS,
      nativeAudioTracks: isIOS,
      nativeTextTracks: isIOS
    }
  };

  onMount(async () => {
    const playerOptions = { ...defaultOptions, ...options };
    player = videojs(videoElement, playerOptions);

    player.ready(() => {
      console.log("Video.js player is ready");
      
      if (isIOS) {
        console.log("Setting up iOS-specific playback");
        // Set source directly on the player
        player.src({
          src: src,
          type: 'application/x-mpegURL',
          withCredentials: false
        });
      }
    });

    // Handle iOS-specific events
    if (isIOS) {
      player.on('loadstart', () => {
        console.log('Loadstart event fired');
      });

      player.on('loadedmetadata', () => {
        console.log('Loaded metadata');
      });

      player.on('canplay', () => {
        console.log('Can play');
      });

      player.on('error', (e: Error) => {
        console.error('Video player error:', e);
        // Log additional error details
        console.error('Player state:', {
          readyState: videoElement.readyState,
          networkState: videoElement.networkState,
          currentSrc: videoElement.currentSrc
        });
      });
    }
  });

  onDestroy(() => {
    if (player) {
      player.dispose();
    }
  });
</script>

<video 
  bind:this={videoElement} 
  class="video-js vjs-os9" 
  playsinline
  preload="auto"
>
  <source src={src} type="application/x-mpegURL" />

</video>

