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
  const enableIdleMovements: boolean = true;

  let { visemeTimeline = [], audioPlaybackStartTime = null } = $props<{
    visemeTimeline: VisemeEvent[];
    audioPlaybackStartTime: number | null;
  }>();

  // Noise for idle jitter
  const noise = new SimplexNoise();

  // Glance variables
  let glanceActive = false;
  let glanceTimer: ReturnType<typeof setTimeout> | null = null;
  let glanceOffset = { x: 0, y: 0 };
  let glanceTarget = { x: 0, y: 0 };

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
  let currentVisemeInfluences = $state<Record<string, number>>({});

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
    } else {
      threeClockAudioStartTime = null;
      resetVisemeBlendshapes(); // Reset lips when audio stops
    }
  });
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
      vUv = uv * 500.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
    }
  `,
      fragmentShader: `
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      float lines = step(0.98, abs(sin(vUv.x + uTime)) * abs(sin(vUv.y + uTime)));
      vec3 color = mix(vec3(0.0), vec3(0.8, 0.9, 1.0), lines); // light neon blue
      gl_FragColor = vec4(color, 1.0);
    }
  `,
      side: THREE.DoubleSide,
    });

    gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.rotation.x = -1;
    gridMesh.position.y = -50;
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

    if (leftEyeBone) {
      console.log("✅ Found left eye:", leftEyeBone.name);
      leftEyeBone.userData.initialRotation = leftEyeBone.rotation.clone();
    } else {
      console.warn("❌ Left eye not found");
    }

    if (rightEyeBone) {
      console.log("✅ Found right eye:", rightEyeBone.name);
      rightEyeBone.userData.initialRotation = rightEyeBone.rotation.clone();
    } else {
      console.warn("❌ Right eye not found");
    }

    if (skullBone) {
      console.log("✅ Found skull:", skullBone.name);
      skullBone.userData.initialRotation = skullBone.rotation.clone();
    } else {
      console.warn("❌ Skull not found");
    }

    if (neckBone) {
      console.log("✅ Found neck:", neckBone.name);
      neckBone.userData.initialRotation = neckBone.rotation.clone();
    } else {
      console.warn("❌ Neck not found");
    }
  }

  // -------------------------------- MAP BLENDSHAPES --------------------------------
  function findAndMapMeshes(): void {
  if (!model) return;

  const meshesWithMorphs: THREE.Mesh[] = [];
  model.traverse((node) => {
    // Find skinned meshes with morph targets (common for RPM avatars)
    if (
      node.isSkinnedMesh && // Often SkinnedMesh for RPM heads/faces
      node.morphTargetInfluences &&
      node.morphTargetInfluences.length > 0 &&
      node.morphTargetDictionary
    ) {
      meshesWithMorphs.push(node as THREE.Mesh);
    } else if ( // Fallback for non-skinned meshes
      node.isMesh &&
      !node.isSkinnedMesh &&
      node.morphTargetInfluences &&
      node.morphTargetInfluences.length > 0 &&
      node.morphTargetDictionary
    ) {
       meshesWithMorphs.push(node as THREE.Mesh);
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
     if (faceMeshes[0].morphTargetDictionary?.[arkitName] !== undefined) {
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
  }

  function resetVisemeBlendshapes(): void {
    OCULUS_VISEME_NAMES.forEach((name) => {
      setBlendshapeValue(name, 0);
    });
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

    // --- LIP SYNC LOGIC ---
    const targetBlendValues: { [key: string]: number } = {}; // Store TARGET values (0 or 1) for this frame

    if (threeClockAudioStartTime !== null && visemeTimeline.length > 0) {
        const elapsedAudioTimeMs = (time - threeClockAudioStartTime) * 1000;

        // Determine TARGET value (1.0) for active viseme(s)
        for (const event of visemeTimeline) {
            if (elapsedAudioTimeMs >= event.start && elapsedAudioTimeMs <= event.end) {
                const morphTargetName = 'viseme_' + event.viseme;
                targetBlendValues[morphTargetName] = 1.0; // Target is 1 when active
                // Optimization: if only one viseme active at a time, could break
            }
        }
    }
    // --- Interpolate and Apply ---
    let activeVisemeFoundThisFrame = false; // Track if *any* viseme should be active

    OCULUS_VISEME_NAMES.forEach(name => {
        const targetValue = targetBlendValues[name] || 0; // Target is 1 if active, 0 otherwise
        let currentValue = currentVisemeInfluences[name] || 0; // Get current smoothed value

        // Interpolate currentValue towards targetValue
        // Using frame-rate independent smoothing:
        const lerpFactor = 1.0 - Math.exp(-lipSmoothingSpeed * delta);
        const newValue = currentValue + (targetValue - currentValue) * lerpFactor;

        // Clamp tiny values to 0 to prevent lingering influences
        const finalValue = (newValue < 0.001) ? 0 : THREE.MathUtils.clamp(newValue, 0, 1);

        // Apply the smoothed value
        setBlendshapeValue(name, finalValue);

        // Update the stored current value for the next frame
        currentVisemeInfluences[name] = finalValue;

        if(finalValue > 0.01) { // Check if this viseme has any significant influence
            activeVisemeFoundThisFrame = true;
        }
    });
    // --- END LIP SYNC LOGIC ---

    gridMat.uniforms.uTime.value = clock.elapsedTime * 5.0;
    gridMesh.rotation.z += 0.001;
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
    min-height: 400px;
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
