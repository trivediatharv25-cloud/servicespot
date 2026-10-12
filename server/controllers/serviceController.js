const Service = require("../models/Service");
const { getAverageRatingsForServices } = require("./reviewController");

// @route POST /api/services  (provider only)
const createService = async (req, res) => {
  try {
    const { title, description, durationMinutes, price, imageUrl, address, galleryUrls } = req.body;
    const service = await Service.create({
      provider: req.user._id,
      title,
      description,
      durationMinutes,
      price,
      imageUrl,
      address,
      galleryUrls: Array.isArray(galleryUrls) ? galleryUrls : [],
    });
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/services  (public - browse all services, e.g. for the booking page)
const getServices = async (req, res) => {
  try {
    const services = await Service.find().populate("provider", "name email phone location");

    // If a provider account was deleted (e.g. during testing) but their old
    // services are still in the DB, populate() returns provider: null for
    // those. Filter them out instead of crashing the whole listing.
    const validServices = services.filter((s) => s.provider);

    // Attach each SERVICE's own average rating (not the provider's overall
    // rating) so a provider offering multiple services doesn't have one
    // service's reviews bleed into another's.
    const serviceIds = validServices.map((s) => s._id.toString());
    const ratingMap = await getAverageRatingsForServices(serviceIds);

    const withRatings = validServices.map((s) => {
      const obj = s.toObject();
      const rating = ratingMap[s._id.toString()];
      obj.avgRating = rating ? rating.avgRating : null;
      obj.reviewCount = rating ? rating.count : 0;
      return obj;
    });

    res.json(withRatings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/services/mine  (provider only - their own services)
const getMyServices = async (req, res) => {
  try {
    const services = await Service.find({ provider: req.user._id });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createService, getServices, getMyServices };
