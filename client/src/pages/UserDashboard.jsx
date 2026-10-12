import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarX2, CheckCircle2, Clock, IndianRupee, Star } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import RatingModal from "../components/RatingModal";
import { DateBlock, EmptyState, RowSkeleton, StatCard, StatusBadge, Tabs } from "../components/ui";
import { formatDayLabel, formatINR, formatTime, hoursUntil } from "../utils/format";

const CANCELLATION_WINDOW_HOURS = 2; // mirrors the rule enforced in bookingController

const UserDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [ratingBooking, setRatingBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("upcoming");
  const [confirmId, setConfirmId] = useState(null); // booking awaiting "are you sure?"
  const [cancellingId, setCancellingId] = useState(null);

  const load = ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    api
      .get("/bookings/mine")
      .then(({ data }) => setBookings(data))
      .catch(() => setError("Couldn't load your bookings. Please refresh."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (id) => {
    setError("");
    setCancellingId(id);
    try {
      await api.patch(`/bookings/${id}/cancel`);
      setConfirmId(null);
      load({ quiet: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not cancel this booking");
    } finally {
      setCancellingId(null);
    }
  };

  const { upcoming, past, cancelled, spent } = useMemo(() => {
    const now = new Date();
    const confirmed = bookings.filter((b) => b.status === "confirmed");
    const startOf = (b) => (b.slot ? new Date(b.slot.startTime) : new Date(0));
    const isUpcoming = (b) => b.slot && new Date(b.slot.endTime) >= now;
    return {
      upcoming: confirmed.filter(isUpcoming).sort((a, b) => startOf(a) - startOf(b)),
      past: confirmed.filter((b) => !isUpcoming(b)).sort((a, b) => startOf(b) - startOf(a)),
      cancelled: bookings.filter((b) => b.status === "cancelled"),
      spent: confirmed.reduce((sum, b) => sum + (b.amountPaid || 0), 0),
    };
  }, [bookings]);

  const lists = { upcoming, past, cancelled };
  const shown = lists[tab];
  const next = upcoming[0];

  const emptyCopy = {
    upcoming: {
      title: "Nothing coming up",
      text: "Find a service and pick a time that suits you.",
      action: { label: "Browse services", to: "/browse" },
    },
    past: { title: "No past bookings yet", text: "Completed bookings show up here so you can rate them." },
    cancelled: { title: "No cancelled bookings", text: "Bookings you cancel will be listed here." },
  }[tab];

  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-paper py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-ink-900">
          {firstName ? `${firstName}'s bookings` : "My bookings"}
        </h1>
        <p className="text-sm text-ink-500 mt-1 mb-6">
          You can cancel a booking up to {CANCELLATION_WINDOW_HOURS} hours before it starts.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={CalendarCheck}
            tone="sage"
            label="Upcoming"
            value={upcoming.length}
            hint={next?.slot ? `Next: ${formatDayLabel(next.slot.startTime)}, ${formatTime(next.slot.startTime)}` : undefined}
          />
          <StatCard icon={CheckCircle2} tone="ink" label="Completed" value={past.length} />
          <StatCard icon={CalendarX2} tone="rose" label="Cancelled" value={cancelled.length} />
          <StatCard icon={IndianRupee} tone="brass" label="Total spent" value={formatINR(spent)} />
        </div>

        {error && (
          <p role="alert" className="text-red-700 text-sm mb-4 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="mb-4">
          <Tabs
            label="Booking status"
            value={tab}
            onChange={(t) => {
              setTab(t);
              setConfirmId(null);
            }}
            tabs={[
              { id: "upcoming", label: "Upcoming", count: upcoming.length },
              { id: "past", label: "Past", count: past.length },
              { id: "cancelled", label: "Cancelled", count: cancelled.length },
            ]}
          />
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState icon={tab === "cancelled" ? CalendarX2 : CalendarCheck} {...emptyCopy} />
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((b) => {
              const canCancel =
                b.status === "confirmed" && b.slot && hoursUntil(b.slot.startTime) >= CANCELLATION_WINDOW_HOURS;
              const tooLate =
                b.status === "confirmed" && b.slot && !canCancel && new Date(b.slot.startTime) > new Date();
              const confirming = confirmId === b._id;

              return (
                <li key={b._id} className="bg-white border border-ink-100 rounded-lg p-4">
                  <div className="flex gap-3">
                    <DateBlock date={b.slot?.startTime} muted={tab !== "upcoming"} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-ink-900 truncate">{b.service?.title || "Service"}</p>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-sm text-ink-500">with {b.provider?.name || "provider"}</p>
                      {b.slot && (
                        <p className="text-sm text-ink-500 flex items-center gap-1.5 mt-0.5">
                          <Clock size={13} strokeWidth={1.75} />
                          {formatDayLabel(b.slot.startTime)}, {formatTime(b.slot.startTime)} –{" "}
                          {formatTime(b.slot.endTime)}
                        </p>
                      )}
                      {b.amountPaid > 0 && (
                        <p className="text-xs text-ink-400 mt-1">Paid {formatINR(b.amountPaid)}</p>
                      )}
                    </div>
                  </div>

                  {(b.status === "confirmed" || tooLate) && (
                    <div className="mt-3 pt-3 border-t border-ink-100 flex flex-wrap items-center justify-between gap-2">
                      {confirming ? (
                        <>
                          <p className="text-sm text-ink-700">Cancel this booking?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setConfirmId(null)}
                              className="text-sm border border-ink-200 rounded-full px-4 py-1.5 text-ink-700 hover:border-ink-400 transition-colors"
                            >
                              Keep it
                            </button>
                            <button
                              onClick={() => handleCancel(b._id)}
                              disabled={cancellingId === b._id}
                              className="text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-full px-4 py-1.5 transition-colors"
                            >
                              {cancellingId === b._id ? "Cancelling…" : "Yes, cancel"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-ink-400">
                            {tooLate && "Too close to the start time to cancel"}
                          </div>
                          <div className="flex items-center gap-2">
                            {b.status === "confirmed" && !b.reviewed && (
                              <button
                                onClick={() => setRatingBooking(b)}
                                className="text-sm bg-brass-50 hover:bg-brass-100 text-brass-700 px-3.5 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                              >
                                <Star size={12} className="fill-brass-500 text-brass-500" /> Rate
                              </button>
                            )}
                            {b.reviewed && (
                              <span className="text-xs text-ink-400 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Reviewed
                              </span>
                            )}
                            {canCancel && (
                              <button
                                onClick={() => setConfirmId(b._id)}
                                className="text-sm text-red-600 hover:text-red-700 px-2 py-1.5"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {ratingBooking && (
          <RatingModal
            booking={ratingBooking}
            onClose={() => setRatingBooking(null)}
            onSubmitted={() => load({ quiet: true })}
          />
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
