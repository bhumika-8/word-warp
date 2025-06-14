// word-warp/server/index.js

import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cahData = null;

// Load the JSON *before* using it
async function loadCahData() {
  try {
    const jsonPath = path.join(__dirname, 'data', 'cah-compact-indian.json');
    const raw = await fs.readFile(jsonPath, 'utf-8');
    cahData = JSON.parse(raw);
    console.log("✅ cahData loaded");
  } catch (err) {
    console.error("⚠️ Failed to load cah-compact.json:", err.message);
  }
}

function getRandomPrompt() {
  if (!cahData || !Array.isArray(cahData.black)) {
    return "No prompt available.";
  }

  const cards = cahData.black;
  const random = cards[Math.floor(Math.random() * cards.length)];
  return typeof random === "string" ? random : random.text || "Unnamed prompt";
}

// Run everything inside an async function
async function main() {
  await loadCahData();

  // Now it’s safe to call getRandomPrompt()
  const prompt = getRandomPrompt();
  console.log("Random Prompt:", prompt);
}

main(); // 🚀




// Test the function
console.log(getRandomPrompt());

const app = express();
const server = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const rooms = {};
function broadcastOpenRooms() {
  const openRooms = Object.entries(rooms).map(([roomCode, room]) => ({
    code: roomCode,
    members: room.members.size,
  }));
  io.emit("roomListUpdate", openRooms);
  console.log(openRooms);
}




function getRoomOfUser(socketId) {
  for (const roomId in rooms) {
    if (rooms[roomId].members.has(socketId)) {
      return roomId;
    }
  }
  return null;
}

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`New socket connected: ${socket.id}`);
socket.emit("roomListUpdate", Object.entries(rooms).map(([code, room]) => ({
  code,
  members: room.members.size,
})));
socket.on("createRoom", () => {
  const roomId = uuidv4().slice(0, 6);

  rooms[roomId] = {
    creator: socket.id,
    members: new Set([socket.id]),
    playerNames: { [socket.id]: "Player 1" },
    judge: null,
    responses: [],
    submitted: new Set(),
    gameInProgress: false,
  };

  socket.join(roomId);

  // Emit to the creator so they enter the room properly
  socket.emit("roomJoined", {
    roomId,
    existingMembers: [], // No other members yet
    creator: socket.id,
    playerNames: rooms[roomId].playerNames,
  });

  broadcastOpenRooms();
  console.log(`Room created: ${roomId} by ${socket.id}`);
});

socket.on("getRoomList", () => {
  const openRooms = Object.entries(rooms).map(([code, room]) => ({
    code,
    members: room.members.size,
  }));
  socket.emit("roomListUpdate", openRooms);
});

  socket.on("joinRoom", (roomId) => {
  const room = rooms[roomId];

  if (!room) {
    socket.emit("error", "Room does not exist");
    return;
  }
if (room.gameInProgress) {
    socket.emit("join-error", { message: "Game already in progress. You can't join now." });
    return;
  }
  if (room.members.has(socket.id)) {
    // Already in the room — maybe page refresh or rejoin
    const existingMembers = Array.from(room.members).filter(id => id !== socket.id);
    socket.emit("roomJoined", {
      roomId,
      existingMembers,
      creator: room.creator,
       playerNames: rooms[roomId].playerNames, 
    });
    console.log("🎯 playerNames after creation:", rooms[roomId].playerNames);
    return;
  }

  if (room.members.size >= 6) {
    socket.emit("error", "Room is full.");
    return;
  }

  // Add the member
  room.members.add(socket.id);
   const playerCount = Object.keys(room.playerNames).length;
  room.playerNames[socket.id] = `Player ${playerCount + 1}`;
 console.log("🎯 playerNames after creation:", rooms[roomId].playerNames);
  socket.join(roomId);

  const existingMembers = Array.from(room.members).filter(id => id !== socket.id);

  socket.emit("roomJoined", {
  roomId,
  existingMembers,
  creator: room.creator,
  playerNames: room.playerNames,
});

  socket.to(roomId).emit("roomUpdate", {
    newMember: socket.id,
  });

  broadcastOpenRooms();
  console.log(`👥 ${socket.id} joined room: ${roomId}`);
});


  socket.on("submit-response", ({ room, response, user }) => {
    const currentRoom = rooms[room];
    if (!currentRoom || !currentRoom.responses || !currentRoom.submitted) return;
    if (currentRoom.submitted.has(socket.id)) return;

    currentRoom.submitted.add(socket.id);
    currentRoom.responses.push({ user, response });

    const totalNonJudges = currentRoom.members.size - 1;
    const submittedCount = currentRoom.responses.length;

    if (submittedCount === totalNonJudges) {
      io.to(room).emit("all-responses", {
        responses: currentRoom.responses,
        totalNonJudges
      });
    }
  });

