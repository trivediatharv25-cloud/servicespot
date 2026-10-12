import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarX2, Clock, Inbox, IndianRupee, Layers, Phone, Ticket } from "lucide-react";
import api from "../api/axios";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import ProviderCalendar from "../components/ProviderCalendar";
import { DateBlock, EmptyState, RowSkeleton, StatCard, StatusBadge, Tabs } from "../components/ui";
import { formatDayLabel, formatINR, formatTime, toLocalInput } from "../utils/format";

const EMPTY_SERVICE = {
  title: "",
  description: "",
  durationMinutes: 30,
  price: 0,
  imageUrl: "",
  address: "",
  galleryText: "", // one URL per line, split into galleryUrls on submit
};

const inputClass =
  "border border-ink-100 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brass-400 text-sm bg-white w-full";

const Notice = ({ tone, children }) => (
  <p
    role="status"
    className={`text-sm rounded-md px-3 py-2 border ${
      tone === "success"
        ? "bg-sage-100 border-sage-500/30 text-sage-600"
        : "bg-red-50 border-red-200 text-red-700"
    }`}
  >
    {children}
  </p>
);

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-xs text-ink-500">{label}</span>
    {children}
  </label>
);

const ProviderDashboard = () => {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [mySlots, setMySlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("bookings"); // "bookings" | "manage" | "calendar"
  const [bookingTab, setBookingTab] = useState("upcoming");
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE);
  const [slotForm, setSlotForm] = useState({ serviceId: "", startTime: "", endTime: "" });
  const [savingService, setSavingService] = useState(false);
  const [savingSlot, setSavingSlot] = useState(false);
  const [serviceNotice, setServiceNotice] = useState(null);
  const [slotNotice, setSlotNotice] = useState(null);
  const socketCtx = useSocket();
  const { user, updateProfile } = useAuth();

  const [contactForm, setContactForm] = useState({ phone: "", location: "" });
  const [savingContact, setSavingContact] = useState(false);
  const [contactNotice, setContactNotice] = useState(null);

  // Keep the form in sync once the logged-in user's data is available
  useEffect(() => {
    if (user) {
      setContactForm({ phone: user.phone || "", location: user.location || "" });
    }
  }, [user]);

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setSavingContact(true);
    setContactNotice(null);
    try {
      await updateProfile(contactForm);
      setContactNotice({ tone: "success", text: "Saved. Customers will now see this on your listings." });
    } catch (err) {
      setContactNotice({ tone: "error", text: err.response?.data?.message || "Could not save contact info" });
    } finally {
      setSavingContact(false);
    }
  };

  const loadAll = ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    return Promise.all([
      api.get("/services/mine").then(({ data }) => setServices(data)),
      api.get("/bookings/provider").then(({ data }) => setBookings(data)),
      api.get("/slots/mine").then(({ data }) => setMySlots(data)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Live-update the bookings list the instant a new booking comes in,
  // instead of the provider having to refresh the page.
  useEffect(() => {
    const socket = socketCtx?.socket;
    if (!socket) return;
    const handler = () => loadAll({ quiet: true });
    socket.on("notification:new", handler);
    return () => socket.off("notification:new", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketCtx?.socket]);

  // ---- Derived numbers for the stat cards and lists ----
  const { upcoming, past, cancelled, earnings, openSlots, openByService } = useMemo(() => {
    const now = new Date();
    const confirmed = bookings.filter((b) => b.status === "confirmed");
    const startOf = (b) => (b.slot ? new Date(b.slot.startTime) : new Date(0));
    const isUpcoming = (b) => b.slot && new Date(b.slot.endTime) >= now;

    const open = mySlots.filter((s) => s.status === "available" && new Date(s.startTime) >= now);
    const byService = {};
    open.forEach((s) => {
      const id = s.service?._id;
      if (id) byService[id] = (byService[id] || 0) + 1;
    });

    return {
      upcoming: confirmed.filter(isUpcoming).sort((a, b) => startOf(a) - startOf(b)),
      past: confirmed.filter((b) => !isUpcoming(b)).sort((a, b) => startOf(b) - startOf(a)),
      cancelled: bookings.filter((b) => b.status === "cancelled"),
      earnings: confirmed.reduce((sum, b) => sum + (b.amountPaid || 0), 0),
      openSlots: open.length,
      openByService: byService,
    };
  }, [bookings, mySlots]);

  const nextBooking = upcoming[0];
  const shownBookings = { upcoming, past, cancelled }[bookingTab];

  // ---- Create service ----
  const handleCreateService = async (e) => {
    e.preventDefault();
    setServiceNotice(null);
    setSavingService(true);
    try {
      const galleryUrls = serviceForm.galleryText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      await api.post("/services", { ...serviceForm, galleryUrls });
      setServiceForm(EMPTY_SERVICE);
      setServiceNotice({ tone: "success", text: "Service added. Open a slot below so people can book it." });
      loadAll({ quiet: true });
    } catch (err) {
      setServiceNotice({ tone: "error", text: err.response?.data?.message || "Could not add this service" });
    } finally {
      setSavingService(false);
    }
  };

  // ---- Create slot (end time fills in from the service's duration) ----
  const durationOf = (serviceId) => Number(services.find((s) => s._id === serviceId)?.durationMinutes) || 0;
  const autoEnd = (start, serviceId) => {
    const mins = durationOf(serviceId);
    if (!start || !mins) return "";
    return toLocalInput(new Date(new Date(start).getTime() + mins * 60000));
  };

  const handleSlotService = (serviceId) =>
    setSlotForm((f) => ({
      ...f,
      serviceId,
      endTime: f.startTime ? autoEnd(f.startTime, serviceId) || f.endTime : f.endTime,
    }));

  const handleSlotStart = (startTime) =>
    setSlotForm((f) => ({ ...f, startTime, endTime: autoEnd(startTime, f.serviceId) || f.endTime }));

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setSlotNotice(null);
    if (!slotForm.serviceId) return;
    if (new Date(slotForm.endTime) <= new Date(slotForm.startTime)) {
      setSlotNotice({ tone: "error", text: "The end time must be after the start time." });
      return;
    }
    setSavingSlot(true);
    try {
      await api.post("/slots", slotForm);
      setSlotForm((f) => ({ ...f, startTime: "", endTime: "" }));
      setSlotNotice({ tone: "success", text: "Slot opened. It's now visible to customers." });
      loadAll({ quiet: true });
    } catch (err) {
      setSlotNotice({ tone: "error", text: err.response?.data?.message || "Could not open this slot" });
    } finally {
      setSavingSlot(false);
    }
  };

  const emptyBookings = {
    upcoming: { title: "No upcoming bookings", text: "When a customer books one of your slots, it shows up here instantly." },
    past: { title: "No past bookings yet", text: "Finished appointments will be listed here." },
    cancelled: { title: "No cancelled bookings", text: "Cancellations will be listed here." },
  }[bookingTab];

  const primaryBtn =
    "bg-ink-900 hover:bg-ink-800 disabled:opacity-50 transition-colors text-white rounded-full px-5 py-2.5 text-sm font-medium";

  return (
    <div className="min-h-[calc(100vh-64px)] bg-paper py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl text-ink-900">
          {user?.name ? `${user.name.split(" ")[0]}'s dashboard` : "Dashboard"}
        </h1>
        <p className="text-sm text-ink-500 mt-1 mb-6">Your bookings, services and open times in one place.</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={CalendarCheck}
            tone="sage"
            label="Upcoming bookings"
            value={upcoming.length}
            hint={
              nextBooking?.slot
                ? `Next: ${formatDayLabel(nextBooking.slot.startTime)}, ${formatTime(nextBooking.slot.startTime)}`
                : undefined
            }
          />
          <StatCard icon={Ticket} tone="ink" label="Open slots" value={openSlots} />
          <StatCard icon={Layers} tone="brass" label="Services" value={services.length} />
          <StatCard icon={IndianRupee} tone="rose" label="Earned from bookings" value={formatINR(earnings)} />
        </div>

        {!user?.phone && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 bg-brass-50 border border-brass-300 rounded-lg px-4 py-3">
            <p className="text-sm text-brass-700 flex items-center gap-2">
              <Phone size={15} strokeWidth={1.75} /> Add a mobile number so customers can call or WhatsApp you.
            </p>
            <button
              onClick={() => setTab("manage")}
              className="text-sm font-medium text-brass-700 underline underline-offset-2"
            >
              Add number
            </button>
          </div>
        )}

        <div className="mb-5">
          <Tabs
            label="Dashboard sections"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "bookings", label: "Bookings", count: upcoming.length },
              { id: "manage", label: "Manage" },
              { id: "calendar", label: "Calendar" },
            ]}
          />
        </div>

        {/* ---------------- Bookings ---------------- */}
        {tab === "bookings" && (
          <div>
            <div className="mb-4">
              <Tabs
                label="Booking status"
                value={bookingTab}
                onChange={setBookingTab}
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
            ) : shownBookings.length === 0 ? (
              <EmptyState
                icon={bookingTab === "cancelled" ? CalendarX2 : Inbox}
                {...emptyBookings}
                action={
                  bookingTab === "upcoming" && openSlots === 0
                    ? { label: "Open a slot", onClick: () => setTab("manage") }
                    : undefined
                }
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {shownBookings.map((b) => (
                  <li key={b._id} className="bg-white border border-ink-100 rounded-lg p-4 flex gap-3">
                    <DateBlock date={b.slot?.startTime} muted={bookingTab !== "upcoming"} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-ink-900 truncate">{b.service?.title || "Service"}</p>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-sm text-ink-500 truncate">
                        {b.user?.name}
                        {b.user?.email && (
                          <>
                            {" · "}
                            <a href={`mailto:${b.user.email}`} className="underline underline-offset-2 hover:text-ink-900">
                              {b.user.email}
                            </a>
                          </>
                        )}
                      </p>
                      {b.slot && (
                        <p className="text-sm text-ink-500 flex items-center gap-1.5 mt-0.5">
                          <Clock size={13} strokeWidth={1.75} />
                          {formatDayLabel(b.slot.startTime)}, {formatTime(b.slot.startTime)} –{" "}
                          {formatTime(b.slot.endTime)}
                        </p>
                      )}
                      {b.amountPaid > 0 && <p className="text-xs text-ink-400 mt-1">Paid {formatINR(b.amountPaid)}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ---------------- Manage ---------------- */}
        {tab === "manage" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col gap-6">
              <section className="bg-white rounded-lg border border-ink-100 p-4 sm:p-5">
                <h2 className="font-serif font-medium text-lg text-ink-900">Contact info</h2>
                <p className="text-xs text-ink-500 mt-0.5 mb-3">
                  Shown on your listings so customers can call or WhatsApp you.
                </p>
                <form onSubmit={handleSaveContact} className="flex flex-col gap-2">
                  <input
                    aria-label="Mobile number"
                    placeholder="Mobile number (e.g. 98765 43210)"
                    className={inputClass}
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                  <input
                    aria-label="Location"
                    placeholder="Location / city"
                    className={inputClass}
                    value={contactForm.location}
                    onChange={(e) => setContactForm({ ...contactForm, location: e.target.value })}
                  />
                  <button disabled={savingContact} className={`${primaryBtn} self-start`}>
                    {savingContact ? "Saving…" : "Save contact info"}
                  </button>
                  {contactNotice && <Notice tone={contactNotice.tone}>{contactNotice.text}</Notice>}
                </form>
              </section>

              <section className="bg-white rounded-lg border border-ink-100 p-4 sm:p-5">
                <h2 className="font-serif font-medium text-lg text-ink-900 mb-3">Open a new slot</h2>
                <form onSubmit={handleCreateSlot} className="flex flex-col gap-3">
                  <Field label="Service">
                    <select
                      className={inputClass}
                      value={slotForm.serviceId}
                      onChange={(e) => handleSlotService(e.target.value)}
                      required
                    >
                      <option value="">Select a service</option>
                      {services.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Starts">
                      <input
                        type="datetime-local"
                        className={inputClass}
                        min={toLocalInput(new Date())}
                        value={slotForm.startTime}
                        onChange={(e) => handleSlotStart(e.target.value)}
                        required
                      />
                    </Field>
                    <Field label="Ends">
                      <input
                        type="datetime-local"
                        className={inputClass}
                        min={slotForm.startTime || toLocalInput(new Date())}
                        value={slotForm.endTime}
                        onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                        required
                      />
                    </Field>
                  </div>
                  {durationOf(slotForm.serviceId) > 0 && (
                    <p className="text-xs text-ink-400 -mt-1">
                      The end time fills in from this service's {durationOf(slotForm.serviceId)}-minute duration.
                    </p>
                  )}
                  <button disabled={savingSlot || services.length === 0} className={`${primaryBtn} self-start`}>
                    {savingSlot ? "Opening…" : "Open slot"}
                  </button>
                  {services.length === 0 && (
                    <p className="text-xs text-ink-500">Add a service first, then you can open slots for it.</p>
                  )}
                  {slotNotice && <Notice tone={slotNotice.tone}>{slotNotice.text}</Notice>}
                </form>
              </section>
            </div>

            <div className="flex flex-col gap-6">
              <section className="bg-white rounded-lg border border-ink-100 p-4 sm:p-5">
                <h2 className="font-serif font-medium text-lg text-ink-900 mb-3">Add a service</h2>
                <form onSubmit={handleCreateService} className="flex flex-col gap-3">
                  <Field label="Title">
                    <input
                      placeholder="e.g. 1:1 Career Guidance"
                      className={inputClass}
                      value={serviceForm.title}
                      onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Description">
                    <textarea
                      rows={3}
                      placeholder="What do customers get?"
                      className={inputClass}
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Duration (minutes)">
                      <input
                        type="number"
                        min="5"
                        className={inputClass}
                        value={serviceForm.durationMinutes}
                        onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: e.target.value })}
                      />
                    </Field>
                    <Field label="Price (₹, 0 for free)">
                      <input
                        type="number"
                        min="0"
                        className={inputClass}
                        value={serviceForm.price}
                        onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                      />
                    </Field>
                  </div>
                  <Field label="Address">
                    <input
                      placeholder="e.g. Shop 12, Civil Lines, Kanpur"
                      className={inputClass}
                      value={serviceForm.address}
                      onChange={(e) => setServiceForm({ ...serviceForm, address: e.target.value })}
                    />
                  </Field>
                  <Field label="Cover photo URL">
                    <input
                      placeholder="https://…"
                      className={inputClass}
                      value={serviceForm.imageUrl}
                      onChange={(e) => setServiceForm({ ...serviceForm, imageUrl: e.target.value })}
                    />
                  </Field>
                  <Field label="More photos (one URL per line, optional)">
                    <textarea
                      rows={2}
                      className={inputClass}
                      value={serviceForm.galleryText}
                      onChange={(e) => setServiceForm({ ...serviceForm, galleryText: e.target.value })}
                    />
                  </Field>
                  <button disabled={savingService} className={`${primaryBtn} self-start`}>
                    {savingService ? "Adding…" : "Add service"}
                  </button>
                  {serviceNotice && <Notice tone={serviceNotice.tone}>{serviceNotice.text}</Notice>}
                </form>
              </section>

              <section className="bg-white rounded-lg border border-ink-100 p-4 sm:p-5">
                <h2 className="font-serif font-medium text-lg text-ink-900 mb-3">Your services</h2>
                {services.length === 0 ? (
                  <p className="text-sm text-ink-500">Services you add will be listed here.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-ink-100">
                    {services.map((s) => (
                      <li key={s._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        {s.imageUrl ? (
                          <img
                            src={s.imageUrl}
                            alt=""
                            className="w-12 h-12 rounded-md object-cover flex-shrink-0 bg-paper-200"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-paper-200 flex-shrink-0" aria-hidden="true" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-ink-900 truncate">{s.title}</p>
                          <p className="text-xs text-ink-500">
                            {s.price > 0 ? formatINR(s.price) : "Free"} · {s.durationMinutes} min
                          </p>
                        </div>
                        <span className="text-xs text-ink-500 whitespace-nowrap">
                          {openByService[s._id] || 0} open {(openByService[s._id] || 0) === 1 ? "slot" : "slots"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        )}

        {/* ---------------- Calendar ---------------- */}
        {tab === "calendar" && (loading ? <RowSkeleton /> : <ProviderCalendar slots={mySlots} />)}
      </div>
    </div>
  );
};

export default ProviderDashboard;
