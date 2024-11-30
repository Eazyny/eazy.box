import './style.css';
import ReactDOM from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import Experience from './Experience';
import { Suspense } from 'react';
import Loader from './Loading';

const root = ReactDOM.createRoot(document.querySelector('#root'));

root.render(
  <Canvas className="r3f">
    <Suspense fallback={<Loader />}>
      <Experience />
    </Suspense>
  </Canvas>
);
