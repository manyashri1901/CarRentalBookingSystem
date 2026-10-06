import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Bookings.css";

const cars = [
  {
    id: 1,
    name: "Hyundai i20",
    type: "Hatchback",
    price: "₹1500/day",
    image: "https://www.hyundai.com/content/dam/hyundai/ww/en/images/find-a-car/pip/cars/i20-bc3/i20-bc3-highlights-designed-to-stand-out-m.jpg",
    features: ["AC", "Manual", "5 Seats"],
    rating: 4.5,
  },
  {
    id: 2,
    name: "Maruti Swift",
    type: "Hatchback",
    price: "₹1400/day",
    image: "https://www.indusmotor.com/public/uploads/pages/106820210617161118.jpg",
    features: ["AC", "Manual", "5 Seats"],
    rating: 4.3,
  },
  {
    id: 3,
    name: "Toyota Innova Crysta",
    type: "SUV",
    price: "₹2500/day",
    image: "https://imgcdn.sayaratbay.com/medium/gallery/exterior/40/424/toyota-fortuner-95078.jpg",
    features: ["AC", "Automatic", "7 Seats"],
    rating: 4.8,
  },
  {
    id: 4,
    name: "Mercedes E-Class",
    type: "Luxury",
    price: "₹5000/day",
    image: "https://imgd.aeplcdn.com/1056x594/n/gonrueb_1779977.jpg?q=80",
    features: ["AC", "Automatic", "5 Seats"],
    rating: 4.9,
  },
];

const Bookings = () => {
  const [filters, setFilters] = useState({ location: "", date: "", carType: "" });
  const [broken, setBroken] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleBook = (car) => {
    navigate("/payment", {
      state: {
        carName: car.name,
        amount: parseInt(car.price.replace(/[^\d]/g, ""), 10) * 100, // convert to paisa
        carId: car.id,
      },
    });
  };

  // Location/date are collected for the booking; only car type narrows the list
  const filteredCars = cars.filter((car) => !filters.carType || car.type === filters.carType);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= Math.round(rating) ? "" : "empty"}`} aria-hidden="true">
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <main className="page booking-container">
      <h1>🚗 Book Your Perfect Ride</h1>

      <div className="search-filters">
        <label className="field">
          <span>Location</span>
          <input type="text" name="location" placeholder="Enter location"
            value={filters.location} onChange={handleChange} autoComplete="off" />
        </label>
        <label className="field">
          <span>Date</span>
          <input type="date" name="date" value={filters.date} onChange={handleChange} />
        </label>
        <label className="field">
          <span>Car type</span>
          <select name="carType" value={filters.carType} onChange={handleChange}>
            <option value="">All types</option>
            <option value="Hatchback">Hatchback</option>
            <option value="SUV">SUV</option>
            <option value="Luxury">Luxury</option>
          </select>
        </label>
      </div>

      {filteredCars.length === 0 && <p className="muted center">No cars match your filters.</p>}

      <div className="car-list">
        {filteredCars.map((car) => (
          <article key={car.id} className="car-card">
            {broken[car.id] ? (
              <div className="car-img placeholder" role="img" aria-label={car.name}>🚗</div>
            ) : (
              <img
                className="car-img"
                src={car.image}
                alt={car.name}
                loading="lazy"
                onError={() => setBroken((b) => ({ ...b, [car.id]: true }))}
              />
            )}
            <div className="car-body">
              <h3>{car.name}</h3>
              <p className="car-type">{car.type}</p>

              <div className="car-features">
                {car.features.map((feature) => (
                  <span key={feature} className="feature">{feature}</span>
                ))}
              </div>

              <div className="rating" aria-label={`Rated ${car.rating} out of 5`}>
                {renderStars(car.rating)} <span>({car.rating})</span>
              </div>

              <p className="price">{car.price}</p>

              <button type="button" className="btn btn-block" onClick={() => handleBook(car)}>
                Book Now
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
};

export default Bookings;
