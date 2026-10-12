import { Star } from "lucide-react";

const ReviewsList = ({ reviews, avgRating, count }) => {
  return (
    <div className="bg-white rounded-md border border-ink-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif font-medium text-ink-900">Reviews</h3>
        {count > 0 && (
          <span className="text-sm text-brass-600 font-medium flex items-center gap-1">
            <Star size={13} className="fill-brass-500 text-brass-500" /> {avgRating} · {count} review{count > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-ink-500">No reviews yet - be the first to book and rate!</p>
      ) : (
        <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
          {reviews.map((r) => (
            <div key={r._id} className="border-b border-ink-100 pb-2 last:border-b-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink-900">{r.user?.name || "Anonymous"}</p>
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      className={i < r.rating ? "fill-brass-400 text-brass-400" : "text-ink-100"}
                    />
                  ))}
                </span>
              </div>
              {r.comment && <p className="text-sm text-ink-500 mt-0.5">{r.comment}</p>}
              <p className="text-xs text-ink-300 mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
