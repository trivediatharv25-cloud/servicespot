const rateLimit = require("express-rate-limit");

// General limiter for all API routes - generous, just stops obvious abuse
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Stricter limiter for login/register - slows down brute-force password guessing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login/register attempts, please try again later." },
});

// Stricter limiter for booking creation - stops someone from spamming the
// booking endpoint to repeatedly try to grab slots
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many booking attempts, please slow down." },
});

module.exports = { generalLimiter, authLimiter, bookingLimiter };