socket.on("judge-select", ({ room, winner, responses }) => {
  const currentRoom = rooms[room];
  if (!currentRoom) return;

  // Save final responses
  currentRoom.responses = responses;

  // Emit the round results
  io.to(room).emit("reveal-answers", {
    responses,
    winner,
  });

  // Rotate judge
  const members = Array.from(currentRoom.members);
  const currentJudgeIndex = members.indexOf(currentRoom.judge);
  const nextJudgeIndex = (currentJudgeIndex + 1) % members.length;
  const nextJudge = members[nextJudgeIndex];
  currentRoom.judge = nextJudge;

  // Mark game as not in progress (until next round starts)
  currentRoom.gameInProgress = false;

  // Send new judge to clients
  io.to(room).emit("nextRoundReady", {
    nextJudge,
  });

  console.log(`👨‍⚖️ Judge rotated to ${nextJudge} in room ${room}`);
});
socket.on("startNextRound", ({ room }) => {
  const currentRoom = rooms[room];
  if (!currentRoom) return;

  const prompt = getRandomPrompt();
  currentRoom.responses = [];
  currentRoom.submitted = new Set();
  currentRoom.gameInProgress = true;

  io.to(room).emit("gameStarted", {
    prompt,
    selectedUser: currentRoom.judge,
  });

  console.log(`🎮 New round started in room ${room} with judge ${currentRoom.judge}`);
});



  socket.on("leave-room", ({ room, user }) => {
  const currentRoom = rooms[room];
  if (!currentRoom) return;

  currentRoom.members.delete(user);
  socket.leave(room);

  // ❌ Room is now empty
  if (currentRoom.members.size === 0) {
    delete rooms[room];
    console.log(`🧹 Room ${room} deleted after ${user} left.`);
    return;
  }

  // 👑 Creator left — reassign
  if (currentRoom.creator === user) {
    const newCreator = Array.from(currentRoom.members)[0];
    currentRoom.creator = newCreator;
    currentRoom.judge = newCreator;
    io.to(room).emit("newCreator", { newCreator, newJudge: newCreator });
    console.log(`👑 Creator ${user} left. New creator/judge: ${newCreator}`);
  }

  // 🧠 Game mid-progress handling
  if (currentRoom.gameInProgress) {
    currentRoom.responses = currentRoom.responses?.filter(r => r.user !== user) || [];
    currentRoom.submitted?.delete?.(user);

    const active = Array.from(currentRoom.members);
    const nonJudges = active.filter(id => id !== currentRoom.judge);

    if (nonJudges.length < 1) {
      currentRoom.gameInProgress = false;
      io.to(room).emit("notEnoughPlayers");
      console.log(`❗Game ended in ${room} due to too few players.`);
    } else if (currentRoom.responses.length === nonJudges.length) {
      // Reveal if all remaining non-judges submitted
      io.to(room).emit("reveal-answers", {
        responses: currentRoom.responses,
        winner: null,
      });
      currentRoom.gameInProgress = false;
    }
  }

  socket.to(room).emit("roomUpdate", { memberLeft: user });
  io.to(room).emit("playerListUpdate", Array.from(currentRoom.members));
  broadcastOpenRooms();
  console.log(`👋 ${user} left room ${room}`);
});



socket.on("disconnect", () => {
  const roomCode = getRoomOfUser(socket.id);
  if (!roomCode) return;

  const room = rooms[roomCode];
  if (!room) return;

  room.members.delete(socket.id);

  if (room.members.size === 0) {
    delete rooms[roomCode];
    console.log(`❌ Room ${roomCode} deleted after disconnect.`);
    return;
  }

  if (room.creator === socket.id) {
    const newCreator = Array.from(room.members)[0];
    room.creator = newCreator;
    room.judge = newCreator;
    io.to(roomCode).emit("newCreator", {
      newCreator,
      newJudge: newCreator,
    });
    console.log(`👑 Creator ${socket.id} disconnected. New creator/judge: ${newCreator}`);
  }

  // 🧠 Handle mid-game disconnect
  if (room.gameInProgress) {
    room.responses = room.responses?.filter(r => r.user !== socket.id) || [];
    room.submitted?.delete?.(socket.id);

    const active = Array.from(room.members);
    const nonJudges = active.filter(id => id !== room.judge);

    if (nonJudges.length < 1) {
      room.gameInProgress = false;
      io.to(roomCode).emit("notEnoughPlayers");
      console.log(`❗Game ended in ${roomCode} due to too few players.`);
    } else if (room.responses.length === nonJudges.length) {
      io.to(roomCode).emit("reveal-answers", {
        responses: room.responses,
        winner: null,
      });
      room.gameInProgress = false;
    }
  }

  io.to(roomCode).emit("roomUpdate", { memberLeft: socket.id });
  io.to(roomCode).emit("playerListUpdate", Array.from(room.members));
  broadcastOpenRooms();
});


  socket.on("startGame", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (room && room.members.size > 2) {
      const membersArray = Array.from(room.members);
      const randomIndex = Math.floor(Math.random() * membersArray.length);
      const selectedUser = membersArray[randomIndex];
      const prompt = getRandomPrompt();

      room.judge = selectedUser;
      room.responses = [];
      room.submitted = new Set();
      // Inside "gameStarted" logic
      room.gameInProgress = true;


      io.to(roomCode).emit("gameStarted", {
        prompt,
        selectedUser,
      });
      

      console.log(`Game started in room ${roomCode} with judge ${selectedUser}`);
    }
  });
});

app.get('/', (req, res) => {
  res.send("Server running!");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
