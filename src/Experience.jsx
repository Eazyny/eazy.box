import {
    Html,
    ContactShadows,
    PerspectiveCamera,
    useGLTF,
    useCubeTexture,
} from '@react-three/drei'; // Use useCubeTexture for skybox
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { ToneMapping } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';
import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { ToneMappingMode } from 'postprocessing';

export default function Experience() {
    const computer = useGLTF('./BedRoomCombo.glb');

    const skyboxTexture = useCubeTexture(
        ['right.png', 'left.png', 'top.png', 'bottom.png', 'front.png', 'back.png'],
        { path: '/' }
    );

    const cameraRef = useRef();
    const directionalLightRef = useRef();
    const pointLightRef = useRef();
    const { gl, scene } = useThree();

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

    // Camera animation state with bounce effect
    const [{ position, rotation }, setCamera] = useSpring(() => ({
        position: initialCameraPosition,
        rotation: initialCameraRotation,
        config: {
            tension: 55, // Higher tension makes the animation more "snappy"
            friction: 10, // Lower friction allows for more bounce
            clamp: false, // Prevents overshooting
            precision: 0.01, // Smooths the final resting position
        },
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

    useEffect(() => {
        scene.background = skyboxTexture;
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

        setTimeout(showButtons, 3000);
    }, []);

    useFrame(() => {
        const currentPosition = new THREE.Vector3(...position.get());
        cameraRef.current.position.lerp(currentPosition, 0.1);

        const targetQuaternion = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(...rotation.get())
        );
        cameraRef.current.quaternion.slerp(targetQuaternion, 0.1);
    });

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
                intensity={0.8}
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

            {/* Point Light */}
            <pointLight
                ref={pointLightRef}
                intensity={1}
                position={[0.5, 1.8, -0.3]}
                distance={100}
                decay={1.5}
            />

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
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                            }}
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
                    <div
                        style={{
                            width: '560px',
                            height: '315px',
                            border: 'none',
                            borderRadius: '10px',
                        }}
                    >
                        <iframe
                            width="560"
                            height="315"
                            src="https://www.youtube.com/embed/jfKfPfyJRdk"
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                        />
                    </div>
                </Html>

                {/* Troverse Screen */}
                <Html
                    transform
                    wrapperClass="troverseScreen"
                    distanceFactor={1}
                    position={[1.91, 1.79, -2.115]}
                    rotation={[0, -0.31, 0]}
                    scale={[0.64, 0.65, 0.6]}
                    occlude
                >
                    <div
                        style={{
                            width: '560px',
                            height: '315px',
                            border: 'none',
                            borderRadius: '10px',
                        }}
                    >
                        <iframe
                            width="560"
                            height="315"
                            src="https://playtroverse.com"
                            title="Troverse Website"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                        />
                    </div>
                </Html>
            </primitive>

            {/* Shadows */}
            <ContactShadows position-y={-1.4} opacity={0.4} scale={5} blur={2.4} />

            {/* Post-processing Effects */}
            <EffectComposer multisampling={4}>
                <Bloom
                    intensity={0.5}
                    luminanceThreshold={0.2}
                    luminanceSmoothing={0.2}
                    kernelSize={KernelSize.LARGE}
                />
                <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            </EffectComposer>
        </>
    );
}
