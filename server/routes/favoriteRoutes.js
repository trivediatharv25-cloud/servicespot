const express = require("express");
const { toggleFavorite, getMyFavorites } = require("../controllers/favoriteController");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/toggle", protect, requireRole("user"), toggleFavorite);
router.get("/mine", protect, requireRole("user"), getMyFavorites);

module.exports = router;
