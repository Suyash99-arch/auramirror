import type { RefObject } from "react";
import type { CameraStatus } from "../../hooks/useCamera";
import "./Camera.css";

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  status: CameraStatus;
  onStart: () => void;
}

export default function Camera({ videoRef, canvasRef, status, onStart }: Props) {
  return (
    <div className="camera">
      <video ref={videoRef} className="camera-video" playsInline muted />
      <canvas ref={canvasRef} className="camera-canvas" />

      {status !== "ready" && (
        <div className="camera-overlay">
          <div className="camera-icon">📷</div>
          {status === "denied" ? (
            <p>Camera access was blocked. Click the camera icon in your browser's address bar, allow it, and refresh.</p>
          ) : status === "error" ? (
            <p>Couldn't open the camera. Close other apps that use it and try again.</p>
          ) : (
            <p>Your mirror is ready. Turn on the camera to begin.</p>
          )}
          <button className="btn" onClick={onStart} disabled={status === "loading"}>
            {status === "loading" ? "Starting…" : "Enable Camera"}
          </button>
        </div>
      )}
    </div>
  );
}