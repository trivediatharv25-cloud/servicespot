import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(email, password);
      navigate(data.role === "provider" ? "/dashboard" : "/browse");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-paper px-4">
      <div className="max-w-sm w-full bg-white p-8 rounded-md border border-ink-100">
        <h1 className="text-2xl font-serif font-semibold mb-1 text-ink-900">Welcome back</h1>
        <p className="text-sm text-ink-500 mb-6">Login to continue to ServiceSpot</p>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            className="border border-ink-100 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brass-400 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-ink-100 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brass-400 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="bg-ink-900 hover:bg-ink-800 transition-colors text-white rounded-full py-2.5 font-medium mt-1">
            Login
          </button>
        </form>
        <p className="text-sm mt-5 text-ink-500">
          No account? <Link to="/register" className="text-brass-600 font-medium hover:text-brass-700">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
