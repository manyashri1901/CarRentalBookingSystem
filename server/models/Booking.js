const mongoose = require('mongoose');
const crypto = require('crypto');

const bookingSchema = new mongoose.Schema(
  {
    // Public, unguessable id used in URLs (an ObjectId is guessable, and bookings hold a name and email)
    ref: { type: String, unique: true, default: () => crypto.randomUUID() },
    carId: { type: String, required: true, index: true }, // Car.id slug
    userId: { type: String, index: true, default: null }, // User.ref when booked while signed in
    name: { type: String, required: true },
    email: { type: String, required: true },
    pickupLocation: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    addOns: {
      insurance: { type: Boolean, default: false },
      homeCharger: { type: Boolean, default: false },
    },
    totalINR: { type: Number, required: true }, // computed on the server, never taken from the client
    // pending = awaiting payment (also covers failed, cancelled and abandoned attempts), paid, cancelled
    status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
    payment: {
      method: { type: String, enum: ['razorpay', 'demo'] },
      demo: { type: Boolean, default: false }, // true = NOT a real payment
      razorpayOrderIds: { type: [String], default: [] }, // one per attempt; any of them may be paid
      razorpayPaymentId: String, // or "demo_..." for demo payments
      paidAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
