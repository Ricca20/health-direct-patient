const express = require("express");
const { auth } = require("../middleware/auth");
const DeviceSession = require("../models/DeviceSession");
const User = require("../models/User");
const { upsertDeviceSession } = require("../utils/deviceSessionService");

const router = express.Router();

router.get("/my", auth, async (req, res) => {
  try {
    // Backfill/sync current device session for existing users
    const user = await User.findById(req.user.id);
    if (user) {
      const deviceInfo = {
        deviceId: req.headers["x-device-id"],
        userAgent: req.headers["x-device-user-agent"],
        platform: req.headers["x-device-platform"],
        browser: req.headers["x-device-browser"],
        os: req.headers["x-device-os"],
        deviceType: req.headers["x-device-type"],
        location: req.headers["x-device-location"],
      };
      await upsertDeviceSession({ user, req, deviceInfo });
    }

    const devices = await DeviceSession.find({
      userId: req.user.id,
      isRevoked: false,
    })
      .sort({ lastLoginAt: -1 })
      .select(
        "email deviceId browser os platform deviceType ipAddress location firstUsedAt lastUsedAt lastLoginAt isCurrent isTrusted"
      )
      .lean();

    return res.status(200).json({ success: true, devices });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch devices" });
  }
});

router.patch("/:id/revoke", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const device = await DeviceSession.findOne({
      _id: id,
      userId: req.user.id,
      isRevoked: false,
    });

    if (!device) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    device.isRevoked = true;
    device.isCurrent = false;
    device.revokedAt = new Date();
    await device.save();

    return res.status(200).json({ success: true, message: "Device revoked" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to revoke device" });
  }
});

router.patch("/revoke-others", auth, async (req, res) => {
  try {
    const { currentDeviceId } = req.body || {};

    const query = {
      userId: req.user.id,
      isRevoked: false,
    };

    if (currentDeviceId) {
      query.deviceId = { $ne: currentDeviceId };
    }

    const result = await DeviceSession.updateMany(query, {
      $set: {
        isRevoked: true,
        isCurrent: false,
        revokedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Other devices revoked",
      count: result.modifiedCount || 0,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to revoke other devices" });
  }
});

module.exports = router;
