import { formatTime } from "../utils/format";

// A selectable time pill. Booking happens from the confirm card in
// BrowseServices, so a stray tap never books anything by accident.
const SlotCard = ({ slot, selected, disabled, onSelect }) => (
  <button
    type="button"
    disabled={disabled}
    aria-pressed={selected}
    onClick={() => onSelect(slot._id)}
    className={`px-3.5 py-2 rounded-full text-sm border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      selected
        ? "bg-ink-900 border-ink-900 text-paper"
        : "bg-white border-ink-100 text-ink-700 hover:border-brass-500"
    }`}
  >
    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
  </button>
);

export default SlotCard;
