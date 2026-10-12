const crypto = require("crypto");

process.env.RAZORPAY_KEY_SECRET = "test_secret_for_unit_tests";

const { isValidRazorpaySignature } = require("../controllers/bookingController");

describe("isValidRazorpaySignature", () => {
  const orderId = "order_ABC123";
  const paymentId = "pay_XYZ789";

  const makeValidSignature = (order, payment) => {
    return crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${order}|${payment}`)
      .digest("hex");
  };

  it("accepts a correctly-signed payment", () => {
    const signature = makeValidSignature(orderId, paymentId);
    expect(isValidRazorpaySignature(orderId, paymentId, signature)).toBe(true);
  });

  it("rejects a tampered signature", () => {
    const signature = makeValidSignature(orderId, paymentId);
    const tampered = signature.slice(0, -1) + (signature.slice(-1) === "a" ? "b" : "a");
    expect(isValidRazorpaySignature(orderId, paymentId, tampered)).toBe(false);
  });

  it("rejects a signature generated for a different order/payment id", () => {
    const signature = makeValidSignature(orderId, paymentId);
    // Same signature, but claiming to belong to a different order id -
    // simulates someone replaying an old payment's signature on a new booking
    expect(isValidRazorpaySignature("order_DIFFERENT", paymentId, signature)).toBe(false);
  });
});
