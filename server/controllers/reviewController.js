const mongoose = require("mongoose");
const Review = require("../models/Review");
const Booking = require("../models/Booking");

// @route POST /api/reviews  (user only) - review a booking you made
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only review your own bookings" });
    }
    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: "Only confirmed bookings can be reviewed" });
    }
    if (booking.reviewed) {
      return res.status(400).json({ message: "You've already reviewed this booking" });
    }

    const review = await Review.create({
      booking: booking._id,
      provider: booking.provider,
      user: req.user._id,
      service: booking.service,
      rating,
      comment: comment || "",
    });

    booking.reviewed = true;
    await booking.save();

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/reviews/service/:serviceId - public, used to show rating on Browse page (per-service)
const getServiceReviews = async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const reviews = await Review.find({ service: serviceId })
      .populate("user", "name")
      .sort("-createdAt");

    const avgRating =
      reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    res.json({ reviews, avgRating: Math.round(avgRating * 10) / 10, count: reviews.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Used internally by serviceController to attach ratings to the Browse page listing.
// Ratings are scoped per SERVICE, not per provider - a provider offering both
// "Hair Spa" and "Music Lessons" should not have one service's rating bleed
// into the other's.
const getAverageRatingsForServices = async (serviceIds) => {
  const objectIds = serviceIds.map((id) => new mongoose.Types.ObjectId(id));
  const results = await Review.aggregate([
    { $match: { service: { $in: objectIds } } },
    { $group: { _id: "$service", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const map = {};
  results.forEach((r) => {
    map[r._id.toString()] = { avgRating: Math.round(r.avgRating * 10) / 10, count: r.count };
  });
  return map;
};

module.exports = { createReview, getServiceReviews, getAverageRatingsForServices };
