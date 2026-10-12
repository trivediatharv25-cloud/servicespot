import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import api from "../api/axios";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    // One socket connection per logged-in session
    const socket = io("http://localhost:5000");
    socketRef.current = socket;

    // Tell the server which "room" to put us in so it can target
    // notifications at us specifically (see server/socket.js)
    socket.emit("join", user._id);

    socket.on("notification:new", (payload) => {
      setNotifications((prev) => [
        { ...payload, read: false, createdAt: payload.createdAt || new Date() },
        ...prev,
      ]);
    });

    // Load notifications that arrived while the user was offline
    api.get("/notifications").then(({ data }) => setNotifications(data)).catch(() => {});

    return () => socket.disconnect();
  }, [user]);

  // Called when the bell dropdown is opened. Flips everything to "read"
  // locally right away (so the badge clears instantly) and persists it on
  // the server so it stays cleared on refresh / next login.
  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.patch("/notifications/read-all");
    } catch {
      // non-critical - badge will just re-sync from the server on next load
    }
  };

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, notifications, setNotifications, markAllRead }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
