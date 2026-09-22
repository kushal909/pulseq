const r = require("express").Router();

const c = require("../controllers/hospitalcontroller");

const {
  protect,
} = require("../middleware/auth");

r.use(protect);

r.get(
  "/me",
  c.getHospital
);

module.exports = r;