const { PlugNmeetClient } = require("../routes/plugnmeetClient");
const Application = require("../models/Application");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const User = require("../models/User");

const plugClient = new PlugNmeetClient(
  process.env.PLUGNMEET_API_KEY,
  process.env.PLUGNMEET_API_SECRET,
  process.env.PLUGNMEET_BASE_URL
);

// Create a new room
exports.createRoom = async (req, res) => {
  try {
    const { roomId, title = "Meeting Room", options = {} } = req.body;
    if (!roomId) {
      return res.status(400).json({ status: false, message: "roomId is required" });
    }

    const data = await plugClient.createRoom(roomId, title, {
      ...options,
      emptyTimeout: options.emptyTimeout || 3600, // 1 hour instead of 5 minutes
    });
    
    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to create room",
      error: error.response?.data || error.message,
    });
  }
};

exports.createOrJoinRoom = async (req, res) => {
  try {
    const { applicationId, roomId: bodyRoomId, title: bodyTitle, user, options = {} } = req.body;

    // Prefer application data
    let applicationDoc = null;
    if (applicationId) {
      applicationDoc =
        (await Application.findOne({ applicationId })) || (await Application.findById(applicationId));
      if (!applicationDoc) {
        return res.status(404).json({ status: false, message: "Application not found" });
      }
    }

    // Resolve doctor room
    let doctorDoc = null;
    if (applicationDoc?.doctorEmail) {
      doctorDoc = await Doctor.findOne({ email: applicationDoc.doctorEmail.toLowerCase() });
      if (doctorDoc && !doctorDoc.meetingRoomId) {
        doctorDoc.meetingRoomId = doctorDoc._id.toString();
        await doctorDoc.save();
      }
    }

    const roomId =
      bodyRoomId ||
      doctorDoc?.meetingRoomId ||
      applicationDoc?._id?.toString() ||
      applicationDoc?.applicationId;
    
    if (!roomId) {
      return res.status(400).json({ status: false, message: "roomId or applicationId is required" });
    }

    const title = bodyTitle || (applicationDoc ? `Appointment ${applicationDoc.applicationId}` : "Meeting Room");

    const metadata = {
      appointment_id: applicationDoc?.applicationId,
      appointment_date: applicationDoc?.date,
      start_time: applicationDoc?.startTime,
      end_time: applicationDoc?.endTime,
      doctor_email: applicationDoc?.doctorEmail,
      patient_email: applicationDoc?.patientEmail,
      service_type: applicationDoc?.serviceType,
      appointment_mode: applicationDoc?.appointmentMode,
      branch: applicationDoc?.branch,
    };

    const mergedOptions = {
      ...options,
      metadata: { ...(options.metadata || {}), ...metadata },
      emptyTimeout: options.emptyTimeout || 3600,
    };

    const roomData = await plugClient.createOrJoinRoom(roomId, title, mergedOptions);
    
    if (!roomData.status) {
      throw new Error(roomData.msg);
    }

    // If user info provided, generate token immediately
    let tokenData = null;
    if (user) {
      tokenData = await plugClient.getJoinToken(roomId, {
        name: user.name || "Participant",
        userId: user.userId || `user_${Date.now()}`,
        isAdmin: user.isAdmin || false,
        profilePic: user.profilePic,
      });
    }

    if (applicationDoc) {
      applicationDoc.meeting = {
        roomId,
        joinUrl: tokenData?.status ? 
          `${process.env.PLUGNMEET_BASE_URL}/?access_token=${tokenData.token}` : null,
        lastToken: tokenData?.token || null,
        lastGeneratedAt: new Date(),
        lastGeneratedBy: user?.userId || null,
      };
      await applicationDoc.save();
    }

    return res.json({
      status: true,
      roomId,
      isNewRoom: roomData.isNewRoom,
      token: tokenData?.token || null,
      joinUrl: tokenData?.status ? 
        `${process.env.PLUGNMEET_BASE_URL}/?access_token=${tokenData.token}` : null,
      message: roomData.message,
    });
  } catch (error) {
    console.error("createOrJoinRoom error:", error.message);
    return res.status(500).json({
      status: false,
      message: "Failed to create or join room",
      error: error.response?.data || error.message,
    });
  }
};

