import { Text, Html, ContactShadows, PerspectiveCamera, OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { ToneMapping } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';
import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ToneMappingMode } from 'postprocessing';

export default function Experience() {
    const computer = useGLTF('./BedroomCombo.glb');
    const cameraRef = useRef();
    const directionalLightRef = useRef();
    const pointLightRef = useRef();
    const { gl } = useThree();

    // Initial camera settings
    const initialCameraPosition = [1.7, 0.4, -1.2];
    const initialCameraRotation = [0, 0.8, 0];
    const zoomMin = 0.5;
    const zoomMax = 2;

    // Enable shadows
    useEffect(() => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap; // Ensure shadows are smooth
    }, [gl]);

    // Enable shadows for the GLTF model
    useEffect(() => {
        computer.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true; // Allow meshes to cast shadows
                child.receiveShadow = true; // Allow meshes to receive shadows
            }
        });
    }, [computer]);

    // Set the initial rotation of the camera
    useEffect(() => {
        if (cameraRef.current) {
            cameraRef.current.rotation.set(...initialCameraRotation);
        }
    }, []);

    // Add zoom interaction handling
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

    return (
        <>
            {/* HDRI Environment */}
            <Environment background files="nighttime.hdr" path="/" />

            {/* Background */}
            <color args={['#000000']} attach="background" />

            {/* Perspective Camera */}
            <PerspectiveCamera
                ref={cameraRef}
                makeDefault
                position={initialCameraPosition}
                fov={60}
                near={0.1}
                far={1000}
                onUpdate={(self) => self.updateProjectionMatrix()}
            />

            {/* OrbitControls for Camera Interaction */}
            <OrbitControls target={[0, 1, 0]} maxPolarAngle={Math.PI / 2} />

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
                intensity={0.9}
                position={[1.1, 1.7, 0.2]}
                distance={100}
                decay={1.5}
            />

            {/* Computer Model */}
            <primitive object={computer.scene} position-y={-1.5} position-x={0} position-z={0}>
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
                        />
                    </div>
                </Html>

                {/* YouTube Iframe */}
                <Html
                    transform
                    wrapperClass="youtubeScreen"
                    distanceFactor={1}
                    position={[-1.45, 2.10, -2.51]}
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
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
                    scale={[0.64, 0.65, 0.60]}
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
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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

            {/* Text */}
            <Text
                font="./bangers-v20-latin-regular.woff"
                fontSize={1}
                position={[0.5, 3, 2.855]}
                rotation-y={3.15}
                maxWidth={2}
            >
                WELCOME
            </Text>
            <Text
                font="./bangers-v20-latin-regular.woff"
                fontSize={0.3}
                position={[0.5, 2.2, 2.855]}
                rotation-y={3.15}
                maxWidth={2}
            >
                To my Portfolio
            </Text>
            <Text
                font="./bangers-v20-latin-regular.woff"
                fontSize={0.28}
                position={[0.5, 1, 2.855]}
                rotation-y={3.15}
                maxWidth={3.5}
                textAlign="center"
                anchorX="center"
                anchorY="middle"
            >
                Feel free to explore. This project is my WIP Portfolio. I'm still working on it, so stay tuned for
                updates! Don't forget to stop by the PC to contact me!
            </Text>

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
