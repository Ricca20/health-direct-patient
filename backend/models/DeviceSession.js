const mongoose = require("mongoose");

const deviceSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  email: { type: String, required: true },
  deviceId: { type: String, required: true },
  fingerprintHash: { type: String, required: true },
  userAgent: { type: String },
  ipAddress: { type: String },
  platform: { type: String },
  browser: { type: String },
  os: { type: String },
  deviceType: { type: String },
  location: { type: String },
  firstUsedAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now },
  isCurrent: { type: Boolean, default: true },
  isTrusted: { type: Boolean, default: false },
  isRevoked: { type: Boolean, default: false },
  revokedAt: { type: Date },
});

deviceSessionSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
deviceSessionSchema.index({ email: 1, lastLoginAt: -1 });

const DeviceSession = mongoose.model("DeviceSession", deviceSessionSchema);

module.exports = DeviceSession;