export const rooms = {};

export function getRoomOfUser(socketId) {
  for (const roomId in rooms) {
    if (rooms[roomId].members.has(socketId)) {
      return roomId;
    }
  }
  return null;
}

export function broadcastOpenRooms(io) {
  const openRooms = Object.entries(rooms).map(([roomCode, room]) => ({
    code: roomCode,
    members: room.members.size,
  }));
  io.emit("roomListUpdate", openRooms);
  return openRooms;
}
export function handleLeaveOrDisconnect(socket, io, reason = "disconnect") {
  const roomCode = getRoomOfUser(socket.id);
  if (!roomCode) return;

  const room = rooms[roomCode];
  if (!room) return;

  room.members.delete(socket.id);
  delete room.playerNames?.[socket.id];

  if (room.members.size === 0) {
    delete rooms[roomCode];
    return;
  }

  const remainingPlayers = Array.from(room.members);


  if (room.creator === socket.id) {
    const newCreator = remainingPlayers[0];
    room.creator = newCreator;

    io.to(roomCode).emit("newCreator", {
      newCreator,
      roomCode,
      playerNames: room.playerNames,
    });
  }

  if (room.judge === socket.id) {
    const newJudge = remainingPlayers[0];
    room.judge = newJudge;

    io.to(roomCode).emit("newJudge", {
      newJudge,
      roomCode,
    });

    io.to(roomCode).emit("roundResetDueToJudgeLeave", {
      message: "Judge left. New judge assigned. Round reset.",
    });
  }

  if (remainingPlayers.length < 3) {
    room.gameInProgress = false;
    room.responses = [];
    room.submitted = new Set();
    room.judge = null;

   io.to(roomCode).emit("notEnoughPlayersRedirect", {
  message: "Not enough players. Returning to waiting room...",
  roomCode,
  playerNames: room.playerNames,
});


  } else {
    io.to(roomCode).emit("roomUpdate", {
      playerNames: room.playerNames,
    });
  }

  broadcastOpenRooms(io);
}
