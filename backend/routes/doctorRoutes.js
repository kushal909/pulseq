const r = require("express").Router();

const c = require("../controllers/doctorController");

const {
  protect,
  authorize,
} = require("../middleware/auth");

r.use(protect);

// Get doctors
r.get(
  "/",
  c.getDoctors
);

// Create doctor
r.post(
  "/",
  authorize("admin"),
  c.createDoctor
);

module.exports = r;