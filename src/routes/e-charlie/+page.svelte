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
  import AnimatedAvatar from "$lib/components/e-charlie/AnimatedAvatar.svelte";
  import { onMount, onDestroy } from "svelte";
  import { Conversation } from "@11labs/client";
  import { goto } from "$app/navigation";
  import { getContext } from "svelte";
  import { tick } from "svelte";
  import { soundCommand } from "$lib/components/SoundEffects.svelte";
  let conversation: Conversation | null = null;
  let frequencyData = $state<Uint8Array | null>(null);
  let animationFrameId: number | null = null;
  let isSpeaking = false; // Track speaking state

  let audioContext = new AudioContext();
  let startTime: number | null = null;
  let elapsed = 0;

  const closeWindow = getContext('windowManager') as (id: string) => void;
  const windowId = getContext('windowId') as string;

  // Function to close window with animation and sound by finding and clicking the close button
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

    // -------------------------------- INIT ELEVENLABS CONVERSATION --------------------------------
    try {
      conversation = await Conversation.startSession({
        agentId: "JqxSmuRTrGAN7TCUR3ja",
        onMessage: (message) => {
          console.log("Message received:", message);
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
          isSpeaking = mode.mode === "speaking";
          
          if (!isSpeaking) {
            // Clear frequency data when not speaking
            frequencyData = null;
          }
        },
      });

      console.log("Conversation started");
      

      // Start the animation loop after conversation is initialized
      updateLipSync();
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  });

  function navigateRoute(route: string) {
    goto(route);
  }

  function updateLipSync() {
  if (conversation && isSpeaking) {
    try {
      // Only attempt to get frequency data when speaking
      const newData = conversation.getOutputByteFrequencyData();
      if (newData && newData.length > 0) {
        frequencyData = newData; // Explicitly assign to trigger reactivity
        console.log("Got frequency data:", frequencyData.length);
      }
    } catch (error) {
      console.error("Error getting frequency data:", error);
    }
  } else if (!isSpeaking && frequencyData) {
    // Clear data when not speaking to reset mouth position
    frequencyData = null;
  }
  
  // Schedule the next frame regardless of speaking state
  animationFrameId = requestAnimationFrame(updateLipSync);
}

  onDestroy(async () => {
    if (animationFrameId) { 
      cancelAnimationFrame(animationFrameId);
    }

    if (conversation) {
      await conversation.endSession();
      console.log("Conversation ended");
    }
  });
</script>

<AnimatedAvatar frequencyData={frequencyData} />