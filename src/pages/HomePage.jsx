import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const HomePage = () => {
  const container = useRef();

  useGSAP(() => {
    // Hero Timeline
    const tl = gsap.timeline({ 
      defaults: { ease: "power4.out", duration: 1 } 
    });
    
    tl.from(".badge", {
      y: -20,
      autoAlpha: 0
    })
    .from("h1", {
      y: 40,
      autoAlpha: 0
    }, "-=0.6")
    .from("p", {
      y: 20,
      autoAlpha: 0,
      duration: 0.8
    }, "-=0.7")
    .from(".hero-btns", {
      y: 20,
      autoAlpha: 0,
      duration: 0.8
    }, "-=0.6");

    // Scroll triggered features
    gsap.fromTo(".feature-card", 
      {
        y: 60,
        autoAlpha: 0
      },
      {
        scrollTrigger: {
          trigger: ".grid-3",
          start: "top bottom-=100px",
          toggleActions: "play none none none",
        },
        y: 0,
        autoAlpha: 1,
        stagger: 0.15,
        duration: 1,
        ease: "power2.out"
      }
    );

    // Impact section reveal
    gsap.from(".impact-quote", {
      scrollTrigger: {
        trigger: ".impact-quote",
        start: "top bottom-=50px",
      },
      scale: 0.95,
      opacity: 0,
      duration: 1.2,
      ease: "power3.out"
    });
  }, { scope: container });

  return (
    <div ref={container} className="home-page">
      <section className="hero">
        <div className="hero-content">
          <span className="badge">LifeDrop Network</span>
          <h1>
            Your Blood Can <span className="highlight">Save</span> Three Lives
          </h1>
          <p>
            Join the world's most efficient blood donation network. We connect heroes like you with patients in urgent need within minutes.
          </p>
          <div className="hero-btns" style={{ marginTop: '40px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/register" className="btn-primary">Become a Donor</Link>
            <Link to="/about" className="btn-secondary">Learn More</Link>
          </div>
        </div>
      </section>

      <section className="features-section" style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="grid-3">
          <div className="feature-card">
            <div className="icon">🩸</div>
            <h3>Critical Need</h3>
            <p>Every 2 seconds someone needs blood. Your contribution is vital for emergency surgeries and chronic treatments.</p>
          </div>
          <div className="feature-card">
            <div className="icon">⚡</div>
            <h3>Quick Process</h3>
            <p>Registration takes 2 minutes. The actual donation takes only 10 minutes. It's the simplest way to be a hero.</p>
          </div>
          <div className="feature-card">
            <div className="icon">🛡️</div>
            <h3>Safe & Secure</h3>
            <p>We prioritize your safety with top-tier medical protocols and a secure data management system.</p>
          </div>
        </div>
      </section>

      <section className="impact-quote" style={{ padding: '100px 20px', textAlign: 'center', background: 'var(--bg-soft)' }}>
         <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '36px', fontStyle: 'italic' }}>"The finest gesture one can make is to save a life."</h2>
            <p style={{ marginTop: '24px', color: 'var(--text-soft)', fontWeight: '600' }}>— Join 10,000+ donors today.</p>
         </div>
      </section>
    </div>
  );
};

export default HomePage;
