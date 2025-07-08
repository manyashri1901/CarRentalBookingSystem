import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Bookings.css";

const Bookings = () => {
  const [filters, setFilters] = useState({
    location: "",
    date: "",
    carType: "",
  });

  const navigate = useNavigate(); // 

  const [cars] = useState([
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
  ]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

 const handleBook = (car) => {
  navigate("/payment", {
    state: {
      carName: car.name,
      amount: parseInt(car.price.replace(/[^\d]/g, "")) * 100, // convert to paisa
      carId: car.id,
    },
  });
};
  const filteredCars = cars.filter(
    (car) =>
      (!filters.carType || car.type === filters.carType) &&
      (!filters.location || filters.location.toLowerCase().includes("delhi")) // placeholder logic
  );

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`star ${i <= rating ? '' : 'empty'}`}
        >
          ⭐
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="booking-container">
      <div className="content-wrapper">
        <h2>🚗 Book Your Perfect Ride</h2>
        
        <div className="search-filters">
          <input
            type="text"
            name="location"
            placeholder="🏙️ Enter Location"
            value={filters.location}
            onChange={handleChange}
          />
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleChange}
          />
          <select
            name="carType"
            value={filters.carType}
            onChange={handleChange}
          >
            <option value="">🚗 All Types</option>
            <option value="Hatchback">🚙 Hatchback</option>
            <option value="SUV">🚐 SUV</option>
            <option value="Luxury">👑 Luxury</option>
          </select>
        </div>

        <div className="car-list">
          {filteredCars.map((car) => (
            <div key={car.id} className="car-card">
              <img src={car.image} alt={car.name} />
              <h3>{car.name}</h3>
              <p>{car.type}</p>
              
              <div className="car-features">
                {car.features.map((feature, index) => (
                  <span key={index} className="feature">
                    {feature}
                  </span>
                ))}
              </div>
              
              <div className="rating">
                {renderStars(car.rating)} ({car.rating})
              </div>
              
              <p className="price">{car.price}</p>
              
             <button onClick={() => handleBook(car)}>
  Book Now! 🚀
</button>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Bookings;