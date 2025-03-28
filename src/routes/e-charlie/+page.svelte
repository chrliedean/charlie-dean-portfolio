<script context="module">
  export const windowMeta = {
    id: "e-charlie",
    title: "E-Charlie",
    route: "/e-charlie",
    defaultSize: { width: 400, height: 400 },
    maxSize: { width: 480, height: 480 },
    minSize: { width: 320, height: 320 },
    style: 'nopadding',
    icon: 'charlie'
  };
</script>

<script lang="ts">
  import { onMount } from "svelte";

  // Reference to the rapport-scene element
  let scene: RapportSceneElement;

  onMount(async () => {
    // Wait until the custom element is defined/upgraded.
    await customElements.whenDefined("rapport-scene");

    if (!scene) {
      console.error("rapport-scene element not found");
      return;
    }

    if (typeof scene.sessionRequest !== "function") {
      console.error(
        "sessionRequest is not available on the rapport-scene element"
      );
      return;
    }

    scene.sessionRequest({
      sessionConnected() {
        console.log("Session connected to rapport-scene");
        // Find and autoplay idle animation
        const idleAnimation = scene.animations
          .get()
          .find((animation) => animation.toLowerCase().includes("idle"));
        if (idleAnimation) {
          scene.animations.play(idleAnimation, true); // animation name, loop
        }

        // Autoplay "first_and_only_command"
        if (
          scene.modules.commands.data.commands.includes(
            "first_and_only_command"
          )
        ) {
          scene.modules.commands.trigger("first_and_only_command");
        }
      },
      sessionDisconnected() {
        console.log("Session disconnected from rapport-scene");
      },
    });
  });
</script>

<svelte:head>
  <title>Charlie Dean - E - Charlie</title>
  <meta
    name="description"
    content="E-Charlie is a virtual assistant based on the artist Charlie Dean."
  />
  <script
    src="https://cdn.rapport.cloud/rapport-web-viewer/rapport.js"
  ></script>
</svelte:head>

<!-- Bind the rapport-scene element to the `scene` variable -->
<rapport-scene
  bind:this={scene}
  project-id="3771910e-33e2-4829-b8ee-c1e262c0a7b6"
  project-token="fdc3b513-80d5-4add-86d2-349ca696f47d"
  ai-user-id="de2735b0-45ad-48a3-853a-a9005b37e137"
  lobby-zone-id="generated_lobby_id"
  progress-bar="true"
  style="width: 480px; height: 480px; max-width: 100%; max-height: 100%; background: #000000"
></rapport-scene>
