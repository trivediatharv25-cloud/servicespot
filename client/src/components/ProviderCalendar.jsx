import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Colors the calendar events green (available) or red (booked) so a provider
// can scan their week at a glance without reading every label.
const eventStyleGetter = (event) => ({
  style: {
    backgroundColor: event.status === "booked" ? "#e11d48" : "#5B7A63",
    borderRadius: "4px",
    color: "white",
    border: "none",
    fontSize: "0.75rem",
  },
});

const ProviderCalendar = ({ slots }) => {
  // Week view is cramped on a phone, so start on the day view there
  const [view, setView] = useState(() => (typeof window !== "undefined" && window.innerWidth < 640 ? "day" : "week"));
  const [date, setDate] = useState(new Date());

  const events = slots.map((s) => ({
    id: s._id,
    title:
      s.status === "booked"
        ? `${s.service?.title || "Service"} — Booked (${s.bookedBy?.name || "someone"})`
        : `${s.service?.title || "Service"} — Available`,
    start: new Date(s.startTime),
    end: new Date(s.endTime),
    status: s.status,
  }));

  return (
    <div>
      <div className="flex items-center gap-4 text-xs text-ink-500 mb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: "#5B7A63" }} /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: "#e11d48" }} /> Booked
        </span>
      </div>
      <div className="h-[70vh] min-h-[420px] bg-white p-2 rounded-lg border border-ink-100">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventStyleGetter}
          views={["week", "day", "agenda"]}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          popup
        />
      </div>
    </div>
  );
};

export default ProviderCalendar;
