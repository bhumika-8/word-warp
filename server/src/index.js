// word-warp/server/index.js

import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { initSocket } from "./socket/socketHandler.js";
import { loadCahData } from "./services/cahService.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
  origin: ["http://localhost:3000", "https://word-warp-ten.vercel.app"],
  methods: ["GET", "POST"],
  credentials: true,
},

});

app.use(cors());
app.get("/", (req, res) => {
  res.send("Word Warp server is running.");
});

async function start() {
  await loadCahData(); // Load prompts from JSON
  initSocket(io);      // Hook up all socket.io logic

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
