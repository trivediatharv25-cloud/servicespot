const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
  },
  { timestamps: true }
);

// A user can only favorite the same service once
favoriteSchema.index({ user: 1, service: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
