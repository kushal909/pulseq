const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },

    tokenNumber: {
      type: Number,
      required: true,
    },

    patientName: {
      type: String,
      required: true,
    },

    phoneNumber: String,

    reason: String,

    source: {
      type: String,
      enum: ["walk_in", "online"],
      default: "walk_in",
    },

    status: {
      type: String,
      enum: [
        "waiting",
        "called",
        "in_consultation",
        "completed",
        "skipped",
        "no_show",
      ],
      default: "waiting",
    },

    businessDate: {
      type: String,
      required: true,
    },

    calledAt: Date,
    startedAt: Date,
    completedAt: Date,
    skippedAt: Date,
  },
  {
    timestamps: true,
  }
);

schema.index({
  hospitalId: 1,
  businessDate: 1,
  tokenNumber: 1,
});

schema.index({
  doctorId: 1,
  businessDate: 1,
  status: 1,
  tokenNumber: 1,
});

module.exports = mongoose.model("Token", schema);