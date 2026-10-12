const express = require("express");
const { createSlot, getAvailableSlots, getMySlots } = require("../controllers/slotController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/service/:serviceId", getAvailableSlots);
router.get("/mine", protect, requireRole("provider"), getMySlots);
router.post("/", protect, requireRole("provider"), createSlot);

module.exports = router;
