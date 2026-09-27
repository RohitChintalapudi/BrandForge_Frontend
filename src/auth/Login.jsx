import { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

    try {
      await api.post("/api/auth/login", { email, password });

      const { data } = await api.get("/api/auth/me");
      setUser(data);

      toast.success("Login successful");

      // Immediate redirect after login
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
          break;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
        <div className="gradient-blob blob-3"></div>
      </div>

      <div className="auth-container">
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your BrandForge account</p>
          </div>

          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button">
            Login
          </button>

          <div className="auth-footer">
            <p>
              Don&apos;t have an account? <Link to="/register">Sign up</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
