const express = require("express");
const {
  createBooking,
  getMyBookings,
  getProviderBookings,
  cancelBooking,
} = require("../controllers/bookingController");
const { protect, requireRole } = require("../middleware/auth");
const { bookingLimiter } = require("../middleware/rateLimiters");
const { validate, createBookingRules } = require("../middleware/validators");

const router = express.Router();

router.post("/", protect, requireRole("user"), bookingLimiter, createBookingRules, validate, createBooking);
router.get("/mine", protect, requireRole("user"), getMyBookings);
router.get("/provider", protect, requireRole("provider"), getProviderBookings);
router.patch("/:id/cancel", protect, cancelBooking);

module.exports = router;
