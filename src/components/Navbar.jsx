import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import api from "../api/axios";
import { totalWonSummary } from "../utils/creatorPrizes";

const PLATFORM_FEE_TOOLTIP =
  "5% is deducted as a platform fee from your payout.";

const Navbar = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [creatorTotalWon, setCreatorTotalWon] = useState(null);

  useEffect(() => {
    if (user?.role !== "creator") {
      setCreatorTotalWon(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [campaignsRes, winsRes] = await Promise.all([
          api.get("/api/campaigns"),
          api.get("/api/submissions/my-wins"),
        ]);
        if (cancelled) return;
        const summary = totalWonSummary(
          winsRes.data || [],
          campaignsRes.data || []
        );
        setCreatorTotalWon(summary);
      } catch {
        if (!cancelled) setCreatorTotalWon(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.role, user?._id, user?.id]);

  if (loading) return null;

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar">
      <h2 className="brand">Brand<span className="forge">forge.</span></h2>

      <div className="navbar-links">
        {!user && (
          <>
            <Link to="/login" className="nav-login-btn">Login</Link>
            <Link to="/register" className="nav-register-btn">Register</Link>
          </>
        )}

        {user && !isAuthPage && (
          <>
            {user.role === "creator" && creatorTotalWon && (
              <span
                className="navbar-total-won"
                title={PLATFORM_FEE_TOOLTIP}
              >
                Total won: <strong>{creatorTotalWon}</strong>
                <sup className="navbar-total-asterisk">*</sup>
              </span>
            )}
            <button className="action-btn logout-btn" onClick={handleLogoutClick}>
              Logout
            </button>
          </>
        )}
      </div>

      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-header">
              <span className="warning-icon">⚠️</span>
              <h3>Confirm Logout</h3>
            </div>
            <p>Are you sure you want to log out of BrandForge?</p>
            <div className="logout-modal-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="confirm-btn" 
                onClick={handleConfirmLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
