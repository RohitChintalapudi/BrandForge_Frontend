import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import ServerLoadingScreen from "../components/ServerLoadingScreen";

const Register = () => {
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

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "creator",
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const validateField = (name, val) => {
    switch (name) {
      case "name":
        if (!val.trim()) {
          return "Full name is required";
        }
        if (val.trim().length < 2) {
          return "Name must be at least 2 characters";
        }
        return "";
      case "email":
        if (!val.trim()) {
          return "Email is required";
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          return "Please enter a valid email address";
        }
        return "";
      case "password":
        if (!val) {
          return "Password is required";
        }
        if (val.length < 6) {
          return "Password must be at least 6 characters";
        }
        return "";
      default:
        return "";
    }
  };

  // Run validation on touch/change
  useEffect(() => {
    if (touched.name) {
      setErrors((prev) => ({ ...prev, name: validateField("name", form.name) }));
    }
  }, [form.name, touched.name]);

  useEffect(() => {
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateField("email", form.email) }));
    }
  }, [form.email, touched.email]);

  useEffect(() => {
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validateField("password", form.password) }));
    }
  }, [form.password, touched.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      name: true,
      email: true,
      password: true,
    });

    const nameErr = validateField("name", form.name);
    const emailErr = validateField("email", form.email);
    const passErr = validateField("password", form.password);

    if (nameErr || emailErr || passErr) {
      setErrors({
        name: nameErr,
        email: emailErr,
        password: passErr,
      });
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/api/auth/register", form);
      toast.success("Registered successfully");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = !!(touched.name && errors.name) || 
                    !!(touched.email && errors.email) || 
                    !!(touched.password && errors.password);

  return (
    <>
      {submitting && <ServerLoadingScreen />}
      <div className="auth-split-layout">
      {/* Left panel: Form */}
      <div className="auth-side-form">
        <canvas ref={canvasRef} className="auth-network-canvas" />
        <div className="auth-form-wrapper">
          <form className="auth-form compact-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-header">
              <h2>Create Account</h2>
              <p>Join BrandForge and start your journey</p>
            </div>

            <div className={`form-group ${touched.name && errors.name ? "is-invalid" : ""} ${touched.name && !errors.name ? "is-valid" : ""}`}>
              <label htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                name="name"
                placeholder="Enter full name"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {touched.name && errors.name && (
                <span className="validation-error">{errors.name}</span>
              )}
            </div>

            <div className={`form-group ${touched.email && errors.email ? "is-invalid" : ""} ${touched.email && !errors.email ? "is-valid" : ""}`}>
              <label htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {touched.email && errors.email && (
                <span className="validation-error">{errors.email}</span>
              )}
            </div>

            <div className={`form-group ${touched.password && errors.password ? "is-invalid" : ""} ${touched.password && !errors.password ? "is-valid" : ""}`}>
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {touched.password && errors.password && (
                <span className="validation-error">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="reg-role">I want to join as a</label>
              <select 
                id="reg-role"
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="creator">Creator</option>
                <option value="brand">Brand</option>
              </select>
            </div>

            <button type="submit" className="auth-button" disabled={hasErrors}>
              Create Account
            </button>

            <div className="auth-footer">
              <p>
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      <div className="auth-divider-line"></div>

      {/* Right panel: Brand Forge showcase with nice purple animations */}
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
            Join a powerful community where creators meet brands to build authentic relationships and drive game-changing campaigns.
          </p>
          <div className="showcase-cta">
            Begin Your Journey
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Register;
