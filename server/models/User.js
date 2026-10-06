const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    // Public, unguessable id used in tokens and URLs (never the database _id)
    ref: { type: String, unique: true, default: () => crypto.randomUUID() },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash, never plain text
    // Set by the server only. Signup always creates "user"; admins come from scripts/create-admin.js
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
