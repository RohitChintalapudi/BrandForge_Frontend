import { useState } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "creator",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "", color: "transparent" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: "Weak", color: "#ef4444" };
      case 2:
        return { score: 50, label: "Fair", color: "#f59e0b" };
      case 3:
        return { score: 75, label: "Good", color: "#8b5cf6" };
      case 4:
        return { score: 100, label: "Strong", color: "#10b981" };
      default:
        return { score: 15, label: "Very Weak", color: "#ef4444" };
    }
  };

  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!agreeTerms) {
      toast.warning("Please accept the Terms of Service to proceed.");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/api/auth/register", form);
      toast.success("Account created successfully! Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Background ambient lighting */}
      <div className="ambient-glow glow-top-left"></div>
      <div className="ambient-glow glow-bottom-right"></div>
      <div className="ambient-mesh-pattern"></div>

      <div className="login-card-container register-container">
        {/* Left Side: Brand & Onboarding Showcase */}
        <div className="login-showcase-panel register-showcase-panel">
          <div className="showcase-content">
            <div className="showcase-badge">
              <span className="badge-sparkle">🚀</span>
              <span>Join 10,000+ Brands & Creators</span>
            </div>

            <h1 className="showcase-title">
              Start forging <br />
              <span className="gradient-text">lucrative partnerships.</span>
            </h1>

            <p className="showcase-description">
              Create an account today to access verified brand campaigns,
              collaborate seamlessly, and get guaranteed payouts.
            </p>

            {/* Dynamic Role Highlight Card */}
            <div className="role-highlight-box">
              <div className="highlight-header">
                <span className="highlight-role-badge">
                  {form.role === "creator" ? "🎨 For Creators" : "🏢 For Brands"}
                </span>
              </div>
              <p className="highlight-body">
                {form.role === "creator"
                  ? "Showcase your portfolio, submit social video links, win brand budgets, and withdraw earnings effortlessly."
                  : "Post custom campaigns with specific criteria, review curated creator submissions, and award winners with 1 click."}
              </p>
            </div>

            {/* Step-by-Step Benefit List */}
            <div className="benefits-checklist">
              <div className="benefit-item">
                <div className="benefit-bullet">✓</div>
                <span>Free instant account setup with zero hidden fees</span>
              </div>
              <div className="benefit-item">
                <div className="benefit-bullet">✓</div>
                <span>Role-tailored dashboard & campaign management</span>
              </div>
              <div className="benefit-item">
                <div className="benefit-bullet">✓</div>
                <span>Secure escrow & guaranteed on-time approvals</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Create Account Form */}
        <div className="login-form-panel register-form-panel">
          <div className="login-form-card register-form-card">
            <div className="login-card-header">
              <div className="brand-logo-pill">
                <span className="logo-icon">⚡</span>
                <span className="logo-name">BrandForge</span>
              </div>
              <h2>Create Account</h2>
              <p>Get started with your free BrandForge account</p>
            </div>

            {/* Role Selection Radio Cards */}
            <div className="role-selection-group">
              <label className="section-sublabel">Choose your account type:</label>
              <div className="role-cards-grid">
                <button
                  type="button"
                  className={`role-select-card ${form.role === "creator" ? "active" : ""}`}
                  onClick={() => setForm({ ...form, role: "creator" })}
                >
                  <div className="role-card-icon">🎨</div>
                  <div className="role-card-info">
                    <strong>Creator</strong>
                    <span>Submit & earn</span>
                  </div>
                  {form.role === "creator" && (
                    <div className="role-check-icon">✓</div>
                  )}
                </button>

                <button
                  type="button"
                  className={`role-select-card ${form.role === "brand" ? "active" : ""}`}
                  onClick={() => setForm({ ...form, role: "brand" })}
                >
                  <div className="role-card-icon">🏢</div>
                  <div className="role-card-info">
                    <strong>Brand</strong>
                    <span>Post & hire</span>
                  </div>
                  {form.role === "brand" && (
                    <div className="role-check-icon">✓</div>
                  )}
                </button>
              </div>
            </div>

            <form className="interactive-form" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="input-field-group">
                <label htmlFor="register-name">Full Name</label>
                <div className="input-with-icon">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="register-name"
                    type="text"
                    placeholder="e.g. Samantha Vance"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="input-field-group">
                <label htmlFor="register-email">Work or Personal Email</label>
                <div className="input-with-icon">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    id="register-email"
                    type="email"
                    placeholder="name@domain.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="input-field-group">
                <label htmlFor="register-password">Create Password</label>
                <div className="input-with-icon">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Live Password Strength Meter */}
                {form.password && (
                  <div className="password-meter-container">
                    <div className="meter-track">
                      <div
                        className="meter-fill"
                        style={{
                          width: `${strength.score}%`,
                          backgroundColor: strength.color,
                        }}
                      ></div>
                    </div>
                    <div className="meter-info">
                      <span>Strength:</span>
                      <strong style={{ color: strength.color }}>
                        {strength.label}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms Agreement */}
              <div className="form-extras">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <span className="checkmark-box"></span>
                  <span className="checkbox-label" style={{ fontSize: "0.82rem" }}>
                    I agree to the Terms of Service and Privacy Policy
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`login-submit-button ${isSubmitting ? "submitting" : ""}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="button-spinner-row">
                    <span className="btn-spinner"></span>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="button-label-row">
                    <span>Create Free Account</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Footer */}
              <div className="login-card-footer">
                <p>
                  Already have an account?{" "}
                  <Link to="/login" className="highlight-link">
                    Sign in here
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

export default Register;


