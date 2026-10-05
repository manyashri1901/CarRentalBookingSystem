import React from "react";
import "../styles/about.css";

const items = [
  ["🚗", "DriveEasy is a premium car rental service committed to convenience and affordability."],
  ["📍", "We operate in major Indian cities, offering a wide fleet from hatchbacks to luxury SUVs."],
  ["🕒", "24/7 customer support ensures your journey is smooth and worry-free."],
  ["🔒", "All cars are regularly maintained, insured, and sanitized for your safety."],
  ["📱", "Book via our user-friendly website in just a few clicks."],
  ["💳", "Secure payment options including UPI, credit/debit cards, and more."],
  ["🌱", "We are eco-conscious and aim to introduce EVs to our fleet soon."],
];

const About = () => (
  <main className="page narrow about-container">
    <h1>About DriveEasy</h1>
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
