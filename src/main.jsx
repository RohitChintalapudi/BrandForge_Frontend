import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#ffffff",
            color: "#1f2937",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            padding: "12px 16px",
            fontSize: "0.9rem",
            fontWeight: "500",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          },
          success: {
            iconTheme: { primary: "#8b5cf6", secondary: "#ffffff" },
            style: {
              border: "1px solid rgba(139,92,246,0.25)",
              background: "#faf5ff",
            },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#ffffff" },
            style: {
              border: "1px solid rgba(239,68,68,0.25)",
              background: "#fff5f5",
            },
          },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);
