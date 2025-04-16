<script context="module">
  // No changes needed here
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
  import { onMount, onDestroy } from "svelte"; // Import onDestroy

  // --- Configuration Values ---
  const PROJECT_ID = "3771910e-33e2-4829-b8ee-c1e262c0a7b6";
  const PROJECT_TOKEN = "fdc3b513-80d5-4add-86d2-349ca696f47d";
  const AI_USER_ID = "de2735b0-45ad-48a3-853a-a9005b37e137"; // Can be generated or static per user
  const LOBBY_ZONE_ID = "generated_lobby_id"; // Or your specific zone ID
  const TTS_OPENING_TEXT = "Please introduce yourself to me.";
  const ENABLE_COOKIES = false; // Set according to your preference/compliance
  // --- End Configuration ---

  let scene: RapportSceneElement | null = null; // Initialize as null
  let micPermissionRequested = false;
  let isLoading = true;
  let currentTarget = "";
  let mouseX = 0;
  let mouseY = 0;
  const baseCameraPosition = { x: 0, y: 0, z: 0.5 };
  let interactionStarted = false; // Flag to prevent multiple starts

  function handleMouseMove(event: MouseEvent) {
    if (!scene) return;
    const rect = scene.getBoundingClientRect();
    mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    updateAvatarLook(mouseX, mouseY);
  }

  function updateAvatarLook(normX: number, normY: number) {
    if (!scene?.setAttribute) return; // Check if scene and setAttribute exist
    const sensitivity = 0.2;
    const newCameraPosition = {
      x: baseCameraPosition.x - normX * sensitivity,
      y: baseCameraPosition.y + normY * sensitivity,
      z: baseCameraPosition.z,
    };
    scene.setAttribute("camera-position", JSON.stringify(newCameraPosition));
  }

  // AI Message Handler Function
  const handleAiMessage = (e: Event) => {
      const event = e as CustomEvent;
      const aiText = event.detail.params.text || "";
      console.log("AI message received:", aiText);
      const cleanedText = aiText.replace(/\*(.*?)\*/g, "").trim();
      if (scene?.modules?.tts) { // Check if scene and tts module exist
        scene.modules.tts.sendText(cleanedText);
      }
      const match = aiText.match(/\*(.*?)\*/);
      if (match && match[1]) {
        currentTarget = match[1].trim();
      }
  };

  // TTS Start Handler Function
  const handleTtsStart = (e: Event) => {
      const event = e as CustomEvent;
      const ttsText = event.detail.text || "";
      console.log("TTS started:", ttsText);
      if (currentTarget !== "") {
          console.log("Navigating to:", currentTarget);
          goto(`${currentTarget}`);
          currentTarget = ""; // Reset target after navigation attempt
      }
  };

  // Function to request microphone permissions and start the session
  async function startInteraction() {
    console.log("🔍 Starting interaction");
    // Ensure scene element exists and hasn't started already
    if (!scene || typeof scene.sessionRequest !== "function" || interactionStarted) {
      console.error("Rapport scene element is not ready or interaction already started", { sceneExists: !!scene, hasSessionRequest: typeof scene?.sessionRequest === 'function', interactionStarted });
      // Optionally reset loading state if interaction fails to start
      if (!interactionStarted) isLoading = false; 
      return;
    }

    // Indicate interaction attempt has begun
    interactionStarted = true; 
    micPermissionRequested = true;
    isLoading = true; // Show loading indicator while session connects

    // Save to localStorage that user has initiated interaction (might not mean granted yet)
    localStorage.setItem('eCharlieMicPermissionGranted', 'true'); 

    // Add event listeners (ensure they are added only once)
    scene.removeEventListener("aiMessage", handleAiMessage); // Remove first to prevent duplicates
    scene.addEventListener("aiMessage", handleAiMessage);
    scene.removeEventListener("ttsStart", handleTtsStart); // Remove first
    scene.addEventListener("ttsStart", handleTtsStart);

    
    try {
      // Now initialize the session which might trigger the permission request
      console.log("🔍 Initializing session");
      await scene.sessionRequest({
        info: (ev) => infoHandler(ev),
        warning: (ev) => warningHandler(ev),
        sessionDisconnected: (ev) => sessionDisconnectedHandler(ev),
        // --- Pass configuration here ---
        projectId: PROJECT_ID,
        projectToken: PROJECT_TOKEN,
        aiUserId: AI_USER_ID,
        lobbyZoneId: LOBBY_ZONE_ID,
        openingText: TTS_OPENING_TEXT, // Pass empty here if you trigger TTS later
        enableCookies: ENABLE_COOKIES,
        backgroundColor: "#000000",
        
        // --- Callbacks ---
        sessionConnected: () => {
          console.log("Session connected to rapport-scene");
          isLoading = false; // Hide loading indicator

          // Trigger initial TTS if needed (or handle via commands)


          // Find and autoplay idle animation
          const idleAnimation = scene?.animations
            ?.get()
            ?.find((animation) => animation.toLowerCase().includes("idle"));
          if (idleAnimation && scene?.animations) {
            scene.animations.play(idleAnimation, true);
          }

          // Autoplay "first_and_only_command"
          if (scene?.modules?.commands?.data?.commands.includes("first_and_only_command")) {
            scene.modules.commands.trigger("first_and_only_command");
          }

          // Initialize camera position with default values
          updateAvatarLook(0, 0);
          
          // Add mouse move event listener after session is connected
          window.removeEventListener("mousemove", handleMouseMove); // Remove first
          window.addEventListener("mousemove", handleMouseMove);
        },

      });
    } catch (error) {
        console.error("Error during sessionRequest:", error);
        isLoading = false; // Hide loading indicator on error
        interactionStarted = false; // Allow retrying
        // Handle specific errors, e.g., permission denied
        if (error instanceof Error && error.name === 'NotAllowedError') {
            // User denied permission
            micPermissionRequested = false; // Show overlay again
             localStorage.removeItem('eCharlieMicPermissionGranted'); // Clear flag
        } else {
            // Show a generic error message?
            console.log("oh no")
        }
    }
  }

  // Function to check if microphone permissions are likely granted
  async function checkMicrophonePermissionStatus() {
      if (typeof navigator?.permissions?.query !== 'function') {
          console.warn("Permissions API not supported.");
          // Fallback: Check localStorage flag from previous grants?
          return localStorage.getItem('eCharlieMicPermissionGranted') === 'true';
      }
      try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          console.log("Microphone permission state:", permissionStatus.state); // 'granted', 'prompt', 'denied'
          return permissionStatus.state === 'granted';
      } catch (err) {
          console.error("Error querying microphone permission:", err);
          return false; // Assume not granted if query fails
      }
  }

  const infoHandler = (ev: CustomEvent) => {
    console.log("Info event received:", ev);
  };

  const warningHandler = (ev: CustomEvent) => {
    console.log("Warning event received:", ev);
  };

  const sessionDisconnectedHandler = (ev: CustomEvent) => {
    console.log("Session disconnected event received:", ev);
  };

 onMount(() => {
    console.log("🔍 E-Charlie mounted");
    // Ensure the script is loaded before accessing customElements
    const rapportScript = document.querySelector('script[src*="rapport.js"]');
    
    const initializeScene = async () => {
        await customElements.whenDefined("rapport-scene");
        console.log("Rapport scene element defined.");
        
        // Bind the scene element AFTER it's defined
        scene = document.getElementById('rapportScene') as RapportSceneElement; 

        if (!scene) {
            console.error("Failed to get rapportScene element by ID after definition.");
            return;
        }

        // Check if permission was likely granted previously
        const alreadyGranted = await checkMicrophonePermissionStatus();
        if (alreadyGranted) {
            console.log("Permission likely granted, attempting to start interaction...");
            // Set flags to skip overlay, show loading
            micPermissionRequested = true;
            isLoading = true; 
            startInteraction(); // Attempt to start directly
        } else {
             console.log("Permission not granted or in prompt state.");
             // Ensure flags correctly show the permission overlay
             micPermissionRequested = false;
             isLoading = false; // Don't show loading if we need permission prompt
        }
    };

  
        // Fallback: Use a timeout or MutationObserver if script load detection is tricky
        // Using whenDefined is generally preferred and cleaner
        initializeScene();
    

    // Return cleanup function
    return () => {
        console.log("🧹 E-Charlie destroying...");
        window.removeEventListener("mousemove", handleMouseMove);
        
        // Remove scene-specific listeners
        if (scene) {
            scene.removeEventListener("aiMessage", handleAiMessage);
            scene.removeEventListener("ttsStart", handleTtsStart);
            
            // Attempt to disconnect session gracefully
            if (scene.sessionDisconnect) {
                console.log("Attempting session disconnect...");
                scene.sessionDisconnect().catch(err => console.error("Error during session disconnect:", err));
            }
        }
        scene = null; // Clear reference
        interactionStarted = false; // Reset flag
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

{#if !micPermissionRequested && !isLoading} <div class="overlay-container">
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

{#if isLoading}
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

<rapport-scene
  id="rapportScene" bind:this={scene} 
  ></rapport-scene>

<style>
  /* ... your styles ... */
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
   .window-body p {
     font-size: 14px; 
     line-height: 1.4;
   }

  .button-container {
    display: flex;
    justify-content: center;
    margin-top: 15px; 
  }

  .loading .window-body {
    text-align: center;
  }
  
  rapport-scene {
      display: block; 
      background: #000000 !important;
      width: 100%;
      height: 100%;
  }
</style>