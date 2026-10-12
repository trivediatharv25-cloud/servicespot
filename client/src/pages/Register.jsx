import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    phone: "",
    location: "",
  });
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await register(form);
      navigate(data.role === "provider" ? "/dashboard" : "/browse");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  const inputClass =
    "border border-ink-100 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brass-400 text-sm";

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-paper px-4 py-8">
      <div className="max-w-sm w-full bg-white p-8 rounded-md border border-ink-100">
        <h1 className="text-2xl font-serif font-semibold mb-1 text-ink-900">Create an account</h1>
        <p className="text-sm text-ink-500 mb-6">Join ServiceSpot in a few seconds</p>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input name="name" placeholder="Full name" className={inputClass} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" className={inputClass} onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" className={inputClass} onChange={handleChange} required />
          <input name="phone" placeholder="Phone number" className={inputClass} onChange={handleChange} />
          <input name="location" placeholder="City / location" className={inputClass} onChange={handleChange} />
          <select name="role" className={inputClass} onChange={handleChange} value={form.role}>
            <option value="user">I want to book services</option>
            <option value="provider">I want to offer services</option>
          </select>
          <button className="bg-ink-900 hover:bg-ink-800 transition-colors text-white rounded-full py-2.5 font-medium mt-1">
            Register
          </button>
        </form>
        <p className="text-sm mt-5 text-ink-500">
          Already have an account? <Link to="/login" className="text-brass-600 font-medium hover:text-brass-700">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
