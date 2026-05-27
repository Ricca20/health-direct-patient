const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const {auth} = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const { generateTokens } = require("./token");

const router = express.Router();

// POST Signup function
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Save in User collection
    const newUser = new User({
      email,
      password: hashedPassword,
      role: "patient",
      profileCompleted: false,
    });
    await newUser.save();

    // Save in Patient collection too
    const newPatient = new Patient({ email });
    await newPatient.save();

    // Send welcome email
    await sendEmail(
      email,
      "Welcome to Health Direct",
      "Hi,\n\nYou have successfully registered at Health Direct.\n\nThank you!"
    );

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser);

    // Save refreshToken in DB
    newUser.refreshToken = refreshToken;
    await newUser.save();

    // Set refresh token as HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      accessToken,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        profileCompleted: false,
      },
    });
  } catch (error) {
    console.error("Error in /signup:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Signin route with profile check inside
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (user.role !== "patient") {
      return res.status(403).json({ message: "Access denied: Not a patient" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save refreshToken in DB
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token as HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (error) {
    console.error("Error in /signin:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Token validation route
router.get('/validate', auth, (req, res) => {
  res.status(200).json({ message: 'Token is valid', profileCompleted: req.user.profileCompleted });
});

// Logout
router.post('/logout', auth, (req, res) => {
  try {
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in /logout:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


module.exports = router;