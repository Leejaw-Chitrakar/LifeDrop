import React from "react";

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-content">
        <p>
          &copy; {new Date().getFullYear()} LifeDrop. All rights reserved.
        </p>
        <p className="tagline">Providing hope, one drop at a time.</p>
      </div>
    </footer>
  );
};

export default Footer;
