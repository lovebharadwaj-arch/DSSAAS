import { ArrowRight, Brain, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import "../../index.css";
import Button from "../common/Button";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Features", "Platform", "Pricing", "Resources"];

  const handleGetStarted = () => {
    setMobileOpen(false);
    navigate(user ? "/dataPages" : "/login");
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/login", { replace: true });
  };

  const handleLogin = () => {
    setMobileOpen(false);
    navigate("/login");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glass py-3" : "bg-transparent py-5"
      }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <button
          type="button"
          className="flex items-center gap-2.5"
          onClick={() => navigate("/")}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-teal-400 flex items-center justify-center">
            <Brain className="w-5 h-5 text-slate-900" />
          </div>

          <span className="text-white font-bold text-lg tracking-tight">
            Neuralis
          </span>
        </button>

        {/* Desktop navigation links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              {link}
            </a>
          ))}
        </div>

        {/* Desktop authentication buttons */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <button
                type="button"
                onClick={handleGetStarted}
                className="text-sm font-medium text-white hover:text-teal-300 transition-colors">
                Hi, {user.name}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="btn-primary text-white text-sm font-semibold px-5 py-2.5 rounded-lg">
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                onClick={handleLogin}>
                Sign in
              </button>

              <button
                type="button"
                className="btn-primary text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2"
                onClick={handleGetStarted}>
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <Button
          className="md:hidden text-white"
          onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <div className="md:hidden glass mt-3 mx-6 rounded-xl p-6 flex flex-col gap-4">
          {links.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-slate-300 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}>
              {link}
            </a>
          ))}

          {user ? (
            <>
              <p className="text-white font-medium">Logged in as {user.name}</p>

              <Button
                className="btn-primary text-white font-semibold px-5 py-2.5 rounded-lg mt-2"
                onClick={handleGetStarted}>
                Go to Dashboard
              </Button>

              <Button
                className="text-white font-semibold px-5 py-2.5 rounded-lg"
                onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                className="text-white font-semibold px-5 py-2.5 rounded-lg"
                onClick={handleLogin}>
                Sign in
              </Button>

              <Button
                className="btn-primary text-white font-semibold px-5 py-2.5 rounded-lg mt-2"
                onClick={handleGetStarted}>
                Get Started
              </Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
