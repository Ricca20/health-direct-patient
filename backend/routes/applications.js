const express = require("express");
const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const Application = require("../models/Application");
const Availability = require("../models/Availability");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const sendEmail = require("../utils/sendEmail");
const Counter = require("../models/Counter");
const Order = require("../models/Order");
const UserNotification = require("../models/userNotificationSchema");
const { ObjectId } = mongoose.Types;

// GridFS setup
let gfsBucket;
const initGridFS = async () => {
  if (!gfsBucket) {
    await mongoose.connection.asPromise();
    const db = mongoose.connection.db;
    gfsBucket = new GridFSBucket(db, {
      bucketName: "media",
      chunkSizeBytes: 1024 * 1024,
    });
  }
  return gfsBucket;
};

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    allowedTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Invalid file type."), false);
  },
});

// Initialize GridFS before handling requests
router.use(async (req, res, next) => {
  try {
    await initGridFS();
    next();
  } catch (err) {
    console.error("GridFS init failed:", err);
    res.status(500).json({ error: "Server error: GridFS" });
  }
});

// POST for submit the application.
router.post("/submit", [auth, upload.array("documents")], async (req, res) => {
  try {
    const { serviceName, details } = req.body;

    // Check payment preference
    const paymentPreference = req.body.paymentPreference || "pay_at_clinic";

    // Normalize files (handles both single & multiple uploads)
    const normalizedFiles = Array.isArray(req.files)
      ? req.files
      : req.files
        ? [req.files]
        : [];

    let formData;
    try {
      formData = JSON.parse(details || "{}");
    } catch (err) {
      return res.status(400).json({ error: "Invalid details format" });
    }

    if (!formData.entranceDiagnosis || !formData.briefHistory) {
      return res
        .status(400)
        .json({ error: "Diagnosis and brief history are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const patient = await Patient.findOne({ email: user.email })
      .select("patientId")
      .lean();

    const documents = [];

    // Process files
    if (normalizedFiles.length > 0) {
      for (const file of normalizedFiles) {
        try {
          const uploadStream = gfsBucket.openUploadStream(file.originalname, {
            contentType: file.mimetype,
          });

          const fileId = await new Promise((resolve, reject) => {
            uploadStream.on("finish", () => resolve(uploadStream.id));
            uploadStream.on("error", reject);
            uploadStream.end(file.buffer);
          });

          documents.push({
            filename: file.originalname,
            fileId,
            verificationStatus: "Verified",
            uploadedAt: new Date(),
          });
        } catch (fileErr) {
          console.error("File upload error:", fileErr);
        }
      }
    } else {
      console.log("No files to process");
    }

    // Handle cloud links if they exist (optional)
    if (formData.cloudLink) {
      documents.push({
        filename: "Cloud Link",
        fileId: null,
        url: formData.cloudLink,
        uploadedAt: new Date(),
      });
    }

    const {
      doctorEmail,
      appointmentDate: date,
      startTime,
      endTime,
      appointmentMode: formAppointmentMode,
      amount,
      currency,
    } = formData;

    if (!doctorEmail || !date || !startTime || !endTime) {
      return res.status(400).json({
        error: "Missing doctor or appointment time info",
      });
    }

    // Always add +30 minutes to endTime
    let adjustedEndTime;
    try {
      const end = new Date(endTime);
      end.setMinutes(end.getMinutes() + 30); // or +60 for 1hr
      adjustedEndTime = end.toISOString();
    } catch (e) {
      return res.status(400).json({ error: "Invalid endTime format" });
    }

    let doctorName = "Not assigned";
    let specialty = "";
    let appointmentMode = formAppointmentMode || "Online";
    let meetingLink = "";

    const doctor = await Doctor.findOne({ email: doctorEmail });
    if (doctor) {
      doctorName = doctor.fullName;
      specialty = doctor.specialty || "";
      appointmentMode = doctor.services?.[0] || appointmentMode;
    }

    const patientFullName = [user.surname, user.name, user.patronymicName]
      .filter(Boolean)
      .join(" ");
    const now = new Date();
    const monthYear = `${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}/${now.getFullYear()}`;

    let counter = await Counter.findOne({ name: "applicationId" });
    if (!counter) {
      counter = new Counter({
        name: "applicationId",
        monthYear,
        monthlyCount: 1,
        overallCount: 1,
      });
    } else {
      if (counter.monthYear !== monthYear) {
        counter.monthYear = monthYear;
        counter.monthlyCount = 1;
      } else {
        counter.monthlyCount += 1;
      }
      counter.overallCount = (counter.overallCount || 0) + 1;
    }
    await counter.save();

    const applicationId = `HD-R${String(counter.monthlyCount).padStart(
      3,
      "0"
    )}-${monthYear}-${String(counter.overallCount).padStart(4, "0")}`;

    // Set appointment status based on payment preference
    const appointmentStatus =
      paymentPreference === "pay_now" ? "Awaiting for Payment" : "Unconfirmed";

    // Create application for both payment options - NO PAYMENT INITIATION HERE
    const application = new Application({
      applicationId,
      patientId: patient?.patientId || null,
      patientEmail: user.email,
      doctorEmail,
      serviceType: serviceName,
      specialty,
      appointmentMode,
      appointmentStatus,
      meetingLink,
      date,
      startTime,
      endTime: adjustedEndTime,
      documents,
      comments: [],
      payments: [],
      serviceOrders: [
        {
          userId: req.user.id,
          serviceName,
          entranceDiagnosis: formData.entranceDiagnosis,
          briefHistory: formData.briefHistory,
          promoCode: formData.promoCode || null,
          expertReviewService: formData.expertReviewService || null,
          pathologicaService: formData.pathologicaService || null,
        },
      ],
    });

    await application.save();

    // Send email only for pay_at_clinic (pay_now will be sent after payment)
    if (paymentPreference === "pay_at_clinic") {
      // --- Format date/time (use your clinic TZ; adjust if needed) ---
      const TZ = "Europe/Moscow";
      const fmtDate = new Date(date).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: TZ,
      });
      const fmtStart = new Date(startTime).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: TZ,
      });
      const fmtEnd = new Date(adjustedEndTime).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: TZ,
      });

      // Optional bits
      const amountLine =
        amount && currency ? `\nEstimated Amount: ${amount} ${currency}` : "";
      const meetingLine =
        appointmentMode?.toLowerCase() === "online" && meetingLink
          ? `\nMeeting link: ${meetingLink}`
          : "";

      // --- Subject + Plain text ---
      const emailSubject = `Appointment Confirmed – ${fmtDate} ${fmtStart}-${fmtEnd}`;

      const emailText = `Hi ${patientFullName},

Your appointment has been successfully booked.

Application ID: ${applicationId}
Date & Time: ${fmtDate} • ${fmtStart} – ${fmtEnd} (${TZ})
Doctor: ${doctorName}${specialty ? ` (${specialty})` : ""}
Service: ${serviceName}
Mode: ${appointmentMode}${meetingLine}
${amountLine}
Payment: Pay at clinic upon arrival

What to bring:
• A valid ID/passport
• Previous medical reports (if any)
• This Application ID: ${applicationId}

If you need to reschedule or cancel, reply to this email.

— Health Direct Team`;

      // --- HTML version (optional but nicer) ---
      const emailHtml = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;">
    <h2 style="margin:0 0 8px 0;">Appointment Confirmed</h2>
    <p style="margin:0 0 16px 0;">Hi ${patientFullName},</p>
    <p style="margin:0 0 16px 0;">Your appointment has been successfully booked.</p>

    <table style="border-collapse:collapse;margin:0 0 16px 0;">
      <tr>
        <td style="padding:4px 8px;color:#555;">Application ID:</td>
        <td style="padding:4px 8px;"><strong>${applicationId}</strong></td>
      </tr>
      <tr>
        <td style="padding:4px 8px;color:#555;">Date & Time:</td>
        <td style="padding:4px 8px;"><strong>${fmtDate} • ${fmtStart} – ${fmtEnd} (${TZ})</strong></td>
      </tr>
      <tr>
        <td style="padding:4px 8px;color:#555;">Doctor:</td>
        <td style="padding:4px 8px;">${doctorName}${specialty ? ` (${specialty})` : ""
        }</td>
      </tr>
      <tr>
        <td style="padding:4px 8px;color:#555;">Service:</td>
        <td style="padding:4px 8px;">${serviceName}</td>
      </tr>
      <tr>
        <td style="padding:4px 8px;color:#555;">Mode:</td>
        <td style="padding:4px 8px;">${appointmentMode}${meetingLine
          ? `<div style="margin-top:4px;"><a href="${meetingLink}" style="color:#13597F;text-decoration:none;">Join meeting</a></div>`
          : ""
        }</td>
      </tr>
      ${amount && currency
          ? `<tr>
               <td style="padding:4px 8px;color:#555;">Estimated Amount:</td>
               <td style="padding:4px 8px;">${amount} ${currency}</td>
             </tr>`
          : ""
        }
      <tr>
        <td style="padding:4px 8px;color:#555;">Payment:</td>
        <td style="padding:4px 8px;">Pay at clinic upon arrival</td>
      </tr>
    </table>

    <div style="background:#f7f7f7;border:1px solid #eee;border-radius:8px;padding:12px 14px;margin:0 0 16px 0;">
      <div style="font-weight:600;margin-bottom:6px;">What to bring</div>
      <ul style="margin:0;padding-left:18px;">
        <li>A valid ID/passport</li>
        <li>Previous medical reports (if any)</li>
        <li>Application ID: <strong>${applicationId}</strong></li>
      </ul>
    </div>

    <p style="margin:0 0 16px 0;">If you need to reschedule or cancel, just reply to this email.</p>
    <p style="margin:0 0 4px 0;">— Health Direct Team</p>
  </div>
`;

      // If your sendEmail supports HTML as 4th arg, pass it; otherwise omit `emailHtml`.
      await sendEmail(user.email, emailSubject, emailText, emailHtml);

      const submissionNotification = new UserNotification({
        patientEmail: user.email,
        addedBy: "patient",
        message: {
          en: `Your appointment request <strong>${applicationId}</strong> has been submitted successfully. Payment due at clinic.`,
          ru: `Ваш запрос на прием <strong>${applicationId}</strong> был успешно отправлен. Оплата при посещении клиники.`,
        },
        appointmentId: applicationId,
        orderId: null,
      });

      await submissionNotification.save();
    }

    res.status(201).json({
      message:
        paymentPreference === "pay_now"
          ? "Application created successfully - Awaiting Payment"
          : "Application created successfully - Payment due at clinic",
      applicationId: applicationId,
      requiresPayment: paymentPreference === "pay_now",
      paymentPreference: paymentPreference,
    });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large. Max 10MB." });
      }
      if (error.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ error: "Max 5 files allowed." });
      }
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /applications/:applicationId/follow-up-book
router.put("/:applicationId/follow-up-book", auth, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const {
      followUpDate,
      followUpTime,
      appointmentMode,
      comment,
      paymentPreference,
    } = req.body;

    // 1. Find original application
    const originalApp = await Application.findOne({ applicationId });
    if (!originalApp) {
      return res.status(404).json({ error: "Original appointment not found" });
    }

    const { patientEmail, doctorEmail } = originalApp;
    if (!patientEmail || !doctorEmail) {
      return res.status(400).json({ error: "Missing patient or doctor email" });
    }

    // 2. Get doctor fees
    const doctor = await Doctor.findOne({ email: doctorEmail });
    if (!doctor || !doctor.feesAmount) {
      return res.status(400).json({ error: "Doctor fee not configured" });
    }
    const amount = doctor.feesAmount;
    const currency = doctor.currency || "RUB";

    // 3. Generate new applicationId
    const now = new Date();
    const monthYear = `${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}/${now.getFullYear()}`;
    let counter = await Counter.findOne({ name: "applicationId" });
    if (!counter) {
      counter = new Counter({
        name: "applicationId",
        monthYear,
        monthlyCount: 1,
        overallCount: 1,
      });
    } else {
      if (counter.monthYear !== monthYear) {
        counter.monthYear = monthYear;
        counter.monthlyCount = 1;
      } else {
        counter.monthlyCount += 1;
      }
      counter.overallCount = (counter.overallCount || 0) + 1;
    }
    await counter.save();

    const newApplicationId = `HD-R${String(counter.monthlyCount).padStart(
      3,
      "0"
    )}-${monthYear}-${String(counter.overallCount).padStart(4, "0")}`;

    // 4. Calculate start/end times
    const start = new Date(followUpTime);
    const end = new Date(followUpTime);
    end.setMinutes(end.getMinutes() + 30);

    // 5. Decide appointmentStatus
    const appointmentStatus =
      paymentPreference === "pay_now" ? "Awaiting for Payment" : "Unconfirmed";

    // 6. Create new follow-up application
    const followUpApp = new Application({
      applicationId: newApplicationId,
      patientEmail,
      doctorEmail,
      serviceType: originalApp.serviceType,
      specialty: originalApp.specialty,
      appointmentMode:
        appointmentMode || originalApp.appointmentMode || "Online",
      appointmentStatus,
      meetingLink: "",
      date: followUpDate,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      documents: [],
      comments: [],
      payments: [],
      serviceOrders: originalApp.serviceOrders,
    });

    await followUpApp.save();

    // 7. Update original application followUp field
    originalApp.followUp = {
      needed: true,
      comment: comment || originalApp.followUp?.comment || "",
      applicationId: newApplicationId,
      booked: true,
    };
    await originalApp.save();

    // 8. Respond
    res.json({
      message: "Follow-up booked successfully",
      followUpApplicationId: newApplicationId,
      amount,
      currency,
      requiresPayment: paymentPreference === "pay_now", // only true for pay_now
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET applications for a specific patient
router.get("/", auth, async (req, res) => {
  const { patientId, email } = req.query;

  if (!patientId && !email) {
    return res.status(400).json({ error: "patientId is required" });
  }

  try {
    const patient = patientId
      ? await Patient.findOne({ patientId }).select("email").lean()
      : null;

    const query = patientId
      ? {
          $or: [
            { patientId },
            ...(patient?.email ? [{ patientEmail: patient.email }] : []),
          ],
        }
      : { patientEmail: email };

    const applications = await Application.find(query).sort({
      createdAt: -1,
    });
    res.status(200).json(applications);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// GET single application + relevant orders
router.get("/:id", auth, async (req, res) => {
  try {
    const decodedId = decodeURIComponent(req.params.id);

    // Find application
    const application = await Application.findOne({ applicationId: decodedId });
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Find relevant orders: appointmentId matches & status NOT in excluded list
    const orders = await Order.find({
      applicationId: decodedId,
      status: {
        $nin: ["Waiting for Assign", "Reupload Requested", "Cancelled"],
      },
    });

    res.status(200).json({
      application,
      orders,
    });
  } catch (err) {
    console.error("Error fetching application/orders:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET file from GridFS
router.get("/media/:fileId", async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    const file = await mongoose.connection.db
      .collection("media.files")
      .findOne({ _id: fileId });

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.set("Content-Type", file.contentType);
    res.set("Content-Disposition", `inline; filename="${file.filename}"`);

    const downloadStream = gfsBucket.openDownloadStream(fileId);
    downloadStream.pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "File download failed" });
  }
});

//GET GEt the test results
router.get("/results/:id", async (req, res) => {
  try {
    const fileId = new ObjectId(req.params.id);

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "results",
    });

    const files = await bucket.find({ _id: fileId }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    const file = files[0];
    const stream = bucket.openDownloadStream(fileId);

    res.set("Content-Type", file.contentType || "application/octet-stream");

    if (req.query.download === "true") {
      res.set("Content-Disposition", `attachment; filename="${file.filename}"`);
    }

    stream.pipe(res);
  } catch (err) {
    console.error("Error streaming result file:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST For fetch the existing appointment in the particular speciality
router.post("/existings", auth, async (req, res) => {
  const { patientId, specialty } = req.body;

  if (!patientId) {
    return res.status(400).json({ error: "patientId parameter is required" });
  }

  if (!specialty) {
    return res.status(400).json({ error: "Specialty parameter is required" });
  }

  try {
    const patient = await Patient.findOne({ patientId }).select("email").lean();
    const patientQuery = {
      $or: [{ patientId }, ...(patient?.email ? [{ patientEmail: patient.email }] : [])],
    };

    const applications = await Application.find({
      ...patientQuery,
      specialty,
      appointmentStatus: { $ne: "Cancelled" },
    }).sort({ appointmentDate: 1, startTime: 1 });

    const currentDate = new Date();
    const currentDateStr = currentDate.toISOString().split("T")[0];
    const currentTime = currentDate
      .toTimeString()
      .split(" ")[0]
      .substring(0, 5); // HH:MM

    const futureApplications = applications.filter((app) => {
      if (!app.appointmentDate && !app.date) return false;

      const appointmentDate = app.appointmentDate || app.date;

      if (appointmentDate > currentDateStr) return true;

      if (appointmentDate === currentDateStr && app.startTime) {
        const startTimeStr =
          typeof app.startTime === "string"
            ? app.startTime.substring(0, 5)
            : new Date(app.startTime).toTimeString().substring(0, 5);

        return startTimeStr > currentTime;
      }

      return false;
    });

    res.status(200).json({
      success: true,
      count: futureApplications.length,
      applications: futureApplications,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// PATCH For cancel the particular application
router.patch("/:applicationId/cancel", auth, async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Decode
    const decodedApplicationId = decodeURIComponent(applicationId);

    // Find application
    const application = await Application.findOne({
      applicationId: decodedApplicationId,
    });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check already cancelled
    if (application.appointmentStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Application is already cancelled",
      });
    }

    // Update status
    const updatedApplication = await Application.findOneAndUpdate(
      { applicationId: decodedApplicationId },
      {
        appointmentStatus: "Cancelled",
        // cancelledBy: req.user?.id || "system"
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Application cancelled successfully",
      data: updatedApplication,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// POST Check the patient have any conflit in the selecte date
router.post("/check-time-conflict", auth, async (req, res) => {
  try {
    const { patientEmail, appointmentDate, startTime } = req.body;

    console.log("Checking time conflict with parameters:", {
      patientEmail,
      appointmentDate,
      startTime,
    });

    if (!patientEmail || !appointmentDate || !startTime) {
      console.log("Missing required parameters");
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    // Convert startTime to Date object for comparison
    const selectedStartTime = new Date(startTime);
    console.log("Selected start time:", selectedStartTime.toISOString());

    // Find appointments for this patient on the same date
    console.log("Querying appointments for:", {
      patientEmail,
      appointmentDate,
      status: { $ne: "Cancelled" },
    });

    const appointments = await Application.find({
      patientEmail,
      date: appointmentDate, // Direct string comparison
      appointmentStatus: { $ne: "Cancelled" }, // Exclude cancelled appointments
    });

    console.log(`Found ${appointments.length} appointments on this date`);

    // Check for time conflicts
    let conflictingAppointment = null;

    for (const appointment of appointments) {
      console.log("Checking appointment:", {
        id: appointment._id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.appointmentStatus,
      });

      if (appointment.startTime) {
        const appointmentStart = new Date(appointment.startTime);
        const appointmentEnd = new Date(appointment.endTime);

        console.log("Appointment time range:", {
          appointmentStart: appointmentStart.toISOString(),
          appointmentEnd: appointmentEnd.toISOString(),
          selectedStartTime: selectedStartTime.toISOString(),
        });

        // Check if the selected time overlaps with existing appointment
        const timeOverlap =
          selectedStartTime >= appointmentStart &&
          selectedStartTime < appointmentEnd;

        const reverseOverlap =
          appointmentStart >= selectedStartTime &&
          appointmentStart < new Date(selectedStartTime.getTime() + 30 * 60000);

        console.log("Overlap check results:", {
          timeOverlap,
          reverseOverlap,
        });

        if (timeOverlap || reverseOverlap) {
          console.log("CONFLICT FOUND with appointment:", appointment._id);
          conflictingAppointment = appointment;
          break;
        } else {
          console.log("No conflict with appointment:", appointment._id);
        }
      } else {
        console.log("Appointment has no startTime, skipping:", appointment._id);
      }
    }

    const result = {
      hasConflict: !!conflictingAppointment,
      conflictingAppointment,
    };

    console.log("Final result:", result);

    res.json(result);
  } catch (error) {
    console.error("Error checking time conflict:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get all payments for a patient
router.get("/patient/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findOne({ patientId }).select("email").lean();

    const query = {
      $or: [{ patientId }, ...(patient?.email ? [{ patientEmail: patient.email }] : [])],
    };

    // Find applications belonging to this patient
    const applications = await Application.find(query).select(
      "applicationId payments"
    );

    if (!applications.length) {
      return res.json({ success: true, payments: [] });
    }

    // Flatten all payments into one list
    const payments = applications.flatMap((app) =>
      (app.payments || []).map((payment) => {
        const plainPayment = payment.toObject ? payment.toObject() : payment;

        return {
          applicationId: app.applicationId,

          id: plainPayment.id,
          invoiceNumber: plainPayment.invoiceNumber,
          status: plainPayment.status,
          paymentLink: plainPayment.paymentLink,
          invoiceFileId: plainPayment.invoiceFileId,

          // Items & totals
          items: plainPayment.items || [],
          amount: plainPayment.amount,
          discount: plainPayment.discount || 0,
          finalAmount: plainPayment.finalAmount || plainPayment.amount,
          currency: plainPayment.currency || "RUB",

          // Type & timestamps
          type: plainPayment.type,
          createdAt: plainPayment.createdAt,
          paidAt: plainPayment.paidAt,
        };
      })
    );

    res.json({ success: true, payments });
  } catch (err) {
    console.error("Error fetching payments:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
