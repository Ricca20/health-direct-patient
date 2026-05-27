const mongoose = require("mongoose");

let gfsDoctorProfile = null;

mongoose.connection.once("open", () => {
  gfsDoctorProfile = new mongoose.mongo.GridFSBucket(
    mongoose.connection.db,
    {
      bucketName: "doctorProfileFiles", 
    }
  );
  console.log("GridFS initialized for doctorProfileFiles");
});

module.exports = {
  getGfsDoctorProfile: () => {
    if (!gfsDoctorProfile) {
      throw new Error("GridFS doctorProfileFiles not initialized");
    }
    return gfsDoctorProfile;
  },
};