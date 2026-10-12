const Notification = require("../models/Notification");

// @route GET /api/notifications - load past notifications on page load
// (the socket only handles NEW ones that arrive while the tab is open)
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort("-createdAt").limit(30);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PATCH /api/notifications/read-all
// Called when the user opens the notification bell - clears the unread
// badge by flipping every unread notification for this user to read.
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
