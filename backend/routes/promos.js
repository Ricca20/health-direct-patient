const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { getGfsPromos } = require("../gridfs-promos");
const { auth } = require("../middleware/auth");

const Promo = require("../models/Promo");

router.get("/", async (req, res) => {
  try {
    const promos = await Promo.find().sort("order").lean(); 
    const gfsPromos = getGfsPromos();

    const enrichedPromos = await Promise.all(
      promos.map(async (promo) => {
        let fileData = null;

        // Safe file handling
        if (promo.fileId) {
          try {
            const fileId = new mongoose.Types.ObjectId(promo.fileId);
            const readStream = gfsPromos.openDownloadStream(fileId);

            const chunks = [];
            for await (const chunk of readStream) {
              chunks.push(chunk);
            }

            fileData = Buffer.concat(chunks).toString("base64");
          } catch (err) {
            console.error(`Error loading promo ${promo._id}`, err);
          }
        }

        return {
          _id: promo._id,

          // 🔥 FILE
          fileId: promo.fileId,
          fileType: promo.fileType,
          filename: promo.filename,
          fileData,

          // 🔥 BASIC
          order: promo.order,
          isActive: promo.isActive,
          createdAt: promo.createdAt,

          // 🔥 DATES
          startDate: promo.startDate,
          endDate: promo.endDate,

          // 🔥 COLORS
          startColor: promo.startColor,
          endColor: promo.endColor,

          // 🔥 MULTILINGUAL
          description: promo.description,
          promoBannerTitle: promo.promoBannerTitle,
          promoBannerDescription: promo.promoBannerDescription,

          // 🔥 DERIVED (manual since lean removes virtuals)
          isCurrentlyActive:
            promo.isActive &&
            new Date(promo.startDate) <= new Date() &&
            (!promo.endDate || new Date(promo.endDate) >= new Date()),

          isExpired: promo.endDate && new Date(promo.endDate) < new Date(),

          isScheduled: promo.isActive && new Date(promo.startDate) > new Date(),
        };
      }),
    );

    res.json({ promos: enrichedPromos });
  } catch (error) {
    console.error("Error fetching promos:", error);
    res.status(500).json({
      message: "Error fetching promos",
      error: error.message,
    });
  }
});

module.exports = router;
