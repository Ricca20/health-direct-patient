const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const { GridFSBucket } = require("mongodb");
const cookieParser = require("cookie-parser");
const path = require('path');
const { isCrawler } = require('./middleware/crawlerDetector');
const Doctor = require('./models/Doctor');


const loginRoutes = require("./routes/login");
const profileRoutes = require("./routes/profile");
const serviceRoutes = require("./routes/services");
const doctorRoutes = require("./routes/doctors");
const availRoutes = require("./routes/availability");
const applicationRoutes = require("./routes/applications");
const promoRoutes = require("./routes/promos");
const notificationRoutes = require("./routes/notifications");
const paymentRoutes = require("./routes/payments");
const uploadsRoutes = require("./routes/uploads");
const authRoutes = require("./routes/auth");
const deviceRoutes = require("./routes/devices");

const meetingRoutes = require("./routes/meetingRoutes");



// Load environment variables
dotenv.config();

// Validate Mongo URI
if (!process.env.MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in .env file");
  process.exit(1);
}

const app = express();
app.use(cookieParser());


// CORS config
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  "http://localhost:5173",
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
};

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
    "x-auth-token",
    "x-device-id",
    "x-device-user-agent",
    "x-device-platform",
    "x-device-browser",
    "x-device-os",
    "x-device-type",
    "x-device-location",
  ],
  exposedHeaders: ["Authorization", "x-auth-token"],
  credentials: true,
  optionsSuccessStatus: 204,
  preflightContinue: false,
  maxAge: 86400,
};
app.use(cors(corsOptions));
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return cors(corsOptions)(req, res, next);
  }

  next();
});



// Conditional JSON parsing
app.use((req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("application/json")) {
    express.json()(req, res, next);
  } else {
    next();
  }
});



mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    
    // Initialize GridFS buckets immediately
    const db = mongoose.connection.db;
    
    app.locals.resultBucket = new GridFSBucket(db, { bucketName: "results" });
    app.locals.documentBucket = new GridFSBucket(db, { bucketName: "documents" });
    app.locals.mediaBucket = new GridFSBucket(db, { bucketName: "media" });
    app.locals.profileBucket = new GridFSBucket(db, { bucketName: "profileImages" });
      
   
  })
  .catch((err) => {
    process.exit(1);
  });

// Routes
app.use("/api/login", loginRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/availability", availRoutes);
app.use("/api/doctor-availability", availRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/promos", promoRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);

app.use("/api/meetings", meetingRoutes);




// Health check endpoint
app.get("/api/health", (req, res) => {
  const buckets = {
    profileBucket: !!req.app.locals.profileBucket,
    resultBucket: !!req.app.locals.resultBucket,
    documentBucket: !!req.app.locals.documentBucket,
    mediaBucket: !!req.app.locals.mediaBucket
  };
  
 
  
  res.json({
    status: "OK",
    buckets: buckets,
    mongoConnected: mongoose.connection.readyState === 1,
    mongoState: mongoose.connection.readyState,
    timestamp: new Date().toISOString()
  });
});

// ✅ ONLY ONE ROUTE FOR DOCTOR SHARING (NO React serving)
app.get('/doctors/:id', async (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const { id } = req.params;
  
  console.log(`📱 Request for doctor: ${id}`);
  console.log(`🕷️ Is crawler: ${isCrawler(userAgent)}`);
  
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log('❌ Invalid doctor ID');
    return res.status(400).json({ message: "Invalid doctor ID" });
  }
  
  try {
    // Fetch doctor from database
    const Doctor = require('./models/Doctor');
    const doctor = await Doctor.findById(id)
      .populate('specialtyIds')
      .lean();
    
    if (!doctor) {
      console.log('❌ Doctor not found');
      return res.status(404).json({ message: "Doctor not found" });
    }
    
    console.log(`✅ Doctor found: ${doctor.firstName?.en} ${doctor.lastName?.en}`);
    
    // For crawlers - return HTML with OG tags
    if (isCrawler(userAgent)) {
      console.log('📄 Returning HTML with OG tags for crawler');
      
      // Get full name
      const fullName = `${doctor.firstName?.en || ''} ${doctor.lastName?.en || ''}`.trim();
      
      // Get specialties
      const specialties = doctor.specialtyIds?.map(s => s.name?.en).join(', ') || 'Medical Doctor';
      
      // Get image URL
      const baseUrl = process.env.API_BASE_URL || 'https://pupil-pull-outweigh.ngrok-free.dev';
      const imageUrl = doctor.profileFileId 
        ? `${baseUrl}/api/doctors/profile-image-file/${doctor.profileFileId}`
        : `${baseUrl}/default-doctor.jpg`;
      
      // Description
      const description = doctor.bio?.en 
        ? doctor.bio.en.substring(0, 200)
        : `Dr. ${fullName} - ${specialties}`;
      
      // Simple HTML with OG tags
      const html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Dr. ${fullName} - Doctor Profile</title>
        <meta property="og:title" content="Dr. ${fullName}" />
        <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:url" content="${baseUrl}/doctors/${id}" />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Dr. ${fullName}" />
        <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}" />
        <meta name="twitter:image" content="${imageUrl}" />
      </head>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <img src="${imageUrl}" style="width: 100%; border-radius: 10px;" />
          <h1 style="color: #333;">Dr. ${fullName}</h1>
          <p style="color: #0066cc; font-weight: bold;">${specialties}</p>
          <p style="color: #666;">${description}</p>
        </div>
      </body>
      </html>`;
      
      return res.send(html);
    }
    
    // For normal users - redirect to your React dev server
    console.log('🔄 Redirecting to React dev server');
    const reactBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const reactUrl = `${reactBaseUrl.replace(/\/$/, "")}/doctors/${id}`;
    return res.redirect(reactUrl);
    
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Simple root route
app.get('/', (req, res) => {
  res.json({ message: 'HMS API is running', endpoints: ['/api/doctors', '/doctors/:id'] });
});

// // Also handle root and other routes
// app.get(/.*/, (req, res) => {
//   res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
// });


// Start server
const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});