const { body, validationResult } = require("express-validator");

// Runs after a set of express-validator rules; returns a clean 400 with the
// first error message instead of letting bad data reach the controller.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["user", "provider"]).withMessage("Role must be 'user' or 'provider'"),
];

const loginRules = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const updateProfileRules = [
  body("name").optional().trim().notEmpty().withMessage("Name can't be empty"),
  body("phone").optional().trim().isLength({ max: 20 }).withMessage("Phone number looks too long"),
  body("location").optional().trim().isLength({ max: 100 }).withMessage("Location looks too long"),
];

const createServiceRules = [
  body("title").trim().notEmpty().withMessage("Service title is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be 0 or more"),
  body("durationMinutes").isInt({ min: 5 }).withMessage("Duration must be at least 5 minutes"),
];

const createBookingRules = [
  body("slotId").notEmpty().withMessage("slotId is required"),
];

const createReviewRules = [
  body("bookingId").notEmpty().withMessage("bookingId is required"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().isLength({ max: 500 }).withMessage("Comment must be under 500 characters"),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  updateProfileRules,
  createServiceRules,
  createBookingRules,
  createReviewRules,
};
