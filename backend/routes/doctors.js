const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const { getGfsDoctorProfile } = require("../gridfs-doctor-profile");
const { auth } = require("../middleware/auth");

require("../models/SpecialtyMaster");
require("../models/SubSpecialityMaster");

router.get("/", async (req, res) => {
  try {
    console.log("doctors get fun");

    const doctors = await Doctor.find()
      .populate("specialtyIds")
      .populate("subSpecialityIds")
      .sort({ "firstName.en": 1 })
      .lean({ virtuals: true });

    const gfsDoctor = getGfsDoctorProfile();

    const enrichedDoctors = await Promise.all(
      doctors.map(async (doc) => {
        let fileData = null;

        // GridFS image
        if (doc.profileFileId) {
          try {
            const fileId = new mongoose.Types.ObjectId(doc.profileFileId);
            const readStream = gfsDoctor.openDownloadStream(fileId);

            const chunks = [];
            for await (const chunk of readStream) {
              chunks.push(chunk);
            }

            fileData = Buffer.concat(chunks).toString("base64");
          } catch (err) {
            console.error(`Error loading doctor image ${doc._id}`, err);
          }
        }

        //FULL MULTILINGUAL NAME
        const fullName = {
          en: `${doc.firstName?.en || ""} ${
            doc.middleName?.en ? doc.middleName.en + " " : ""
          }${doc.lastName?.en || ""}`.trim(),

          ru: `${doc.firstName?.ru || ""} ${
            doc.middleName?.ru ? doc.middleName.ru + " " : ""
          }${doc.lastName?.ru || ""}`.trim(),
        };

        const baseUrl = process.env.API_BASE_URL || "http://localhost:5004";

        const imagePublicUrl = doc.profileFileId
          ? `${baseUrl}/api/doctors/profile-image-file/${doc.profileFileId}`
          : null;

        return {
          ...doc, //  RETURN EVERYTHING FROM MODEL

          fullName, //  override/add clean fullName

          // image (same style as promo)
          fileData,
          fileType: "image",
          filename: "profile",
          imagePublicUrl,
        };
      }),
    );

    res.json({ doctors: enrichedDoctors });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({
      message: "Error fetching doctors",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ❌ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    const doctor = await Doctor.findById(id)
      .populate("specialtyIds")
      .populate("subSpecialityIds")
      .lean({ virtuals: true });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const gfsDoctor = getGfsDoctorProfile();

    let fileData = null;

    // ✅ GridFS image
    if (doctor.profileFileId) {
      try {
        const fileId = new mongoose.Types.ObjectId(doctor.profileFileId);
        const readStream = gfsDoctor.openDownloadStream(fileId);

        const chunks = [];
        for await (const chunk of readStream) {
          chunks.push(chunk);
        }

        fileData = Buffer.concat(chunks).toString("base64");
      } catch (err) {
        console.error(`Error loading doctor image ${doctor._id}`, err);
      }
    }

    // ✅ FULL NAME
    const fullName = {
      en: `${doctor.firstName?.en || ""} ${
        doctor.middleName?.en ? doctor.middleName.en + " " : ""
      }${doctor.lastName?.en || ""}`.trim(),

      ru: `${doctor.firstName?.ru || ""} ${
        doctor.middleName?.ru ? doctor.middleName.ru + " " : ""
      }${doctor.lastName?.ru || ""}`.trim(),
    };

    // ✅ Public Image URL
    const baseUrl = process.env.API_BASE_URL || "http://localhost:5004";

    const imagePublicUrl = doctor.profileFileId
      ? `${baseUrl}/api/doctors/profile-image-file/${doctor.profileFileId}`
      : null;

    const enrichedDoctor = {
      ...doctor,
      fullName,
      fileData,
      fileType: "image",
      filename: "profile",
      imagePublicUrl,
    };

    res.json({ doctor: enrichedDoctor });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    res.status(500).json({
      message: "Error fetching doctor",
      error: error.message,
    });
  }
});

module.exports = router;
