import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/" onClick={() => setIsOpen(false)}>
          LifeDrop<span>.</span>
        </Link>
      </div>

      <button 
        className={`mobile-toggle ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`nav-links ${isOpen ? 'open' : ''}`}>
        <Link to="/" className={location.pathname === "/" ? "active" : ""} onClick={() => setIsOpen(false)}>
          Home
        </Link>
        <Link to="/about" className={location.pathname === "/about" ? "active" : ""} onClick={() => setIsOpen(false)}>
          About
        </Link>
        <Link to="/donor-login" className={location.pathname === "/donor-login" ? "active" : ""} onClick={() => setIsOpen(false)}>
          My Profile
        </Link>
        <Link 
          to="/register" 
          className={location.pathname === "/register" ? "active btn-primary" : "btn-primary"} 
          onClick={() => setIsOpen(false)}
          style={{ padding: '10px 20px', color: '#fff' }}
        >
          Register
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
