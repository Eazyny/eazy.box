import { Html, useProgress } from '@react-three/drei';
import './MatrixLoader.css'; // Add this CSS for styling

function Loader() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="matrix-loader">
        <div className="matrix-rain">
          {[...Array(20)].map((_, i) => (
            <span key={i} className="matrix-column">
              {''.split('').map((char, j) => (
                <span key={j}>{char}</span>
              ))}
            </span>
          ))}
        </div>
        <div className="loader-container">
          <div className="loader-bar">
            <div className="loader-progress" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="loader-text"> {progress.toFixed(2)}%</p>
        </div>
      </div>
    </Html>
  );
}

export default Loader;
