import React from "react";
import "./about.css"; // External CSS

const About = () => {
  return (
    <div className="about-container">
      <h2>About DriveEasy</h2>
      <ul className="about-list">
        <li>🚗 DriveEasy is a premium car rental service committed to convenience and affordability.</li>
        <li>📍 We operate in major Indian cities, offering a wide fleet from hatchbacks to luxury SUVs.</li>
        <li>🕒 24/7 customer support ensures your journey is smooth and worry-free.</li>
        <li>🔒 All cars are regularly maintained, insured, and sanitized for your safety.</li>
        <li>📱 Book via our user-friendly website in just a few clicks.</li>
        <li>💳 Secure payment options including UPI, credit/debit cards, and more.</li>
        <li>🌱 We are eco-conscious and aim to introduce EVs to our fleet soon.</li>
      </ul>
    </div>
  );
};

export default About;
