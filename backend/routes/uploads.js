// routes/uploads.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const crypto = require("crypto");
const PendingUpload = require("../models/PendingUpload");
const {auth} = require('../middleware/auth');

let gfsBucket;
async function initGridFS() {
  if (!gfsBucket) {
    await mongoose.connection.asPromise();
    gfsBucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: "media",
      chunkSizeBytes: 1024 * 1024,
    });
  }
  return gfsBucket;
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  // match FE (50MB, max 5 files) — adjust if needed
  limits: { fileSize: 50 * 1024 * 1024, files: 5 },
});

router.use(async (req, res, next) => {
  try {
    await initGridFS();
    next();
  } catch (e) {
    console.error("GridFS init error:", e);
    res.status(500).json({ error: "GridFS init failed" });
  }
});

// POST /api/uploads/pending
router.post("/pending", [auth, upload.array("documents")], async (req, res) => {
  try {
    const uploadToken = crypto.randomUUID();
    const filesMeta = [];

    const normalized = Array.isArray(req.files) ? req.files : (req.files ? [req.files] : []);
    for (const file of normalized) {
      const stream = gfsBucket.openUploadStream(file.originalname, {
        contentType: file.mimetype,
      });
      const fileId = await new Promise((resolve, reject) => {
        stream.on("finish", () => resolve(stream.id));
        stream.on("error", reject);
        stream.end(file.buffer);
      });
      filesMeta.push({
        filename: file.originalname,
        fileId,
        contentType: file.mimetype,
      });
    }

    // if your auth middleware attaches email, great; otherwise fetch user first
    const patientEmail = req.user?.email || req.user?.id || "unknown";

    await PendingUpload.create({
      uploadToken,
      patientEmail,
      files: filesMeta,
    });

    res.json({ uploadToken, filesCount: filesMeta.length });
  } catch (err) {
    console.error("pending upload error:", err);
    res.status(500).json({ error: "Failed to stage files" });
  }
});

module.exports = router;
