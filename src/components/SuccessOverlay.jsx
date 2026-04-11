import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const SuccessOverlay = ({ onClose }) => {
  const overlayRef = useRef();
  const contentRef = useRef();

  useGSAP(() => {
    const tl = gsap.timeline();

    tl.to(overlayRef.current, {
      opacity: 1,
      duration: 0.4,
    })
    .from(contentRef.current, {
      scale: 0.8,
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: "back.out(1.7)",
    })
    .to(".blood-drop-inner", {
      y: 10,
      repeat: -1,
      yoyo: true,
      duration: 1.5,
      ease: "sine.inOut",
    });
  }, { scope: overlayRef });

  const handleClose = () => {
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.3,
      onComplete: onClose,
    });
  };

  return (
    <div className="success-overlay" ref={overlayRef}>
      <div className="overlay-content" ref={contentRef}>
        <div className="animation-container">
          <div className="blood-drop-outer">
            <div className="blood-drop-inner">❤️</div>
          </div>
        </div>
        <h2>Thank You, Hero!</h2>
        <p>Your registration was successful. You are now part of a life-saving community.</p>
        <button onClick={handleClose} className="btn-primary">
          Back to Site
        </button>
      </div>
    </div>
  );
};

export default SuccessOverlay;
