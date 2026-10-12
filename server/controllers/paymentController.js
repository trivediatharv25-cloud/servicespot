const Razorpay = require("razorpay");
const Service = require("../models/Service");

// Only construct the Razorpay client if keys are present - this lets the app
// still run (for free services / local dev) even before you've added your
// own test keys from the Razorpay dashboard.
const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

// @route POST /api/payments/order  (user only)
// Called right before opening the Razorpay checkout modal on the frontend.
const createOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({ message: "Payments are not configured on this server yet (missing Razorpay keys)" });
    }

    const { serviceId } = req.body;
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    if (service.price <= 0) {
      return res.status(400).json({ message: "This service is free - no payment needed" });
    }

    // Razorpay works in the smallest currency unit (paise for INR), so ₹500 = 50000
    const amountInPaise = Math.round(service.price * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `servicespot_${Date.now()}`,
    });

    res.json({ order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createOrder, razorpay };
