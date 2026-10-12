const crypto = require("crypto");
const Slot = require("../models/Slot");
const Service = require("../models/Service");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");

// Verifies a Razorpay payment signature server-side. Never trust the frontend's
// word that "payment succeeded" - Razorpay signs the order+payment ids with
// your secret key, and only someone holding that secret (i.e. our server)
// can reproduce the same signature. If it doesn't match, the payment details
// were forged or tampered with.
const isValidRazorpaySignature = (orderId, paymentId, signature) => {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expected === signature;
};

// @route POST /api/bookings  (user only)
// This is the most important piece of the whole project: preventing double-booking
// when two users try to grab the same slot at (almost) the same time.
const createBooking = async (req, res) => {
  try {
    const { slotId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // findOneAndUpdate is ATOMIC at the database level. Instead of doing
    // "read the slot -> check if available -> then update it" (which has a
    // race condition window between the read and the write), we do the
    // check-and-update in a single query. Only ONE concurrent request can
    // match { status: "available" } and flip it to "booked" - every other
    // request that arrives a millisecond later will simply get null back
    // because the status has already changed.
    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, status: "available" },
      { status: "booked", bookedBy: req.user._id },
      { new: true }
    );

    if (!slot) {
      return res.status(409).json({ message: "This slot was just booked by someone else. Please pick another." });
    }

    const service = await Service.findById(slot.service);

    // If the service isn't free, a valid, verified Razorpay payment is required.
    // This check happens on the server, not just the frontend, so a user can't
    // skip payment by calling this API directly.
    if (service && service.price > 0) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        // Roll back the slot claim since payment info is missing
        await Slot.findByIdAndUpdate(slot._id, { status: "available", bookedBy: null });
        return res.status(402).json({ message: "Payment is required for this service" });
      }
      const valid = isValidRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!valid) {
        await Slot.findByIdAndUpdate(slot._id, { status: "available", bookedBy: null });
        return res.status(400).json({ message: "Payment verification failed" });
      }
    }

    const booking = await Booking.create({
      slot: slot._id,
      service: slot.service,
      provider: slot.provider,
      user: req.user._id,
      amountPaid: service ? service.price : 0,
      razorpayOrderId: razorpay_order_id || null,
      razorpayPaymentId: razorpay_payment_id || null,
    });

    const populatedBooking = await booking.populate([
      { path: "service", select: "title" },
      { path: "user", select: "name email" },
    ]);

    // Persist a notification for the provider so it survives even if they're offline
    const notification = await Notification.create({
      user: slot.provider,
      message: `New booking from ${req.user.name} for "${populatedBooking.service.title}"`,
    });

    const io = req.app.get("io");

    // 1. Tell everyone currently browsing this slot that it's gone - removes
    //    it from other users' screens instantly, without a page refresh.
    io.emit("slot:booked", { slotId: slot._id });

    // 2. Push a real-time notification straight to the provider, if they're
    //    online right now (room pattern - see socket.js). Include the DB _id
    //    so the client can track its read state consistently with GET /notifications.
    io.to(`user:${slot.provider}`).emit("notification:new", {
      _id: notification._id,
      message: notification.message,
      read: false,
      createdAt: notification.createdAt,
      booking: populatedBooking,
    });

    res.status(201).json(populatedBooking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/bookings/mine (user only) - bookings the logged-in user made
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("service", "title price")
      .populate("provider", "name email")
      .populate("slot")
      .sort("-createdAt");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/bookings/provider (provider only) - bookings received
const getProviderBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ provider: req.user._id })
      .populate("service", "title price")
      .populate("user", "name email")
      .populate("slot")
      .sort("-createdAt");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PATCH /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("slot");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Only the user who made it or the provider who owns it can cancel
    const isOwner = booking.user.toString() === req.user._id.toString();
    const isProvider = booking.provider.toString() === req.user._id.toString();
    if (!isOwner && !isProvider) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    // Cancellation policy: a USER can only cancel up to 2 hours before the
    // slot starts - keeps last-minute no-shows in check, similar to real
    // booking platforms. The provider isn't bound by this (they may need to
    // cancel on short notice for their own reasons).
    const CANCELLATION_WINDOW_HOURS = 2;
    if (isOwner && booking.slot) {
      const hoursUntilStart = (new Date(booking.slot.startTime) - new Date()) / (1000 * 60 * 60);
      if (hoursUntilStart < CANCELLATION_WINDOW_HOURS) {
        return res.status(400).json({
          message: `Bookings can only be cancelled at least ${CANCELLATION_WINDOW_HOURS} hours before the slot starts`,
        });
      }
    }

    booking.status = "cancelled";
    await booking.save();

    // Re-open the slot so someone else can book it
    await Slot.findByIdAndUpdate(booking.slot._id, { status: "available", bookedBy: null });

    const io = req.app.get("io");
    io.emit("slot:reopened", { slotId: booking.slot._id });

    res.json({ message: "Booking cancelled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getProviderBookings,
  cancelBooking,
  isValidRazorpaySignature,
};
