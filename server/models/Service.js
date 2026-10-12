const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    durationMinutes: { type: Number, required: true, default: 30 },
    price: { type: Number, required: true, default: 0 },
    imageUrl: { type: String, default: "" },
    galleryUrls: { type: [String], default: [] },
    address: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);
