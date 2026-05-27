const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  doctor: { type: String, required: true } ,// email directly
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  status: { type: String, enum: ['Available', 'Unavailable'], required: true },
  notes: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Availability', availabilitySchema);