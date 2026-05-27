const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("./models/User");
const Patient = require("./models/Patient");

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const LOGIN_EMAIL = (process.env.SEED_LOGIN_EMAIL || "patient@test.com").toLowerCase().trim();
const LOGIN_PASSWORD = process.env.SEED_LOGIN_PASSWORD || "Test@123";

async function seedLogin() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in environment variables.");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");

  const hashedPassword = await bcrypt.hash(LOGIN_PASSWORD, 10);

  const user = await User.findOneAndUpdate(
    { email: LOGIN_EMAIL },
    {
      $set: {
        password: hashedPassword,
        role: "patient",
        profileCompleted: true,
        notificationLanguage: "en",
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  const existingPatient = await Patient.findOne({ email: LOGIN_EMAIL });

  if (!existingPatient) {
    await Patient.create({
      email: LOGIN_EMAIL,
      firstName: "Demo",
      middleName: "",
      lastName: "Patient",
      gender: "Male",
      dateOfBirth: new Date("1995-01-15"),
      phoneNumber: "9000000000",
      profileCompleted: true,
      notificationLanguage: "en",
      notes: "Seeded patient for login testing",
    });
  } else {
    const updates = {};

    if (!existingPatient.firstName) updates.firstName = "Demo";
    if (!existingPatient.lastName) updates.lastName = "Patient";
    if (!existingPatient.gender) updates.gender = "Male";
    if (!existingPatient.dateOfBirth) updates.dateOfBirth = new Date("1995-01-15");
    if (!existingPatient.phoneNumber) updates.phoneNumber = "9000000000";

    updates.profileCompleted = true;
    updates.notificationLanguage = existingPatient.notificationLanguage || "en";

    if (Object.keys(updates).length > 0) {
      await Patient.updateOne({ _id: existingPatient._id }, { $set: updates }, { runValidators: true });
    }
  }

  console.log("Seed complete. Login credentials:");
  console.log(`email: ${LOGIN_EMAIL}`);
  console.log(`password: ${LOGIN_PASSWORD}`);
  console.log(`userId: ${user._id}`);
}

seedLogin()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seeding failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
