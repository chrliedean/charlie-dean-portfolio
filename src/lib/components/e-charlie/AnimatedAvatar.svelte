<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
  import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
  import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
  import type { VisemeEvent } from "$lib/utils/visemes";

  const modelPath: string = "/charlie-v2.glb";
  const enableTracking: boolean = true;
  const enableBlinking: boolean = true;

  // Define EmojiEvent interface here for the component
  interface EmojiEvent {
    emoji: string;
    start_ms: number;
  }

  let { visemeTimeline = [], audioPlaybackStartTime = null, emojiEvents = [] } = $props<{
    visemeTimeline: VisemeEvent[];
    audioPlaybackStartTime: number | null;
    emojiEvents: EmojiEvent[];
  }>();

  // Noise for idle jitter
  const noise = new SimplexNoise();

  // Glance variables
  let glanceActive = false;
  let glanceTimer: ReturnType<typeof setTimeout> | null = null;
  let glanceOffset = { x: 0, y: 0 };
  let glanceTarget = { x: 0, y: 0 };
  
  let disableIdleBlendshapes: boolean = false


  // DOM container reference
  let container: HTMLDivElement;

  // Three.js components
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;

  // Animation state
  const clock = new THREE.Clock();
  let threeClockAudioStartTime: number | null = null;

  let model = $state<THREE.Group | null>(null);
  let isLoading = $state(true);
  let loadingProgress = $state(0);
  let errorMessage = $state("");

  let gridMat: THREE.ShaderMaterial;
  let gridMesh: THREE.Mesh;
  // Bone references
  let leftEyeBone = $state<THREE.Object3D | null>(null);
  let rightEyeBone = $state<THREE.Object3D | null>(null);
  let skullBone = $state<THREE.Object3D | null>(null);
  let neckBone = $state<THREE.Object3D | null>(null);

  let faceMeshes = $state<THREE.Mesh[]>([]);

  // Animation control
  let blinkTimer: number | null = null;
  let idleTimer: number | null = null;
  let trackingActive = true;
  let resizeObserver: ResizeObserver | null = null;
  // Mouse position tracking
  let mousePosition = $state({ x: 0.5, y: 0.5 });
  let targetLook = { x: 0.5, y: 0.5 };
  let currentLook = { x: 0.5, y: 0.5 };

  const lipSmoothingSpeed = 15;
  const emojiSmoothingSpeed = 10; // Can use a different speed for expressions
  let currentVisemeInfluences = $state<Record<string, number>>({});
  
  // State for current emoji expression
  let currentActiveEmoji = $state<EmojiEvent | null>(null); // Track the latest active emoji event
  let currentEmojiDefinition = $state<any | null>(null); // Store its definition

  let currentEmojiInfluences = $state<Record<string, number>>({}); // Smoothed values for emoji shapes

  // Grid background

  // Available blendshape names for facial expressions
  const BLENDSHAPES = {
    // Eye blinking
    BROW_DOWN_LEFT: "browDownLeft",
    BROW_DOWN_RIGHT: "browDownRight",
    BROW_INNER_UP_LEFT: "browInnerUpLeft",
    BROW_INNER_UP_RIGHT: "browInnerUpRight",
    BROW_OUTER_UP_LEFT: "browOuterUpLeft",
    BROW_OUTER_UP_RIGHT: "browOuterUpRight",
    CHEEK_PUFF_LEFT: "cheekPuffLeft",
    CHEEK_PUFF_RIGHT: "cheekPuffRight",
    CHEEK_SQUINT_LEFT: "cheekSquintLeft",
    CHEEK_SQUINT_RIGHT: "cheekSquintRight",
    EYE_BLINK_LEFT: "eyeBlinkLeft",
    EYE_BLINK_RIGHT: "eyeBlinkRight",
    EYE_LOOK_DOWN_LEFT: "eyeLookDownLeft",
    EYE_LOOK_DOWN_RIGHT: "eyeLookDownRight",
    EYE_LOOK_IN_LEFT: "eyeLookInLeft",
    EYE_LOOK_IN_RIGHT: "eyeLookInRight",
    EYE_LOOK_OUT_LEFT: "eyeLookOutLeft",
    EYE_LOOK_OUT_RIGHT: "eyeLookOutRight",
    EYE_LOOK_UP_LEFT: "eyeLookUpLeft",
    EYE_LOOK_UP_RIGHT: "eyeLookUpRight",
    EYE_SQUINT_LEFT: "eyeSquintLeft",
    EYE_SQUINT_RIGHT: "eyeSquintRight",
    EYE_WIDE_LEFT: "eyeWideLeft",
    EYE_WIDE_RIGHT: "eyeWideRight",

    JAW_FORWARD: "jawForward",
    JAW_LEFT: "jawLeft",
    JAW_RIGHT: "jawRight",
    JAW_OPEN: "jawOpen",
    MOUTH_CLOSE: "mouthClose",
    MOUTH_DIMPLE_LEFT: "mouthDimpleLeft",
    MOUTH_DIMPLE_RIGHT: "mouthDimpleRight",
    MOUTH_FROWN_LEFT: "mouthFrownLeft",
    MOUTH_FROWN_RIGHT: "mouthFrownRight",
    MOUTH_FUNNEL: "mouthFunnel",
    MOUTH_LEFT: "mouthLeft",
    MOUTH_LOWER_DOWN_LEFT: "mouthLowerDownLeft",
    MOUTH_LOWER_DOWN_RIGHT: "mouthLowerDownRight",
    MOUTH_PRESS_LEFT: "mouthPressLeft",
    MOUTH_PRESS_RIGHT: "mouthPressRight",
    MOUTH_PUCKER: "mouthPucker",
    MOUTH_RIGHT: "mouthRight",
    MOUTH_ROLL_LOWER: "mouthRollLower",
    MOUTH_ROLL_UPPER: "mouthRollUpper",
    MOUTH_SHRUG_LOWER: "mouthShrugLower",
    MOUTH_SHRUG_UPPER: "mouthShrugUpper",
    MOUTH_SMILE_LEFT: "mouthSmileLeft",
    MOUTH_SMILE_RIGHT: "mouthSmileRight",
    MOUTH_STRETCH_LEFT: "mouthStretchLeft",
    MOUTH_STRETCH_RIGHT: "mouthStretchRight",
    MOUTH_UPPER_UP_LEFT: "mouthUpperUpLeft",
    MOUTH_UPPER_UP_RIGHT: "mouthUpperUpRight",
    NOSE_SNEER_LEFT: "noseSneerLeft",
    NOSE_SNEER_RIGHT: "noseSneerRight",

    BROW_INNER_UP: "browInnerUp",
    CHEEK_PUFF: "cheekPuff",
  };

  const EMOJI_BLENDSHAPES: Record<string, any> = {
   '😐': { dt: [300,2000], rescale: [0,1], vs: { pose: ['straight'], browInnerUp: [0.4], eyeWideLeft: [0.7], eyeWideRight: [0.7], mouthPressLeft: [0.6], mouthPressRight: [0.6], mouthRollLower: [0.3], mouthStretchLeft: [1], mouthStretchRight: [1] } },
      '😶': { link:  '😐' },
      '😏': { dt: [300,2000], rescale: [0,1], vs: { eyeContact: [0], browDownRight: [0.1], browInnerUp: [0.7], browOuterUpRight: [0.2], eyeLookInRight: [0.7], eyeLookOutLeft: [0.7], eyeSquintLeft: [1], eyeSquintRight: [0.8], eyesRotateY: [0.7], mouthLeft: [0.4], mouthPucker: [0.4], mouthShrugLower: [0.3], mouthShrugUpper: [0.2], mouthSmile: [0.2], mouthSmileLeft: [0.4], mouthSmileRight: [0.2], mouthStretchLeft: [0.5], mouthUpperUpLeft: [0.6], noseSneerLeft: [0.7] } },
      '🙂': { dt: [300,2000], rescale: [0,1], vs: { mouthSmile: [0.5] } },
      '🙃': { link:  '🙂' },
      '😊': { dt: [300,2000], rescale: [0,1], vs: { browInnerUp: [0.6], eyeSquintLeft: [1], eyeSquintRight: [1], mouthSmile: [0.7], noseSneerLeft: [0.7], noseSneerRight: [0.7]} },
      '😇': { link:  '😊' },
      '😀': { dt: [300,2000], rescale: [0,1], vs: { browInnerUp: [0.6], jawOpen: [0.1], mouthDimpleLeft: [0.2], mouthDimpleRight: [0.2], mouthPressLeft: [0.3], mouthPressRight: [0.3], mouthRollLower: [0.4], mouthShrugUpper: [0.4], mouthSmile: [0.7], mouthUpperUpLeft: [0.3], mouthUpperUpRight: [0.3], noseSneerLeft: [0.4], noseSneerRight: [0.4] }},
      '😃': { dt: [300,2000], rescale: [0,1], vs: { browInnerUp: [0.6], eyeWideLeft: [0.7], eyeWideRight: [0.7], jawOpen: [0.1], mouthDimpleLeft: [0.2], mouthDimpleRight: [0.2], mouthPressLeft: [0.3], mouthPressRight: [0.3], mouthRollLower: [0.4], mouthShrugUpper: [0.4], mouthSmile: [0.7], mouthUpperUpLeft: [0.3], mouthUpperUpRight: [0.3], noseSneerLeft: [0.4], noseSneerRight: [0.4] } },
      '😄': { dt: [300,2000], rescale: [0,1], vs: { browInnerUp: [0.3], eyeSquintLeft: [1], eyeSquintRight: [1], jawOpen: [0.2], mouthDimpleLeft: [0.2], mouthDimpleRight: [0.2], mouthPressLeft: [0.3], mouthPressRight: [0.3], mouthRollLower: [0.4], mouthShrugUpper: [0.4], mouthSmile: [0.7], mouthUpperUpLeft: [0.3], mouthUpperUpRight: [0.3], noseSneerLeft: [0.4], noseSneerRight: [0.4] } },
      '😁': { dt: [300,2000], rescale: [0,1], vs: { browInnerUp: [0.3], eyeSquintLeft: [1], eyeSquintRight: [1], jawOpen: [0.3], mouthDimpleLeft: [0.2], mouthDimpleRight: [0.2], mouthPressLeft: [0.5], mouthPressRight: [0.5], mouthShrugUpper: [0.4], mouthSmile: [0.7], mouthUpperUpLeft: [0.3], mouthUpperUpRight: [0.3], noseSneerLeft: [0.4], noseSneerRight: [0.4] } },
      '😆': { dt: [300,2000], rescale: [0,1], vs: { browInnerUp: [0.3], eyeSquintLeft: [1], eyeSquintRight: [1], eyesClosed: [0.6], jawOpen: [0.3], mouthDimpleLeft: [0.2], mouthDimpleRight: [0.2], mouthPressLeft: [0.5], mouthPressRight: [0.5], mouthShrugUpper: [0.4], mouthSmile: [0.7], mouthUpperUpLeft: [0.3], mouthUpperUpRight: [0.3], noseSneerLeft: [0.4], noseSneerRight: [0.4] } },
      '😝': { dt: [300,100,1500,500,500], rescale: [0,0,1,0,0], vs: { browInnerUp: [0.8], eyesClosed: [1], jawOpen: [0.7], mouthFunnel: [0.5], mouthSmile: [1], tongueOut: [0,1,1,0] } },
      '😋': { link:  '😝' }, '😛': { link:  '😝' }, '😜': { link:  '😝' }, '🤪': { link:  '😝' },
      '😂': { dt: [300,2000], rescale: [0,1], vs: { browInnerUp: [0.3], eyeSquintLeft: [1], eyeSquintRight: [1], eyesClosed: [0.6], jawOpen: [0.3], mouthDimpleLeft: [0.2], mouthDimpleRight: [0.2], mouthPressLeft: [0.5], mouthPressRight: [0.5], mouthShrugUpper: [0.4], mouthSmile: [0.7], mouthUpperUpLeft: [0.3], mouthUpperUpRight: [0.3], noseSneerLeft: [0.4], noseSneerRight: [0.4] } },
      '🤣': { link:  '😂' }, '😅': { link:  '😂' },
      '😉': { dt: [500,200,500,500], rescale: [0,0,0,1], vs: { mouthSmile: [0.5], mouthSmileLeft: [0,0.5,0], eyeBlinkLeft: [0,0.7,0], eyeBlinkRight: [0,0,0], bodyRotateX: [0.05,0.05,0.05,0], bodyRotateZ: [-0.05,-0.05,-0.05,0], browDownLeft: [0,0.7,0], cheekSquintLeft: [0,0.7,0], eyeSquintLeft: [0,1,0], eyesClosed: [0] } },

      '😭': { dt: [1000,1000], rescale: [0,1], vs: { browInnerUp: [1], eyeSquintLeft: [1], eyeSquintRight: [1], eyesClosed: [0.1], jawOpen: [0], mouthFrownLeft: [1], mouthFrownRight: [1], mouthPucker: [0.5], mouthUpperUpLeft: [0.6], mouthUpperUpRight: [0.6] } },
      '🥺': { dt: [1000,1000], rescale: [0,1], vs: { browDownLeft: [0.2], browDownRight: [0.2], browInnerUp: [1], eyeWideLeft: [0.9], eyeWideRight: [0.9], eyesClosed: [0.1], mouthClose: [0.2], mouthFrownLeft: [1], mouthFrownRight: [1], mouthPressLeft: [0.4], mouthPressRight: [0.4], mouthPucker: [1], mouthRollLower: [0.6], mouthRollUpper: [0.2], mouthUpperUpLeft: [0.8], mouthUpperUpRight: [0.8] } },
      '😞': { dt: [1000,1000], rescale: [0,1], vs: { browInnerUp: [0.7], eyeSquintLeft: [1], eyeSquintRight: [1], eyesClosed: [0.5], bodyRotateX: [0.3], mouthClose: [0.2], mouthFrownLeft: [1], mouthFrownRight: [1], mouthPucker: [1], mouthRollLower: [1], mouthShrugLower: [0.2], mouthUpperUpLeft: [0.8], mouthUpperUpRight: [0.8] } },
      '😔': { dt: [1000,1000], rescale: [0,1], vs: { browInnerUp: [1], eyeSquintLeft: [1], eyeSquintRight: [1], eyesClosed: [0.5], bodyRotateX: [0.3], mouthClose: [0.2], mouthFrownLeft: [1], mouthFrownRight: [1], mouthPressLeft: [0.4], mouthPressRight: [0.4], mouthPucker: [1], mouthRollLower: [0.6], mouthRollUpper: [0.2], mouthUpperUpLeft: [0.8], mouthUpperUpRight: [0.8] } },
      '😳': { dt: [1000,1000], rescale: [0,1], vs: { browInnerUp: [1], eyeWideLeft: [0.5], eyeWideRight: [0.5], eyesRotateY: [0.05], eyesRotateX: [0.05], mouthClose: [0.2], mouthFunnel: [0.5], mouthPucker: [0.4], mouthRollLower: [0.4], mouthRollUpper: [0.4] } },
      '☹️': { dt: [500,1500], rescale: [0,1], vs: { mouthFrownLeft: [1], mouthFrownRight: [1], mouthPucker: [0.1], mouthRollLower: [0.8] } },

      '😚': { dt: [500,1000,1000], rescale: [0,1,0], vs: { browInnerUp: [0.6], eyeBlinkLeft: [1], eyeBlinkRight: [1], eyeSquintLeft: [1], eyeSquintRight: [1], mouthPucker: [0,0.5], noseSneerLeft: [0,0.7], noseSneerRight: [0,0.7], viseme_U: [0,1] } },
      '😘': { dt: [500,500,200,500], rescale: [0,0,0,1], vs: { browInnerUp: [0.6], eyeBlinkLeft: [0,0,1,0], eyeBlinkRight: [0], eyesRotateY: [0], bodyRotateY: [0], bodyRotateX: [0,0.05,0.05,0], bodyRotateZ: [0,-0.05,-0.05,0], eyeSquintLeft: [1], eyeSquintRight: [1], mouthPucker: [0,0.5,0], noseSneerLeft: [0,0.7], noseSneerRight: [0.7], viseme_U: [0,1] } },
      '🥰': { dt: [1000,1000], rescale: [0,1], vs: { browInnerUp: [0.6], eyeSquintLeft: [1], eyeSquintRight: [1], mouthSmile: [0.7], noseSneerLeft: [0.7], noseSneerRight: [0.7] } },
      '😍': { dt: [1000,1000], rescale: [0,1], vs: { browInnerUp: [0.6], jawOpen: [0.1], mouthDimpleLeft: [0.2], mouthDimpleRight: [0.2], mouthPressLeft: [0.3], mouthPressRight: [0.3], mouthRollLower: [0.4], mouthShrugUpper: [0.4], mouthSmile: [0.7], mouthUpperUpLeft: [0.3], mouthUpperUpRight: [0.3], noseSneerLeft: [0.4], noseSneerRight: [0.4] } },
      '🤩': { link:  '😍' },

      '😡': { dt: [1000,1500], rescale: [0,1], vs: { browDownLeft: [1], browDownRight: [1], eyesLookUp: [0.2], jawForward: [0.3], mouthFrownLeft: [1], mouthFrownRight: [1], bodyRotateX: [0.15] } },
      '😠': { dt: [1000,1500], rescale: [0,1], vs: { browDownLeft: [1], browDownRight: [1], eyesLookUp: [0.2], jawForward: [0.3], mouthFrownLeft: [1], mouthFrownRight: [1], bodyRotateX: [0.15] } },
      '🤬': { link:  '😠' },
      '😒': { dt: [1000,1000], rescale: [0,1], vs: { eyeContact: [0], browDownRight: [0.1], browInnerUp: [0.7], browOuterUpRight: [0.2], eyeLookInRight: [0.7], eyeLookOutLeft: [0.7], eyeSquintLeft: [1], eyeSquintRight: [0.8], eyesRotateY: [0.7], mouthFrownLeft: [1], mouthFrownRight: [1], mouthLeft: [0.2], mouthPucker: [0.5], mouthRollLower: [0.2], mouthRollUpper: [0.2], mouthShrugLower: [0.2], mouthShrugUpper: [0.2], mouthStretchLeft: [0.5] } },

      '😱': { dt: [500,1500], rescale: [0,1], vs: { browInnerUp: [0.8], eyeWideLeft: [0.5], eyeWideRight: [0.5], jawOpen: [0.7], mouthFunnel: [0.5] } },
      '😬': { dt: [500,1500], rescale: [0,1], vs: { browDownLeft: [1], browDownRight: [1], browInnerUp: [1], mouthDimpleLeft: [0.5], mouthDimpleRight: [0.5], mouthLowerDownLeft: [1], mouthLowerDownRight: [1], mouthPressLeft: [0.4], mouthPressRight: [0.4], mouthPucker: [0.5], mouthSmile: [0.1], mouthSmileLeft: [0.2], mouthSmileRight: [0.2], mouthStretchLeft: [1], mouthStretchRight: [1], mouthUpperUpLeft: [1], mouthUpperUpRight: [1] } },
  };

  // Blendshape management
  let blendshapeMap = $state<Record<string, THREE.Mesh[]>>({});

  const OCULUS_VISEME_NAMES = [
    "viseme_sil",
    "viseme_PP",
    "viseme_FF",
    "viseme_TH",
    "viseme_DD",
    "viseme_kk",
    "viseme_CH",
    "viseme_SS",
    "viseme_nn",
    "viseme_RR",
    "viseme_aa",
    "viseme_E",
    "viseme_I",
    "viseme_O",
    "viseme_U",
  ];

  // On mount.
  onMount(() => {
    initScene();
    loadModel();

    // Debug: Log available emoji definitions
    console.log("Available emoji animations:", Object.keys(EMOJI_BLENDSHAPES));

    // Start tracking mouse movement
    if (enableTracking) {
      window.addEventListener("mousemove", trackMouseMovement);
    }

    resizeObserver = new ResizeObserver(() => {
      onContainerResize();
    });
    resizeObserver.observe(container);

    // Glance interval
    setInterval(
      () => {
        if (!trackingActive || !enableTracking) return;
        triggerGlance();
      },
      6000 + Math.random() * 4000
    ); // glance every 6–10 sec

    // Start animation loop
    animate();

    // Handle window resize

    return () => {
      // Cleanup on component unmount
      window.removeEventListener("mousemove", trackMouseMovement);

      // Clear animation timers
      if (blinkTimer) window.clearInterval(blinkTimer);
      if (idleTimer) window.clearInterval(idleTimer);

      if (renderer) {
        renderer.dispose();
      }

      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  });

  //------------------------------------------------------------------------------------------------
  //                                LIP SYNC FUNCTIONS
  //------------------------------------------------------------------------------------------------
  $effect(() => {
    if (audioPlaybackStartTime !== null) {
      threeClockAudioStartTime = clock.getElapsedTime();
      console.log(
        "Audio start detected in Avatar. Three Clock:",
        threeClockAudioStartTime
      );
      // Sort emoji events by start time when audio starts, just in case
      emojiEvents.sort((a: EmojiEvent, b: EmojiEvent) => a.start_ms - b.start_ms);
    } else {
      threeClockAudioStartTime = null;
      resetVisemeBlendshapes(); // Reset lips when audio stops
      resetEmojiBlendshapes(); // Reset emoji expressions when audio stops
    }
  });
  
  // Helper function to get emoji animation definition
  function getEmojiAnimation(emoji: string): any {
    const definition = EMOJI_BLENDSHAPES[emoji];
    console.log("Get emoji animation for:", emoji)
    if (definition) {
      // If this emoji links to another emoji, follow the link
      if (definition.link) {
        return EMOJI_BLENDSHAPES[definition.link];
      }
      return definition;
    }
    return null;
  }

  //------------------------------------------------------------------------------------------------
  //                                INITIALIZE SCENE
  //------------------------------------------------------------------------------------------------
  function initScene(): void {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x123195);

    // Create camera
    camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 1.5;

    // Create renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(0.5, 1.5, 2);
    scene.add(directionalLight);

    const gridSize = 1000;
    const gridGeo = new THREE.PlaneGeometry(gridSize, gridSize, 1, 1);

    gridMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
      },
      vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv * 500.0; // Keep scaling here
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
      fragmentShader: `
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      // Define line thickness relative to grid spacing
      float thickness = 0.05; // Adjust for desired thickness

      // Animate the grid position slightly
      vec2 animatedUv = vUv + uTime * 0.5; 

      // Calculate distance to the nearest grid line (horizontal and vertical)
      vec2 gridPos = fract(animatedUv); // Position within the current grid cell (0 to 1)
      vec2 distToLine = min(gridPos, 1.0 - gridPos); // Distance to closest edge (0 or 1)

      // Check if within thickness threshold for either X or Y lines
      // smoothstep creates anti-aliasing
      float lineX = 1.0 - smoothstep(thickness, thickness + 0.02, distToLine.x);
      float lineY = 1.0 - smoothstep(thickness, thickness + 0.02, distToLine.y);

      // Combine lines - max means if either X or Y is a line, it's drawn
      float gridIntensity = max(lineX, lineY);

      // Mix color based on grid intensity
      vec3 bgColor = vec3(0.0, 0.0, 0.1); // Dark blue background
      vec3 lineColor = vec3(0.8, 0.9, 1.0); // Light neon blue
      vec3 color = mix(bgColor, lineColor, gridIntensity); 
      
      gl_FragColor = vec4(color, 1.0);
    }
  `,
      side: THREE.DoubleSide,
    });

    gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.rotation.x = -1;
    gridMesh.position.y = -10;
    scene.add(gridMesh);
  }

  // -------------------------------- LOAD MODEL --------------------------------
  function loadModel(): void {
    const dracoLoader = new DRACOLoader(); //

    // 2. Set the path to the Draco decoder files you copied to your static/public folder
    //    Adjust '/draco-decoder-jsm/' to the actual path you used.
    //    Common paths: '/draco/', '/decoder/draco/', '/libs/draco/'
    dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
    ); // IMPORTANT: Path relative to web server root!
    dracoLoader.setDecoderConfig({ type: "js" }); // Optional: force JS decoder if WASM causes issues

    // 3. Instantiate GLTFLoader
    const loader = new GLTFLoader(); //

    // 4. Associate DRACOLoader with GLTFLoader
    loader.setDRACOLoader(dracoLoader); //

    // 5. Load the GLB file
    loader.load(
      //
      modelPath, // Your '/charlie.glb' path
      (gltf) => {
        model = gltf.scene;

        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.2 / maxDim;
        gltf.scene.scale.set(scale, scale, scale);

        gltf.scene.position.x = -center.x * scale;
        gltf.scene.position.y = -center.y * scale;
        gltf.scene.position.z = -center.z * scale;

        scene.add(gltf.scene);

        findBones();

        findAndMapMeshes();
        
        // Initialize all influences for visemes and emoji expressions
        initializeAllInfluences();

        if (enableBlinking) startBlinking();

        isLoading = false;
        console.log("Model loaded successfully (with DRACO support)");
      },
      (xhr) => {
        loadingProgress = Math.floor((xhr.loaded / xhr.total) * 100);
      },
      (error) => {
        errorMessage = "Error loading model";
        console.error("Model loading error:", error);
        isLoading = false;
      }
    );
  }

  // -------------------------------- FIND BONES --------------------------------
  function findBones(): void {
    if (!model) return;

    leftEyeBone = model.getObjectByName("eyeball_L") || null;
    rightEyeBone = model.getObjectByName("eyeball_R") || null;
    skullBone = model.getObjectByName("skull") || null;
    neckBone = model.getObjectByName("neck") || null;

    if (leftEyeBone) {leftEyeBone.userData.initialRotation = leftEyeBone.rotation.clone();} else {console.warn("❌ Left eye not found");}
    if (rightEyeBone) {rightEyeBone.userData.initialRotation = rightEyeBone.rotation.clone();} else {console.warn("❌ Right eye not found");}
    if (skullBone) {skullBone.userData.initialRotation = skullBone.rotation.clone();} else {console.warn("❌ Skull not found");}
    if (neckBone) {neckBone.userData.initialRotation = neckBone.rotation.clone();} else {console.warn("❌ Neck not found");}
  }

  // -------------------------------- MAP BLENDSHAPES --------------------------------
  function findAndMapMeshes(): void {
  if (!model) return;

  const meshesWithMorphs: THREE.Mesh[] = [];
  model.traverse((node) => {
    // Check if it's a SkinnedMesh with morph targets
    if (node instanceof THREE.SkinnedMesh && node.morphTargetInfluences && node.morphTargetDictionary) {
      meshesWithMorphs.push(node);
    } 
    // Else, check if it's a regular Mesh with morph targets
    else if (node instanceof THREE.Mesh && !(node instanceof THREE.SkinnedMesh) && node.morphTargetInfluences && node.morphTargetDictionary) {
      meshesWithMorphs.push(node);
    }
  });

  if (meshesWithMorphs.length === 0) {
      console.warn("❌ No meshes with morph targets found!");
      return;
  }
  // Store the found meshes directly
  faceMeshes = meshesWithMorphs;
  console.log(`✅ Found ${faceMeshes.length} mesh(es) with morph targets.`);

  // OPTIONAL: You can still populate blendshapeMap for non-viseme shapes if needed
  blendshapeMap = {}; // Clear previous map
  Object.values(BLENDSHAPES).forEach(arkitName => {
     // Check if this ARKit name exists on the first found mesh's dictionary
     // Use optional chaining just in case faceMeshes[0] or morphTargetDictionary is somehow undefined
     if (faceMeshes[0]?.morphTargetDictionary?.[arkitName] !== undefined) { 
         blendshapeMap[arkitName] = faceMeshes; // Assign relevant meshes
     }
  });
   console.log("Mapped non-viseme blendshapes:", Object.keys(blendshapeMap));
}

  // -------------------------------- SET BLENDSHAPE VALUE --------------------------------
  function setBlendshapeValue(name: string, value: number): void {
  // Iterate through the stored face meshes directly
  faceMeshes.forEach((mesh) => {
    // Check if this mesh has the morph target dictionary
    const morphDict = mesh.morphTargetDictionary as Record<string, number>;


    // --- DEBUG LOG FOR EMOJIS ---
    // if (!name.startsWith('viseme_') && value > 0.01 && disableIdleBlendshapes) { // Log only active non-viseme shapes
    //      const found = morphDict && name in morphDict;
    //      console.log(`Applying Emoji/Other Shape: ${name} = ${value.toFixed(2)}. Found in dict: ${found}`);
    //      if(morphDict && !found) console.log(`Available keys: ${Object.keys(morphDict).join(', ')}`); // Log keys if not found
    // }
    // --- END DEBUG ---

    if (morphDict && name in morphDict) {
      const index = morphDict[name];
      if (mesh.morphTargetInfluences && index !== undefined && index < mesh.morphTargetInfluences.length) {
         // Basic check to prevent NaN/Infinity affecting influences
         if (isFinite(value)) {
             mesh.morphTargetInfluences[index] = THREE.MathUtils.clamp(value, 0, 1); // Clamp value just in case
         } else {
             console.warn(`Attempted to set invalid value (${value}) for blendshape: ${name}`);
         }
      }
    }
    // Optional: Add a log if a specific viseme name ISN'T found, helps debug model export
    // else if (name.startsWith('viseme_')) {
    //    console.warn(`Viseme shape key "${name}" not found in morphTargetDictionary for mesh ${mesh.name}`);
    // }
  });
}

  // -------------------------------- RESET ALL BLENDSHAPES --------------------------------
  function resetAllBlendshapes(): void {
    Object.keys(blendshapeMap).forEach((name) => {
      setBlendshapeValue(name, 0);
    });
    resetVisemeBlendshapes();
    resetEmojiBlendshapes();
  }

  function resetVisemeBlendshapes(): void {
    OCULUS_VISEME_NAMES.forEach((name) => {
      setBlendshapeValue(name, 0);
    });
  }
  
  // Function to reset emoji state
  function resetEmojiBlendshapes(): void {
    currentActiveEmoji = null; // Reset the currently active emoji event
    currentEmojiDefinition = null;
    disableIdleBlendshapes = false; // Re-enable idle movements
    // Reset influences (assuming ARKit names are in BLENDSHAPES)
    // Iterate through all known blendshapes (visemes + potential emoji shapes)
    const allShapeNames = new Set([...OCULUS_VISEME_NAMES, ...Object.values(BLENDSHAPES)]);
    allShapeNames.forEach(name => {
       if (typeof name === 'string' && !name.startsWith('viseme_')) { // Only reset non-viseme shapes here
          currentEmojiInfluences[name] = 0;
          // Optionally call setBlendshapeValue here too if immediate reset needed
          setBlendshapeValue(name, 0);
       }
    });
  }

  // Initialize all influences
  function initializeAllInfluences(): void {
    OCULUS_VISEME_NAMES.forEach(name => { 
      currentVisemeInfluences[name] = 0; 
    });
    resetEmojiBlendshapes(); // Use this to initialize emoji influences too
    console.log("Initialized all influences");
  }

  // -------------------------------- RESET BONES --------------------------------
  function resetBones(): void {
    if (leftEyeBone && leftEyeBone.userData.initialRotation) {
      leftEyeBone.rotation.copy(leftEyeBone.userData.initialRotation);
    }

    if (rightEyeBone && rightEyeBone.userData.initialRotation) {
      rightEyeBone.rotation.copy(rightEyeBone.userData.initialRotation);
    }

    if (skullBone && skullBone.userData.initialRotation) {
      skullBone.rotation.copy(skullBone.userData.initialRotation);
    }

    if (neckBone && neckBone.userData.initialRotation) {
      neckBone.rotation.copy(neckBone.userData.initialRotation);
    }
  }

  // -------------------------------- HANDLE WINDOW RESIZE --------------------------------
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  function onContainerResize(): void {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (!camera || !renderer || !container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }, 50); // debounce to avoid flicker
  }

  // ------------------------------------------------------------------------------------------------
  //                                HELPER FUNCTIONS
  // ------------------------------------------------------------------------------------------------

  // -------------------------------- TWEEN BLENDSHAPE VALUE --------------------------------
  function tweenBlendshape(
    name: string,
    to: number,
    duration: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      const from = getBlendshapeValue(name);
      const animate = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const value = from + (to - from) * t;
        setBlendshapeValue(name, value);
        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  // -------------------------------- GET BLENDSHAPE VALUE --------------------------------
  function getBlendshapeValue(name: string): number {
    const meshes = blendshapeMap[name];
    if (meshes && meshes.length > 0) {
      const morphDict = (meshes[0] as any).morphTargetDictionary;
      const index = morphDict[name];
      return meshes[0].morphTargetInfluences?.[index] ?? 0;
    }
    return 0;
  }

  // ------------------------------------------------------------------------------------------------
  //                            TRACKING FUNCTIONS
  // ------------------------------------------------------------------------------------------------

  // -------------------------------- MOUSE TRACKING --------------------------------
  function trackMouseMovement(event: MouseEvent): void {
    if (!trackingActive || !enableTracking) return;

    // Normalize coordinates to 0-1 range
    const x = event.clientX / window.innerWidth;
    const y = event.clientY / window.innerHeight;

    targetLook = { x: 1 - x, y: 1 - y };
  }

  // -------------------------------- EYE TRACKING --------------------------------
  function updateEyeTracking(): void {
    if (!trackingActive || !enableTracking) return;

    // Convert normalized coordinates to rotation range
    // from center (0.5, 0.5) to edge (0, 0) or (1, 1)
    const lookX = (mousePosition.x - 0.5) * 2; // -1 to 1
    const lookY = (0.5 - mousePosition.y) * 2; // -1 to 1

    // Rotate eyeball bones if available
    rotateHeadAndNeck(lookX, lookY);
    rotateEyeBones(lookX, lookY);

    // Add eye blendshapes for more realism
    updateEyeBlendshapes(lookX, lookY);
  }

  // -------------------------------- EYE BONES --------------------------------
  function rotateEyeBones(lookX: number, lookY: number): void {
    const maxEyeRotationX = THREE.MathUtils.degToRad(30); // horizontal
    const maxEyeRotationY = THREE.MathUtils.degToRad(20); // vertical

    const eyeRotY = lookX * maxEyeRotationX;
    const eyeRotX = lookY * maxEyeRotationY;

    if (rightEyeBone && rightEyeBone.userData.initialRotation) {
      rightEyeBone.rotation.copy(rightEyeBone.userData.initialRotation);
      rightEyeBone.rotateX(-eyeRotX);
      rightEyeBone.rotateZ(-eyeRotY);
    }

    if (leftEyeBone && leftEyeBone.userData.initialRotation) {
      leftEyeBone.rotation.copy(leftEyeBone.userData.initialRotation);
      leftEyeBone.rotateX(-eyeRotX);
      leftEyeBone.rotateZ(-eyeRotY);
    }
  }

  // -------------------------------- HEAD AND NECK --------------------------------
  function rotateHeadAndNeck(lookX: number, lookY: number): void {
    const maxSkullRotationX = THREE.MathUtils.degToRad(15);
    const maxSkullRotationY = THREE.MathUtils.degToRad(20);
    const maxNeckRotationX = THREE.MathUtils.degToRad(10);
    const maxNeckRotationY = THREE.MathUtils.degToRad(15);

    const skullRotY = lookX * maxSkullRotationY * 0.5;
    const skullRotX = lookY * maxSkullRotationX * 0.5;
    const neckRotY = lookX * maxNeckRotationY * 0.3;
    const neckRotX = lookY * maxNeckRotationX * 0.3;

    if (skullBone && skullBone.userData.initialRotation) {
      skullBone.rotation.copy(skullBone.userData.initialRotation);
      skullBone.rotateX(skullRotX);
      skullBone.rotateZ(skullRotY);
    }

    if (neckBone && neckBone.userData.initialRotation) {
      neckBone.rotation.copy(neckBone.userData.initialRotation);
      neckBone.rotateX(neckRotX);
      neckBone.rotateZ(neckRotY);
    }
  }

  // -------------------------------- EYE BLENDSHAPES --------------------------------
  function updateEyeBlendshapes(lookX: number, lookY: number): void {
    if (disableIdleBlendshapes) return;
    // Reset existing eye shape blendshapes
    setBlendshapeValue(BLENDSHAPES.EYE_SQUINT_LEFT, 0);
    setBlendshapeValue(BLENDSHAPES.EYE_SQUINT_RIGHT, 0);
    setBlendshapeValue(BLENDSHAPES.EYE_WIDE_LEFT, 0);
    setBlendshapeValue(BLENDSHAPES.EYE_WIDE_RIGHT, 0);

    // Add a slight squint when looking at extreme angles
    const extremeLook = Math.max(Math.abs(lookX), Math.abs(lookY));
    if (extremeLook > 0.7) {
      const squintAmount = (extremeLook - 0.7) * 0.5; // Max 0.15 at extreme
      setBlendshapeValue(BLENDSHAPES.EYE_SQUINT_LEFT, squintAmount);
      setBlendshapeValue(BLENDSHAPES.EYE_SQUINT_RIGHT, squintAmount);
    }

    // Add slight widening when looking up
    if (lookY > 0.5) {
      const wideAmount = (lookY - 0.5) * 0.4;
      setBlendshapeValue(BLENDSHAPES.EYE_WIDE_LEFT, wideAmount);
      setBlendshapeValue(BLENDSHAPES.EYE_WIDE_RIGHT, wideAmount);
    }
  }

  // ------------------------------------------------------------------------------------------------
  //                                BLINKING AND GLANCE FUNCTIONS
  // ------------------------------------------------------------------------------------------------
  function startBlinking(): void {
    if (disableIdleBlendshapes) return;
    const randomBlinkInterval = (): number => 1000 + Math.random() * 8000;

    const doBlink = async (): Promise<void> => {
      await Promise.all([
        tweenBlendshape(BLENDSHAPES.EYE_BLINK_LEFT, 1, 80),
        tweenBlendshape(BLENDSHAPES.EYE_BLINK_RIGHT, 1, 80),
      ]);

      await new Promise((resolve) => setTimeout(resolve, 100));

      await Promise.all([
        tweenBlendshape(BLENDSHAPES.EYE_BLINK_LEFT, 0, 100),
        tweenBlendshape(BLENDSHAPES.EYE_BLINK_RIGHT, 0, 100),
      ]);

      // Schedule the next blink randomly
      blinkTimer = window.setTimeout(doBlink, randomBlinkInterval());
    };

    doBlink(); // Start the blink cycle
  }

  // -------------------------------- GLANCE -----------------------------
  function triggerGlance(): void {
    if (glanceActive) return;
    glanceActive = true;

    if (trackingActive) {
      trackingActive = false;

      glanceTarget = {
        x: (Math.random() - 0.5) * 0.6,
        y: (Math.random() - 0.5) * 0.4,
      };

      setTimeout(
        () => {
          glanceTarget = { x: 0, y: 0 };
        },
        800 + Math.random() * 400
      );
      // Random offset within a small range
      glanceOffset = {
        x: (Math.random() - 0.5) * 0.6, // -0.3 to 0.3
        y: (Math.random() - 0.5) * 0.4, // -0.2 to 0.2
      };

      // Return eyes after a short pause
      glanceTimer = setTimeout(
        () => {
          glanceOffset = { x: 0, y: 0 };
          glanceActive = false;
        },
        800 + Math.random() * 400
      ); // hold for ~0.8-1.2 sec
    }
    trackingActive = true;
  }

  //------------------------------------------------------------------------------------------------
  //                                ANIMATION LOOP
  //------------------------------------------------------------------------------------------------
  function animate(): void {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.elapsedTime;

    // Lerp currentLook toward targetLook
    currentLook.x += (targetLook.x - currentLook.x) * 0.05;
    currentLook.y += (targetLook.y - currentLook.y) * 0.05;

    // Add subtle head jitter
    const noiseX = noise.noise(time * 0.5, 0) * 0.05;
    const noiseY = noise.noise(0, time * 0.5) * 0.03;

    const jitteredLookX = currentLook.x + noiseX;
    const jitteredLookY = currentLook.y + noiseY;

    glanceOffset.x += (glanceTarget.x - glanceOffset.x) * 0.1;
    glanceOffset.y += (glanceTarget.y - glanceOffset.y) * 0.1;

    const glanceLookX = jitteredLookX + glanceOffset.x;
    const glanceLookY = jitteredLookY + glanceOffset.y;

    if (trackingActive && enableTracking) {
      // Head + neck follows smoothed target
      rotateEyeBones((glanceLookX - 0.5) * 2, (0.5 - glanceLookY) * 2);
      rotateHeadAndNeck((jitteredLookX - 0.5) * 2, (0.5 - jitteredLookY) * 2);
      updateEyeBlendshapes((glanceLookX - 0.5) * 2, (0.5 - glanceLookY) * 2);
    }

    // --- LIP SYNC & EMOJI ANIMATION LOGIC ---
    let elapsedAudioTimeMs = -1;
    if (threeClockAudioStartTime !== null) {
      elapsedAudioTimeMs = (time - threeClockAudioStartTime) * 1000;
    }

    // --- 1. Determine Target Viseme Values ---
    const targetVisemeValues: { [key: string]: number } = {};
    if (elapsedAudioTimeMs >= 0 && visemeTimeline.length > 0) {
      for (const event of visemeTimeline) {
        if (elapsedAudioTimeMs >= event.start && elapsedAudioTimeMs <= event.end) {
          const morphTargetName = 'viseme_' + event.viseme;
          targetVisemeValues[morphTargetName] = 1.0;
        }
      }
    }

    // --- 2. Determine Target Emoji Values ---
    const targetEmojiValues: { [key: string]: number } = {};

    // Find the latest emoji that should be active based on start time
    let latestEmojiEvent: EmojiEvent | null = null;
    if (elapsedAudioTimeMs >= 0 && emojiEvents.length > 0) {
        for (let i = emojiEvents.length - 1; i >= 0; i--) {
            if (elapsedAudioTimeMs >= emojiEvents[i].start_ms) {
                latestEmojiEvent = emojiEvents[i];
                break;
            }
        }
    }
    
    // Check if the active emoji needs to change
    if (latestEmojiEvent && latestEmojiEvent.emoji !== currentActiveEmoji?.emoji) {
        console.log(`Switching emoji: ${currentActiveEmoji?.emoji || 'none'} -> ${latestEmojiEvent.emoji} at ${elapsedAudioTimeMs.toFixed(0)}ms`);
        currentActiveEmoji = latestEmojiEvent;
        currentEmojiDefinition = getEmojiAnimation(currentActiveEmoji.emoji);
        
        if (currentEmojiDefinition && currentEmojiDefinition.vs) {
             disableIdleBlendshapes = true; // Disable idle movements when an emoji is active
             console.log(`   Definition found for ${currentActiveEmoji.emoji}`);
        } else {
             disableIdleBlendshapes = false; // Re-enable if no definition found
             console.log(`   No valid animation definition found for ${currentActiveEmoji.emoji}`);
             currentEmojiDefinition = null; // Clear definition if invalid
        }

    } else if (!latestEmojiEvent && currentActiveEmoji) {
        // This case should ideally not happen if audio is still playing and events exist,
        // but handles resetting if somehow no event is found mid-playback.
        // Resetting primarily happens via the $effect hook when audio stops.
        // console.log(`Clearing active emoji ${currentActiveEmoji.emoji} as no event found at ${elapsedAudioTimeMs.toFixed(0)}ms`);
        // currentActiveEmoji = null;
        // currentEmojiDefinition = null;
        // disableIdleBlendshapes = false;
    }

    // If an emoji is active, set its target blend values
    if (currentActiveEmoji && currentEmojiDefinition && currentEmojiDefinition.vs) {
        const values = currentEmojiDefinition.vs;
        for (const blendshapeName in values) {
            const valueSequence = values[blendshapeName];
            let targetValue = 0;

            // Determine the target value: use number directly, or first element of array
            if (typeof valueSequence === 'number') {
                targetValue = valueSequence;
            } else if (Array.isArray(valueSequence) && valueSequence.length > 0 && typeof valueSequence[0] === 'number') {
                // Use the first value in the sequence as the target hold value
                // We could adapt this later to use `dt` if needed, but for now, hold the initial pose.
                targetValue = valueSequence[0]; 
            }

            targetEmojiValues[blendshapeName] = targetValue;
        }
    }

    // --- 3. Smooth & Combine Viseme and Emoji Influences ---
    const finalBlendValues: { [key: string]: number } = {};

    // Smooth Visemes
    OCULUS_VISEME_NAMES.forEach(name => {
      const targetValue = targetVisemeValues[name] || 0;
      let currentValue = currentVisemeInfluences[name] || 0;
      const lerpFactor = 1.0 - Math.exp(-lipSmoothingSpeed * delta);
      const newValue = currentValue + (targetValue - currentValue) * lerpFactor;
      const finalValue = (newValue < 0.001) ? 0 : THREE.MathUtils.clamp(newValue, 0, 1);
      currentVisemeInfluences[name] = finalValue;
      finalBlendValues[name] = finalValue; // Start with viseme value
    });

    // Identify all possible emoji blendshape names from definitions and current influences
    const allEmojiShapeNames = new Set([
        ...Object.values(BLENDSHAPES), // Base shapes
        ...Object.keys(currentEmojiInfluences) // Currently smoothed shapes
    ]);
    if (currentEmojiDefinition && currentEmojiDefinition.vs) {
        Object.keys(currentEmojiDefinition.vs).forEach(name => allEmojiShapeNames.add(name)); // Shapes from current definition
    }

    // Smooth Emojis
    allEmojiShapeNames.forEach(name => {
      if (typeof name === 'string' && !name.startsWith('viseme_')) { // Don't smooth visemes here
        const targetValue = targetEmojiValues[name] || 0; // Target from emoji logic (or 0 if emoji ended)
        let currentValue = currentEmojiInfluences[name] || 0;
        const lerpFactor = 1.0 - Math.exp(-emojiSmoothingSpeed * delta);
        const newValue = currentValue + (targetValue - currentValue) * lerpFactor;
        const finalValue = (newValue < 0.001) ? 0 : THREE.MathUtils.clamp(newValue, 0, 1);
        currentEmojiInfluences[name] = finalValue;

        // Combine with viseme value (take maximum) - only for shapes NOT controlled by visemes
        if (!OCULUS_VISEME_NAMES.includes(name)) {
            finalBlendValues[name] = Math.max(finalBlendValues[name] || 0, finalValue);
        }
      }
    });

    // --- 4. Apply Final Values ---
    // Apply all calculated values (visemes + emojis combined)
    for (const shapeName in finalBlendValues) {
      setBlendshapeValue(shapeName, finalBlendValues[shapeName]);
    }

    gridMat.uniforms.uTime.value = clock.elapsedTime * 5.0;
    renderer.render(scene, camera);
  }

  //------------------------------------------------------------------------------------------------
  //                                MANUAL TRIGGER FUNCTIONS
  //------------------------------------------------------------------------------------------------

  // Toggle mouse tracking on/off
  export function toggleTracking(enabled?: boolean): void {
    if (enabled !== undefined) {
      trackingActive = enabled;
    } else {
      trackingActive = !trackingActive;
    }
  }

  // Manually trigger a blink
  export function triggerBlink(): Promise<void> {
    return new Promise((resolve) => {
      const wasTracking = trackingActive;
      trackingActive = false;

      // Set blink on
      setBlendshapeValue(BLENDSHAPES.EYE_BLINK_LEFT, 1);
      setBlendshapeValue(BLENDSHAPES.EYE_BLINK_RIGHT, 1);

      // Hold for 100ms
      setTimeout(() => {
        // Set blink off
        setBlendshapeValue(BLENDSHAPES.EYE_BLINK_LEFT, 0);
        setBlendshapeValue(BLENDSHAPES.EYE_BLINK_RIGHT, 0);

        // Restore tracking state
        trackingActive = wasTracking;
        resolve();
      }, 100);
    });
  }

  // Look in a specific direction (normalized -1 to 1 coordinates)
  export function lookAt(x: number, y: number): void {
    if (x < -1 || x > 1 || y < -1 || y > 1) {
      console.warn("lookAt coordinates must be in range -1 to 1");
      return;
    }

    const wasTracking = trackingActive;
    trackingActive = false;

    // Rotate eyeball bones directly
    rotateEyeBones(x, y);
    rotateHeadAndNeck(x, y);

    // Update blendshapes to match the eye direction
    updateEyeBlendshapes(x, y);

    // Restore tracking state after a short delay if requested
    if (wasTracking) {
      setTimeout(() => {
        trackingActive = true;
      }, 2000);
    }
  }

  // Make the avatar smile
  export function smile(intensity: number = 0.5): void {
    // These are common smile-related blendshapes
    setBlendshapeValue("mouthSmileLeft", intensity);
    setBlendshapeValue("mouthSmileRight", intensity);
    setBlendshapeValue("cheekSquintLeft", intensity * 0.7);
    setBlendshapeValue("cheekSquintRight", intensity * 0.7);

    // Add slight eye squint for more natural smile
    setBlendshapeValue(BLENDSHAPES.EYE_SQUINT_LEFT, intensity * 0.3);
    setBlendshapeValue(BLENDSHAPES.EYE_SQUINT_RIGHT, intensity * 0.3);
  }

  // Reset all animations and poses
  export function reset(): void {
    resetAllBlendshapes();
    resetBones();
  }
</script>

<div class="avatar-container" bind:this={container}>
  {#if isLoading}
    <div class="loading-overlay">
      <p>Loading avatar: {loadingProgress}%</p>
    </div>
  {/if}

  {#if errorMessage}
    <div class="error-overlay">
      <p>{errorMessage}</p>
    </div>
  {/if}
</div>

<style>
  .avatar-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .loading-overlay,
  .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    z-index: 10;
  }

  .error-overlay {
    background: rgba(255, 0, 0, 0.3);
  }
</style>
