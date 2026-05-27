const express = require('express');
const multer = require('multer');
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const User = require('../models/User');
const Patient = require('../models/Patient');
const {auth} = require('../middleware/auth');
const router = express.Router();
const { ObjectId } = mongoose.Types;


const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      return cb(null, true);
    }
    cb(new Error('File must be an image (jpeg, jpg, or png)'));
  },
});

const normalizePhoneNumber = (phoneNumber) => {
  return typeof phoneNumber === "string"
    ? phoneNumber.replace(/\D/g, "")
    : "";
};

// Get patient profile (from Patient schema)
router.get('/',  auth, async (req, res) => {
  try {
    // Fetch basic user info
    const user = await User.findById(req.user.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requestedPatientId = req.query?.patientId;

    let patient = null;
    if (requestedPatientId) {
      patient = await Patient.findOne({ patientId: requestedPatientId });
    }

    if (!patient && user.email) {
      patient = await Patient.findOne({ email: user.email });
    }

    if (!patient && user.phoneNumber) {
      const normalizedPhone = normalizePhoneNumber(user.phoneNumber);
      patient = await Patient.findOne({
        $or: [{ phoneNumber: user.phoneNumber }, { phoneNumber: normalizedPhone }],
      });
    }

    if (!patient) {
      const patientData = {
        patientId: requestedPatientId,
        email: user.email,
        firstName: user.firstName || 'Demo',
        middleName: user.middleName || '',
        lastName: user.lastName || 'Patient',
        gender: 'Male',
        dateOfBirth: new Date('1995-01-15'),
        phoneNumber: user.phoneNumber || '9000000000',
        additionalPhone: '',
        comments: 'Created default profile.',
        profileCompleted: user.profileCompleted || false,
        notificationLanguage: user.notificationLanguage || 'en',
      };

      patient = await Patient.findOneAndUpdate(
        { phoneNumber: patientData.phoneNumber },
        { $setOnInsert: patientData },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    const update = {};
    if (!patient.firstName) update.firstName = 'Demo';
    if (!patient.lastName) update.lastName = 'Patient';
    if (!patient.gender) update.gender = 'Male';
    if (!patient.dateOfBirth) update.dateOfBirth = new Date('1995-01-15');
    if (!patient.phoneNumber) update.phoneNumber = '9000000000';
    if (update.firstName || update.lastName || update.gender || update.dateOfBirth || update.phoneNumber) {
      patient = await Patient.findByIdAndUpdate(patient._id, { $set: update }, { new: true });
    }

    res.json(patient);
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile (save to Patient & update User flag)
router.put("/", auth, async (req, res) => {
  try {
    const payload = req.body || {};

    const dateFields = [
      "dateOfBirth",
      "cmipDate",
      "documentIssuedDate",
      "disabilityFrom",
      "disabilityTo",
    ];

    const allowedFields = [
      "firstName",
      "middleName",
      "lastName",
      "gender",
      "dateOfBirth",
      "phoneNumber",
      "additionalPhone",
      "notes",
      "comments",
      "maxId",
      "telegramNickname",
      "telegramId",
      "newsletter",
      "egisz",
      "instagram",
      "vk",
      "facebook",
      "ok",
      "contactPerson",
      "contactPersonPhone",
      "cmip",
      "cmipDate",
      "cmipOrgCode",
      "snils",
      "medInsuranceOrg",
      "socialSupportCode",
      "citizenship",
      "documentType",
      "documentSeries",
      "documentNumber",
      "documentIssuedDate",
      "departmentCode",
      "documentIssuedBy",
      "inn",
      "addressType",
      "region",
      "district",
      "city",
      "settlement",
      "street",
      "house",
      "terrain",
      "apartment",
      "postcode",
      "geocoordinates",
      "registrationChange",
      "maritalStatus",
      "education",
      "employment",
      "placeOfWork",
      "workSpecialty",
      "changePlaceOfWork",
      "changeOfPosition",
      "disability",
      "disabilityFrom",
      "disabilityTo",
      "disabilityIndefinitely",
      "invalidGroup",
      "disabilityType",
      "disabilityPrimaryRepeated",
      "notificationLanguage",
      "diseases",
      "finalDiagnoses",
      "radiationDoses",
      "legalRepresentatives",
    ];

    const arrayFields = [
      "diseases",
      "finalDiagnoses",
      "radiationDoses",
      "legalRepresentatives",
    ];

    const normalizeDate = (value) => {
      if (value === undefined || value === null || value === "") return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? "INVALID_DATE" : parsed;
    };

    // === Validations ===
    if (
      !payload.firstName ||
      !payload.lastName ||
      !payload.gender ||
      !payload.dateOfBirth ||
      !payload.phoneNumber
    ) {
      return res.status(400).json({
        message:
          "Please provide all required fields: first name, last name, gender, date of birth, and phone number",
      });
    }

    const dob = new Date(payload.dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      return res.status(400).json({ message: "Invalid date of birth" });
    }
    if (dob > new Date()) {
      return res
        .status(400)
        .json({ message: "Date of birth cannot be in the future" });
    }

    const phoneRegex = /^\+?\d{10,15}$/;
    if (!phoneRegex.test(payload.phoneNumber)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }
    if (payload.additionalPhone && !phoneRegex.test(payload.additionalPhone)) {
      return res
        .status(400)
        .json({ message: "Invalid additional phone number format" });
    }
    if (payload.contactPersonPhone && !phoneRegex.test(payload.contactPersonPhone)) {
      return res
        .status(400)
        .json({ message: "Invalid contact person phone number format" });
    }

    if (!["Male", "Female", "Other"].includes(payload.gender)) {
      return res.status(400).json({ message: "Invalid gender value" });
    }
    if (
      payload.disability !== undefined &&
      !["Yes", "No", ""].includes(payload.disability)
    ) {
      return res.status(400).json({ message: "Invalid disability value" });
    }
    if (
      payload.notificationLanguage !== undefined &&
      !["en", "ru"].includes(payload.notificationLanguage)
    ) {
      return res.status(400).json({ message: "Invalid notification language" });
    }

    for (const key of arrayFields) {
      if (payload[key] !== undefined && !Array.isArray(payload[key])) {
        return res.status(400).json({ message: `${key} must be an array` });
      }
    }

    const patientUpdateData = {};
    for (const key of allowedFields) {
      if (payload[key] === undefined) continue;

      if (dateFields.includes(key)) {
        const normalizedDate = normalizeDate(payload[key]);
        if (normalizedDate === "INVALID_DATE") {
          return res.status(400).json({ message: `Invalid date value for ${key}` });
        }
        patientUpdateData[key] = normalizedDate;
        continue;
      }

      patientUpdateData[key] = payload[key];
    }

    patientUpdateData.profileCompleted = true;

    // === Update User ===
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.profileCompleted = true;
    await user.save();

    // === Update or create Patient ===
    const patient = await Patient.findOneAndUpdate(
      payload.patientId ? { patientId: payload.patientId } : { email: user.email },
      {
        $set: patientUpdateData,
        $setOnInsert: {
          email: user.email,
          ...(payload.patientId ? { patientId: payload.patientId } : {}),
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: "Profile updated successfully",
      patient,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});


// POST Upload profil picture
router.post("/upload-profile-picture", auth, upload.single("profilePicture"), async (req, res) => {
  try {
    // Check if bucket is available
    if (!req.app.locals || !req.app.locals.profileBucket) {
      return res.status(500).json({ message: "Server configuration error: GridFS bucket not initialized" });
    }

    const patientId = req.body.patientId;
    const email = req.user?.email || req.body.email;

    if (!req.file || (!patientId && !email)) {
      return res.status(400).json({ message: "Missing patientId or file." });
    }

    const patient = patientId
      ? await Patient.findOne({ patientId })
      : await Patient.findOne({ email });
    if (!patient) return res.status(404).json({ message: "Patient not found." });

    const bucket = req.app.locals.profileBucket;

    // Delete old file if exists
    if (patient.profileFileId) {
      try {
        await bucket.delete(new mongoose.Types.ObjectId(patient.profileFileId));
      } catch (err) {
        console.warn("Previous profile image deletion failed:", err.message);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new file
    const uploadStream = bucket.openUploadStream(`${patient.patientId || patient.email}-profile-${Date.now()}.jpg`, {
      contentType: req.file.mimetype,
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on('error', (err) => {
      console.error("UploadStream error:", err);
      return res.status(500).json({ message: "Failed to upload profile image." });
    });

    uploadStream.on('finish', async () => {
      try {
        patient.profileFileId = uploadStream.id;
        await patient.save();
        return res.status(200).json({ 
          message: "Profile picture uploaded successfully.",
          fileId: uploadStream.id 
        });
      } catch (saveErr) {
        console.error("Save error:", saveErr);
        return res.status(500).json({ message: "Failed to save file reference." });
      }
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Image upload failed." });
  }
});

//GET Profile image
router.get("/image/:fileId", async (req, res) => {
  const bucket = req.app.locals.profileBucket;
  const { fileId } = req.params;

  try {
    const _id = new mongoose.Types.ObjectId(fileId);
    const downloadStream = bucket.openDownloadStream(_id);

    res.set("Content-Type", "image/jpeg");
    downloadStream.pipe(res);
  } catch (err) {
    console.error("Image fetch error:", err);
    res.status(404).json({ message: "Image not found." });
  }
});



module.exports = router;