// Join room by user email/role with name resolved from respective schema
exports.joinMeetingByUser = async (req, res) => {
  try {
    const {
      roomId: bodyRoomId,
      applicationId,
      userEmail,
      role: bodyRole,
      name: bodyName,
      profilePic,
    } = req.body || {};

    const authUser = req.user || {};

    console.log(authUser)
    console.log(req.body)

    if (!bodyRoomId && !applicationId) {
      return res
        .status(400)
        .json({ status: false, message: "roomId or applicationId is required" });
    }

    let resolvedRoomId = bodyRoomId;
    let applicationDoc = null;

    if (applicationId && !resolvedRoomId) {
      applicationDoc =
        (await Application.findOne({ applicationId })) ||
        (await Application.findById(applicationId));
      if (applicationDoc) {
        resolvedRoomId =
          applicationDoc.meeting?.roomId ||
          applicationDoc._id?.toString() ||
          applicationDoc.applicationId;
      }
    }

    if (!resolvedRoomId) {
      return res.status(400).json({ status: false, message: "roomId could not be resolved" });
    }

    const email = (userEmail || authUser.email || "").toLowerCase();
    const userDoc = authUser.id
      ? await User.findById(authUser.id)
      : email
      ? await User.findOne({ email })
      : null;
    const resolvedRole = bodyRole || authUser.role || userDoc?.role || "patient";
    const normalizedRole = resolvedRole === "doctor" ? "doctor" : "patient";

    // Resolve display name from respective collection
    let displayName =
      bodyName ||
      userDoc?.name ||
      email ||
      "Guest";

    const findByEmail = async (Model) => {
      try {
        return await Model.findOne({ email });
      } catch {
        return null;
      }
    };

    let profileDoc = null;
    if (email) {
      profileDoc = normalizedRole === "doctor" ? await findByEmail(Doctor) : await findByEmail(Patient);
    }

    if (profileDoc) {
      const fullName = `${profileDoc.firstName || ""} ${profileDoc.lastName || ""}`.trim();
      displayName = fullName || displayName;
    }

    const isAdmin = normalizedRole === "doctor";

    // Ensure room exists/active
    const title =
      (applicationDoc && `Appointment ${applicationDoc.applicationId}`) || "Meeting Room";
    const roomStatus = await plugClient.isRoomActive(resolvedRoomId);
    if (!roomStatus.is_active) {
      const created = await plugClient.createRoom(resolvedRoomId, title, {
        emptyTimeout: 7200,
      });
      if (!created.status) {
        throw new Error(created.msg || "Failed to create room");
      }
    }

    const tokenResult = await plugClient.getJoinToken(resolvedRoomId, {
      name: displayName,
      userId: authUser.id
        ? `${normalizedRole}_${authUser.id}`
        : `${normalizedRole}_${resolvedRoomId}_${Date.now()}`,
      isAdmin,
      profilePic:
        profilePic ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
    });

    if (!tokenResult.status) {
      throw new Error(tokenResult.msg || "Failed to generate token");
    }

    const joinUrl = `${process.env.PLUGNMEET_BASE_URL}/?access_token=${tokenResult.token}`;

    // Persist to application meeting details if we have it
    if (applicationDoc) {
      applicationDoc.meeting = {
        ...(applicationDoc.meeting || {}),
        roomId: resolvedRoomId,
        lastGeneratedAt: new Date(),
        lastGeneratedBy: email || normalizedRole,
        [`${normalizedRole}Token`]: tokenResult.token,
        [`${normalizedRole}Link`]: joinUrl,
      };
      await applicationDoc.save();
    }

    return res.json({
      status: true,
      roomId: resolvedRoomId,
      token: tokenResult.token,
      joinUrl,
      role: normalizedRole,
      isAdmin,
      name: displayName,
    });
  } catch (error) {
    console.error("joinMeetingByUser error:", error.message);
    return res.status(500).json({
      status: false,
      message: "Failed to join meeting",
      error: error.message,
    });
  }
};

