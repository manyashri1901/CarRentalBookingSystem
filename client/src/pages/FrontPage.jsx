import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Carrental.css";

const faqs = [
  {
    question: "How do I book a car?",
    answer: "You can book a car by selecting the location, date and time, then clicking the 'Search' button.",
  },
  {
    question: "What documents are required?",
    answer: "You need to provide a valid driving license and identity proof at the time of pickup.",
  },
  {
    question: "Is there any deposit?",
    answer: "Some vehicles may require a security deposit, refundable upon vehicle return.",
  },
];

const FrontPage = () => {
  const [faqIndex, setFaqIndex] = useState(null);
  const [tab, setTab] = useState("daily");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate("/cars");
  };

  return (
    <>
      <main>
        <section className="hero">
          <div className="hero-inner">
            <h1>Drive With Freedom</h1>
            <p>Choose from a wide range of premium and affordable vehicles.</p>

            <form className="search-bar" onSubmit={handleSearch}>
              <div className="tabs" role="tablist" aria-label="Rental type">
                <button type="button" role="tab" aria-selected={tab === "daily"}
                  className={tab === "daily" ? "active" : ""} onClick={() => setTab("daily")}>
                  Daily Rentals
                </button>
                <button type="button" role="tab" aria-selected={tab === "monthly"}
                  className={tab === "monthly" ? "active" : ""} onClick={() => setTab("monthly")}>
                  Monthly Rentals
                </button>
              </div>
              <div className="inputs">
                <label className="field">
                  <span>Pickup location</span>
                  <input type="text" placeholder="e.g. Indore" autoComplete="off" />
                </label>
                <label className="field">
                  <span>Pickup date &amp; time</span>
                  <input type="datetime-local" />
                </label>
                <label className="field">
                  <span>Drop-off date &amp; time</span>
                  <input type="datetime-local" />
                </label>
                <button type="submit" className="btn search-btn">Search</button>
              </div>
            </form>
          </div>
        </section>

        <section className="faq">
          <h2>Frequently Asked Questions</h2>
          {faqs.map((faq, index) => {
            const isOpen = faqIndex === index;
            return (
              <div key={faq.question} className={`accordion-item ${isOpen ? "active" : ""}`}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${index}`}
                    onClick={() => setFaqIndex(isOpen ? null : index)}
                  >
                    {faq.question}
                    <span className="chev" aria-hidden="true">▾</span>
                  </button>
                </h3>
                {isOpen && (
                  <div className="content" id={`faq-${index}`}>
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} ECar-Ride Electric Rentals. All rights reserved.</p>
        <div className="socials">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">FB</a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">TW</a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">IG</a>
        </div>
      </footer>
    </>
  );
};

export default FrontPage;
