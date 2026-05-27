const mongoose = require("mongoose");

const patientOtpSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, trim: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Auto-delete expired OTPs
patientOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PatientOtp", patientOtpSchema);