// models/PendingUpload.js
const mongoose = require("mongoose");

const PendingUploadSchema = new mongoose.Schema({
  uploadToken: { type: String, required: true, unique: true, index: true },
  patientEmail: { type: String, required: true },
  files: [
    {
      filename: String,
      fileId: mongoose.Schema.Types.ObjectId, // GridFS id
      contentType: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  // auto-delete after 24 hours
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 },
});

module.exports = mongoose.model("PendingUpload", PendingUploadSchema);
