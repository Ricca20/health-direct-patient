// routes/payments.js
const express = require("express");
const router = express.Router();
const yooKassa = require("yookassa");
const Application = require("../models/Application");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Availability = require("../models/Availability");
const Counter = require("../models/Counter");
const sendEmail = require("../utils/sendEmail");
const UserNotification = require("../models/userNotificationSchema");
const {auth} = require('../middleware/auth');

// Initialize YooKassa
const yooKassaClient = new yooKassa({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY,
});

// POST Crete a new payment
router.post("/create", auth, async (req, res) => {
  try {
    const { applicationId, amount, currency = "RUB" } = req.body;

    if (!applicationId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: applicationId, amount",
      });
    }

    // Find the application to update payment details
    const application = await Application.findOne({ applicationId });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const idempotenceKey = require("crypto").randomUUID();

    const paymentPayload = {
      amount: { value: amount.toString(), currency },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: `${process.env.FRONTEND_URL}/appointments?applicationId=${applicationId}&paymentId={payment_id}&status=success`,
      },
      metadata: {
        applicationId,
        createdBy: "patientCrm",
      },
    };

    const payment = await yooKassaClient.createPayment(
      paymentPayload,
      idempotenceKey
    );

    // Generate invoice number (you might want to use a more sophisticated method)
    const invoiceNumber = `INV-${applicationId}-${Date.now()}`;

    // Update the application's payment details according to your schema
    const paymentDetails = {
      id: payment.id, // YooKassa payment ID
      invoiceNumber: invoiceNumber,
      status: "pending", // Using "pending" instead of "new" to match your enum
      paymentLink: payment.confirmation.confirmation_url,
      amount: amount.toString(),
      currency: currency,
      paidAt: null, // Will be updated when payment is completed
    };

    // Add payment details to the application
    application.payments.push(paymentDetails);
    await application.save();

    res.status(200).json({
      success: true,
      applicationId,
      paymentId: payment.id,
      paymentUrl: payment.confirmation.confirmation_url,
      invoiceNumber: invoiceNumber,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: error.message,
    });
  }
});

// POST Hanlde the payment responce
router.post("/webhook", auth, async (req, res) => {
  try {
    const { event, object } = req.body;

    if (event !== "payment.succeeded") {
      return res.status(200).send("OK");
    }

    const payment = object;

    const { metadata } = payment || {};

    if (!metadata || !metadata.applicationId) {
      return res.status(200).send("OK");
    }

    const applicationId = metadata.applicationId;

    // --- Find application by applicationId ---
    const application = await Application.findOne({ applicationId });
    if (!application) {
      return res.status(200).send("OK");
    }

    // --- Idempotency - Check if payment already processed ---
    const existingPayment = application.payments.find(
      (p) => p.id === payment.id
    );
    if (existingPayment && existingPayment.status === "paid") {
      return res.status(200).send("OK");
    }

    // --- Update the specific payment in the payments array ---
    const paymentIndex = application.payments.findIndex(
      (p) => p.id === payment.id
    );

    if (paymentIndex !== -1) {
      // Payment exists, update it
      application.payments[paymentIndex].status = "paid";
      application.payments[paymentIndex].paidAt = new Date();
    } else {
      // Payment doesn't exist, add it (this shouldn't happen but just in case)
      application.payments.push({
        id: payment.id,
        status: "paid",
        paidAt: new Date(),
        amount: payment.amount.value,
        currency: payment.amount.currency,
      });
    }

    // --- Update application status ---
    application.appointmentStatus = "Confirmed";

    // --- Block the time slot ---
    if (
      application.doctorEmail &&
      application.startTime &&
      application.endTime
    ) {
      const doctor = await Doctor.findOne({ email: application.doctorEmail });

      if (doctor) {
        const slot = await Availability.findOne({
          start: new Date(application.startTime),
          end: new Date(application.endTime),
          doctor: doctor._id,
        });

        if (slot && slot.status === "Available") {
          slot.status = "Unavailable";
          await slot.save();
        } else {
          console.warn("Matching slot not found or already unavailable.");
        }
      }
    }

    await application.save();

    // --- Find user for email and notification ---
    const user = await User.findOne({ email: application.patientEmail });
    if (!user) {
      return res.status(200).send("OK");
    }

    // --- Email confirmation ---
    const patientFullName = [user.surname, user.name, user.patronymicName]
      .filter(Boolean)
      .join(" ");

    await sendEmail(
      user.email,
      "Your Appointment Booking is Confirmed",
      `
Hi ${patientFullName},

Your appointment has been successfully booked and paid on Health Direct.

Date: ${application.date}
Time: ${application.startTime} – ${application.endTime}
Doctor: ${application.doctorEmail}
Service: ${application.serviceType}
Mode: ${application.appointmentMode}
Payment: Completed

We look forward to serving you.

– Health Direct Team
`.trim()
    );

    // --- In-app notification ---
    await new UserNotification({
      patientEmail: user.email,
      addedBy: "system",
      message: {
        en: `Your appointment <strong>${applicationId}</strong> has been confirmed and paid successfully.`,
        ru: `Ваш прием <strong>${applicationId}</strong> был подтвержден и успешно оплачен.`,
      },
      appointmentId: applicationId,
      orderId: null,
    }).save();

    return res.status(200).send("OK");
  } catch (error) {
    return res.status(500).send("Error processing webhook");
  }
});

// Recreate payment for consultation OR tests
router.post("/recreate/:applicationId", auth, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { type } = req.body;

    if (!["consultation", "test"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment type. Must be 'consultation' or 'test'",
      });
    }

    // 🔹 Find the application
    const application = await Application.findOne({ applicationId });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // 🔹 Find the correct payment
    const payment = application.payments.find((p) => p.type === type);
    if (!payment) {
      return res.status(400).json({
        success: false,
        message: `No existing ${type} payment found`,
      });
    }

    // Calculate finalAmount (subtotal + tax – discount)
    const subtotal = (payment.items || []).reduce((sum, i) => sum + i.amount, 0);
    const tax = subtotal * 0.05; // 5% default tax
    const discount = payment.discount || 0;
    const finalAmount = subtotal + tax - discount;

    const idempotenceKey = require("crypto").randomUUID();

    const paymentPayload = {
      amount: { value: finalAmount.toString(), currency: payment.currency },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: `${process.env.FRONTEND_URL}/appointments?applicationId=${applicationId}&paymentId={payment_id}&status=success`,
      },
      metadata: {
        applicationId,
        type,
        recreated: true,
      },
    };

    // 🔹 Create new YooKassa payment
    const newPayment = await yooKassaClient.createPayment(
      paymentPayload,
      idempotenceKey
    );

    // 🔹 Update existing payment fields
    payment.id = newPayment.id;
    payment.status = "pending";
    payment.paymentLink = newPayment.confirmation.confirmation_url;
    payment.createdAt = new Date();
    payment.paidAt = null;
    payment.amount = subtotal;
    payment.finalAmount = finalAmount;
    payment.tax = tax;
    payment.discount = discount;

    await application.save();

    res.status(200).json({
      success: true,
      applicationId,
      type,
      paymentId: payment.id,
      paymentLink: payment.paymentLink,
      createdAt: payment.createdAt,
      subtotal,
      tax,
      discount,
      finalAmount,
    });
  } catch (error) {
    console.error("Recreate payment error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to recreate payment",
      error: error.message,
    });
  }
});


module.exports = router;
