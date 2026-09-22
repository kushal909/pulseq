const Hospital = require("../models/Hospital");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Token = require("../models/Token");


// =====================================================
// GET ACTIVE HOSPITALS
// =====================================================

exports.hospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({
      isActive: true,
    }).sort({
      hospitalName: 1,
    });

    return res.status(200).json({
      hospitals,
    });

  } catch (error) {
    console.error(
      "GET HOSPITALS ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to load hospitals",
    });
  }
};


// =====================================================
// GET DOCTORS BY HOSPITAL
// =====================================================

exports.doctors = async (req, res) => {
  try {
    const { hospitalId } = req.params;
console.log("req.params",req.params)
    const doctors = await Doctor.find({
      hospitalId,
      status: {
        $ne: "offline",
      },
    })
      .sort({
        doctorName: 1,
      });

      console.log("doctors--",doctors)
    return res.status(200).json({
      doctors,
    });

  } catch (error) {
    console.error(
      "GET DOCTORS ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to load doctors",
    });
  }
};


// =====================================================
// PUBLIC BOOKING
// =====================================================

exports.book = async (req, res) => {
  try {

    const {
      hospitalId,
      doctorId,
      patientName,
      phoneNumber,
      reason,
      scheduledAt,
    } = req.body;


    if (
      !hospitalId ||
      !doctorId ||
      !patientName ||
      !scheduledAt
    ) {
      return res.status(400).json({
        message:
          "hospitalId, doctorId, patientName and scheduledAt required",
      });
    }


    // Verify doctor belongs to hospital

    const doctor = await Doctor.findOne({
      _id: doctorId,
      hospitalId,
    });


    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }


    // Create appointment

    const appointment =
      await Appointment.create({

        hospitalId,

        doctorId,

        patientName,

        phoneNumber,

        reason,

        scheduledAt,

        status: "booked",

      });


    return res.status(201).json({
      appointment,
    });

  } catch (error) {

    console.error(
      "PUBLIC BOOKING ERROR:",
      error
    );

    return res.status(400).json({
      message: error.message,
    });
  }
};


// =====================================================
// PUBLIC LIVE QUEUE
// =====================================================

exports.queue = async (req, res) => {
  try {

    const {
      hospitalId,
    } = req.params;


    // -----------------------------------------------
    // Verify hospital
    // -----------------------------------------------

    const hospital =
      await Hospital.findOne({
        _id: hospitalId,
        isActive: true,
      });


    if (!hospital) {
      return res.status(404).json({
        message: "Hospital not found",
      });
    }


    // -----------------------------------------------
    // Today's business date
    // -----------------------------------------------

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);


    // -----------------------------------------------
    // Get active queue
    // -----------------------------------------------

    const tokens =
      await Token.find({

        hospitalId,

        businessDate: today,

        status: {
          $in: [
            "waiting",
            "called",
            "in_consultation",
          ],
        },

      })

        // THIS IS THE IMPORTANT PART
        .populate(
          "doctorId",
          "doctorName specialization"
        )

        .sort({
          doctorId: 1,
          tokenNumber: 1,
        });


    return res.status(200).json({
      tokens,
    });


  } catch (error) {

    console.error(
      "PUBLIC QUEUE ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to load public queue",
    });
  }
};