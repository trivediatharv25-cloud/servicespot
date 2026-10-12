import { Link } from "react-router-dom";

const TONES = {
  ink: "bg-ink-50 text-ink-700",
  brass: "bg-brass-50 text-brass-700",
  sage: "bg-sage-100 text-sage-600",
  rose: "bg-rose-50 text-rose-600",
};

export const StatCard = ({ icon: Icon, label, value, hint, tone = "ink" }) => (
  <div className="bg-white border border-ink-100 rounded-lg p-4 flex items-start gap-3 min-w-0">
    <span className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${TONES[tone]}`}>
      <Icon size={17} strokeWidth={1.75} />
    </span>
    <div className="min-w-0">
      <p className="font-serif text-2xl font-semibold text-ink-900 leading-none truncate">{value}</p>
      <p className="text-xs text-ink-500 mt-1.5">{label}</p>
      {hint && <p className="text-[11px] text-ink-400 mt-0.5 truncate">{hint}</p>}
    </div>
  </div>
);

// Segmented tabs: [{ id, label, count? }]
export const Tabs = ({ tabs, value, onChange, label }) => (
  <div
    role="tablist"
    aria-label={label}
    className="flex gap-1 overflow-x-auto no-scrollbar bg-paper-200 p-1 rounded-full max-w-full w-fit"
  >
    {tabs.map((t) => {
      const active = t.id === value;
      return (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={active}
          onClick={() => onChange(t.id)}
          className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap flex items-center gap-1.5 transition-colors ${
            active ? "bg-ink-900 text-paper" : "text-ink-600 hover:text-ink-900"
          }`}
        >
          {t.label}
          {t.count != null && (
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full leading-none ${
                active ? "bg-white/15 text-paper" : "bg-white text-ink-500"
              }`}
            >
              {t.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

// action: { label, to?, onClick? }
export const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className="text-center py-14 px-6 bg-white rounded-lg border border-ink-100">
    <Icon size={28} className="mx-auto mb-3 text-ink-200" strokeWidth={1.5} />
    <p className="font-medium text-ink-900">{title}</p>
    {text && <p className="text-sm text-ink-500 mt-1 max-w-xs mx-auto">{text}</p>}
    {action &&
      (action.to ? (
        <Link
          to={action.to}
          className="inline-block mt-4 bg-ink-900 hover:bg-ink-800 transition-colors text-paper text-sm font-medium rounded-full px-5 py-2"
        >
          {action.label}
        </Link>
      ) : (
        <button
          onClick={action.onClick}
          className="mt-4 bg-ink-900 hover:bg-ink-800 transition-colors text-paper text-sm font-medium rounded-full px-5 py-2"
        >
          {action.label}
        </button>
      ))}
  </div>
);

// Calendar-style date tile used in booking lists
export const DateBlock = ({ date, muted }) => {
  if (!date) {
    return <div className="w-12 h-14 flex-shrink-0 rounded-md bg-paper-200" aria-hidden="true" />;
  }
  const d = new Date(date);
  return (
    <div
      className={`w-12 flex-shrink-0 rounded-md text-center py-1.5 ${
        muted ? "bg-paper-200 text-ink-500" : "bg-ink-900 text-paper"
      }`}
    >
      <p className="text-lg font-serif font-semibold leading-none">{d.getDate()}</p>
      <p className="text-[11px] mt-1 opacity-80">{d.toLocaleDateString("en-IN", { month: "short" })}</p>
    </div>
  );
};

export const StatusBadge = ({ status }) => (
  <span
    className={`text-xs px-2 py-0.5 rounded-full inline-block ${
      status === "confirmed" ? "bg-sage-100 text-sage-600" : "bg-red-100 text-red-700"
    }`}
  >
    {status}
  </span>
);

export const ServiceCardSkeleton = () => (
  <div className="bg-white rounded-md border border-ink-100 overflow-hidden" aria-hidden="true">
    <div className="skeleton h-36" />
    <div className="p-3.5 flex flex-col gap-2">
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
      <div className="flex justify-between pt-2 mt-1 border-t border-ink-100">
        <div className="skeleton h-4 w-12 rounded" />
        <div className="skeleton h-4 w-16 rounded" />
      </div>
    </div>
  </div>
);

export const RowSkeleton = () => (
  <div className="bg-white border border-ink-100 rounded-lg p-4 flex gap-3" aria-hidden="true">
    <div className="skeleton w-12 h-14 rounded-md" />
    <div className="flex-1 flex flex-col gap-2 pt-1">
      <div className="skeleton h-4 w-1/2 rounded" />
      <div className="skeleton h-3 w-1/3 rounded" />
      <div className="skeleton h-3 w-2/5 rounded" />
    </div>
  </div>
);
