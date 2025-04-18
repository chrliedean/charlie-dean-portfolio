<script module>
  // No changes needed here
  export const windowMeta = {
    id: "e-charlie",
    title: "E-Charlie",
    route: "/e-charlie",
    defaultSize: { width: 400, height: 400 },

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

  // --- State ---
  let conversation: Conversation | null = null;
  let avatar: AnimatedAvatar | null = null; // bind:this reference
  let isSpeaking = $state(false);
  // Add state for the timeline and audio start time to pass to the avatar
  let currentVisemeTimeline = $state<VisemeEvent[]>([]);
  let audioPlaybackStartTime = $state<number | null>(null);

  // Re-introduce AudioContext for playback HERE
  let audioCtx: AudioContext | null = null;
  let currentAudioSource: AudioBufferSourceNode | null = null;

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
    if (currentAudioSource) {
        try { currentAudioSource.stop(); } catch (e) {}
        currentAudioSource = null;
    }

    // --- 1. Collect all TTS data ---
    const collectedPcmChunks: ArrayBuffer[] = [];
    const collectedWordTimings: WordTiming[] = [];

    try {
        for await (const chunk of generateSpeech(text)) { //
            if (chunk.pcmBuffer) {
                collectedPcmChunks.push(chunk.pcmBuffer);
            }
            if (chunk.wordTimings && chunk.wordTimings.length > 0) {
                collectedWordTimings.push(...chunk.wordTimings);
            }
        }
        console.log(`TTS stream finished. Collected ${collectedPcmChunks.length} audio chunks, ${collectedWordTimings.length} word timings.`);

        if (collectedPcmChunks.length === 0 || collectedWordTimings.length === 0) {
            console.warn("No audio or word timings collected.");
            isSpeaking = false;
            return;
        }

        // --- 2. Generate Viseme Timeline ---
        const timeline = generateVisemeTimeline(collectedWordTimings); // Call the helper
        currentVisemeTimeline = timeline; // Update state to pass to avatar
        console.log(`Generated ${timeline.length} viseme events.`);

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

    audioCtx = new AudioContext();

    // -------------------------------- INIT ELEVENLABS CONVERSATION --------------------------------
    try {
      conversation = await Conversation.startSession({
        agentId: "JqxSmuRTrGAN7TCUR3ja",
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
      

      // Start the animation loop after conversation is initialized
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  });



  function navigateRoute(route: string) {
    goto(route);
  }


  onDestroy(async () => {
    if (currentAudioSource) {
      try { currentAudioSource.stop(); } catch (e) {}
      currentAudioSource = null;
    }
    if (audioCtx) {
      await audioCtx.close();
      audioCtx = null;
    }

    if (conversation) {
      await conversation.endSession();
      console.log("Conversation ended");
    }
  });
</script>

<AnimatedAvatar bind:this={avatar} visemeTimeline={currentVisemeTimeline} audioPlaybackStartTime={audioPlaybackStartTime}/>