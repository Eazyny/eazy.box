// src/MatrixRain.jsx
import { useEffect, useRef } from 'react';

export default function MatrixRain() {
  const canvasRef = useRef(null);
  const workerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // OffscreenCanvas supported?
    if (!canvas.transferControlToOffscreen) {
      // Fallback: still show canvas (won’t crash), but main-thread animation would be needed
      console.warn('OffscreenCanvas not supported in this browser.');
      return;
    }

    const offscreen = canvas.transferControlToOffscreen();

    const worker = new Worker(new URL('./matrixrain.worker.js', import.meta.url), {
      type: 'module',
    });

    workerRef.current = worker;

    const sendResize = () => {
      worker.postMessage({
        type: 'resize',
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        columnCount: 70,
      });
    };

    worker.postMessage(
      {
        type: 'init',
        canvas: offscreen,
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        columnCount: 70,
      },
      [offscreen]
    );

    window.addEventListener('resize', sendResize);

    return () => {
      window.removeEventListener('resize', sendResize);
      worker.postMessage({ type: 'stop' });
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="matrix-rain"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    />
  );
}
