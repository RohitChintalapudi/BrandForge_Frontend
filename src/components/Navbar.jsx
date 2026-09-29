import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showLogoutModal && !isLoggingOut) {
        setShowLogoutModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLogoutModal, isLoggingOut]);

  if (loading) return null;

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/signup";

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success("Logged out successfully");
      setShowLogoutModal(false);
      navigate("/login", { replace: true });
    } catch {
      toast.error("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-brand-link">
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
              <button
                type="button"
                className="action-btn navbar-logout-btn"
                onClick={() => setShowLogoutModal(true)}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Confirmation Modal Popup for Logout */}
      {showLogoutModal && (
        <div
          className="logout-modal-backdrop"
          onClick={() => !isLoggingOut && setShowLogoutModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-heading"
        >
          <div
            className="logout-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="logout-modal-header">
              <div className="logout-modal-icon-badge">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <button
                type="button"
                className="logout-modal-close-icon"
                onClick={() => !isLoggingOut && setShowLogoutModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <h3 id="logout-modal-heading" className="logout-modal-title">
              Are you sure you want to log out?
            </h3>
            <p className="logout-modal-subtitle">
              You will be signed out of your BrandForge account and returned to the sign in page.
            </p>

            <div className="logout-modal-actions">
              <button
                type="button"
                className="logout-modal-cancel-btn"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                type="button"
                className="logout-modal-confirm-btn"
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Logging out..." : "Yes, Log Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;


