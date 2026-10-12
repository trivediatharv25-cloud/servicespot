import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

// Full-screen photo viewer for a service's photos. `photos` is an array of
// image URLs, `startIndex` is which one to open on, `onClose` closes it.
const PhotoLightbox = ({ photos, index, setIndex, onClose }) => {
  const total = photos.length;

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total);
  }, [setIndex, total]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % total);
  }, [setIndex, total]);

  // Keyboard support - Escape to close, arrow keys to move between photos
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goPrev, goNext]);

  if (total === 0) return null;
  const current = photos[index];

  return (
    <div
      className="fixed inset-0 bg-ink-950/90 z-[60] flex flex-col items-center justify-center px-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-5 right-5 text-white/80 hover:text-white transition-colors"
      >
        <X size={28} strokeWidth={1.75} />
      </button>

      {total > 1 && (
        <span className="absolute top-6 left-6 text-sm text-white/70">
          {index + 1} / {total}
        </span>
      )}

      {total > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label="Previous photo"
          className="absolute left-3 sm:left-6 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
        >
          <ChevronLeft size={22} strokeWidth={1.75} />
        </button>
      )}

      <img
        src={current}
        alt={`Photo ${index + 1} of ${total}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[78vh] max-w-full object-contain rounded-md"
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />

      {total > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          aria-label="Next photo"
          className="absolute right-3 sm:right-6 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
        >
          <ChevronRight size={22} strokeWidth={1.75} />
        </button>
      )}

      {total > 1 && (
        <div
          className="flex gap-2 mt-5 overflow-x-auto max-w-full px-4"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((url, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-14 h-14 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                i === index ? "border-brass-400" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoLightbox;
