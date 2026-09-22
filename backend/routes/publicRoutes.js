const express = require("express");

const router = express.Router();

const c = require("../controllers/publicController");

// =========================
// HOSPITALS
// =========================

router.get(
  "/hospitals",
  c.hospitals
);


// =========================
// DOCTORS
// =========================

router.get(
  "/doctors/:hospitalId",
  c.doctors
);


// =========================
// APPOINTMENTS
// =========================

router.post(
  "/appointments",
  c.book
);


// =========================
// QUEUE
// =========================

router.get(
  "/queue/:hospitalId",
  c.queue
);


module.exports = router;