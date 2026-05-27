const express = require("express");
const router = express.Router();
const CommonNotification = require("../models/CommonNotification");
const UserNotification = require("../models/userNotificationSchema");
const Patient = require("../models/Patient");
const {auth} = require('../middleware/auth');


//GET Common Notifications
router.get("/common", async (req, res) => {
  try {
    const notifications = await CommonNotification.find()
      .sort({ createdAt: -1 }) 
      .exec();
    return res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching common notifications:", error);
    return res.status(500).json({ message: "Error fetching notifications" });
  }
});

// GET Personal Notifications
router.get("/personal", auth, async (req, res) => {
  const { patientId } = req.query;

  if (!patientId) {
    return res.status(400).json({ message: "Missing patientId" });
  }

  try {
    const patient = await Patient.findOne({ patientId }).select("email").lean();
    const notifications = await UserNotification.find({
      $or: [
        { patientId },
        ...(patient?.email ? [{ patientEmail: patient.email }] : []),
      ],
    })
      .sort({ createdAt: -1 }); // Most recent first


    return res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching personal notifications:", error);
    return res.status(500).json({ message: "Error fetching personal notifications" });
  }
});

// PATCH Mark as Read
router.patch("/:id/read", auth, async (req, res) => {
  const { role } = req.body;

  if (!["patient", "doctor", "manager"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const notification = await UserNotification.findByIdAndUpdate(
      req.params.id,
      { $set: { [`isRead.${role}`]: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification marked as read", notification });
  } catch (error) {
    res.status(500).json({ message: "Error marking as read" });
  }
});




module.exports = router;
