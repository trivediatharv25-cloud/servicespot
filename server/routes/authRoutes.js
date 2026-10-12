const express = require("express");
const { register, login, getMe, updateMe } = require("../controllers/authController");
const { authLimiter } = require("../middleware/rateLimiters");
const { protect } = require("../middleware/auth");
const { validate, registerRules, loginRules, updateProfileRules } = require("../middleware/validators");

const router = express.Router();

router.post("/register", authLimiter, registerRules, validate, register);
router.post("/login", authLimiter, loginRules, validate, login);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateProfileRules, validate, updateMe);

module.exports = router;
