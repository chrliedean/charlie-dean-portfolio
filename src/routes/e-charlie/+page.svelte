<script module>
  // No changes needed here
  export const windowMeta = {
    id: "e-charlie",
    title: "E-Charlie",
    route: "/e-charlie",
    defaultSize: { width: 350, height: 500 },
    
    minSize: { width: 320, height: 320 },
    style: "nopadding",
    icon: "charlie",
  };
</script>

<script lang="ts">
import AnimatedAvatar from "$lib/components/e-charlie/AnimatedAvatar.svelte"; // Path to your component
  import { onMount, onDestroy } from "svelte";
  import { Conversation } from "@11labs/client"; // Assuming used
  import { goto } from "$app/navigation"; // If used
  import { getContext } from "svelte"; // If used
  // Import the generateSpeech that yields { pcmBuffer, wordTimings }
  import { generateSpeech } from "$lib/utils/tts"; // Path to updated tts.ts
  // Import the new helper
  import { generateVisemeTimeline, type VisemeEvent, type WordTiming } from "$lib/utils/visemes"; // Path to helper
  
  // Import or define EmojiEvent type
  // If not defined in visemes.ts, define it here
  interface EmojiEvent {
    emoji: string;
    start_ms: number;
  }

  // --- State ---
  let conversation: Conversation | null = null;
  let avatar: AnimatedAvatar | null = null; // bind:this reference
  let isSpeaking = $state(false);
  // Add state for the timeline and audio start time to pass to the avatar
  let currentVisemeTimeline = $state<VisemeEvent[]>([]);
  let audioPlaybackStartTime = $state<number | null>(null);
  let collectedEmojiEvents = $state<EmojiEvent[]>([]); // Add state for emojis

  // Re-introduce AudioContext for playback HERE
  let audioCtx: AudioContext | null = null;
  let currentAudioSource: AudioBufferSourceNode | null = null;

  // Add state for client city
  let clientCity = $state('');

  // --- Permission Overlay State ---
  let showPermissionOverlay = $state(true);
  let permissionError = $state<string | null>(null);

  // --- Speech Function ---
  async function speakAndAnimate(text: string) {
    if (isSpeaking || !avatar) {
      console.log("Avatar not ready or already speaking.");
      return;
    }
    isSpeaking = true;
    console.log("Gathering TTS data for:", text);

    // Reset state for new utterance
    currentVisemeTimeline = [];
    audioPlaybackStartTime = null;
    collectedEmojiEvents = []; // Reset emojis for new utterance
    if (currentAudioSource) {
        try { currentAudioSource.stop(); } catch (e) {}
        currentAudioSource = null;
    }

    // --- 1. Collect all TTS data ---
    const collectedPcmChunks: ArrayBuffer[] = [];
    const collectedWordTimings: WordTiming[] = [];
    const currentEmojiEventsList: EmojiEvent[] = []; // Temporary list for this utterance's emojis

    try {
        for await (const chunk of generateSpeech(text)) { //
            if (chunk.pcmBuffer) {
                collectedPcmChunks.push(chunk.pcmBuffer);
            }
            if (chunk.wordTimings && chunk.wordTimings.length > 0) {
                collectedWordTimings.push(...chunk.wordTimings);
            }
            // Collect emoji events
            if (chunk.emojiEvents && chunk.emojiEvents.length > 0) {
                currentEmojiEventsList.push(...chunk.emojiEvents);
            }
        }
        console.log(`TTS stream finished. Collected ${collectedPcmChunks.length} audio chunks, ${collectedWordTimings.length} word timings, ${currentEmojiEventsList.length} emoji events.`);
        console.log("currentEmojiEventsList", currentEmojiEventsList);

        if (collectedPcmChunks.length === 0 || collectedWordTimings.length === 0) {
            console.warn("No audio or word timings collected.");
            isSpeaking = false;
            return;
        }

        // --- 2. Generate Viseme Timeline ---
        const timeline = generateVisemeTimeline(collectedWordTimings); // Call the helper
        currentVisemeTimeline = timeline; // Update state to pass to avatar
        collectedEmojiEvents = currentEmojiEventsList; // Update state with collected emojis
        console.log(`Generated ${timeline.length} viseme events and ${collectedEmojiEvents.length} emoji events.`);

        // --- 3. Prepare and Play Audio ---
        if (!audioCtx) {
            audioCtx = new AudioContext();
        } else if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        // Concatenate PCM buffers
        let totalLength = 0;
        collectedPcmChunks.forEach(chunk => { totalLength += chunk.byteLength; });
        const combinedPcm = new Uint8Array(totalLength);
        let offset = 0;
        collectedPcmChunks.forEach(chunk => {
            combinedPcm.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
        });

        // Decode combined PCM into an AudioBuffer
        // 1. Interpret the raw buffer as 16-bit signed integers (Little Endian is default)
        const pcmInt16 = new Int16Array(combinedPcm.buffer);

        // 2. Get parameters (Ensure sampleRate is correct)
        const sampleRate = 16000; // Get from your TTS source
        const frameCount = pcmInt16.length; // Number of samples
        const numChannels = 1; // Assuming mono PCM

        // 3. Create an empty AudioBuffer
        const audioBuffer = audioCtx.createBuffer(numChannels, frameCount, sampleRate);

        // 4. Get the channel data buffer to fill
        const channelData = audioBuffer.getChannelData(0); // For mono

        // 5. Copy PCM data, converting Int16 to Float32 (-1.0 to 1.0 range)
        for (let i = 0; i < frameCount; i++) {
          // Divide by 32768 (which is 2^15) to normalize Int16 range to [-1, 1)
          channelData[i] = pcmInt16[i] / 32768.0;
        }


        // Play the audio
        currentAudioSource = audioCtx.createBufferSource();
        currentAudioSource.buffer = audioBuffer;
        currentAudioSource.connect(audioCtx.destination);

        // Record the precise start time relative to the AudioContext's clock
        const startTime = audioCtx.currentTime;
        currentAudioSource.start(startTime);
        audioPlaybackStartTime = startTime; // Update state to pass to avatar
        console.log("Audio playback started at context time:", startTime);

        currentAudioSource.onended = () => {
            console.log("Audio playback ended.");
            isSpeaking = false;
            audioPlaybackStartTime = null; // Reset start time
            // Maybe reset timeline prop after a delay?
            // setTimeout(() => { currentVisemeTimeline = []; }, 100);
            currentAudioSource = null;
        };

    } catch (error) {
      console.error("TTS processing or playback failed:", error);
      isSpeaking = false;
      currentVisemeTimeline = [];
      audioPlaybackStartTime = null;
    }
  }

  // --- Start ElevenLabs Conversation ---
  async function startElevenLabsConversation() {
    if (conversation) return; // Prevent multiple starts

    console.log("Attempting to start ElevenLabs conversation...");
    try {
        conversation = await Conversation.startSession({
            agentId: "JqxSmuRTrGAN7TCUR3ja",
            dynamicVariables: {
            client_city: clientCity
            },
            onMessage: async (message) => {
            console.log("Message received:", message);
            if (message.source === "ai") {
                speakAndAnimate(message.message);
            }
            },

            onStatusChange: (status) => {
            console.log("Status changed:", status);
            if (status.status === "disconnected") {
                closeWithAnimation();
                console.log("trying to close the window")
            }
            },

            onUnhandledClientToolCall: (toolCall) => {
                navigateRoute(toolCall.parameters.routeToNavigate)
            },
            onModeChange: (mode) => {
            console.log("Mode changed:", mode);
            // Track when the agent is speaking vs. listening
            },
        });

        await conversation.setVolume({ volume: 0 });

        console.log("Conversation started");

    } catch (error) {
        console.error("Error starting conversation:", error);
        permissionError = `Failed to start conversation: ${error instanceof Error ? error.message : String(error)}`;
        showPermissionOverlay = true; // Show overlay again on error
    }
  }

  // --- Request Mic Permission and Start ---
  async function requestMicAndStartConversation() {
    permissionError = null; // Clear previous errors
    console.log("Requesting microphone permission...");

    // Initialize AudioContext on user gesture
    if (!audioCtx) {
        try {
            audioCtx = new AudioContext();
            console.log(`AudioContext created. State: ${audioCtx.state}`);
        } catch (e) {
            console.error("Failed to create AudioContext:", e);
            permissionError = `Could not initialize audio: ${e instanceof Error ? e.message : String(e)}`;
            return;
        }
    } else if (audioCtx.state === 'suspended') {
        // Attempt to resume if already exists but suspended
        try {
            await audioCtx.resume();
            console.log("AudioContext resumed.");
        } catch (e) {
            console.error("Failed to resume AudioContext:", e);
            permissionError = `Could not resume audio: ${e instanceof Error ? e.message : String(e)}`;
            return;
        }
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        permissionError = "Microphone access is not supported by this browser.";
        console.error(permissionError);
        return;
    }

    try {
        // Request microphone access (this also acts as a user gesture requirement for AudioContext)
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // We don't need the stream itself, just the permission grant. Stop the tracks immediately.
        stream.getTracks().forEach(track => track.stop());
        console.log("Microphone permission granted.");

        // Hide overlay and start conversation
        showPermissionOverlay = false;
        await startElevenLabsConversation();

    } catch (err) {
        console.error("Microphone permission denied or error:", err);
        if (err instanceof Error && err.name === 'NotAllowedError') {
            permissionError = "Microphone permission denied. Please grant access to talk to E-Charlie.";
        } else if (err instanceof Error && err.name === 'NotFoundError') {
            permissionError = "No microphone found. Please ensure a microphone is connected.";
        }
         else {
            permissionError = `Error requesting microphone: ${err instanceof Error ? err.message : String(err)}`;
        }
    }
  }

  const closeWindow = getContext('windowManager') as (id: string) => void;
  const windowId = getContext('windowId') as string;

  // -------------------------------- CLOSE WINDOW WITH ANIMATION --------------------------------
  async function closeWithAnimation() {
    // Check all window elements in the DOM with class "window"
    const allWindows = document.querySelectorAll('.window');
    let foundWindow: Element | null = null;
    
    // Find the window that belongs to this component
    for (const win of Array.from(allWindows)) {
      // Look for e-charlie window using titlebar text
      const titleEl = win.querySelector('.window-title');
      if (titleEl && titleEl.textContent?.includes('E-Charlie')) {
        foundWindow = win;
        break;
      }
    }
    
    if (!foundWindow) {
      // Fallback: just close the window directly
      console.log("Couldn't find window element, closing directly");
      return closeWindow(windowId);
    }
    
    // Find the close button (first titlebar-button in the window)
    const closeBtn = foundWindow.querySelector('.titlebar-button');
    if (closeBtn) {
      // Programmatically click the close button to trigger animation and sound
      closeBtn.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
    } else {
      // Fallback
      closeWindow(windowId);
    }
  }

  onMount(async () => {
    // Create AudioContext immediately - MOVED TO BUTTON CLICK
    // Needs user gesture (like button click) to start/resume later
    // audioCtx = new AudioContext();
    // console.log(`AudioContext state on mount: ${audioCtx.state}`);

    // Fetch client city from IP - can happen before mic permission
    try {
      const response = await fetch('http://ip-api.com/json/?fields=status,message,city');
      if (!response.ok) {
        throw new Error(`IP API request failed with status ${response.status}`);
      }
      const data = await response.json();
      if (data.status === 'success') {
        clientCity = data.city;
        console.log(`Client city identified as: ${clientCity}`);
      } else {
        console.warn(`IP API query failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Error fetching client city:", error);
    }

    // --- Conversation is NOT started here anymore ---
    // It will be started after mic permission is granted in requestMicAndStartConversation()
  });

  function navigateRoute(route: string) {
    goto(route);
  }

  onDestroy(async () => {
    if (currentAudioSource) {
      try { currentAudioSource.stop(); } catch (e) {}
      currentAudioSource = null;
      console.log("Audio source stopped");
    }
    if (audioCtx) {
      await audioCtx.close();
      audioCtx = null;
      console.log("Audio context closed");
    }

    if (conversation) {
      await conversation.endSession();
      console.log("Conversation ended");
    }
  });
</script>

<div class="e-charlie-container">
  <AnimatedAvatar 
    bind:this={avatar} 
    visemeTimeline={currentVisemeTimeline} 
    audioPlaybackStartTime={audioPlaybackStartTime}
    emojiEvents={collectedEmojiEvents}
  />

  {#if showPermissionOverlay}
    <div class="permission-overlay">
      <div class="overlay-content">
        <h2>Microphone Access</h2>
        <p>E-Charlie needs access to your microphone to talk.</p>
        {#if permissionError}
          <p class="error-message">{permissionError}</p>
        {/if}
        <button class="button primary" onclick={requestMicAndStartConversation}>
          Grant Permission
        </button>
         <p class="subtle">Your voice data is not stored.</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .e-charlie-container {
    position: relative; /* Needed for absolute positioning of overlay */
    width: 100%;
    height: 100%;
    overflow: hidden; /* Prevent scrollbars if avatar slightly overflows */
    background-color: var(--bg-color, #f0f0f0); /* Fallback background */
  }

  .permission-overlay {
    position: absolute;
    inset: 0; /* top, right, bottom, left = 0 */
    background-color: rgba(0, 0, 0, 0.8); /* Semi-transparent dark background */
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    z-index: 10; /* Ensure it's on top */
    padding: 20px;
    box-sizing: border-box;
  }

  .overlay-content {
    background-color: rgba(30, 30, 30, 0.9); /* Slightly darker box */
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    max-width: 300px; /* Limit width */
  }

  .overlay-content h2 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #eee;
  }

  .overlay-content p {
    margin-bottom: 20px;
    line-height: 1.5;
     color: #ccc;
  }




  .error-message {
    color: #ff4d4d; /* Red for errors */
    font-weight: bold;
    margin-bottom: 15px;
  }

  .subtle {
    font-size: 0.8rem;
    color: #aaa;
    margin-top: 10px;
    margin-bottom: 0;
  }

  /* Ensure AnimatedAvatar fills container if needed */
  :global(.e-charlie-container > *:first-child) {
     /* Assuming AnimatedAvatar is the direct child */
    width: 100%;
    height: 100%;
    display: block; /* Or flex, depending on avatar's internal structure */
  }
</style>