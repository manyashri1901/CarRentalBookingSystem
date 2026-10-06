const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    carId: { type: String, required: true, index: true }, // Car.id slug
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // set when logged in
    name: { type: String, required: true },
    email: { type: String, required: true },
    pickupLocation: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    addOns: {
      insurance: { type: Boolean, default: false },
      homeCharger: { type: Boolean, default: false },
    },
    totalINR: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
    payment: {
      method: { type: String, enum: ['razorpay', 'demo'] },
      razorpayOrderId: String,
      razorpayPaymentId: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
