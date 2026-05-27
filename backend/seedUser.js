const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Patient = require("./models/Patient");
const Promo = require("./models/Promo.js");
const Doctor = require("./models/Doctor.js");
const Application = require("./models/Application");
require("dotenv").config();

const MONGO_URI = process.env.MONGODB_URI;

const seedUser = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    // Check if user already exists
    // const existingUser = await User.findOne({ email: "patient@test.com" });
    // if (existingUser) {
    //   console.log("User already exists");
    //   process.exit();
    // }

    // Hash password
    // const hashedPassword = await bcrypt.hash("123456", 10);

    // // Create patient user
    // const user = await User.create({
    //   email: "patient@test.com",
    //   password: hashedPassword,
    //   role: "patient",
    //   profileCompleted: true,
    //   notificationLanguage: "en",
    // });

    // const patientData = {
    //   email: "patient@test.com",
    //   firstName: "Ravi",
    //   middleName: "",
    //   lastName: "Kumar",
    //   gender: "Male",
    //   dateOfBirth: new Date("1998-05-20"),
    //   phoneNumber: "9876543210",

    //   // Optional fields
    //   notes: "Demo patient created for testing",
    //   city: "Hyderabad",
    //   state: "Telangana",
    //   maritalStatus: "Single",
    //   bloodGroup: "O+",
    //   allergies: "None",
    // };

    // const users = await User.find({_id:"69ccdd717baf84e910efc32f"});
    // console.log(users);

    // console.log("Patient user created:");
    // console.log({
    //   email: user.email,
    //   password: "123456", // plain for login
    //   role: user.role,
    // });

    // const patient = await Patient.create(patientData);
    // console.log("✅ Patient created:", patient);

    //  const users = await Promo.find();
    // console.log(users);

    // 🔥 Fetch doctors with populate
    // const doctors = await Doctor.find()
    //   // .populate("specialtyIds")
    //   // .populate("subSpecialityIds");

    // console.log("Doctors with populated data:");
    // console.log(doctors);

    // ✅ Patient email
    const patientEmail = "patient@test.com";

    const applicationData = {
      applicationId: "APP-0001",
      patientEmail: "patient@test.com",

      doctors: [
        {
          doctorEmail: "doctor@test.com",
          doctorName: "Dr. John Doe",
          serviceName: "General Consultation",
        },
      ],

      serviceType: "consultation",
      branch: "Hyderabad",

      appointmentStatus: "Pending payment",

      date: "2026-04-10",
      startTime: "10:00",
      endTime: "10:30",

      // ✅ PAYMENTS
      payments: [
        {
          id: new mongoose.Types.ObjectId().toString(),
          status: "pending",
          paymentLink: "https://payment-link.com",
          invoiceFileId: "",

          items: [
            { name: "Consultation", amount: 15000 },
            { name: "Blood Test", amount: 5000 },
          ],

          amount: 20000,
          discount: 2000,
          finalAmount: 18000,
          currency: "RUB",

          type: "consultation",
          createdAt: new Date(),
        },
      ],

      // ✅ COMMENTS
      comments: [
        {
          text: "Initial consultation created",
          email: "doctor@test.com",
          role: "doctor",
        },
      ],

      // ✅ DOCUMENTS
      documents: [
        {
          filename: "report.pdf",
          url: "https://dummy.com/report.pdf",
          verificationStatus: "Pending",
        },
      ],

      // ✅ SERVICE ORDERS
      serviceOrders: [
        {
          serviceName: "MRI Scan",
          entranceDiagnosis: "Headache",
          briefHistory: "Patient has chronic headache",
          promoCode: "DISCOUNT10",
          expertReviewService: "Expert review of MRI",
        },
      ],

      // ✅ FOLLOW UP
      followUp: {
        needed: true,
        comment: "Follow-up required after 1 week",
        applicationId: null,
        booked: false,
      },

      // ✅ MEETING
      meeting: {
        roomId: "room_123",
        status: "scheduled",
        notes: "Online consultation",
      },

      // ✅ HISTORY FORM (VERY IMPORTANT)
      historyForm: {
        isFirstAppointment: true,

        complaints: { value: "Headache and fever", isVerified: false },
        anamnesisMorbi: { value: "Symptoms since 3 days", isVerified: false },
        anamnesisVitae: {
          value: "No major illness history",
          isVerified: false,
        },

        physicalExam: { value: "Normal", isVerified: false },
        respiratory: { value: "Normal", isVerified: false },
        circulatory: { value: "Normal", isVerified: false },
        digestive: { value: "Normal", isVerified: false },
        urinary: { value: "Normal", isVerified: false },
        endocrine: { value: "Normal", isVerified: false },

        preliminaryDiagnosis: { value: "Migraine", isVerified: false },
        examinationPlan: { value: "MRI + Blood Test", isVerified: false },
        examinationResults: { value: "", isVerified: false },
        clinicalDiagnosis: { value: "", isVerified: false },
        treatmentPlan: { value: "Painkillers + rest", isVerified: false },
      },
    };

    // // if (!application) {
    // //   application = await Application.create({
    // //     applicationId: "APP-0001",
    // //     patientEmail,
    // //     serviceType: "consultation",
    // //     appointmentStatus: "Pending payment",
    // //     date: "2026-04-08",
    // //     startTime: "10:00",
    // //     endTime: "10:30",
    // //     payments: [],
    // //   });

    // //   console.log("✅ Application created");
    // // }

    // // ✅ Create payment (DO NOT ADD invoiceNumber ❌)
    // // const payment = {
    // //   id: new mongoose.Types.ObjectId().toString(),

    // //   status: "pending", // important for invoice generation

    // //   paymentLink: "https://dummy-payment-link.com/pay",
    // //   invoiceFileId: "",

    // //   items: [
    // //     {
    // //       name: "General Consultation",
    // //       amount: 15000,
    // //     },
    // //     {
    // //       name: "Blood Test",
    // //       amount: 5000,
    // //     },
    // //   ],

    // //   amount: 20000,
    // //   discount: 2000,
    // //   finalAmount: 18000,
    // //   currency: "RUB",

    // //   type: "consultation",

    // //   createdAt: new Date(),
    // // };

    // // ✅ Avoid duplicate payment
    // const exists = application.payments.find((p) => p.id === payment.id);

    // if (!exists) {
    //   application.payments.push(payment);
    //   await application.save(); // 🔥 triggers invoice middleware

    //   console.log("✅ Payment added & invoice auto-generated");
    // } else {
    //   console.log("⚠️ Payment already exists");
    // }
    const exists = await Application.findOne({
      applicationId: applicationData.applicationId,
    });

    if (!exists) {
      const app = await Application.create(applicationData);
      console.log("✅ Application created:", app.applicationId);
    } else {
      console.log("⚠️ Application already exists");
    }
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedUser();
