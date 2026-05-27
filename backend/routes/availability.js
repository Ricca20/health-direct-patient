const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Availability = require('../models/Availability');
const Application = require('../models/Application');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const {auth} = require('../middleware/auth');

// GET Fetch the availability
// Supports two formats:
// 1. Old format: /api/availability?doctorEmail=...&date=...
// 2. New format: /api/doctor-availability?doctorId=...&month=...&year=...
router.get('/', async (req, res) => {
  const { doctorEmail, date, patientId, doctorId, month, year } = req.query;

  // NEW FORMAT: doctorId with month/year
  if (doctorId && month && year) {
    try {
      // Validate doctorId
      if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        return res.status(400).json({ error: 'Invalid doctorId' });
      }

      // Get doctor by ID to find their email
      const doctor = await Doctor.findById(doctorId).select('email').lean();
      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      const doctorEmailFromId = doctor.email;

      // Get patient email if patientId provided
      const patient = patientId
        ? await Patient.findOne({ patientId }).select('email').lean()
        : null;
      const currentPatientEmail = patient?.email || null;

      // Calculate date range for the given month/year
      const startDate = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // Fetch all availability blocks for this doctor in the month
      const availabilities = await Availability.find({
        doctorEmail: doctorEmailFromId,
        start: { $lt: endDate },
        end: { $gt: startDate }
      }).lean();

      // Fetch all booked applications for this doctor in the month
      const bookedApps = await Application.find({
        doctorEmail: doctorEmailFromId,
        startTime: { $gte: startDate.toISOString(), $lt: endDate.toISOString() }
      }).lean();

      // Build set of dates with availability
      const availableDatesSet = new Set();
      const now = new Date();

      for (const avail of availabilities) {
        let current = new Date(avail.start);
        const end = new Date(avail.end);

        while (current < end) {
          // Skip past dates
          if (current < now) {
            current.setDate(current.getDate() + 1);
            continue;
          }

          // Check if this date has any free slots (not fully booked)
          const dayStart = new Date(current);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(current);
          dayEnd.setHours(23, 59, 59, 999);

          // Count booked appointments for this doctor on this date
          const dayBookedApps = bookedApps.filter(app => {
            const appStart = new Date(app.startTime);
            return appStart >= dayStart && appStart <= dayEnd;
          });

          // If there are fewer than expected appointments, date has slots
          // (Assuming max ~20 slots per day for 30-min slots in ~10 hours)
          if (dayBookedApps.length < 20) {
            const dateStr = dayStart.toISOString().split('T')[0];
            availableDatesSet.add(dateStr);
          }

          current.setDate(current.getDate() + 1);
        }
      }

      return res.json({ availableDates: Array.from(availableDatesSet).sort() });
    } catch (err) {
      console.error('Error in doctor-availability (new format):', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // OLD FORMAT: doctorEmail with date
  if (!doctorEmail || !date) {
    return res.status(400).json({ error: 'Either (doctorEmail + date) OR (doctorId + month + year) are required' });
  }

  try {
    const patient = patientId
      ? await Patient.findOne({ patientId }).select('email').lean()
      : null;
    const currentPatientEmail = patient?.email || null;

    // Day start and end boundaries
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);

    // Current time
    const now = new Date();

    // Fetch doctor's availability blocks
    const availabilities = await Availability.find({
      doctorEmail,
      start: { $gte: startDate, $lt: endDate }
    }).sort('start');

    // Fetch all booked apps for this doctor on that day
    const bookedApps = await Application.find({
      doctorEmail,
      startTime: { $gte: startDate.toISOString(), $lt: endDate.toISOString() }
    });

    // Build a map of booked slots
    const bookedTimes = new Map(); // key=startISO, value={start,end,status,slotType}

    bookedApps.forEach(app => {
      const startTime = new Date(app.startTime);
      const endTime = new Date(app.endTime);
      const appointmentStatus = app.appointmentStatus || 'Unconfirmed';

      let slotType = 'booked';
      let slotStatus = appointmentStatus;

      if (
        (patientId && app.patientId === patientId) ||
        (currentPatientEmail && app.patientEmail === currentPatientEmail)
      ) {
        // Current patient's own appointments
        if (appointmentStatus === 'Cancelled') {
          slotType = 'free';
          slotStatus = 'available';
        } else {
          slotType = 'patientConflict';
          slotStatus = appointmentStatus;
        }
      } else {
        // Other patients
        if (appointmentStatus === 'Cancelled') {
          slotType = 'free';
          slotStatus = 'available';
        } else if (appointmentStatus === 'Unconfirmed') {
          slotType = 'booked';
          slotStatus = 'Booked & Unconfirmed';
        } else {
          slotType = 'booked';
          slotStatus = 'Confirmed';
        }
      }

      bookedTimes.set(startTime.toISOString(), {
        start: startTime,
        end: endTime,
        slotType,
        status: slotStatus
      });
    });

    const finalSlots = [];

    for (const slot of availabilities) {
      let slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);

      while (slotStart < slotEnd) {
        const subStart = new Date(slotStart);
        const subEnd = new Date(slotStart);
        subEnd.setMinutes(subEnd.getMinutes() + 30);

        // Skip past slots if it's today
        if (subStart < now) {
          slotStart.setMinutes(slotStart.getMinutes() + 30);
          continue;
        }

        const subStartISO = subStart.toISOString();

        if (bookedTimes.has(subStartISO)) {
          const bookedSlot = bookedTimes.get(subStartISO);
          finalSlots.push({
            start: subStart,
            end: subEnd,
            slotType: bookedSlot.slotType,
            status: bookedSlot.status
          });
        } else {
          finalSlots.push({
            start: subStart,
            end: subEnd,
            slotType: 'free',
            status: 'available'
          });
        }

        slotStart.setMinutes(slotStart.getMinutes() + 30);
      }
    }

    res.json(finalSlots);

  } catch (err) {
    console.error('Error in /availability:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
