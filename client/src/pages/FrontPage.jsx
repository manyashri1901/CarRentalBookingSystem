import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApi } from "../api";
import CarCard, { CarCardSkeleton } from "../components/CarCard";
import Counter from "../components/Counter";
import { compare } from "../lib/co2";
import "../styles/Carrental.css";

const faqs = [
  {
    question: "How do I book an EV?",
    answer: "Pick a car, choose your pickup and drop-off time, add insurance or a home charger if you like, and book. You see the full price before you confirm.",
  },
  {
    question: "What if the battery runs low on my trip?",
    answer: "Every car shows its claimed range and a real-world estimate. Plan stops with our charging map, which lists stations and connector types, and use the trip calculator to size your journey.",
  },
  {
    question: "How long does charging take?",
    answer: "On a DC fast charger most of our cars go from 10% to 80% in under an hour; on a normal AC charger a full charge takes several hours. Each car page lists both times.",
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

const whyItems = [
  { icon: "💸", title: "Cheaper to run", text: (s) => `In our example, electricity costs about ${s.costPct}% less than petrol per kilometre.` },
  { icon: "🌿", title: "Zero tailpipe emissions", text: () => "No exhaust fumes in your city, and lower lifetime CO₂ than petrol even on a coal-heavy grid." },
  { icon: "⚡", title: "Smooth and quick", text: () => "Instant torque, quiet cabins and no gear changes make city and highway driving easier." },
  { icon: "🗺️", title: "Charging you can plan", text: () => "Fast chargers are growing along major routes. See connector types and plan stops before you leave." },
];

// Illustrative figures: reference EV vs a petrol car over 1,000 km (see /calculator)
const EXAMPLE_KM = 1000;

function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <svg viewBox="0 0 360 150" focusable="false">
        <defs>
          <linearGradient id="car-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#c8f7e4" />
          </linearGradient>
        </defs>
        <g className="car-bob">
          <path d="M28 96 Q30 68 72 60 L124 36 Q146 26 180 26 L228 28 Q262 38 284 62 L322 70 Q336 74 336 96 Z" fill="url(#car-g)" />
          <path d="M96 62 L132 42 Q150 36 176 36 L176 62 Z" fill="#0b3d37" opacity="0.85" />
          <path d="M186 36 L224 38 Q246 46 262 62 L186 62 Z" fill="#0b3d37" opacity="0.85" />
          <path d="M210 70 l-14 22 h10 l-4 16 l18 -24 h-11 z" fill="#16a34a" className="bolt-pulse" />
          <g className="wheel" style={{ transformOrigin: "90px 100px" }}>
            <circle cx="90" cy="100" r="20" fill="#10231e" />
            <circle cx="90" cy="100" r="9" fill="#9fb8b0" />
            <path d="M90 82 V118 M72 100 H108" stroke="#10231e" strokeWidth="3" />
          </g>
          <g className="wheel" style={{ transformOrigin: "272px 100px" }}>
            <circle cx="272" cy="100" r="20" fill="#10231e" />
            <circle cx="272" cy="100" r="9" fill="#9fb8b0" />
            <path d="M272 82 V118 M254 100 H290" stroke="#10231e" strokeWidth="3" />
          </g>
        </g>
        <line x1="0" y1="124" x2="360" y2="124" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="3" strokeDasharray="22 18" className="road" />
      </svg>
    </div>
  );
}

const FrontPage = () => {
  const [faqIndex, setFaqIndex] = useState(null);
  const [tab, setTab] = useState("daily");
  const navigate = useNavigate();

  const { data, loading, error, reload } = useApi("/api/cars", { sort: "rating_desc" });
  const featured = (data?.cars || []).slice(0, 4);

  const example = useMemo(() => compare({ distanceKm: EXAMPLE_KM }), []);
  const stats = { costPct: Math.round(example.costSavedPct) };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate("/cars");
  };

  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow"><span aria-hidden="true">⚡</span> 100% electric rentals</p>
            <h1>Rent electric. Drive clean.</h1>
            <p className="lead">
              From city hatchbacks to long-range SUVs: book an EV by the hour or day, add a home charger, and see what you save.
            </p>
            <div className="hero-cta">
              <Link to="/cars" className="btn btn-light">Browse EVs</Link>
              <Link to="/calculator" className="btn btn-ghost">Calculate savings</Link>
            </div>
          </div>
          <HeroArt />
        </div>

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
            <button type="submit" className="btn search-btn">Find EVs</button>
          </div>
        </form>
      </section>

      <section className="impact" aria-labelledby="impact-h">
        <h2 id="impact-h">What going electric can save</h2>
        <div className="impact-grid">
          <div className="impact-item">
            <p className="impact-num"><Counter value={example.co2Saved} suffix=" kg" /></p>
            <p className="impact-label">CO₂ avoided per {EXAMPLE_KM.toLocaleString("en-IN")} km</p>
          </div>
          <div className="impact-item">
            <p className="impact-num"><Counter value={example.costSaved} prefix="₹" /></p>
            <p className="impact-label">running cost saved per {EXAMPLE_KM.toLocaleString("en-IN")} km</p>
          </div>
          <div className="impact-item">
            <p className="impact-num"><Counter value={example.costSavedPct} suffix="%" /></p>
            <p className="impact-label">lower cost per km than petrol</p>
          </div>
        </div>
        <p className="impact-note">
          Illustrative example: a 45 kWh EV with 489 km claimed range versus a 15 km/L petrol car, using editable
          assumptions. <Link to="/calculator">Change the assumptions &rarr;</Link>
        </p>
      </section>

      <section className="why page" aria-labelledby="why-h">
        <h2 id="why-h">Why go electric?</h2>
        <div className="why-grid">
          {whyItems.map((w) => (
            <article key={w.title} className="why-card">
              <span className="why-icon" aria-hidden="true">{w.icon}</span>
              <h3>{w.title}</h3>
              <p>{w.text(stats)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="featured page" aria-labelledby="feat-h">
        <div className="section-head">
          <h2 id="feat-h">Top-rated EVs</h2>
          <Link to="/cars" className="more-link">See all EVs &rarr;</Link>
        </div>

        {error && !data && (
          <div className="state-box" role="alert">
            <p className="muted">{error.message}</p>
            <button type="button" className="btn" onClick={reload}>Try again</button>
          </div>
        )}
        <div className="featured-grid">
          {!data && loading && Array.from({ length: 4 }).map((_, i) => <CarCardSkeleton key={i} />)}
          {featured.map((car) => <CarCard key={car.id} car={car} />)}
        </div>
      </section>

      <section className="faq" aria-labelledby="faq-h">
        <h2 id="faq-h">Frequently Asked Questions</h2>
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
  );
};

export default FrontPage;
