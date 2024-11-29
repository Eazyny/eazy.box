import { Html, useProgress } from '@react-three/drei';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ width: '100%', background: '#333', borderRadius: '5px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progress}%`,
              background: '#00df00',
              height: '10px',
              borderRadius: '5px',
            }}
          ></div>
        </div>
        <div style={{ marginTop: '10px' }}>
          Loading... {progress.toFixed(2)}%
        </div>
      </div>
    </Html>
  );
}

export default Loader;