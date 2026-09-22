const r = require("express").Router();

const c = require("../controllers/queueController");

const {
  protect,
  authorize,
} = require("../middleware/auth");

r.use(protect);

// ================================
// QUEUE GET ROUTES
// ================================

r.get(
  "/today",
  c.today
);

r.get(
  "/queue",
  c.queue
);

// ================================
// ONLINE APPOINTMENT ROUTES
// ================================

// Get today's online appointments
r.get(
  "/appointments/today",
  authorize("admin", "receptionist"),
  c.appointmentsToday
);

// Check-in online appointment and create token
r.post(
  "/appointments/check-in",
  authorize("admin", "receptionist"),
  c.checkInAppointment
);

// ================================
// TOKEN ROUTES
// ================================

r.post(
  "/tokens",
  authorize("admin", "receptionist"),
  c.createToken
);

// ================================
// QUEUE ACTIONS
// ================================
r.get(
  "/doctors",
  authorize("admin", "receptionist","doctor"),
  c.doctors
);
r.post(
  "/call-next",
  authorize("admin", "doctor"),
  c.callNext
);

r.post(
  "/start",
  authorize("admin", "doctor"),
  c.start
);

r.post(
  "/complete",
  authorize("admin", "doctor"),
  c.complete
);

r.post(
  "/skip",
  authorize("admin", "doctor"),
  c.skip
);

r.post(
  "/break",
  authorize("admin", "doctor"),
  c.break
);

r.post(
  "/resume",
  authorize("admin", "doctor"),
  c.resume
);

module.exports = r;