import React from "react";
import { useNavigate } from "react-router-dom";
import './LandingPage.css'; // Create this for styling
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <video
  autoPlay
  muted
  loop
  playsInline
  className="video-bg"
>
  <source src="/vid.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>


      <div className="landing-content">
        <h1 className="title">WORD WARP</h1>
        <p className="subtitle">The game where words win.</p>
        <div className="rules-box">
          - One player is the Judge.<br />
          - Others submit their best response.<br />
          - Judge picks a winner.<br />
          - Most wins = Champion.
        </div>
        <button onClick={() => navigate("/lobby")} className="enter-btn">
          ENTER GAME
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
