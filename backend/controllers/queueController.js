const qs = require("../services/queueService");
const Doctor = require("../models/Doctor");
const Token = require("../models/Token");
const Appointment = require("../models/Appointment");
const emitQueueUpdate = require("../utils/emitQueueUpdate");

// =====================================================
// CREATE TOKEN
// Walk-in token
// =====================================================

exports.createToken = async (req, res) => {
  try {
    const token = await qs.createToken({
      ...req.body,
      hospitalId: req.user.hospitalId,
    });

    emitQueueUpdate(
      req,
      "TOKEN_CREATED",
      token
    );

    return res.status(201).json({
      token,
    });
  } catch (error) {
    console.error("CREATE TOKEN ERROR:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


// =====================================================
// GET TODAY'S TOKENS
// =====================================================

exports.today = async (req, res) => {
  try {
    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const tokens = await Token.find({
      hospitalId: req.user.hospitalId,
      businessDate: today,
    })
      .populate(
        "doctorId",
        "doctorName specialization"
      )
      .sort({
        tokenNumber: 1,
      });

    return res.json({
      tokens,
    });
  } catch (error) {
    console.error("TODAY TOKENS ERROR:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


// =====================================================
// GET DOCTORS
// =====================================================

exports.doctors = async (req, res) => {
  try {

    console.log("req.user.hospitalId",req.user.hospitalId)
    const doctors = await Doctor.find({
      hospitalId: req.user.hospitalId,
      status: {
        $ne: "offline",
      },
    }).sort({
      doctorName: 1,
    });
console.log("doctors",doctors)
    return res.json({
      doctors,
    });
  } catch (error) {
    console.error("GET DOCTORS ERROR:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


// =====================================================
// CREATE DOCTOR
// =====================================================

exports.createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create({
      ...req.body,
      hospitalId: req.user.hospitalId,
    });

    return res.status(201).json({
      doctor,
    });
  } catch (error) {
    console.error("CREATE DOCTOR ERROR:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


// =====================================================
// GET QUEUE
// =====================================================

exports.queue = async (req, res) => {
  try {
    const { doctorId } = req.query;

    const doctor = await Doctor.findOne({
      _id: doctorId,
      hospitalId: req.user.hospitalId,
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    const queue = await qs.getQueue({
      ...req.query,
      hospitalId: req.user.hospitalId,
    });

    return res.json({
      queue,
    });
  } catch (error) {
    console.error("GET QUEUE ERROR:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


// =====================================================
// GET TODAY'S ONLINE APPOINTMENTS
// =====================================================

exports.appointmentsToday = async (req, res) => {
  try {
    const hospitalId = req.user.hospitalId;

    if (!hospitalId) {
      return res.status(400).json({
        message: "Hospital ID is missing",
      });
    }
console.log("hospitalId",hospitalId)
    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const appointments = await Appointment.find({
      hospitalId,
    //   date: today,
      status: "booked",
    })
      .populate(
        "doctorId",
        "doctorName specialization"
      )
      .sort({
        startTime: 1,
      });

    return res.status(200).json({
      appointments,
    });
  } catch (error) {
    console.error(
      "GET TODAY APPOINTMENTS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to get today's appointments",
    });
  }
};


// =====================================================
// CHECK-IN ONLINE APPOINTMENT
// =====================================================

exports.checkInAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    // -----------------------------------------------
    // Validate appointment ID
    // -----------------------------------------------

    if (!appointmentId) {
      return res.status(400).json({
        message: "appointmentId is required",
      });
    }

    // -----------------------------------------------
    // Find appointment belonging to this hospital
    // -----------------------------------------------

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      hospitalId: req.user.hospitalId,
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    // -----------------------------------------------
    // Make sure appointment is still booked
    // -----------------------------------------------

    if (
      appointment.status &&
      appointment.status !== "booked"
    ) {
      return res.status(400).json({
        message:
          `Appointment is already ${appointment.status}`,
      });
    }

    // -----------------------------------------------
    // Prevent duplicate check-in
    // -----------------------------------------------

    const existingToken = await Token.findOne({
      appointmentId: appointment._id,
    });

    if (existingToken) {
      return res.status(400).json({
        message:
          "This appointment is already checked in",
        token: existingToken,
      });
    }

    // -----------------------------------------------
    // Create token using existing queue service
    // -----------------------------------------------

    const token = await qs.createToken({
      hospitalId: req.user.hospitalId,

      doctorId: appointment.doctorId,

      appointmentId: appointment._id,

      patientName: appointment.patientName,

      phoneNumber: appointment.phoneNumber,

      reason: appointment.reason,

      source: "online",
    });

    // -----------------------------------------------
    // Update appointment status
    // -----------------------------------------------

    appointment.status = "checked_in";

    await appointment.save();

    // -----------------------------------------------
    // Emit real-time update
    // -----------------------------------------------

    emitQueueUpdate(
      req,
      "TOKEN_CREATED",
      token
    );

    // -----------------------------------------------
    // Response
    // -----------------------------------------------

    return res.status(201).json({
      message:
        "Appointment checked in successfully",
      token,
    });

  } catch (error) {
    console.error(
      "CHECK-IN APPOINTMENT ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message,
    });
  }
};


// =====================================================
// CALL NEXT PATIENT
// =====================================================

exports.callNext = async (req, res) => {
  try {
    const { doctorId } = req.body;

    const doctor = await Doctor.findOne({
      _id: doctorId,
      hospitalId: req.user.hospitalId,
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    const token = await qs.callNext({
      ...req.body,
      hospitalId: req.user.hospitalId,
    });

    emitQueueUpdate(
      req,
      "PATIENT_CALLED",
      token
    );

    return res.json({
      token,
    });
  } catch (error) {
    console.error("CALL NEXT ERROR:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


// =====================================================
// START CONSULTATION
// =====================================================

exports.start = async (req, res) => {
  try {
    const token = await qs.start(
      req.body.doctorId
    );

    emitQueueUpdate(
      req,
      "CONSULTATION_STARTED",
      token
    );

    return res.json({
      token,
    });
  } catch (error) {
    console.error(
      "START CONSULTATION ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message,
    });
  }
};


// =====================================================
// COMPLETE CONSULTATION
// =====================================================

exports.complete = async (req, res) => {
  try {
    const token = await qs.complete(
      req.body.doctorId
    );

    emitQueueUpdate(
      req,
      "CONSULTATION_COMPLETED",
      token
    );

    return res.json({
      token,
    });
  } catch (error) {
    console.error(
      "COMPLETE CONSULTATION ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message,
    });
  }
};


// =====================================================
// SKIP PATIENT
// =====================================================

exports.skip = async (req, res) => {
  try {
    const token = await qs.skip(
      req.body.doctorId
    );

    emitQueueUpdate(
      req,
      "PATIENT_SKIPPED",
      token
    );

    return res.json({
      token,
    });
  } catch (error) {
    console.error(
      "SKIP PATIENT ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message,
    });
  }
};


// =====================================================
// DOCTOR BREAK
// =====================================================

exports.break = async (req, res) => {
  try {
    const doctor = await qs.setBreak(
      req.body.doctorId,
      true
    );

    emitQueueUpdate(
      req,
      "DOCTOR_BREAK",
      doctor
    );

    return res.json({
      doctor,
    });
  } catch (error) {
    console.error(
      "DOCTOR BREAK ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message,
    });
  }
};


// =====================================================
// DOCTOR RESUME
// =====================================================

exports.resume = async (req, res) => {
  try {
    const doctor = await qs.setBreak(
      req.body.doctorId,
      false
    );

    emitQueueUpdate(
      req,
      "DOCTOR_RESUMED",
      doctor
    );

    return res.json({
      doctor,
    });
  } catch (error) {
    console.error(
      "DOCTOR RESUME ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message,
    });
  }
};