import { useState } from "react";
import { Bell } from "lucide-react";
import { useSocket } from "../context/SocketContext";

const NotificationBell = () => {
  const { notifications, markAllRead } = useSocket() || { notifications: [], markAllRead: () => {} };
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleOpen = () => {
    setOpen((prevOpen) => {
      const nextOpen = !prevOpen;
      // Mark everything read the moment the dropdown is opened, so the red
      // dot disappears immediately and doesn't come back for old items.
      if (nextOpen && unreadCount > 0) markAllRead();
      return nextOpen;
    });
  };

  return (
    <div className="relative">
      <button onClick={toggleOpen} className="relative text-ink-100 hover:text-brass-400 transition-colors">
        <Bell size={19} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] leading-none rounded-full px-1.5 py-1">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white text-ink-900 rounded-md border border-ink-100 shadow-lg max-h-80 overflow-y-auto z-50">
          {notifications.length === 0 ? (
            <p className="p-3 text-sm text-ink-500">No notifications yet</p>
          ) : (
            notifications.map((n, i) => (
              <div
                key={n._id || i}
                className={`p-3 border-b border-ink-100 text-sm last:border-b-0 ${
                  n.read ? "text-ink-500" : "text-ink-900 font-medium"
                }`}
              >
                {n.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
