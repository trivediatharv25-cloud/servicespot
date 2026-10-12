const express = require("express");
const { createReview, getServiceReviews } = require("../controllers/reviewController");
const { protect, requireRole } = require("../middleware/auth");
const { validate, createReviewRules } = require("../middleware/validators");

const router = express.Router();

router.post("/", protect, requireRole("user"), createReviewRules, validate, createReview);
router.get("/service/:serviceId", getServiceReviews);

module.exports = router;
