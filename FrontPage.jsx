import React, { useState } from "react";
import "./Carrental.css";

const FrontPage = () => {
  const [faqIndex, setFaqIndex] = useState(null);

  const toggleFAQ = (index) => {
    setFaqIndex(faqIndex === index ? null : index);
  };

  return (
    <>
      {/* Search Section */}
      <section className="search-bar">
        <div className="tabs">
          <button className="active">Daily Rentals</button>
          <button>Monthly Rentals</button>
        </div>
        <div className="inputs">
          <input type="text" placeholder="Enter Pickup Location" />
          <input type="datetime-local" placeholder="Pickup Date & Time" />
          <input type="datetime-local" placeholder="Drop-off Date & Time" />
          <button className="search-btn">Search</button>
        </div>
      </section>

      {/* Main Content */}
      <section className="main-content">
        <h2>Drive With Freedom</h2>
        <p>Choose from a wide range of premium and affordable vehicles.</p>
        <div className="hero-img"></div>
      </section>

      {/* FAQ Section */}
      <section className="faq">
        <h3>Frequently Asked Questions</h3>
        {[
          {
            question: "How do I book a car?",
            answer:
              "You can book a car by selecting the location, date and time, then clicking the 'Search' button.",
          },
          {
            question: "What documents are required?",
            answer:
              "You need to provide a valid driving license and identity proof at the time of pickup.",
          },
          {
            question: "Is there any deposit?",
            answer:
              "Some vehicles may require a security deposit, refundable upon vehicle return.",
          },
        ].map((faq, index) => (
          <div
            key={index}
            className={`accordion-item ${faqIndex === index ? "active" : ""}`}
          >
            <button onClick={() => toggleFAQ(index)}>{faq.question}</button>
            {faqIndex === index && (
              <div className="content">
                <p>{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2025 DriveEasy Car Rentals. All rights reserved.</p>
        <div className="socials">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            FB
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            TW
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            IG
          </a>
        </div>
      </footer>
    </>
  );
};

export default FrontPage;
