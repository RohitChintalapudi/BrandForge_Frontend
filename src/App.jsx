import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./auth/Login";
import Register from "./auth/Register";
import AdminDashboard from "./pages/AdminDashboard";
import BrandDashboard from "./pages/BrandDashboard";
import CreatorDashboard from "./pages/CreatorDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

const HomeRedirect = () => {
  const { user } = useAuth();
  
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  if (user?.role === "brand") return <Navigate to="/brand" replace />;
  if (user?.role === "creator") return <Navigate to="/creator" replace />;
  
  return <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/brand"
          element={
            <ProtectedRoute role="brand">
              <BrandDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/creator"
          element={
            <ProtectedRoute role="creator">
              <CreatorDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
