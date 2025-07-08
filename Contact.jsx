// src/contact.jsx
import React, { useState } from "react";
import "./Contact.css";

const Contact = () => {  // ← Component NAME starts with uppercase
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted:", form);
    setSubmitted(true);
    setForm({ name: "", email: "", phone: "", message: "" });
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="contact-page">
      <div className="form-wrapper">
        <div className="contact-grid">
          <div className="company-info">
            <h2>📞 Contact DriveEasy</h2>
            <p><strong>Phone:</strong> +91 92228098xxxx</p>
            <p><strong>Email:</strong> support@driveeasy.in</p>
            <p><strong>Address:</strong> 2nd Floor, Tech Park, Bengaluru, India</p>
            <p><strong>Hours:</strong> Mon–Sun, 9:00 AM – 9:00 PM</p>
          </div>

          <div className="contact-form-area">
            <h2>Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={form.email}
                onChange={handleChange}
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Your Contact Number"
                value={form.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                title="Enter a 10-digit phone number"
              />
              <textarea
                name="message"
                placeholder="Your Message"
                rows="6"
                value={form.message}
                onChange={handleChange}
                required
              />
              <button type="submit">Send Message</button>
              {submitted && (
                <p className="success-message">✅ Message sent successfully!</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;  // ← Export matches component name
