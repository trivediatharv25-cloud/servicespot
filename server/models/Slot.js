const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ["available", "booked", "cancelled"], default: "available" },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Prevent a provider from creating two slots that overlap for the same service
slotSchema.index({ provider: 1, startTime: 1 });

module.exports = mongoose.model("Slot", slotSchema);