exports.joinDoctorRoom = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { role = "doctor", profilePic, name } = req.body || {};

    if (!doctorId) {
      return res.status(400).json({ status: false, message: "doctorId is required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ status: false, message: "Doctor not found" });
    }

    const roomId = doctor.meetingRoomId || `doctor_${doctorId}`;
    const doctorName = `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim() || "Doctor";
    const displayName = (name || doctorName || "Guest").trim();
    const title = `${doctorName} - Consultation`;

    // Step 1: Check if room exists and is active
    let roomStatus = await plugClient.isRoomActive(roomId);
    let isNewRoom = false;

    // Step 2: If room doesn't exist or is inactive, create it
    if (!roomStatus.is_active) {
      const createResult = await plugClient.createRoom(roomId, title, {
        maxParticipants: 10,
        allowRecording: true,
        allowChat: true,
        allowScreenShare: true,
        muteOnStart: false,
        emptyTimeout: 7200, // 2 hours
        metadata: {
          doctorId: doctor._id.toString(),
          doctorName: doctorName,
          specialty: doctor.specialty,
          createdFor: "doctor_consultation",
          createdAt: new Date().toISOString(),
        }
      });

      if (!createResult.status) {
        throw new Error(`Failed to create room: ${createResult.msg}`);
      }

      isNewRoom = true;

      // Update doctor's room ID if not set
      if (!doctor.meetingRoomId) {
        doctor.meetingRoomId = roomId;
        await doctor.save();
      }
    }

    // Step 3: Generate fresh token for this session
    const normalizedRole = role === "doctor" ? "doctor" : "patient";
    const isAdmin = normalizedRole === "doctor";
    const userPrefix = normalizedRole || (isAdmin ? "doctor" : "participant");
    const tokenResult = await plugClient.getJoinToken(roomId, {
      name: displayName,
      userId: `${userPrefix}_${doctorId}_${Date.now()}`,
      isAdmin,
      profilePic:
        profilePic ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
    });

    if (!tokenResult.status) {
      throw new Error(`Failed to generate token: ${tokenResult.msg}`);
    }

    // Step 4: Return everything needed
    const joinUrl = `${process.env.PLUGNMEET_BASE_URL}/?access_token=${tokenResult.token}`;

    return res.json({
      status: true,
      roomId: roomId,
      token: tokenResult.token,
      joinUrl: joinUrl,
      isNewRoom: isNewRoom,
      doctorName: doctorName,
      role: normalizedRole,
      isAdmin,
      message: isNewRoom ? "Created new room session" : "Joined existing room session",
    });

  } catch (error) {
    console.error("joinDoctorRoom error:", error.message);
    return res.status(500).json({
      status: false,
      message: "Failed to join doctor room",
      error: error.message,
    });
  }
};

// Create or fetch persistent room for a doctor
exports.createDoctorRoom = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ status: false, message: "doctorId is required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ status: false, message: "Doctor not found" });
    }

    // Ensure doctor has a meetingRoomId
    if (!doctor.meetingRoomId) {
      doctor.meetingRoomId = `doctor_${doctor._id}`;
      await doctor.save();
    }

    const roomId = doctor.meetingRoomId;
    const doctorName = `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim() || "Doctor";
    const title = `${doctorName} - Consultation Room`;

    // Build metadata
    const metadata = {
      doctor_id: doctor._id.toString(),
      doctor_email: doctor.email,
      doctor_name: doctorName,
      specialty: doctor.specialty,
      services: doctor.services,
      created_at: new Date().toISOString(),
    };

    const options = { 
      metadata,
      emptyTimeout: 7200, // 2 hours
      maxParticipants: 10,
      allowRecording: true,
    };
    
    const data = await plugClient.createOrJoinRoom(roomId, title, options);

    // Persist room info
    doctor.meetingRoomId = roomId;
    await doctor.save();

    return res.json({
      status: true,
      roomId,
      data,
      message: "Doctor room created/activated successfully",
    });
  } catch (error) {
    console.error("createDoctorRoom error:", error.message);
    return res.status(500).json({
      status: false,
      message: "Failed to create doctor room",
      error: error.response?.data || error.message,
    });
  }
};

// Generate a join token for a user
exports.getJoinToken = async (req, res) => {
  try {
    const { roomId, user } = req.body;
    if (!roomId) {
      return res.status(400).json({ status: false, message: "roomId is required" });
    }
    if (!user || !user.name) {
      return res.status(400).json({ status: false, message: "user.name is required" });
    }

    // Check if room is active first
    const roomStatus = await plugClient.isRoomActive(roomId);
    if (!roomStatus.is_active) {
      return res.status(400).json({
        status: false,
        message: "Room is not active. Please create a room first.",
        code: "ROOM_NOT_ACTIVE"
      });
    }

    const data = await plugClient.getJoinToken(roomId, user);
    return res.json(data);
  } catch (error) {
    console.error("getJoinToken error:", error.message);
    return res.status(500).json({
      status: false,
      message: "Failed to generate join token",
      error: error.response?.data || error.message,
    });
  }
};

// Check if room is active
exports.isRoomActive = async (req, res) => {
  try {
    const { roomId } = req.params;
    const data = await plugClient.isRoomActive(roomId);
    return res.json(data);
  } catch (error) {
    console.error("isRoomActive error:", error.message);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch room status",
      error: error.response?.data || error.message,
    });
  }
};

// Get active room info
exports.getActiveRoomInfo = async (req, res) => {
  try {
    const { roomId } = req.params;
    const data = await plugClient.getActiveRoomInfo(roomId);
    return res.json(data);
  } catch (error) {
    console.error("getActiveRoomInfo error:", error.message);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch room info",
      error: error.response?.data || error.message,
    });
  }
};

// Get all active rooms
exports.getActiveRoomsInfo = async (_req, res) => {
  try {
    const data = await plugClient.getActiveRoomsInfo();
    return res.json(data);
  } catch (error) {
    console.error("getActiveRoomsInfo error:", error.message);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch active rooms",
      error: error.response?.data || error.message,
    });
  }
};

// Fetch past rooms
exports.fetchPastRooms = async (req, res) => {
  try {
    const { roomIds = [], from = 0, limit = 20, orderBy = "DESC" } = req.body;
    const data = await plugClient.fetchPastRooms(roomIds, { from, limit, orderBy });
    return res.json(data);
  } catch (error) {
    console.error("fetchPastRooms error:", error.message);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch past rooms",
      error: error.response?.data || error.message,
    });
  }
};

// End a room
exports.endRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const data = await plugClient.endRoom(roomId);
    return res.json(data);
  } catch (error) {
    console.error("endRoom error:", error.message);
    return res.status(500).json({
      status: false,
      message: "Failed to end room",
      error: error.response?.data || error.message,
    });
  }
};
