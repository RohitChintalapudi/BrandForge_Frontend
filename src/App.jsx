import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import Register from "./auth/Register";
import AdminDashboard from "./pages/AdminDashboard";
import BrandDashboard from "./pages/BrandDashboard";
import CreatorDashboard from "./pages/CreatorDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import LoadingSpinner from "./components/LoadingSpinner";
import { useAuth } from "./context/AuthContext";

// Redirect based on role AFTER auth is resolved
const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

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
        {/* PUBLIC */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signup" element={<Register />} />

        {/* PROTECTED */}
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

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;

