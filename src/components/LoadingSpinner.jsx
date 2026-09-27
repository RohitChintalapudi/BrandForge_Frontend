import React from "react";

const LoadingSpinner = ({ message = "Loading BrandForge..." }) => {
  return (
    <div className="loading-screen">
      <div className="loading-container">
        <div className="brandforge-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-core">⚡</div>
        </div>
        <h3 className="loading-title">BrandForge</h3>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
