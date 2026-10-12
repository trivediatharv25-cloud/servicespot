const express = require("express");
const { createService, getServices, getMyServices } = require("../controllers/serviceController");
const { protect, requireRole } = require("../middleware/auth");
const { validate, createServiceRules } = require("../middleware/validators");

const router = express.Router();

router.get("/", getServices);
router.get("/mine", protect, requireRole("provider"), getMyServices);
router.post("/", protect, requireRole("provider"), createServiceRules, validate, createService);

module.exports = router;
