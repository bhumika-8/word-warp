// server/test-socket.mjs
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("✅ Connected to server:", socket.id);

  // Test createRoom
  socket.emit("createRoom", "room123");

  socket.on("roomCreated", (roomId) => {
    console.log("🟢 Room created:", roomId);
  });

  socket.on("roomJoined", (roomId) => {
    console.log("🟢 Joined room:", roomId);
  });

  socket.on("userJoined", (userId) => {
    console.log("👥 Another user joined:", userId);
  });

  socket.on("error", (msg) => {
    console.error("❌ Error:", msg);
  });
});

socket.on("disconnect", () => {
  console.log("🔴 Disconnected from server");
});
