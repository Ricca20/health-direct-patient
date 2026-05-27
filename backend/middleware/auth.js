// middleware/authPatient.js
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  
  // Skip for refresh + logout
  if (
    req.originalUrl.includes("/auth/refresh") ||
    req.originalUrl.includes("/auth/logout")
  ) {
    return next();
  }

  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization denied - no token provided",
      code: "NO_TOKEN",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
  

    // Ensure only patients allowed
    if (decoded.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied - patient role required",
        code: "ROLE_FORBIDDEN",
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (err) {
    console.error("[ACCESS_TOKEN_ERROR]", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token expired",
        code: "TOKEN_EXPIRED",
      });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Malformed access token",
        code: "TOKEN_MALFORMED",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      code: "TOKEN_INVALID",
    });
  }
};

module.exports = { auth };
