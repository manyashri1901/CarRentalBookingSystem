import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../api";
import "../styles/Deals.css";

const fallbackDeals = [
  { title: "Weekend SUV Deal", description: "20% off on SUVs every weekend!", discount: "20%" },
  { title: "Early Bird Discount", description: "Book 5 days in advance and get 15% off!", discount: "15%" },
  { title: "Monsoon Offer", description: "Rain or shine, get 10% off city rides.", discount: "10%" },
];

const Deals = () => {
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/deals`)
      .then((res) => setDeals(res.data))
      .catch((err) => {
        console.log("Using static fallback due to error:", err.message);
        setDeals(fallbackDeals);
      });
  }, []);

  return (
    <main className="page deals-container">
      <h1>Current Deals &amp; Offers</h1>
      <div className="deal-list">
        {deals.map((deal) => (
          <article key={deal.title} className="deal-card">
            <span className="discount">{deal.discount} OFF</span>
            <h3>{deal.title}</h3>
            <p>{deal.description}</p>
          </article>
        ))}
      </div>
    </main>
  );
};

export default Deals;
