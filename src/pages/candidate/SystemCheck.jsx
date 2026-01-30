import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/SystemCheck.css";

function SystemCheck() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cameraGranted, setCameraGranted] = useState(false);
  const [screenGranted, setScreenGranted] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [error, setError] = useState("");

  // Request camera permission
  const requestCamera = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraGranted(true);
    } catch (err) {
      setError("Camera permission denied.");
    }
  };

  // Request screen share permission
  const requestScreenShare = async () => {
    try {
      await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenGranted(true);
    } catch (err) {
      setError("Screen share permission denied.");
    }
  };

  const canProceed = cameraGranted && screenGranted && consentGiven;

  return (
    <div className="system-check">
      <h1>System Check</h1>

      {error && <p className="error">{error}</p>}

      <div className="check-item">
        <button onClick={requestCamera}>
          {cameraGranted ? "Camera Granted ✅" : "Grant Camera Permission"}
        </button>
      </div>

      <div className="check-item">
        <button onClick={requestScreenShare}>
          {screenGranted
            ? "Screen Share Granted ✅"
            : "Grant Screen Share Permission"}
        </button>
      </div>

      <div className="check-item">
        <label>
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
          />
          I consent to webcam monitoring and exam rules
        </label>
      </div>

      <button
        className="proceed-btn"
        disabled={!canProceed}
        onClick={() => navigate(`/exam-interface/${id}`)}
      >
        Proceed to Exam
      </button>
    </div>
  );
}

export default SystemCheck;