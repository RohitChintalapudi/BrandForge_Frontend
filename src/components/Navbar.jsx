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

  // Helper to extract display name
  const getUserDisplayName = () => {
    if (!user) return "";
    if (user.name) return user.name;
    if (user.email) {
      const prefix = user.email.split("@")[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    if (user.role === "admin") return "Admin";
    if (user.role === "brand") return "Brand Partner";
    if (user.role === "creator") return "Creator";
    return "User";
  };

  // Helper to get initials
  const getUserInitials = () => {
    if (!user) return "BF";
    if (user.name) {
      const parts = user.name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (user.email) return user.email.slice(0, 2).toUpperCase();
    return user.role ? user.role.slice(0, 2).toUpperCase() : "BF";
  };

  // Helper to get role presentation details
  const getRoleConfig = () => {
    if (!user?.role) return { label: "Member", icon: "✨", badgeClass: "role-pill-default" };
    switch (user.role.toLowerCase()) {
      case "admin":
        return { label: "Admin", icon: "👑", badgeClass: "role-pill-admin", path: "/admin" };
      case "brand":
        return { label: "Brand", icon: "🏢", badgeClass: "role-pill-brand", path: "/brand" };
      case "creator":
        return { label: "Creator", icon: "🎨", badgeClass: "role-pill-creator", path: "/creator" };
      default:
        return { label: user.role, icon: "✨", badgeClass: "role-pill-default", path: "/" };
    }
  };

  const roleConfig = getRoleConfig();
  const dashboardPath = roleConfig.path || "/";

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Main Navigation">
        <div className="navbar-inner-wrapper">
          {/* Brand Logo & Tagline */}
          <Link
            to={user ? dashboardPath : "/"}
            className="navbar-brand-link"
            aria-label="BrandForge Home"
          >
            <div className="navbar-logo-badge">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div className="navbar-brand-text-group">
              <div className="navbar-logo-text">
                Brand<span className="navbar-logo-accent">Forge</span>
              </div>
              <span className="navbar-tagline">Collab Hub</span>
            </div>
          </Link>

          {/* Navigation Links & User Controls */}
          <div className="navbar-actions">
            {!user && (
              <div className="navbar-guest-actions">
                <Link
                  to="/login"
                  className={`navbar-signin-link ${
                    location.pathname === "/login" ? "active-link" : ""
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className={`navbar-cta-btn ${
                    isAuthPage && location.pathname !== "/login" ? "active" : ""
                  }`}
                >
                  <span>Get Started</span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            )}

            {user && !isAuthPage && (
              <div className="navbar-user-section">
                {/* User Profile Capsule */}
                <div className="navbar-user-capsule" title={`Signed in as ${user.email || getUserDisplayName()}`}>
                  <div className="navbar-avatar-circle">
                    {getUserInitials()}
                  </div>
                  <div className="navbar-user-meta">
                    <span className="navbar-user-name">{getUserDisplayName()}</span>
                    <span className={`navbar-role-pill ${roleConfig.badgeClass}`}>
                      <span className="role-icon">{roleConfig.icon}</span>
                      <span className="role-text">{roleConfig.label}</span>
                    </span>
                  </div>
                  <div className="navbar-status-indicator" title="Connected">
                    <span className="status-dot"></span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  className="navbar-logout-btn"
                  onClick={() => setShowLogoutModal(true)}
                  aria-label="Log out of account"
                >
                  <svg
                    width="16"
                    height="16"
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
                  <span className="logout-text">Logout</span>
                </button>
              </div>
            )}
          </div>
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
