import React from "react";
import "../styles/about.css";

const items = [
  ["🚗", "ECar-Ride is a premium electric-vehicle rental service committed to clean, convenient and affordable travel."],
  ["📍", "We operate in major Indian cities, offering a fleet of electric hatchbacks, SUVs and luxury EVs."],
  ["🕒", "24/7 customer support ensures your journey is smooth and worry-free."],
  ["🔒", "All cars are regularly maintained, insured, and sanitized for your safety."],
  ["📱", "Book via our user-friendly website in just a few clicks."],
  ["💳", "Secure payment options including UPI, credit/debit cards, and more."],
  ["🌱", "Our fleet is 100% electric, so every trip cuts tailpipe emissions."],
];

const About = () => (
  <main className="page narrow about-container">
    <h1>About ECar-Ride</h1>
    <ul className="about-list">
      {items.map(([icon, text]) => (
        <li key={text}>
          <span className="about-icon" aria-hidden="true">{icon}</span>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  </main>
);

export default About;
