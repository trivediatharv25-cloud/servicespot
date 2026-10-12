import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const WelcomeToast = () => {
  const { justLoggedIn, setJustLoggedIn, user } = useAuth();

  useEffect(() => {
    if (justLoggedIn) {
      const timer = setTimeout(() => setJustLoggedIn(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [justLoggedIn, setJustLoggedIn]);

  if (!justLoggedIn || !user) return null;

  return (
    <div className="fixed top-20 right-6 bg-ink-900 text-paper px-5 py-3 rounded-md shadow-lg z-50 animate-fade-in border border-brass-500/40">
      Welcome back, {user.name}.
    </div>
  );
};

export default WelcomeToast;
