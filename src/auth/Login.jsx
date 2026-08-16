import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useNavigate, Link, useNavigationType } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const particles = [];
    const particleCount = 28;
    const maxDistance = 110;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.65,
        vy: (Math.random() - 0.5) * 0.65,
        radius: Math.random() * 2 + 1.2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(124, 58, 237, 0.55)"; // Purple nodes (more visible)
      ctx.strokeStyle = "rgba(124, 58, 237, 0.22)"; // Soft lines (more visible)
      ctx.lineWidth = 1;

      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx = -p.vx;
        if (p.y < 0 || p.y > canvas.height) p.vy = -p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particleCount; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (user && navigationType === "POP") {
      if (user.role === "admin") navigate("/admin", { replace: true });
      if (user.role === "brand") navigate("/brand", { replace: true });
      if (user.role === "creator") navigate("/creator", { replace: true });
    }
  }, [user, navigationType, navigate]);

  const validateEmail = (val) => {
    if (!val.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const validatePassword = (val) => {
    if (!val) {
      return "Password is required";
    }
    if (val.length < 6) {
      return "Password must be at least 6 characters";
    }
    return "";
  };

  // Run validation on touch/change
  useEffect(() => {
    if (emailTouched) {
      setEmailError(validateEmail(email));
    }
  }, [email, emailTouched]);

  useEffect(() => {
    if (passwordTouched) {
      setPasswordError(validatePassword(password));
    }
  }, [password, passwordTouched]);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Mark all as touched to trigger validations
    setEmailTouched(true);
    setPasswordTouched(true);

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    if (emailErr || passErr) {
      setEmailError(emailErr);
      setPasswordError(passErr);
      return;
    }

    try {
      await api.post("/api/auth/login", { email, password });
      const me = await api.get("/api/auth/me");

      setUser(me.data);

      toast.success("Login successful");

      if (me.data.role === "admin") navigate("/admin", { replace: true });
      if (me.data.role === "brand") navigate("/brand", { replace: true });
      if (me.data.role === "creator") navigate("/creator", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  const hasErrors = !!(emailTouched && emailError) || !!(passwordTouched && passwordError);

  return (
    <div className="auth-split-layout">
      {/* Left panel: Brand Forge showcase with nice purple animations */}
      <div className="auth-side-showcase">
        <div className="auth-orb auth-orb-1"></div>
        <div className="auth-orb auth-orb-2"></div>
        <div className="auth-orb auth-orb-3"></div>

        {/* Floating Particles */}
        <div className="auth-particle auth-particle-1"></div>
        <div className="auth-particle auth-particle-2"></div>
        <div className="auth-particle auth-particle-3"></div>
        <div className="auth-particle auth-particle-4"></div>

        <div className="showcase-glass-card">
          <h1>BrandForge</h1>
          <p>
            Where digital creators and forward-thinking brands collaborate to forge high-impact campaigns and unlock spectacular rewards.
          </p>
          <div className="showcase-cta">
            Collaborate. Create. Conquer.
          </div>
        </div>
      </div>

      {/* Right panel: Login form */}
      <div className="auth-side-form">
        <canvas ref={canvasRef} className="auth-network-canvas" />
        <div className="auth-form-wrapper">
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <div className="auth-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your BrandForge account</p>
            </div>

            <div className={`form-group ${emailTouched && emailError ? "is-invalid" : ""} ${emailTouched && !emailError ? "is-valid" : ""}`}>
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                required
              />
              {emailTouched && emailError && (
                <span className="validation-error">{emailError}</span>
              )}
            </div>

            <div className={`form-group ${passwordTouched && passwordError ? "is-invalid" : ""} ${passwordTouched && !passwordError ? "is-valid" : ""}`}>
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                required
              />
              {passwordTouched && passwordError && (
                <span className="validation-error">{passwordError}</span>
              )}
            </div>

            <button type="submit" className="auth-button" disabled={hasErrors}>
              Login
            </button>

            <div className="auth-footer">
              <p>
                Don't have an account? <Link to="/register">Sign up</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
