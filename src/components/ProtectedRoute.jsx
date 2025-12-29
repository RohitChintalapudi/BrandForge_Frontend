import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

const ProtectedRoute = ({ children, role }) => {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    api
      .get("/api/auth/me")
      .then((res) => {
        if (res.data.role === role) setStatus("allowed");
        else setStatus("denied");
      })
      .catch(() => setStatus("denied"));
  }, [role]);

  if (status === "loading") return null;
  if (status === "denied") return <Navigate to="/login" />;

  return children;
};

export default ProtectedRoute;
