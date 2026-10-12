const express = require("express");
const { createOrder } = require("../controllers/paymentController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/order", protect, requireRole("user"), createOrder);

module.exports = router;
