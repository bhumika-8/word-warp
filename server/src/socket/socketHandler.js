import { generateUniqueName } from "../services/nameService.js";
import { getRandomPrompt, loadCahData } from "../services/cahService.js";
import {
  getRoomOfUser,
  broadcastOpenRooms,
  handleLeaveOrDisconnect,
  rooms,
} from "../controllers/gameController.js";

export function initSocket(io) {
  io.on("connection", (socket) => {

    socket.emit("roomListUpdate", broadcastOpenRooms(io));

    socket.on("createRoom", () => {
      const roomId = crypto.randomUUID().slice(0, 6);

      rooms[roomId] = {
        creator: socket.id,
        members: new Set([socket.id]),
        playerNames: { [socket.id]: generateUniqueName({}) },
        judge: null,
        responses: [],
        submitted: new Set(),
        gameInProgress: false,
      };

      socket.join(roomId);

      socket.emit("roomJoined", {
        roomId,
        existingMembers: [],
        creator: socket.id,
        playerNames: rooms[roomId].playerNames,
      });

      broadcastOpenRooms(io);
    });

    socket.on("getRoomList", () => {
      socket.emit("roomListUpdate", broadcastOpenRooms(io));
    });

    socket.on("joinRoom", (roomId) => {
      const room = rooms[roomId];
      if (!room) return socket.emit("error", "Room does not exist");
      if (room.gameInProgress) return socket.emit("join-error", { message: "Game already in progress" });
      if (room.members.size >= 6) return socket.emit("error", "Room is full.");

      const isReturning = room.members.has(socket.id);
      if (isReturning) {
        const existingMembers = Array.from(room.members).filter(id => id !== socket.id);
        socket.emit("roomJoined", {
          roomId,
          existingMembers,
          creator: room.creator,
          playerNames: room.playerNames,
        });
        return;
      }

      room.members.add(socket.id);
      room.playerNames[socket.id] = generateUniqueName(room.playerNames);
      socket.join(roomId);

      const existingMembers = Array.from(room.members).filter(id => id !== socket.id);
      socket.emit("roomJoined", {
        roomId,
        existingMembers,
        creator: room.creator,
        playerNames: room.playerNames,
      });

      socket.to(roomId).emit("roomUpdate", { playerNames: room.playerNames });
      broadcastOpenRooms(io);
    });

    socket.on("submit-response", ({ room, response, user }) => {
      const currentRoom = rooms[room];
      if (!currentRoom || currentRoom.submitted.has(socket.id)) return;

      currentRoom.submitted.add(socket.id);
      currentRoom.responses.push({ user, response });

      const totalNonJudges = currentRoom.members.size - 1;
      const submittedCount = currentRoom.responses.length;

      if (submittedCount === totalNonJudges) {
        io.to(room).emit("all-responses", {
          responses: currentRoom.responses,
          totalNonJudges,
        });
      }
    });

    socket.on("judge-select", ({ room, winner, responses }) => {
      const currentRoom = rooms[room];
      if (!currentRoom) return;

      currentRoom.responses = responses;
      io.to(room).emit("reveal-answers", { responses, winner });

      const members = Array.from(currentRoom.members);
      const currentJudgeIndex = members.indexOf(currentRoom.judge);
      const nextJudgeIndex = (currentJudgeIndex + 1) % members.length;
      const nextJudge = members[nextJudgeIndex];

      currentRoom.judge = nextJudge;
      currentRoom.gameInProgress = false;

      io.to(room).emit("nextRoundReady", { nextJudge });
    });

  socket.on("startNextRound", ({ room }) => {
  const currentRoom = rooms[room];
  if (!currentRoom) return;

  for (const playerId of [...currentRoom.submitted]) {
    if (!currentRoom.members.has(playerId)) {
      currentRoom.submitted.delete(playerId);
    }
  }
  currentRoom.responses = currentRoom.responses.filter(
    (r) => currentRoom.members.has(r.playerId)
  );

  if (!currentRoom.members.has(currentRoom.judge)) {

    const membersArray = Array.from(currentRoom.members);
    currentRoom.judge = membersArray[0];
  }


  if (currentRoom.members.size < 2) {
    io.to(room).emit("notEnoughPlayers");
    return;
  }

  const prompt = getRandomPrompt();
  currentRoom.responses = [];
  currentRoom.submitted = new Set();
  currentRoom.gameInProgress = true;

  io.to(room).emit("gameStarted", {
    prompt,
    selectedUser: currentRoom.judge,
  });
});


    socket.on("startGame", ({ roomCode }) => {
      const room = rooms[roomCode];
      if (!room) {
  return;
}
      if (room.members.size < 3) {
  io.to(socket.id).emit("startGameFailed", {
    reason: "At least 3 players are required to start the game.",
  });
  return;
}

      const membersArray = Array.from(room.members);
      const randomIndex = Math.floor(Math.random() * membersArray.length);
      const selectedUser = membersArray[randomIndex];
      const prompt = getRandomPrompt();

      room.judge = selectedUser;
      room.responses = [];
      room.submitted = new Set();
      room.gameInProgress = true;

      io.to(roomCode).emit("gameStarted", { prompt, selectedUser });
    });

    socket.on("disconnect", () => {
      handleLeaveOrDisconnect(socket, io, "disconnect");
    });

    socket.on("leave-room", ({ room, user }) => {
      if (socket.id === user) {
        handleLeaveOrDisconnect(socket, io, "leave");
      }
    });
  });
}
