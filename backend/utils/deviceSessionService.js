const crypto = require("crypto");
const DeviceSession = require("../models/DeviceSession");

const normalizeIp = (ip) => {
  if (!ip || typeof ip !== "string") return "unknown";

  let value = ip.trim();

  // If header includes host:port for IPv4, drop port part.
  if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(value)) {
    value = value.split(":")[0];
  }

  if (value === "::1") return "127.0.0.1";
  if (value.startsWith("::ffff:")) return value.replace("::ffff:", "");

  return value;
};

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    const first = forwarded.split(",")[0].trim();
    return normalizeIp(first);
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.length > 0) {
    return normalizeIp(realIp);
  }

  const cloudflareIp = req.headers["cf-connecting-ip"];
  if (typeof cloudflareIp === "string" && cloudflareIp.length > 0) {
    return normalizeIp(cloudflareIp);
  }

  return normalizeIp(req.ip || req.socket?.remoteAddress || "unknown");
};

const detectBrowser = (ua = "") => {
  const s = ua.toLowerCase();
  if (s.includes("edg/")) return "Microsoft Edge";
  if (s.includes("opr/") || s.includes("opera")) return "Opera";
  if (s.includes("chrome/")) return "Chrome";
  if (s.includes("firefox/")) return "Firefox";
  if (s.includes("safari/") && !s.includes("chrome/")) return "Safari";
  return "Unknown";
};

const detectOs = (ua = "") => {
  const s = ua.toLowerCase();
  if (s.includes("windows")) return "Windows";
  if (s.includes("mac os") || s.includes("macintosh")) return "macOS";
  if (s.includes("android")) return "Android";
  if (s.includes("iphone") || s.includes("ipad") || s.includes("ios")) return "iOS";
  if (s.includes("linux")) return "Linux";
  return "Unknown";
};

const detectDeviceType = (ua = "") => {
  const s = ua.toLowerCase();
  if (s.includes("ipad") || s.includes("tablet")) return "tablet";
  if (s.includes("mobile") || s.includes("iphone") || s.includes("android")) return "mobile";
  return "desktop";
};

const buildFingerprintHash = (input) =>
  crypto.createHash("sha256").update(input).digest("hex");

const normalizeDeviceInfo = (deviceInfo = {}, req) => {
  const userAgent =
    deviceInfo.userAgent || req.headers["user-agent"] || "Unknown";
  const ipAddress = getClientIp(req);
  const platform = deviceInfo.platform || "Unknown";
  const browser = deviceInfo.browser || detectBrowser(userAgent);
  const os = deviceInfo.os || detectOs(userAgent);
  const deviceType = deviceInfo.deviceType || detectDeviceType(userAgent);

  const rawDeviceId = deviceInfo.deviceId || "";
  const fallbackDeviceId = buildFingerprintHash(
    `${userAgent}|${platform}|${os}|${deviceType}`
  ).slice(0, 32);

  const deviceId = rawDeviceId || fallbackDeviceId;
  const fingerprintHash =
    deviceInfo.fingerprintHash ||
    buildFingerprintHash(`${deviceId}|${userAgent}|${ipAddress}|${platform}`);

  return {
    deviceId,
    fingerprintHash,
    userAgent,
    ipAddress,
    platform,
    browser,
    os,
    deviceType,
    location: deviceInfo.location || "Unknown",
  };
};

const upsertDeviceSession = async ({ user, req, deviceInfo }) => {
  const normalized = normalizeDeviceInfo(deviceInfo, req);
  const now = new Date();

  await DeviceSession.updateMany(
    { userId: user._id, isCurrent: true },
    { $set: { isCurrent: false, lastUsedAt: now } }
  );

  const existing = await DeviceSession.findOne({
    userId: user._id,
    deviceId: normalized.deviceId,
    isRevoked: false,
  });

  if (existing) {
    existing.email = user.email;
    existing.userAgent = normalized.userAgent;
    existing.ipAddress = normalized.ipAddress;
    existing.platform = normalized.platform;
    existing.browser = normalized.browser;
    existing.os = normalized.os;
    existing.deviceType = normalized.deviceType;
    existing.location = normalized.location;
    existing.lastUsedAt = now;
    existing.lastLoginAt = now;
    existing.isCurrent = true;
    await existing.save();

    return { session: existing, isNewDevice: false };
  }

  const created = await DeviceSession.create({
    userId: user._id,
    email: user.email,
    ...normalized,
    firstUsedAt: now,
    lastUsedAt: now,
    lastLoginAt: now,
    isCurrent: true,
    isTrusted: false,
    isRevoked: false,
  });

  return { session: created, isNewDevice: true };
};

module.exports = {
  upsertDeviceSession,
};
