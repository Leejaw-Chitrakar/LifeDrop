import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const AboutPage = () => {
  const container = useRef();

  useGSAP(() => {
    const tl = gsap.timeline();

    tl.fromTo(".about-hero-content > *", 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.2, duration: 1, ease: "power4.out" }
    )
    .fromTo(".stat-card", 
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, stagger: 0.15, duration: 0.8, ease: "back.out(1.7)" }, 
      "-=0.2"
    )
    .fromTo(".mission-details > *", 
      { x: -50, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.3, duration: 1, ease: "power3.out" }, 
      "-=0.4"
    )
    .fromTo(".step-card", 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.2, duration: 0.8, ease: "sine.out" }, 
      "-=0.6"
    );
  }, { scope: container });

  const stats = [
    { label: "Lives Saved", value: "10k+", icon: "❤️" },
    { label: "Active Donors", value: "5k+", icon: "👥" },
    // { label: "Hospitals Joined", value: "50+", icon: "🏥" },
    // { label: "Cities Covered", value: "12", icon: "📍" },
  ];

  const steps = [
    {
      title: "Registration",
      desc: "Fill out our simple form and pass a quick health screening.",
      icon: "1",
    },
    {
      title: "Donation",
      desc: "Spend 30 minutes giving the gift of life at a local clinic.",
      icon: "2",
    },
    {
      title: "Saving Lives",
      desc: "Your donation is processed and sent where it's needed most.",
      icon: "3",
    },
  ];

  return (
    <div ref={container} className="about-page">
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="badge">Our Mission</span>
          <h1>Bridging the gap between <span>Life</span> and Hope</h1>
          <p>
            LifeDrop was founded on the belief that no one should suffer due to a lack of blood supply. 
            We leverage technology to connect willing donors with those in urgent need.
          </p>
        </div>
      </section>

      <section className="stats-grid-container">
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card">
              <span className="stat-icon">{stat.icon}</span>
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mission-details">
        <div className="mission-text">
          <h2>Why LifeDrop?</h2>
          <p>
            Every 2 seconds, someone in the world needs blood. Whether it's for surgeries, cancer treatments, 
            chronic illnesses, or traumatic injuries, blood is the most precious gift anyone can give.
          </p>
          <p>
            Our platform simplifies the registration process, tracks eligibility, and ensures that the right 
            blood type reaches the right patient at the right time.
          </p>
          <Link to="/register" className="btn-primary">Become a Donor Now</Link>
        </div>
        <div className="mission-image">
           {/* Image placeholder handled by CSS or future tool call if needed, but for now we'll use a styled div */}
           <div className="image-placeholder"></div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Three simple steps to make a massive impact.</p>
        </div>
        <div className="steps-container">
          {steps.map((step, i) => (
            <div key={i} className="step-card">
              <div className="step-number">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-card">
          <h2>Ready to be a hero?</h2>
          <p>Join our growing community of donors and start saving lives today.</p>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
