import React, { useState } from "react";
import "../styles/Contact.css";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
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
    <main className="page contact-page">
      <div className="contact-grid">
        <section className="card company-info">
          <h1>Contact ECar-Ride</h1>
          <p><strong>Phone:</strong> <a href="tel:+919222809800">+91 92228098xxxx</a></p>
          <p><strong>Email:</strong> <a href="mailto:support@ecar-ride.in">support@ecar-ride.in</a></p>
          <p><strong>Address:</strong> 2nd Floor, Tech Park, Bengaluru, India</p>
          <p><strong>Hours:</strong> Mon–Sun, 9:00 AM – 9:00 PM</p>
        </section>

        <section className="card contact-form-area">
          <h2>Send Us a Message</h2>
          <form onSubmit={handleSubmit} className="contact-form">
            <label className="field">
              <span>Your name</span>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                autoComplete="name" required />
            </label>
            <label className="field">
              <span>Your email</span>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                autoComplete="email" required />
            </label>
            <label className="field">
              <span>Contact number</span>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                autoComplete="tel" inputMode="numeric" required pattern="[0-9]{10}"
                title="Enter a 10-digit phone number" placeholder="10-digit number" />
            </label>
            <label className="field">
              <span>Your message</span>
              <textarea name="message" rows="6" value={form.message} onChange={handleChange} required />
            </label>
            <button type="submit" className="btn btn-block">Send Message</button>
            {submitted && <p role="status" className="msg success">✅ Message sent successfully!</p>}
          </form>
        </section>
      </div>
    </main>
  );
};

export default Contact;
