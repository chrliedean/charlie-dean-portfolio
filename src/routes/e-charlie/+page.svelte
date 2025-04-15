<script context="module">
  export const windowMeta = {
    id: "e-charlie",
    title: "E-Charlie",
    route: "/e-charlie",
    defaultSize: { width: 400, height: 400 },
    maxSize: { width: 480, height: 480 },
    minSize: { width: 320, height: 320 },
    style: "nopadding",
    icon: "charlie",
  };
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { beforeNavigate } from "$app/navigation";

  // Reference to the rapport-scene element
  let scene: RapportSceneElement;
  
  // State to track if microphone permissions have been requested
  let micPermissionRequested = false;
  // State to track loading status
  let isLoading = true;
  let currentTarget = "";
  // Flag to track if navigation is happening
  let isNavigating = false;

  // Mouse position tracking
  let mouseX = 0;
  let mouseY = 0;

  // Base camera position parameters
  const baseCameraPosition = {
    x: 0,
    y: 0,
    z: 0.5,
  };

  // Track mouse movement across the entire document
  function handleMouseMove(event: MouseEvent) {
    // Get mouse position relative to the scene element
    if (!scene) return;
    const rect = scene.getBoundingClientRect();

    // Calculate normalized mouse position (-1 to 1) relative to the scene center
    mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseY = ((event.clientY - rect.top) / rect.height) * 2 - 1;

    // Update avatar to follow cursor
    updateAvatarLook(mouseX, mouseY);
  }

  // Update the camera position to make avatar follow the cursor
  function updateAvatarLook(normX: number, normY: number) {
    if (!scene) return;

    // Calculate camera position with smooth, limited movement
    // Limit the movement range to create subtle head tracking
    const sensitivity = 0.2;
    const newCameraPosition = {
      x: baseCameraPosition.x - normX * sensitivity,
      y: baseCameraPosition.y + normY * sensitivity,
      z: baseCameraPosition.z,
    };

    // Update camera if the scene has been initialized
    // if (scene.setAttribute) {
    //   scene.setAttribute("camera-position", JSON.stringify(newCameraPosition));
    // }
  }

  // Function to request microphone permissions and start the session
  function startInteraction() {
    if (!scene || typeof scene.sessionRequest !== "function") {
      console.error("Rapport scene element is not ready");
      return;
    }

    micPermissionRequested = true;
    
    // Save to localStorage that user has granted permission
    localStorage.setItem('eCharlieMicPermissionGranted', 'true');
    
    // Clear previous event listeners to avoid duplicates
    // which can cause errors when navigating back to the component
    try {
      scene.removeEventListener("aiMessage", handleAiMessage);
      scene.removeEventListener("ttsStart", handleTtsStart);
    } catch (e) {
      // Ignore errors if listeners weren't attached
    }
    
    // Set up AI message handling
    scene.addEventListener("aiMessage", handleAiMessage);
    scene.addEventListener("ttsStart", handleTtsStart);
    
    // Now initialize the session which will trigger the permission request
    scene.sessionRequest({
      sessionConnected() {
        console.log("Session connected to rapport-scene");
        isLoading = false;
        
        // Find and autoplay idle animation
        const idleAnimation = scene.animations
          .get()
          .find((animation) => animation.toLowerCase().includes("idle"));
        if (idleAnimation) {
          scene.animations.play(idleAnimation, true); // animation name, loop
        }

        // Autoplay "first_and_only_command"
        if (
          scene.modules?.commands?.data?.commands?.includes(
            "first_and_only_command"
          )
        ) {
          scene.modules.commands.trigger("first_and_only_command");
        }

        // Initialize camera position with default values
        updateAvatarLook(0, 0);
        
        // Add mouse move event listener after session is connected
        window.addEventListener("mousemove", handleMouseMove);
      },
      sessionDisconnected() {
        console.log("Session disconnected from rapport-scene");
      },
    });
  }
  
  // Add navigation guard
  beforeNavigate(() => {
    isNavigating = true;
    
    // Attempt to stop TTS and clean up scene resources
    if (scene) {
      try {
        // Try to stop any current TTS
        if (scene.modules?.tts && 'stop' in scene.modules.tts) {
          console.log("Stopping TTS before navigation");
          (scene.modules.tts as any).stop();
        }
        
        // Remove event listeners
        scene.removeEventListener("aiMessage", handleAiMessage);
        scene.removeEventListener("ttsStart", handleTtsStart);
      } catch (e) {
        console.warn("Error during navigation cleanup:", e);
      }
    }
  });

  // Extracted event handlers to separate functions for cleanup
  function handleAiMessage(e: Event) {
    // Don't process if currently navigating
    if (isNavigating) return;
    
    const event = e as CustomEvent;
    const aiText = event.detail.params.text || "";
    console.log("AI message received:", aiText);

    // removes text contained in asterisks from aiText
    const cleanedText = aiText.replace(/\*(.*?)\*/g, "").trim();
    
    // Check if TTS module is available before sending text
    if (!isNavigating && scene?.modules?.tts?.sendText) {
      try {
        scene.modules.tts.sendText(cleanedText);
      } catch (e) {
        console.warn("Error sending text to TTS:", e);
      }
    } else {
      console.warn("TTS module not available or navigation in progress");
    }

    // Check if the text contains a command to navigate and does so
    const match = aiText.match(/\*(.*?)\*/);
    if (match && match[1]) {
      const target = match[1].trim();
      // Validate the target is not null or empty
      if (target && target !== "null") {
        currentTarget = target;
        console.log("Navigation target set:", target);
      } else {
        console.warn("Invalid navigation target detected:", target);
        currentTarget = "";
      }
    }
  }
  
  function handleTtsStart(e: Event) {
    // Don't process if currently navigating
    if (isNavigating) return;
    
    const event = e as CustomEvent;
    const ttsText = event.detail.text || "";
    console.log("TTS started:", ttsText);
    
    if (currentTarget !== "") {
      console.log("Navigating to:", currentTarget);
      
      // Mark as navigating before actual navigation
      isNavigating = true;
      
      // Stop TTS before navigation if possible
      if (scene?.modules?.tts && 'stop' in scene.modules.tts) {
        try {
          (scene.modules.tts as any).stop();
        } catch (e) {
          console.warn("Error stopping TTS:", e);
        }
      }
      
      // Small delay to allow TTS to stop
      setTimeout(() => {
        // Check if target is valid before navigating
        if (currentTarget.startsWith('/')) {
          goto(`${currentTarget}`);
        } else {
          goto(`/${currentTarget}`);
        }
        // Reset current target after navigation
        currentTarget = "";
      }, 100);
    }
  }

  // Function to check if microphone permissions are already granted
  async function checkMicrophonePermission() {
    try {
      // Try to get user media to check permissions
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If we get here, permission is granted - stop the tracks and start interaction
      stream.getTracks().forEach(track => track.stop());
      console.log("Microphone permission already granted");
      
      // Skip permission overlay but still show loading
      micPermissionRequested = true;
      startInteraction();
      return true;
    } catch (err) {
      console.log("Microphone permission not granted yet:", err);
      return false;
    }
  }

  onMount(() => {
    // Reset navigation flag
    isNavigating = false;
    
    // Debug: Look for images being loaded
    if (typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      (window as any).fetch = function(input: RequestInfo | URL, init?: RequestInit) {
        if (typeof input === 'string' && 
           (input.includes('null') || input === '/null')) {
          console.error('Attempting to fetch from null URL:', input, new Error().stack);
        }
        return originalFetch.call(this, input, init);
      };
      
      // Also intercept Image constructor
      const originalImage = window.Image;
      (window as any).Image = function(width?: number, height?: number) {
        const img = new originalImage(width, height);
        const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')?.set;
        
        if (originalSrcSetter) {
          Object.defineProperty(img, 'src', {
            set(value) {
              if (value === null || value === 'null' || value === '/null') {
                console.error('Setting null image src', new Error().stack);
              }
              originalSrcSetter.call(this, value);
            },
            get: Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')?.get
          });
        }
        return img;
      };
      
      // Store original functions for cleanup
      (window as any).originalFetch = originalFetch;
      (window as any).originalImage = originalImage;
    }
    
    // Wait until the custom element is defined/upgraded
    customElements.whenDefined("rapport-scene").then(() => {
      console.log("Rapport scene element defined, checking microphone permission");
      // Check if mic permission is already granted
      checkMicrophonePermission();
    });
    
    // Cleanup function to remove event listeners when component is destroyed
    return () => {
      // Restore original fetch and Image if we modified them
      if (typeof window !== 'undefined') {
        if ((window as any).originalFetch) {
          window.fetch = (window as any).originalFetch;
        }
        if ((window as any).originalImage) {
          window.Image = (window as any).originalImage;
        }
      }
      
      window.removeEventListener("mousemove", handleMouseMove);
      
      // Clean up rapport event listeners
      if (scene) {
        try {
          // Try to stop any current TTS
          if (scene.modules?.tts && 'stop' in scene.modules.tts) {
            (scene.modules.tts as any).stop();
          }
          
          scene.removeEventListener("aiMessage", handleAiMessage);
          scene.removeEventListener("ttsStart", handleTtsStart);
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  });
</script>

<svelte:head>
  <title>E-Charlie - Charlie Dean</title>
  <meta
    name="description"
    content="E-Charlie is a virtual assistant based on the artist Charlie Dean."
  />
  <script
    src="https://cdn.rapport.cloud/rapport-web-viewer/rapport.js"
  ></script>
</svelte:head>

<!-- Permission overlay - shown until user requests mic permission -->
{#if !micPermissionRequested}
  <div class="overlay-container">
    <div class="overlay-window">
      <div class="titlebar">
        <div class="w-layout-hflex title-bar-flexbox">
          <h1 class="window-title">Microphone Access Required</h1>
        </div>
      </div>
      <div class="window-body">
        <p>E-Charlie needs microphone access to interact with you.</p>
        <p>Click the button below to enable your microphone and start the experience.</p>
        <div class="button-container">
          <button class="button primary" on:click={startInteraction}>
            Enable Microphone
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Loading indicator - shown after permission but before session is connected -->
{#if micPermissionRequested && isLoading}
  <div class="overlay-container">
    <div class="overlay-window loading">
      <div class="titlebar">
        <div class="w-layout-hflex title-bar-flexbox">
          <h1 class="window-title">Loading E-Charlie</h1>
        </div>
      </div>
      <div class="window-body">
        <p>Please wait while E-Charlie initializes...</p>
      </div>
    </div>
  </div>
{/if}

<!-- The Rapport scene is always loaded in the background,
     but permissions are only requested after button click -->
<rapport-scene
  bind:this={scene}
  project-id="3771910e-33e2-4829-b8ee-c1e262c0a7b6"
  project-token="fdc3b513-80d5-4add-86d2-349ca696f47d"
  ai-user-id="de2735b0-45ad-48a3-853a-a9005b37e137"
  lobby-zone-id="generated_lobby_id"
  tts-opening-text="Hello. I'm E-Charlie, a virtual clone of Charlie Dean. I'm stuck here and I have to help."
  style="width: 480px; height: 480px; max-width: 100%; max-height: 100%; background: #000000"
></rapport-scene>

<style>
  .overlay-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
  }

  .overlay-window {
    width: 80%;
    max-width: 350px;
    background-color: var(--_colors---grays-400);
    border: var(--line-width) solid var(--_colors---primary-black-900);
    box-shadow: inset var(--line-width) var(--line-width) 0 0 var(--_colors---grays-200), 
                inset var(--negative-line-width) var(--negative-line-width) 0 0 var(--_colors---grays-600), 
                var(--double-line-width) var(--double-line-width) 0 0 #00000080;
    display: flex;
    flex-direction: column;
  }

  .titlebar {
    border-style: solid solid none;
    border-width: 0px 0px var(--line-width);
    border-color: var(--_colors---primary-black-900);
    width: 100%;
    height: 26px;
  }

  .window-title {
    opacity: 1;
    color: var(--_colors---primary-black-900);
    text-align: center;
    align-self: center;
    margin: 0 auto;
    padding: 0;
    font-family: Charcoal, Tahoma, sans-serif;
    font-size: 16px;
    line-height: 25px;
    display: block;
  }

  .window-body {
    display: block;
    border-top: var(--line-width) solid var(--_colors---primary-black-900);
    background-color: var(--primary-white-100);
    padding: 10px;
    font-family: Geneva, Arial, sans-serif;
    box-shadow: inset var(--negative-line-width) var(--negative-line-width) 0 0 var(--_colors---grays-600);
  }

  .button-container {
    display: flex;
    justify-content: center;
    margin-top: 10px;
  }

  .loading .window-body {
    text-align: center;
  }
</style>