const bcrypt = require("bcryptjs");

const Doctor = require("../models/Doctor");
const User = require("../models/User");

// GET DOCTORS
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({
      hospitalId: req.user.hospitalId,
    }).populate(
      "userId",
      "name email"
    );

    res.json({
      doctors,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// CREATE DOCTOR
exports.createDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      specialization,
    } = req.body;

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "doctor",
      hospitalId: req.user.hospitalId,
    });

    const doctor = await Doctor.create({
      hospitalId: req.user.hospitalId,
      userId: user._id,
      doctorName: name,
      specialization,
    });

    res.status(201).json({
      doctor,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};