import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Deals.css"; // External CSS

const Deals = () => {
  const [deals, setDeals] = useState([]); 

  useEffect(() => {
    axios.get("http://localhost:5000/api/deals")
      .then(res => setDeals(res.data))
      .catch(err => {
        console.log("Using static fallback due to error:", err.message);
        setDeals([
          { title: "Weekend SUV Deal", description: "20% off on SUVs every weekend!", discount: "20%" },
          { title: "Early Bird Discount", description: "Book 5 days in advance and get 15% off!", discount: "15%" },
          { title: "Monsoon Offer", description: "Rain or shine, get 10% off city rides.", discount: "10%" },
        ]);
      });
  }, []);

  return (
    <div className="deals-container">
      <h2>Current Deals & Offers</h2>
      <div className="deal-list">
        {deals.map((deal, index) => (
          <div key={index} className="deal-card">
            <h3>{deal.title}</h3>
            <p>{deal.description}</p>
            <span className="discount">{deal.discount} OFF</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Deals;
