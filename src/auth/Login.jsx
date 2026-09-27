import { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // demo role helper

  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!user) return;

    switch (user.role) {
      case "admin":
        navigate("/admin", { replace: true });
        break;
      case "brand":
        navigate("/brand", { replace: true });
        break;
      case "creator":
        navigate("/creator", { replace: true });
        break;
      default:
        break;
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await api.post("/api/auth/login", { email, password });

      const { data } = await api.get("/api/auth/me");
      setUser(data);

      toast.success(`Welcome back, ${data.name || "User"}! 🎉`);

      // Immediate redirect based on role
      switch (data.role) {
        case "admin":
          navigate("/admin", { replace: true });
          break;
        case "brand":
          navigate("/brand", { replace: true });
          break;
        case "creator":
          navigate("/creator", { replace: true });
          break;
        default:
          navigate("/", { replace: true });
          break;
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Invalid credentials. Please check your email and password."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (role, demoEmail, demoPass) => {
    setActiveTab(role);
    setEmail(demoEmail);
    setPassword(demoPass);
    toast.info(`Filled sample credentials for ${role.toUpperCase()}`);
  };

  return (
    <div className="login-page-wrapper">
      {/* Background ambient lighting */}
      <div className="ambient-glow glow-top-left"></div>
      <div className="ambient-glow glow-bottom-right"></div>
      <div className="ambient-mesh-pattern"></div>

      <div className="login-card-container">
        {/* Left Side: Brand Showcase Panel */}
        <div className="login-showcase-panel">
          <div className="showcase-content">
            <div className="showcase-badge">
              <span className="badge-sparkle">✨</span>
              <span>Next-Gen Creator & Brand Ecosystem</span>
            </div>

            <h1 className="showcase-title">
              Elevate campaigns, <br />
              <span className="gradient-text">amplify your reach.</span>
            </h1>

            <p className="showcase-description">
              BrandForge connects innovative brands with high-impact creators
              for seamless content collaborations, tracking, and rewards.
            </p>

            {/* Interactive Feature Stats Cards */}
            <div className="showcase-metrics">
              <div className="metric-pill">
                <div className="metric-icon">🚀</div>
                <div className="metric-text">
                  <strong>Instant Matching</strong>
                  <span>Direct brand & creator sync</span>
                </div>
              </div>

              <div className="metric-pill">
                <div className="metric-icon">💎</div>
                <div className="metric-text">
                  <strong>Guaranteed Payouts</strong>
                  <span>Secure campaign milestones</span>
                </div>
              </div>
            </div>

            <div className="showcase-testimonial">
              <div className="testimonial-quote">
                "BrandForge transformed how we launch creator campaigns in days
                instead of weeks."
              </div>
              <div className="testimonial-author">
                <div className="avatar-circle">✨</div>
                <div>
                  <strong>Creative Network</strong>
                  <span>Global Brand Partnership</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Login Form */}
        <div className="login-form-panel">
          <div className="login-form-card">
            <div className="login-card-header">
              <div className="brand-logo-pill">
                <span className="logo-name">BrandForge</span>
              </div>
              <h2>Sign in to Account</h2>
              <p>Welcome back! Please enter your details to continue.</p>
            </div>


            {/* Quick Demo Credentials Pill selector */}
            <div className="quick-demo-section">
              <span className="quick-demo-label">Quick Test Login:</span>
              <div className="quick-demo-buttons">
                <button
                  type="button"
                  className={`demo-btn ${activeTab === "creator" ? "active" : ""}`}
                  onClick={() =>
                    handleQuickFill(
                      "creator",
                      "creator@brandforge.com",
                      "Password123!"
                    )
                  }
                >
                  🎨 Creator
                </button>
                <button
                  type="button"
                  className={`demo-btn ${activeTab === "brand" ? "active" : ""}`}
                  onClick={() =>
                    handleQuickFill(
                      "brand",
                      "brand@brandforge.com",
                      "Password123!"
                    )
                  }
                >
                  🏢 Brand
                </button>
                <button
                  type="button"
                  className={`demo-btn ${activeTab === "admin" ? "active" : ""}`}
                  onClick={() =>
                    handleQuickFill(
                      "admin",
                      "admin@brandforge.com",
                      "Password123!"
                    )
                  }
                >
                  👑 Admin
                </button>
              </div>
            </div>

            <form className="interactive-form" onSubmit={handleLogin}>
              {/* Email Field with Icon */}
              <div className="input-field-group">
                <label htmlFor="login-email">Email Address</label>
                <div className="input-with-icon">
                  <span className="input-icon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field with Icon & Toggle */}
              <div className="input-field-group">
                <div className="label-with-link">
                  <label htmlFor="login-password">Password</label>
                  <button
                    type="button"
                    className="text-link-button"
                    onClick={() =>
                      toast.info(
                        "Please contact your administrator or reset via backend"
                      )
                    }
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="input-with-icon">
                  <span className="input-icon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        width="18"
                        height="11"
                        x="3"
                        y="11"
                        rx="2"
                        ry="2"
                      />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Option */}
              <div className="form-extras">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkmark-box"></span>
                  <span className="checkbox-label">Remember me on this device</span>
                </label>
              </div>

              {/* Submit Button with Loading Animation */}
              <button
                type="submit"
                className={`login-submit-button ${isSubmitting ? "submitting" : ""}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="button-spinner-row">
                    <span className="btn-spinner"></span>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="button-label-row">
                    <span>Sign In to Dashboard</span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Footer Links */}
              <div className="login-card-footer">
                <p>
                  Don&apos;t have an account yet?{" "}
                  <Link to="/register" className="highlight-link">
                    Create free account
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

