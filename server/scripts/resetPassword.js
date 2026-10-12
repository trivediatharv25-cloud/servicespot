// One-off utility: reset a user's password directly in the database.
// Run from the server/ folder:  node scripts/resetPassword.js <email> <newPassword>
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error("Usage: node scripts/resetPassword.js <email> <newPassword>");
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    // Setting .password and calling .save() triggers the pre-save hook
    // in models/User.js, which hashes it with bcrypt automatically.
    user.password = newPassword;
    await user.save();

    console.log(`Password reset for ${user.email} (role: ${user.role}).`);
    console.log(`New password: ${newPassword}`);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
