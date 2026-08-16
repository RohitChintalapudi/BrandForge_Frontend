import { useEffect, useState } from "react";

const WARMUP_MESSAGES = [
  "Waking up the server...",
  "Almost there...",
  "Spinning up the engines...",
  "Loading your data...",
  "Connecting to the cloud...",
];

const ServerLoadingScreen = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % WARMUP_MESSAGES.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="server-loading-screen">
      <div className="server-loading-orbs">
        <span className="orb orb-1"></span>
        <span className="orb orb-2"></span>
        <span className="orb orb-3"></span>
      </div>

      <div className="server-loading-grid"></div>

      <div className="server-loading-card">
        <div className="server-loading-logo">
          Brand<span>forge.</span>
        </div>

        <div className="server-loading-spinner"></div>

        <h1 className="server-loading-title">Warming up the server...</h1>
        <p className="server-loading-subtitle">
          Our free-tier server needs a few seconds to wake up. Please wait --
          once it's ready, everything will run smoothly for you.
        </p>

        <p key={messageIndex} className="server-loading-step">
          {WARMUP_MESSAGES[messageIndex]}
        </p>
      </div>
    </div>
  );
};

export default ServerLoadingScreen;