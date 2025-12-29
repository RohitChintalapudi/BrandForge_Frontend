import { useState } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await api.post("/api/auth/login", { email, password });
      const me = await api.get("/api/auth/me");

      setUser(me.data); // 🔥 GLOBAL AUTH STATE UPDATE

      toast.success("Login successful");

      if (me.data.role === "admin") navigate("/admin");
      if (me.data.role === "brand") navigate("/brand");
      if (me.data.role === "creator") navigate("/creator");
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
              Don't have an account? <Link to="/register">Sign up</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
