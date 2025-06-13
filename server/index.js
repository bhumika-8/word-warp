// word-warp/server/index.js

import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

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

function getRandomPrompt() {
  const prompts = [
    "What's the worst idea for a TV show?",
    "If animals could talk, which would be the rudest?",
    "Describe a weird dream you had."
  ];
  return prompts[Math.floor(Math.random() * prompts.length)];
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
      judge: null,
      responses: [],
      submitted: new Set()
    };
    socket.join(roomId);
    socket.emit("roomCreated", roomId);
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

  if (room.members.has(socket.id)) {
    // Already in the room — maybe page refresh or rejoin
    const existingMembers = Array.from(room.members).filter(id => id !== socket.id);
    socket.emit("roomJoined", {
      roomId,
      existingMembers,
      creator: room.creator,
    });
    return;
  }

  if (room.members.size >= 6) {
    socket.emit("error", "Room is full.");
    return;
  }

  // Add the member
  room.members.add(socket.id);
  socket.join(roomId);

  const existingMembers = Array.from(room.members).filter(id => id !== socket.id);

  socket.emit("roomJoined", {
    roomId,
  members: Array.from(room.members),
  creator: room.creator,
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

    currentRoom.responses = responses;
    io.to(room).emit("reveal-answers", {
      responses,
      winner
    });
  });

  socket.on("leave-room", ({ room, user }) => {
    const currentRoom = rooms[room];
    if (!currentRoom) return;

    currentRoom.members.delete(user);
    socket.leave(room);

    if (currentRoom.members.size === 0) {
      delete rooms[room];
      console.log(`🧹 Room ${room} deleted after ${user} left.`);
    } else {
      if (currentRoom.creator === user) {
        const newCreator = Array.from(currentRoom.members)[0];
        currentRoom.creator = newCreator;
        currentRoom.judge = newCreator;
        io.to(room).emit("newCreator", { newCreator, newJudge: newCreator });
        console.log(`👑 Creator ${user} left. New creator/judge: ${newCreator}`);
      }
      socket.to(room).emit("roomUpdate", { memberLeft: user });
      broadcastOpenRooms();
      console.log(`👋 ${user} left room ${room}`);
    }
  });

  socket.on("disconnect", () => {
  const roomCode = getRoomOfUser(socket.id);
  if (!roomCode) return;

  const room = rooms[roomCode];
  room.members.delete(socket.id);

  if (room.members.size === 0) {
    delete rooms[roomCode];
    console.log(`❌ Room ${roomCode} deleted after disconnect.`);
  } else {
    let newCreatorAssigned = false;

    if (room.creator === socket.id) {
      const newCreator = Array.from(room.members)[0];
      room.creator = newCreator;
      room.judge = newCreator;
      newCreatorAssigned = true;

      io.to(roomCode).emit("newCreator", {
        newCreator,
        newJudge: newCreator,
      });
      

      console.log(`👑 Creator ${socket.id} disconnected. New creator/judge: ${newCreator}`);

      // 🔁 Auto-start new game
      const prompt = getRandomPrompt();
      room.responses = [];
      room.submitted = new Set();

      io.to(roomCode).emit("gameStarted", {
        prompt,
        selectedUser: newCreator,
      });

      console.log(`🟢 New game started in ${roomCode} with judge ${newCreator}`);
    }

    io.to(roomCode).emit("roomUpdate", { memberLeft: socket.id });
  }
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
