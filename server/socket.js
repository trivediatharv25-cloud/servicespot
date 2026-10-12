// Sets up the socket.io connection handling. Kept separate from server.js
// so the real-time logic is easy to point to and explain on its own.
const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // The frontend calls this right after login, passing the logged-in user's id.
    // Joining a room named "user:<id>" lets us later target a SPECIFIC user
    // with io.to(`user:${id}`).emit(...) instead of broadcasting to everyone.
    socket.on("join", (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};

module.exports = initSocket;
