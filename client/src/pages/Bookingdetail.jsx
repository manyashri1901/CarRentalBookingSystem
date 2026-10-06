import React, { useState } from "react";
import "../styles/Bookingdetail.css";

const carOptions = [
  "Hyundai i20",
  "Maruti Swift",
  "Toyota Innova Crysta",
  "Mercedes E-Class",
];

const Bookingdetail = () => {
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

  const today = new Date().toISOString().split("T")[0];

  return (
    <main className="page narrow booking-details-container">
      <h1>📝 Booking Details</h1>
      <form className="card booking-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Car selected</span>
          <select name="carName" value={formData.carName} onChange={handleChange} required>
            <option value="">-- Select a car --</option>
            {carOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Your name</span>
          <input type="text" name="name" placeholder="Manya" autoComplete="name"
            value={formData.name} onChange={handleChange} required />
        </label>

        <label className="field">
          <span>Email</span>
          <input type="email" name="email" placeholder="manya@example.com" autoComplete="email"
            value={formData.email} onChange={handleChange} required />
        </label>

        <label className="field">
          <span>Pickup location</span>
          <input type="text" name="pickupLocation" placeholder="Indore"
            value={formData.pickupLocation} onChange={handleChange} required />
        </label>

        <div className="form-row">
          <label className="field">
            <span>Pickup date</span>
            <input type="date" name="pickupDate" min={today}
              value={formData.pickupDate} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>Pickup time</span>
            <input type="time" name="pickupTime"
              value={formData.pickupTime} onChange={handleChange} required />
          </label>
        </div>

        <div className="form-row">
          <label className="field">
            <span>Drop-off date</span>
            <input type="date" name="dropoffDate" min={formData.pickupDate || today}
              value={formData.dropoffDate} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>Drop-off time</span>
            <input type="time" name="dropoffTime"
              value={formData.dropoffTime} onChange={handleChange} required />
          </label>
        </div>

        <button type="submit" className="btn btn-block">Confirm Booking</button>
      </form>
    </main>
  );
};

export default Bookingdetail;
