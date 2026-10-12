import { useEffect } from "react";
import { Heart, X } from "lucide-react";

export const PRICE_OPTIONS = [
  { id: "any", label: "Any price", test: () => true },
  { id: "free", label: "Free", test: (p) => p <= 0 },
  { id: "u500", label: "Under ₹500", test: (p) => p > 0 && p < 500 },
  { id: "mid", label: "₹500 – ₹1,500", test: (p) => p >= 500 && p <= 1500 },
  { id: "high", label: "Above ₹1,500", test: (p) => p > 1500 },
];

export const RATING_OPTIONS = [
  { v: 0, label: "Any rating" },
  { v: 3, label: "3★ & up" },
  { v: 4, label: "4★ & up" },
  { v: 4.5, label: "4.5★ & up" },
];

const Chip = ({ active, onClick, children }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1.5 ${
      active
        ? "bg-ink-900 border-ink-900 text-paper"
        : "bg-white border-ink-100 text-ink-600 hover:border-ink-300"
    }`}
  >
    {children}
  </button>
);

const Group = ({ title, children }) => (
  <fieldset>
    <legend className="text-sm font-medium text-ink-900 mb-2">{title}</legend>
    <div className="flex flex-wrap gap-2">{children}</div>
  </fieldset>
);

// The filter controls themselves - rendered in the desktop sidebar and inside
// the mobile bottom sheet so both stay in sync.
export const FilterPanel = ({
  userRole,
  price,
  setPrice,
  minRating,
  setMinRating,
  showFavoritesOnly,
  setShowFavoritesOnly,
  listingFilter,
  setListingFilter,
  activeCount,
  onReset,
}) => (
  <div className="flex flex-col gap-6">
    {userRole === "provider" && (
      <Group title="Listings">
        <Chip active={listingFilter === "all"} onClick={() => setListingFilter("all")}>All listings</Chip>
        <Chip active={listingFilter === "mine"} onClick={() => setListingFilter("mine")}>My listings</Chip>
      </Group>
    )}
    {userRole === "user" && (
      <Group title="Saved">
        <Chip active={showFavoritesOnly} onClick={() => setShowFavoritesOnly((v) => !v)}>
          <Heart size={13} className={showFavoritesOnly ? "fill-brass-400 text-brass-400" : ""} />
          Favorites only
        </Chip>
      </Group>
    )}
    <Group title="Price">
      {PRICE_OPTIONS.map((o) => (
        <Chip key={o.id} active={price === o.id} onClick={() => setPrice(o.id)}>
          {o.label}
        </Chip>
      ))}
    </Group>
    <Group title="Rating">
      {RATING_OPTIONS.map((o) => (
        <Chip key={o.v} active={minRating === o.v} onClick={() => setMinRating(o.v)}>
          {o.label}
        </Chip>
      ))}
    </Group>
    {activeCount > 0 && (
      <button
        type="button"
        onClick={onReset}
        className="self-start text-sm text-brass-700 hover:underline underline-offset-2"
      >
        Clear all filters
      </button>
    )}
  </div>
);

// Mobile bottom sheet wrapper
export const FilterSheet = ({ open, onClose, resultCount, children }) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
      <div className="absolute inset-0 bg-ink-950/50" onClick={onClose} />
      <div className="sheet-up absolute bottom-0 inset-x-0 bg-paper rounded-t-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-ink-100">
          <h2 className="font-serif font-semibold text-lg text-ink-900">Filters</h2>
          <button onClick={onClose} className="p-1.5 -mr-1.5 text-ink-500" aria-label="Close filters">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        <div className="px-5 pt-3 border-t border-ink-100 pb-safe">
          <button
            onClick={onClose}
            className="w-full bg-ink-900 text-paper rounded-full py-3 font-medium"
          >
            Show {resultCount} {resultCount === 1 ? "service" : "services"}
          </button>
        </div>
      </div>
    </div>
  );
};
