import React from "react";

const LoadingSpinner = ({ message = "Loading BrandForge..." }) => {
  return (
    <div className="loading-screen">
      <div className="loading-container">
        {/* Animated logo mark */}
        <div className="loading-logo-wrapper">
          <div className="loading-logo-ring loading-ring-outer"></div>
          <div className="loading-logo-ring loading-ring-inner"></div>
          <div className="loading-logo-core">
            <span className="loading-logo-letter">B</span>
          </div>
        </div>

        {/* Brand name */}
        <div className="loading-brand-name">
          Brand<span className="loading-brand-accent">Forge</span>
        </div>

        {/* Animated dots bar */}
        <div className="loading-dots-bar">
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
        </div>

        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
