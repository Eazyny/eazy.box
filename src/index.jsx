import './style.css';
import ReactDOM from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';

import Experience from './Experience';
import Loader from './Loading';

const MIN_LOADER_MS = 2500; // 👈 set 4000/6000 if you want more guaranteed rain time

function ProgressBridge({ onProgress }) {
  const { progress } = useProgress();

  useEffect(() => {
    onProgress(progress);
  }, [progress, onProgress]);

  return null;
}

// This runs INSIDE the Canvas, so we can safely detect "first frame rendered"
function FirstFrame({ onFirstFrame }) {
  const fired = useRef(false);
  useFrame(() => {
    if (!fired.current) {
      fired.current = true;
      onFirstFrame();
    }
  });
  return null;
}

function App() {
  const [progress, setProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  const [sceneHasRendered, setSceneHasRendered] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);

  const [loaderVisible, setLoaderVisible] = useState(true);

  // Minimum time gate
  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), MIN_LOADER_MS);
    return () => clearTimeout(t);
  }, []);

  const onProgress = useCallback((p) => setProgress(p), []);
  const onFirstFrame = useCallback(() => setSceneHasRendered(true), []);

  const readyToHide = minTimePassed && sceneHasRendered && progress >= 100;

  // Hide camera buttons (and anything else) while loader is up
  useEffect(() => {
    document.body.classList.toggle('is-loading', loaderVisible);
    return () => document.body.classList.remove('is-loading');
  }, [loaderVisible]);

  // Smooth progress display:
  // - never show 100% until we're actually readyToHide
  // - ease toward target so it doesn't jump
  useEffect(() => {
    let raf;

    const tick = () => {
      setDisplayProgress((prev) => {
        const target = Math.min(progress, readyToHide ? 100 : 99);
        const next = prev + (target - prev) * 0.12; // easing
        return Math.abs(next - target) < 0.1 ? target : next;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress, readyToHide]);

  // Fade out then remove loader
  useEffect(() => {
    if (!readyToHide) return;
    const t = setTimeout(() => setLoaderVisible(false), 320);
    return () => clearTimeout(t);
  }, [readyToHide]);

  return (
    <>
      {loaderVisible && (
        <Loader progress={displayProgress} fading={readyToHide} />
      )}

      <Canvas className="r3f" shadows>
        <Suspense fallback={null}>
          <ProgressBridge onProgress={onProgress} />
          <FirstFrame onFirstFrame={onFirstFrame} />
          <Experience />
        </Suspense>
      </Canvas>
    </>
  );
}

const root = ReactDOM.createRoot(document.querySelector('#root'));
root.render(<App />);
