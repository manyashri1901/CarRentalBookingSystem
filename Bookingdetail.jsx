import React, { useState } from "react";
import "./Bookingdetail.css";

const Bookingdetail  = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    pickupLocation: "",
    pickupDate: "",
    pickupTime: "",
    dropoffDate: "",
    dropoffTime: "",
    carName: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Booking Confirmed!\n\n" + JSON.stringify(formData, null, 2));
    // You can replace this with an API call or navigation to success page
  };

  return (
    <div className="booking-details-container">
      <h2>📝 Booking Details</h2>
      <form className="booking-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Car Selected</label>
          <select
            name="carName"
            value={formData.carName}
            onChange={handleChange}
            required
          >
            <option value="">-- Select a Car --</option>
            <option value="🌟 Economy Special">🌟 Economy Special</option>
            <option value="🏔️ Adventure SUV">🏔️ Adventure SUV</option>
            <option value="👑 Luxury Elite">👑 Luxury Elite</option>
            <option value="🎯 Compact Pro">🎯 Compact Pro</option>
            <option value="🏁 Sports Thunder">🏁 Sports Thunder</option>
            <option value="🔋 Eco Electric">🔋 Eco Electric</option>
          </select>
        </div>

        <div className="form-group">
          <label>Your Name</label>
          <input
            type="text"
            name="name"
            placeholder="Manya"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="📧 manya@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Pickup Location</label>
          <input
            type="text"
            name="pickupLocation"
            placeholder="🏙️Indore"
            value={formData.pickupLocation}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>Pickup Date</label>
            <input
              type="date"
              name="pickupDate"
              value={formData.pickupDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Pickup Time</label>
            <input
              type="time"
              name="pickupTime"
              value={formData.pickupTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group-row">
          <div className="form-group">
            <label>Dropoff Date</label>
            <input
              type="date"
              name="dropoffDate"
              value={formData.dropoffDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Dropoff Time</label>
            <input
              type="time"
              name="dropoffTime"
              value={formData.dropoffTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <button type="submit" className="submit-btn">
          Confirm Booking 🚀
        </button>
      </form>
    </div>
  );
};

export default Bookingdetail;
