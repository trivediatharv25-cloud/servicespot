import { useState } from "react";
import { Star } from "lucide-react";
import api from "../api/axios";

const RatingModal = ({ booking, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a star rating");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/reviews", { bookingId: booking._id, rating, comment });
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink-950/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm border border-ink-100">
        <h3 className="font-serif font-medium text-lg text-ink-900 mb-1">Rate your experience</h3>
        <p className="text-sm text-ink-500 mb-4">{booking.service?.title} with {booking.provider?.name}</p>

        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              <Star
                size={26}
                className={(hoverRating || rating) >= star ? "fill-brass-400 text-brass-400" : "text-ink-100"}
              />
            </button>
          ))}
        </div>

        <textarea
          placeholder="Optional comment..."
          className="border border-ink-100 rounded-md px-3 py-2 w-full text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brass-400"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {error && <p className="text-red-600 text-xs mb-2">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-ink-200 rounded-full py-2 text-sm text-ink-700 hover:border-ink-400 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-ink-900 text-white rounded-full py-2 text-sm disabled:opacity-50 hover:bg-ink-800 transition-colors"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
