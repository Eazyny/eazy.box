import MatrixRain from './MatrixRain';
import './MatrixLoader.css';

export default function Loader({ progress = 0, fading = false }) {
  return (
    <div className={`matrix-loader-overlay ${fading ? 'is-fading' : ''}`}>
      <div className="matrix-loader">
        <MatrixRain />

        <div className="loader-container">
          <div className="loader-bar">
            <div
              className="loader-progress"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="loader-text">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
}
