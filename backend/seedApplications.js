const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Application = require("./models/Application");

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DEMO_PATIENT_EMAIL = process.env.SEED_APP_EMAIL || "patient@test.com".toLowerCase();

const makeApplicationId = (suffix) => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `HD-DEMO-${suffix}-${month}${year}`;
};

const demoApplications = [
  {
    applicationId: makeApplicationId("001"),
    patientEmail: DEMO_PATIENT_EMAIL,
    doctors: [
      {
        doctorEmail: "doctor@test.com",
        doctorName: "Dr. John Doe",
        serviceName: "General Consultation",
      },
    ],
    serviceType: "consultation",
    branch: "Downtown Clinic",
    appointmentStatus: "Pending payment",
    date: "2026-04-10",
    startTime: "10:00",
    endTime: "10:30",
    payments: [
      {
        id: new mongoose.Types.ObjectId().toString(),
        status: "pending",
        paymentLink: "https://demo-payment.example.com/pay/1001",
        items: [
          { name: "Consultation", amount: 1500 },
          { name: "Blood Pressure Check", amount: 300 },
        ],
        amount: 1800,
        discount: 0,
        finalAmount: 1800,
        currency: "RUB",
        type: "consultation",
      },
    ],
    comments: [
      {
        text: "Initial appointment request created for demo testing.",
        email: "doctor@test.com",
        role: "doctor",
      },
    ],
    documents: [
      {
        filename: "demo-report.pdf",
        url: "https://example.com/demo-report.pdf",
        verificationStatus: "Pending",
      },
    ],
    serviceOrders: [
      {
        serviceName: "General Consultation",
        entranceDiagnosis: "Headache and dizziness",
        briefHistory: "Patient reports mild headache for 2 days.",
        promoCode: "DEMO2026",
        expertReviewService: "Expert review of MRI",
      },
    ],
    followUp: {
      needed: false,
      comment: "",
      applicationId: null,
      booked: false,
    },
    meeting: {
      roomId: "room-demo-001",
      status: "scheduled",
      notes: "Demo telehealth appointment.",
    },
    historyForm: {
      isFirstAppointment: true,
      complaints: { value: "Headache and nausea", isVerified: true },
      anamnesisMorbi: { value: "Symptoms started 2 days ago", isVerified: false },
      anamnesisVitae: { value: "No prior chronic illness", isVerified: false },
      physicalExam: { value: "Normal vitals", isVerified: false },
      respiratory: { value: "Clear", isVerified: false },
      circulatory: { value: "Regular heartbeat", isVerified: false },
      digestive: { value: "No complaints", isVerified: false },
      urinary: { value: "Normal", isVerified: false },
      endocrine: { value: "Stable", isVerified: false },
      preliminaryDiagnosis: { value: "Tension headache", isVerified: false },
      examinationPlan: { value: "Advise rest and hydration", isVerified: false },
      examinationResults: { value: "", isVerified: false },
      clinicalDiagnosis: { value: "", isVerified: false },
      treatmentPlan: { value: "Pain medication and follow-up in one week", isVerified: false },
    },
  },
  {
    applicationId: makeApplicationId("002"),
    patientEmail: DEMO_PATIENT_EMAIL,
    doctors: [
      {
        doctorEmail: "doctor2@test.com",
        doctorName: "Dr. Maria Ivanova",
        serviceName: "Dermatologist Visit",
      },
    ],
    serviceType: "consultation",
    branch: "Main Clinic",
    appointmentStatus: "Confirmed",
    date: "2026-04-14",
    startTime: "14:00",
    endTime: "14:30",
    payments: [
      {
        id: new mongoose.Types.ObjectId().toString(),
        status: "paid",
        paymentLink: "https://demo-payment.example.com/pay/1002",
        items: [
          { name: "Dermatology Consultation", amount: 2000 },
        ],
        amount: 2000,
        discount: 200,
        finalAmount: 1800,
        currency: "RUB",
        type: "consultation",
        paidAt: new Date(),
      },
    ],
    comments: [
      {
        text: "Confirmed and paid appointment for dermatology screening.",
        email: "doctor2@test.com",
        role: "doctor",
      },
    ],
    documents: [],
    serviceOrders: [
      {
        serviceName: "Skin Health Check",
        entranceDiagnosis: "Rash and itching",
        briefHistory: "Patient has had a rash on arms for 1 week.",
      },
    ],
    followUp: {
      needed: true,
      comment: "Follow-up appointment after treatment review.",
      applicationId: null,
      booked: false,
    },
    meeting: {
      roomId: "room-demo-002",
      status: "scheduled",
      notes: "In-person appointment recorded for demo.",
    },
    historyForm: {
      isFirstAppointment: false,
      complaints: { value: "Rash and itching", isVerified: true },
      anamnesisMorbi: { value: "Skin irritation began after new cosmetics", isVerified: false },
      anamnesisVitae: { value: "No chronic skin conditions", isVerified: false },
      physicalExam: { value: "Mild redness and rash", isVerified: false },
      respiratory: { value: "Normal", isVerified: false },
      circulatory: { value: "Normal", isVerified: false },
      digestive: { value: "Normal", isVerified: false },
      urinary: { value: "Normal", isVerified: false },
      endocrine: { value: "Normal", isVerified: false },
      preliminaryDiagnosis: { value: "Contact dermatitis", isVerified: false },
      examinationPlan: { value: "Recommend topical cream and avoid irritants", isVerified: false },
      examinationResults: { value: "", isVerified: false },
      clinicalDiagnosis: { value: "", isVerified: false },
      treatmentPlan: { value: "Apply cream twice daily", isVerified: false },
    },
  },
];

async function seedApplications() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in environment variables.");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected for application seeding");

  for (const appData of demoApplications) {
    const existing = await Application.findOne({ applicationId: appData.applicationId });
    if (existing) {
      console.log(`Application ${appData.applicationId} already exists, skipping.`);
      continue;
    }

    await Application.create(appData);
    console.log(`Seeded application ${appData.applicationId}`);
  }

  await mongoose.disconnect();
  console.log("Application seed complete.");
}

seedApplications()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("Seeding applications failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  });
