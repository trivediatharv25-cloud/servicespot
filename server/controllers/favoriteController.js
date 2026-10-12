const Favorite = require("../models/Favorite");

// @route POST /api/favorites/toggle  (user only) - adds if not favorited, removes if already favorited
const toggleFavorite = async (req, res) => {
  try {
    const { serviceId } = req.body;
    if (!serviceId) return res.status(400).json({ message: "serviceId is required" });

    const existing = await Favorite.findOne({ user: req.user._id, service: serviceId });

    if (existing) {
      await existing.deleteOne();
      return res.json({ favorited: false });
    }

    await Favorite.create({ user: req.user._id, service: serviceId });
    res.json({ favorited: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/favorites/mine  (user only) - list of favorited service ids + populated services
const getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).populate({
      path: "service",
      populate: { path: "provider", select: "name email phone location" },
    });

    // Drop any favorite whose service was deleted since being saved
    const valid = favorites.filter((f) => f.service);
    res.json(valid.map((f) => f.service));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { toggleFavorite, getMyFavorites };
