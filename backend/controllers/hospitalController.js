const Hospital = require("../models/Hospital");

exports.getHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(
      req.user.hospitalId
    );

    if (!hospital) {
      return res.status(404).json({
        message: "Hospital not found",
      });
    }

    res.json({
      hospital,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};



exports.getHospitalById = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId);

    if (!hospital) {
      return res.status(404).json({
        message: "Hospital not found",
      });
    }

    return res.status(200).json({
      hospital,
    });
  } catch (error) {
    console.error("Get hospital error:", error);

    return res.status(500).json({
      message: "Failed to get hospital",
    });
  }
};