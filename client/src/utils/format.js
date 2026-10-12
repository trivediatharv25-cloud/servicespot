const DAY_MS = 24 * 60 * 60 * 1000;

export const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`;
};

// "Today" / "Tomorrow" / "Mon, 14 Oct"
export const formatDayLabel = (d) => {
  const diff = Math.round((startOfDay(d) - startOfDay(new Date())) / DAY_MS);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

export const formatTime = (d) =>
  new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

export const formatINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export const hoursUntil = (d) => (new Date(d) - new Date()) / (1000 * 60 * 60);

// Value for <input type="datetime-local"> in the user's local time
export const toLocalInput = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
