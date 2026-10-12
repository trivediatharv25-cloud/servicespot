const Slot = require("../models/Slot");

// @route POST /api/slots  (provider only) - create one or more open slots for a service
const createSlot = async (req, res) => {
  try {
    const { serviceId, startTime, endTime } = req.body;
    const slot = await Slot.create({
      provider: req.user._id,
      service: serviceId,
      startTime,
      endTime,
    });

    // Let everyone currently browsing know a fresh slot just opened up
    const io = req.app.get("io");
    io.emit("slot:created", slot);

    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/slots/service/:serviceId - all *available* slots for a given service
const getAvailableSlots = async (req, res) => {
  try {
    const slots = await Slot.find({
      service: req.params.serviceId,
      status: "available",
      startTime: { $gte: new Date() }, // only future slots
    }).sort("startTime");
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/slots/mine (provider only) - provider's own slot calendar
const getMySlots = async (req, res) => {
  try {
    const slots = await Slot.find({ provider: req.user._id })
      .populate("service", "title")
      .populate("bookedBy", "name email")
      .sort("startTime");
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createSlot, getAvailableSlots, getMySlots };
