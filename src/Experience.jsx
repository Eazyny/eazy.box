import {
  Html,
  ContactShadows,
  PerspectiveCamera,
  useGLTF,
  useCubeTexture,
} from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { ToneMapping } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';
import { useRef, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useSpring } from '@react-spring/three';
import * as THREE from 'three';
import { ToneMappingMode } from 'postprocessing';

// ✅ RectAreaLight support (helpers removed)
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

// Helpers REMOVED: PointLightHelper / RectAreaLightHelper
function PointLightWithHelper({ showHelper = false, helperSize = 0.15, ...props }) {
  return <pointLight {...props} />;
}

function RectAreaLightWithHelper({ showHelper = false, ...props }) {
  return <rectAreaLight {...props} />;
}

export default function Experience({ onFirstFrame }) {
  const computer = useGLTF('./BedRoomCombo.glb');

  const skyboxTexture = useCubeTexture(
    ['right.png', 'left.png', 'top.png', 'bottom.png', 'front.png', 'back.png'],
    { path: '/' }
  );

  const cameraRef = useRef();
  const directionalLightRef = useRef();
  const pointLightRef = useRef();
  const { gl, scene } = useThree();

  // ✅ required for RectAreaLight
  useEffect(() => {
    RectAreaLightUniformsLib.init();
  }, []);

  // Initial camera settings
  const initialCameraPosition = [5, 1.3, 0.6];
  const initialCameraRotation = [0.1, 1.5, -0.1];
  const WelcomePosition = [0.6, 0.4, -0.5];
  const WelcomeRotation = [0, 2.8, 0];
  const mainCameraPosition = [5, 1.3, 0.6];
  const mainCameraRotation = [0.1, 1.5, -0.1];
  const pcStationPosition = [1.4, 0.4, -1.2];
  const pcStationRotation = [0, 0, 0];
  const tvStationPosition = [-0.4, 0.6, -0.7];
  const tvStationRotation = [0, 0.8, 0];
  const zoomMin = 1;
  const zoomMax = 4;

  // Camera animation state
  const [{ position, rotation }, setCamera] = useSpring(() => ({
    position: initialCameraPosition,
    rotation: initialCameraRotation,
    config: { tension: 250, friction: 35, precision: 0.001 },
  }));

  // Expose setCamera to the global scope
  useEffect(() => {
    window.setCamera = setCamera;
    window.mainCameraPosition = mainCameraPosition;
    window.mainCameraRotation = mainCameraRotation;
    window.WelcomePosition = WelcomePosition;
    window.WelcomeRotation = WelcomeRotation;
    window.pcStationPosition = pcStationPosition;
    window.pcStationRotation = pcStationRotation;
    window.tvStationPosition = tvStationPosition;
    window.tvStationRotation = tvStationRotation;
  }, [setCamera]);

  // ✅ Skybox set + baked static rotation (degrees -> radians)
  useEffect(() => {
    scene.background = skyboxTexture;

    const skyYaw = -19;
    const skyPitch = -51;
    const skyRoll = -23;

    scene.backgroundRotation.set(
      THREE.MathUtils.degToRad(skyPitch),
      THREE.MathUtils.degToRad(skyYaw),
      THREE.MathUtils.degToRad(skyRoll)
    );
  }, [scene, skyboxTexture]);

  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl]);

  useEffect(() => {
    computer.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [computer]);

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.rotation.set(...initialCameraRotation);
    }
  }, []);

  useEffect(() => {
    const handleWheel = (event) => {
      const newZoom = Math.max(
        zoomMin,
        Math.min(zoomMax, cameraRef.current.zoom - event.deltaY * 0.001)
      );
      cameraRef.current.zoom = newZoom;
      cameraRef.current.updateProjectionMatrix();
    };

    gl.domElement.addEventListener('wheel', handleWheel);
    return () => {
      gl.domElement.removeEventListener('wheel', handleWheel);
    };
  }, [gl, zoomMin, zoomMax]);

  useEffect(() => {
    const showButtons = () => {
      const buttons = document.querySelector('.camera-buttons');
      if (buttons) {
        buttons.style.display = 'flex';
      }
    };

    setTimeout(showButtons, 100);
  }, []);

  // ✅ First frame signal (prevents black-gap)
  const didFirstFrame = useRef(false);

  useFrame(() => {
    if (!didFirstFrame.current) {
      didFirstFrame.current = true;
      if (typeof onFirstFrame === 'function') onFirstFrame();
    }

    const currentPosition = new THREE.Vector3(...position.get());
    cameraRef.current.position.lerp(currentPosition, 0.1);

    const targetQuaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(...rotation.get())
    );
    cameraRef.current.quaternion.slerp(targetQuaternion, 0.1);
  });

  // ============================================================
  // LIGHT PRESETS (EDIT THESE)
  // ============================================================
  const LIGHT_PRESETS = useMemo(
    () => ({
      base: {
        intensity: 0.1,
        x: -2.03,
        y: 0.64,
        z: -1.96,
        distance: 100,
        decay: 1.6,
      },

      // ✅ soft fill
      fillAmbient: {
        intensity: 0.1,
        color: '#ffffff',
      },

      // ✅ 3 panels for the WELCOME wall (left / center / right)
      panel1: {
        x: 0.85,
        y: 2.29,
        z: -1.85,
        rotXdeg: -24.0,
        rotYdeg: -2.5,
        rotZdeg: 0,
        width: 3.65,
        height: 2.65,
        intensity: 0.1,
        color: '#ffffff',
      },
      panel2: {
        x: -2.15,
        y: 1.55,
        z: -2.25,
        rotXdeg: 0,
        rotYdeg: 90,
        rotZdeg: 0,
        width: 1.2,
        height: 0.55,
        intensity: 0,
        color: '#ffffff',
      },
      panel3: {
        x: -2.15,
        y: 1.55,
        z: -2.65,
        rotXdeg: 0,
        rotYdeg: 90,
        rotZdeg: 0,
        width: 1.2,
        height: 0.55,
        intensity: 0,
        color: '#ffffff',
      },

      // 11 RED lights (explicit)
      red1: { x: -2.11, y: 0.05, z: -2.42, intensity: 0.01, distance: 0.8, decay: 5 },
      red2: { x: -1.75, y: 0.05, z: -2.42, intensity: 0.01, distance: 0.8, decay: 5 },
      red3: { x: -1.3, y: 0.01, z: -2.42, intensity: 0.01, distance: 0.8, decay: 5 },
      red4: { x: -0.85, y: 0.05, z: -2.42, intensity: 0.01, distance: 0.8, decay: 5 },
      red5: { x: -0.4, y: 0.05, z: -2.42, intensity: 0.01, distance: 0.8, decay: 5 },
      red6: { x: 0.05, y: -0.12, z: -2.42, intensity: 0.02, distance: 6.9, decay: 5 },
      red7: { x: 1.47, y: -0.12, z: -2.42, intensity: 0.02, distance: 6.9, decay: 5 },
      red8: { x: 2.09, y: -0.12, z: -2.42, intensity: 0.02, distance: 6.9, decay: 5 },
      red9: { x: -1.09, y: 1.05, z: 2.56, intensity: 0.55, distance: 1.6, decay: 0 },
      red10: { x: 0.21, y: 1.05, z: 2.56, intensity: 0.65, distance: 2, decay: 0 },
      red11: { x: 1.64, y: 1.05, z: 2.56, intensity: 0.55, distance: 1.6, decay: 0 },

      // 4 WHITE lights (explicit)
      white1: { x: -0.95, y: 2.15, z: 2.16, intensity: 0.35, distance: 6, decay: 2 },
      white2: { x: 1.66, y: 2.15, z: 2.16, intensity: 0.35, distance: 6, decay: 2 },
      white3: { x: 0.45, y: 2.15, z: 2.16, intensity: 0.35, distance: 6, decay: 2 },
      white4: { x: 1.67, y: 0.16, z: -1.68, intensity: 0.35, distance: 1.9, decay: 3.02 },
    }),
    []
  );

  // ============================================================
  // FIXED LIGHT VALUES (Leva removed)
  // ============================================================
  const showLightHelpers = false;

  const baseLight = {
    baseIntensity: LIGHT_PRESETS.base.intensity,
    baseX: LIGHT_PRESETS.base.x,
    baseY: LIGHT_PRESETS.base.y,
    baseZ: LIGHT_PRESETS.base.z,
    baseDistance: LIGHT_PRESETS.base.distance,
    baseDecay: LIGHT_PRESETS.base.decay,
  };

  const fill = {
    fillAmbientIntensity: LIGHT_PRESETS.fillAmbient.intensity,
    fillAmbientColor: LIGHT_PRESETS.fillAmbient.color,
  };

  const panels = {
    panel1X: LIGHT_PRESETS.panel1.x,
    panel1Y: LIGHT_PRESETS.panel1.y,
    panel1Z: LIGHT_PRESETS.panel1.z,
    panel1RotXdeg: LIGHT_PRESETS.panel1.rotXdeg,
    panel1RotYdeg: LIGHT_PRESETS.panel1.rotYdeg,
    panel1RotZdeg: LIGHT_PRESETS.panel1.rotZdeg,
    panel1Width: LIGHT_PRESETS.panel1.width,
    panel1Height: LIGHT_PRESETS.panel1.height,
    panel1Intensity: LIGHT_PRESETS.panel1.intensity,
    panel1Color: LIGHT_PRESETS.panel1.color,

    panel2X: LIGHT_PRESETS.panel2.x,
    panel2Y: LIGHT_PRESETS.panel2.y,
    panel2Z: LIGHT_PRESETS.panel2.z,
    panel2RotXdeg: LIGHT_PRESETS.panel2.rotXdeg,
    panel2RotYdeg: LIGHT_PRESETS.panel2.rotYdeg,
    panel2RotZdeg: LIGHT_PRESETS.panel2.rotZdeg,
    panel2Width: LIGHT_PRESETS.panel2.width,
    panel2Height: LIGHT_PRESETS.panel2.height,
    panel2Intensity: LIGHT_PRESETS.panel2.intensity,
    panel2Color: LIGHT_PRESETS.panel2.color,

    panel3X: LIGHT_PRESETS.panel3.x,
    panel3Y: LIGHT_PRESETS.panel3.y,
    panel3Z: LIGHT_PRESETS.panel3.z,
    panel3RotXdeg: LIGHT_PRESETS.panel3.rotXdeg,
    panel3RotYdeg: LIGHT_PRESETS.panel3.rotYdeg,
    panel3RotZdeg: LIGHT_PRESETS.panel3.rotZdeg,
    panel3Width: LIGHT_PRESETS.panel3.width,
    panel3Height: LIGHT_PRESETS.panel3.height,
    panel3Intensity: LIGHT_PRESETS.panel3.intensity,
    panel3Color: LIGHT_PRESETS.panel3.color,
  };

  const red = {
    red1X: LIGHT_PRESETS.red1.x, red1Y: LIGHT_PRESETS.red1.y, red1Z: LIGHT_PRESETS.red1.z,
    red1Intensity: LIGHT_PRESETS.red1.intensity, red1Distance: LIGHT_PRESETS.red1.distance, red1Decay: LIGHT_PRESETS.red1.decay,

    red2X: LIGHT_PRESETS.red2.x, red2Y: LIGHT_PRESETS.red2.y, red2Z: LIGHT_PRESETS.red2.z,
    red2Intensity: LIGHT_PRESETS.red2.intensity, red2Distance: LIGHT_PRESETS.red2.distance, red2Decay: LIGHT_PRESETS.red2.decay,

    red3X: LIGHT_PRESETS.red3.x, red3Y: LIGHT_PRESETS.red3.y, red3Z: LIGHT_PRESETS.red3.z,
    red3Intensity: LIGHT_PRESETS.red3.intensity, red3Distance: LIGHT_PRESETS.red3.distance, red3Decay: LIGHT_PRESETS.red3.decay,

    red4X: LIGHT_PRESETS.red4.x, red4Y: LIGHT_PRESETS.red4.y, red4Z: LIGHT_PRESETS.red4.z,
    red4Intensity: LIGHT_PRESETS.red4.intensity, red4Distance: LIGHT_PRESETS.red4.distance, red4Decay: LIGHT_PRESETS.red4.decay,

    red5X: LIGHT_PRESETS.red5.x, red5Y: LIGHT_PRESETS.red5.y, red5Z: LIGHT_PRESETS.red5.z,
    red5Intensity: LIGHT_PRESETS.red5.intensity, red5Distance: LIGHT_PRESETS.red5.distance, red5Decay: LIGHT_PRESETS.red5.decay,

    red6X: LIGHT_PRESETS.red6.x, red6Y: LIGHT_PRESETS.red6.y, red6Z: LIGHT_PRESETS.red6.z,
    red6Intensity: LIGHT_PRESETS.red6.intensity, red6Distance: LIGHT_PRESETS.red6.distance, red6Decay: LIGHT_PRESETS.red6.decay,

    red7X: LIGHT_PRESETS.red7.x, red7Y: LIGHT_PRESETS.red7.y, red7Z: LIGHT_PRESETS.red7.z,
    red7Intensity: LIGHT_PRESETS.red7.intensity, red7Distance: LIGHT_PRESETS.red7.distance, red7Decay: LIGHT_PRESETS.red7.decay,

    red8X: LIGHT_PRESETS.red8.x, red8Y: LIGHT_PRESETS.red8.y, red8Z: LIGHT_PRESETS.red8.z,
    red8Intensity: LIGHT_PRESETS.red8.intensity, red8Distance: LIGHT_PRESETS.red8.distance, red8Decay: LIGHT_PRESETS.red8.decay,

    red9X: LIGHT_PRESETS.red9.x, red9Y: LIGHT_PRESETS.red9.y, red9Z: LIGHT_PRESETS.red9.z,
    red9Intensity: LIGHT_PRESETS.red9.intensity, red9Distance: LIGHT_PRESETS.red9.distance, red9Decay: LIGHT_PRESETS.red9.decay,

    red10X: LIGHT_PRESETS.red10.x, red10Y: LIGHT_PRESETS.red10.y, red10Z: LIGHT_PRESETS.red10.z,
    red10Intensity: LIGHT_PRESETS.red10.intensity, red10Distance: LIGHT_PRESETS.red10.distance, red10Decay: LIGHT_PRESETS.red10.decay,

    red11X: LIGHT_PRESETS.red11.x, red11Y: LIGHT_PRESETS.red11.y, red11Z: LIGHT_PRESETS.red11.z,
    red11Intensity: LIGHT_PRESETS.red11.intensity, red11Distance: LIGHT_PRESETS.red11.distance, red11Decay: LIGHT_PRESETS.red11.decay,
  };

  const white = {
    white1X: LIGHT_PRESETS.white1.x, white1Y: LIGHT_PRESETS.white1.y, white1Z: LIGHT_PRESETS.white1.z,
    white1Intensity: LIGHT_PRESETS.white1.intensity, white1Distance: LIGHT_PRESETS.white1.distance, white1Decay: LIGHT_PRESETS.white1.decay,

    white2X: LIGHT_PRESETS.white2.x, white2Y: LIGHT_PRESETS.white2.y, white2Z: LIGHT_PRESETS.white2.z,
    white2Intensity: LIGHT_PRESETS.white2.intensity, white2Distance: LIGHT_PRESETS.white2.distance, white2Decay: LIGHT_PRESETS.white2.decay,

    white3X: LIGHT_PRESETS.white3.x, white3Y: LIGHT_PRESETS.white3.y, white3Z: LIGHT_PRESETS.white3.z,
    white3Intensity: LIGHT_PRESETS.white3.intensity, white3Distance: LIGHT_PRESETS.white3.distance, white3Decay: LIGHT_PRESETS.white3.decay,

    white4X: LIGHT_PRESETS.white4.x, white4Y: LIGHT_PRESETS.white4.y, white4Z: LIGHT_PRESETS.white4.z,
    white4Intensity: LIGHT_PRESETS.white4.intensity, white4Distance: LIGHT_PRESETS.white4.distance, white4Decay: LIGHT_PRESETS.white4.decay,
  };

  return (
    <>
      {/* Background */}
      <color args={['#000000']} attach="background" />

      {/* Perspective Camera */}
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={initialCameraPosition}
        fov={80}
        near={0.1}
        far={1000}
        onUpdate={(self) => self.updateProjectionMatrix()}
      />

      {/* Directional Light */}
      <directionalLight
        ref={directionalLightRef}
        intensity={0.6}
        position={[-10, 10, -3]}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-bias={-0.0005}
      />

      {/* ✅ soft fill */}
      <ambientLight color={fill.fillAmbientColor} intensity={fill.fillAmbientIntensity} />

      {/* ✅ 3 panels */}
      <RectAreaLightWithHelper
        showHelper={showLightHelpers}
        color={panels.panel1Color}
        intensity={panels.panel1Intensity}
        width={panels.panel1Width}
        height={panels.panel1Height}
        position={[panels.panel1X, panels.panel1Y, panels.panel1Z]}
        rotation={[
          THREE.MathUtils.degToRad(panels.panel1RotXdeg),
          THREE.MathUtils.degToRad(panels.panel1RotYdeg),
          THREE.MathUtils.degToRad(panels.panel1RotZdeg),
        ]}
      />
      <RectAreaLightWithHelper
        showHelper={showLightHelpers}
        color={panels.panel2Color}
        intensity={panels.panel2Intensity}
        width={panels.panel2Width}
        height={panels.panel2Height}
        position={[panels.panel2X, panels.panel2Y, panels.panel2Z]}
        rotation={[
          THREE.MathUtils.degToRad(panels.panel2RotXdeg),
          THREE.MathUtils.degToRad(panels.panel2RotYdeg),
          THREE.MathUtils.degToRad(panels.panel2RotZdeg),
        ]}
      />
      <RectAreaLightWithHelper
        showHelper={showLightHelpers}
        color={panels.panel3Color}
        intensity={panels.panel3Intensity}
        width={panels.panel3Width}
        height={panels.panel3Height}
        position={[panels.panel3X, panels.panel3Y, panels.panel3Z]}
        rotation={[
          THREE.MathUtils.degToRad(panels.panel3RotXdeg),
          THREE.MathUtils.degToRad(panels.panel3RotYdeg),
          THREE.MathUtils.degToRad(panels.panel3RotZdeg),
        ]}
      />

      {/* Base Point Light */}
      <pointLight
        ref={pointLightRef}
        color={'#ffffff'}
        intensity={baseLight.baseIntensity}
        position={[baseLight.baseX, baseLight.baseY, baseLight.baseZ]}
        distance={baseLight.baseDistance}
        decay={baseLight.baseDecay}
      />

      {/* ===========================
          RED LIGHTS (explicit JSX)
         =========================== */}
      <PointLightWithHelper showHelper={showLightHelpers} helperSize={0.12} color={'#ff2a2a'} intensity={red.red1Intensity} distance={red.red1Distance} decay={red.red1Decay} position={[red.red1X, red.red1Y, red.red1Z]} />
      <PointLightWithHelper showHelper={showLightHelpers} helperSize={0.12} color={'#ff2a2a'} intensity={red.red2Intensity} distance={red.red2Distance} decay={red.red2Decay} position={[red.red2X, red.red2Y, red.red2Z]} />
      <PointLightWithHelper showHelper={showLightHelpers} helperSize={0.12} color={'#ff2a2a'} intensity={red.red3Intensity} distance={red.red3Distance} decay={red.red3Decay} position={[red.red3X, red.red3Y, red.red3Z]} />
      <PointLightWithHelper showHelper={showLightHelpers} helperSize={0.12} color={'#ff2a2a'} intensity={red.red4Intensity} distance={red.red4Distance} decay={red.red4Decay} position={[red.red4X, red.red4Y, red.red4Z]} />
      <PointLightWithHelper showHelper={showLightHelpers} helperSize={0.12} color={'#ff2a2a'} intensity={red.red5Intensity} distance={red.red5Distance} decay={red.red5Decay} position={[red.red5X, red.red5Y, red.red5Z]} />
      <PointLightWithHelper showHelper={showLightHelpers} helperSize={0.12} color={'#ff2a2a'} intensity={red.red6Intensity} distance={red.red6Distance} decay={red.red6Decay} position={[red.red6X, red.red6Y, red.red6Z]} />
      <PointLightWithHelper showHelper={showLightHelpers} helperSize={0.12} color={'#ff2a2a'} intensity={red.red7Intensity} distance={red.red7Distance} decay={red.red7Decay} position={[red.red7X, red.red7Y, red.red7Z]} />
      <PointLightWithHelper showHelper={showLightHelpers} helperSize={0.12} color={'#ff2a2a'} intensity={red.red8Intensity} distance={red.red8Distance} decay={red.red8Decay} position={[red.red8X, red.red8Y, red.red8Z]} />
      <PointLightWithHelper showHelper={showLightHelpers} helperSize={0.12} color={'#ff2a2a'} intensity={red.red9Intensity} distance={red.red9Distance} decay={red.red9Decay} position={[red.red9X, red.red9Y, red.red9Z]} />
      <PointLightWithHelper showHelper={showLightHelpers} helperSize={0.12} color={'#ff2a2a'} intensity={red.red10Intensity} distance={red.red10Distance} decay={red.red10Decay} position={[red.red10X, red.red10Y, red.red10Z]} />
      <PointLightWithHelper showHelper={showLightHelpers} helperSize={0.12} color={'#ff2a2a'} intensity={red.red11Intensity} distance={red.red11Distance} decay={red.red11Decay} position={[red.red11X, red.red11Y, red.red11Z]} />

      {/* ===========================
          WHITE LIGHTS (explicit JSX)
         =========================== */}
      <PointLightWithHelper showHelper={showLightHelpers} helperSize={0.16} color={'#ffffff'} intensity={white.white1Intensity} distance={white.white1Distance} decay={white.white1Decay} position={[white.white1X, white.white1Y, white.white1Z]} />
      <PointLightWithHelper showHelper={showLightHelpers} helperSize={0.16} color={'#ffffff'} intensity={white.white2Intensity} distance={white.white2Distance} decay={white.white2Decay} position={[white.white2X, white.white2Y, white.white2Z]} />
      <PointLightWithHelper showHelper={showLightHelpers} helperSize={0.16} color={'#ffffff'} intensity={white.white3Intensity} distance={white.white3Distance} decay={white.white3Decay} position={[white.white3X, white.white3Y, white.white3Z]} />
      <PointLightWithHelper showHelper={showLightHelpers} helperSize={0.16} color={'#ffffff'} intensity={white.white4Intensity} distance={white.white4Distance} decay={white.white4Decay} position={[white.white4X, white.white4Y, white.white4Z]} />

      {/* Computer Model */}
      <primitive object={computer.scene} position-y={-1.5} position-x={0} position-z={0}>
        {/* HTML Screen */}
        <Html
          transform
          wrapperClass="htmlScreen"
          distanceFactor={1}
          position={[1.054, 1.786, -2.0639]}
          rotation={[0, 0.432, 0]}
          scale={[0.301, 0.301, 0.301]}
          occlude
        >
          <div
            style={{
              width: '1200px',
              height: '680px',
              backgroundColor: 'black',
              border: 'none',
              borderRadius: '10px',
            }}
          >
            <iframe
              src="https://eazy.box/computer/"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              allowFullScreen
            />
          </div>
        </Html>

        {/* YouTube Iframe */}
        <Html
          transform
          wrapperClass="youtubeScreen"
          distanceFactor={1}
          position={[-1.45, 2.1, -2.51]}
          rotation={[0, 0, 0]}
          scale={[1.4, 1.35, 0.4]}
          occlude
        >
          <div style={{ width: '560px', height: '315px', border: 'none', borderRadius: '10px' }}>
            <iframe
              width="560"
              height="315"
              src="https://www.youtube.com/embed/jfKfPfyJRdk"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </Html>

        {/* Troverse Screen */}
        <Html
          transform
          wrapperClass="BlockchaineazyScreen"
          distanceFactor={1}
          position={[1.9075, 1.788, -2.115]}
          rotation={[-0.0001, -0.295, 0]}
          scale={[0.3, 0.258, 0.6]}
          occlude
        >
          <div style={{ width: '1200px', height: '800px', border: 'none', borderRadius: '10px' }}>
            <iframe
              width="1200"
              height="800"
              src="https://blockchaineazy.box"
              title="Blockchaineazy.box"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </Html>
      </primitive>

      {/* Shadows */}
      <ContactShadows position-y={-1.4} opacity={0.4} scale={5} blur={2.4} />

      {/* Post-processing Effects */}
      <EffectComposer multisampling={4}>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.2}
          kernelSize={KernelSize.LARGE}
        />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      </EffectComposer>
    </>
  );
}
