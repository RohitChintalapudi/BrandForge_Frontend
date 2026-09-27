import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const Navbar = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) return null;

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/signup";

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand-link">
        <span className="navbar-logo-icon">⚡</span>
        <span className="navbar-logo-text">BrandForge</span>
      </Link>

      <div className="navbar-links">
        {!user && (
          <>
            <Link to="/login" className={location.pathname === "/login" ? "active-link" : ""}>
              Sign In
            </Link>
            <Link to="/register" className={`navbar-cta-btn ${isAuthPage && location.pathname !== "/login" ? "active" : ""}`}>
              Get Started
            </Link>
          </>
        )}

        {user && !isAuthPage && (
          <div className="navbar-user-section">
            <span className="user-role-badge">{user.role}</span>
            <button className="action-btn navbar-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

