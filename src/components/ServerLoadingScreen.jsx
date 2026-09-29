import { useEffect, useState } from "react";

const WARMUP_MESSAGES = [
  { icon: "⚡", text: "Waking up the server..." },
  { icon: "🔧", text: "Spinning up the engines..." },
  { icon: "🌐", text: "Connecting to the cloud..." },
  { icon: "📦", text: "Loading your data..." },
  { icon: "✨", text: "Almost there..." },
];

const ServerLoadingScreen = () => {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStep((i) => (i + 1) % WARMUP_MESSAGES.length);
    }, 2400);

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return 92; // hold near end until real load
        return p + Math.floor(Math.random() * 6) + 2;
      });
    }, 1800);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const { icon, text } = WARMUP_MESSAGES[step];

  return (
    <div className="sls-backdrop">
      {/* Ambient blobs */}
      <div className="sls-blob sls-blob-1"></div>
      <div className="sls-blob sls-blob-2"></div>
      <div className="sls-blob sls-blob-3"></div>

      <div className="sls-card">
        {/* Top glow bar */}
        <div className="sls-card-glow"></div>

        {/* Logo */}
        <div className="sls-logo-row">
          <div className="sls-logo-icon-wrap">
            <span className="sls-logo-letter">B</span>
            <div className="sls-logo-pulse"></div>
          </div>
          <span className="sls-logo-text">
            Brand<span className="sls-logo-accent">Forge</span>
          </span>
        </div>

        {/* Headline */}
        <h1 className="sls-title">Starting up the server</h1>
        <p className="sls-subtitle">
          Our free-tier server needs a few seconds to wake up. Hang tight — once
          it's live, everything runs smoothly.
        </p>

        {/* Progress bar */}
        <div className="sls-progress-track">
          <div
            className="sls-progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Animated step message */}
        <div className="sls-step-row" key={step}>
          <span className="sls-step-icon">{icon}</span>
          <span className="sls-step-text">{text}</span>
        </div>

        {/* Status indicators */}
        <div className="sls-status-row">
          <div className="sls-status-dot sls-dot-active"></div>
          <span className="sls-status-label">Server initializing</span>
          <div className="sls-divider"></div>
          <div className="sls-status-dot sls-dot-pulse"></div>
          <span className="sls-status-label">Checking health</span>
        </div>
      </div>
    </div>
  );
};

export default ServerLoadingScreen;
