import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/">
          LifeDrop<span>.</span>
        </Link>
      </div>
      <div className="nav-links">
        <Link to="/" className={location.pathname === "/" ? "active" : ""}>
          Home
        </Link>
        <Link to="/about" className={location.pathname === "/about" ? "active" : ""}>
          About
        </Link>
        <Link to="/register" className={location.pathname === "/register" ? "active" : ""}>
          Register
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
