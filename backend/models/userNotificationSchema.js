const mongoose = require("mongoose");
const moment = require("moment-timezone");

const notificationSchema = new mongoose.Schema({
  patientId: { type: String, required: false },
  patientEmail: { type: String, required: false },
  doctorEmail: { type: String, required: false },
  vendorEmail: { type: String, required: false },

  addedBy: { type: String, required: true },

  message: {
    en: { type: String, required: true },
    ru: { type: String, required: true },
  },

  appointmentId: { type: String, required: false },
  orderId: { type: String, required: false },
  vendorId: { type: String, required: false },

  isRead: {
    patient: { type: Boolean, default: false },
    doctor: { type: Boolean, default: false },
    manager: { type: Boolean, default: false },
    vendor: { type: Boolean, default: false },
    assistant: { type: Boolean, default: false },
  },

  createdAt: {
    type: Date,
    default: () => moment.tz("Europe/Moscow").toDate(),
  },
});

notificationSchema.virtual("patient", {
  ref: "Patient",
  localField: "patientId",
  foreignField: "patientId",
  justOne: true,
});

notificationSchema.set("toObject", { virtuals: true });
notificationSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("UserNotification", notificationSchema);
