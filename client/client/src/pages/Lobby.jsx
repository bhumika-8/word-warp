// src/pages/Lobby.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import './lobby.css';

const Lobby = () => {
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    console.log("Creating room...");
    socket.emit("createRoom");
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) return;
    console.log("Joining room:", roomCode);
    socket.emit("joinRoom", roomCode);
  };

  useEffect(() => {
    socket.on("roomCreated", (roomId) => {
      console.log("Room created with ID:", roomId);
      navigate(`/room/${roomId}`);
    });

    socket.on("roomJoined", (data) => {
  const id = typeof data === 'string' ? data : data.roomId;
  console.log("Successfully joined room:", id);
  navigate(`/room/${id}`);
});

    socket.on("error", (message) => {
      alert("Error: " + message);
    });

    return () => {
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.off("error");
    };
  }, [navigate]);

  return (
    <div className="lobby-container">
      <h1 className="lobby-heading">Lobby</h1>

      <button className="lobby-button" onClick={handleCreateRoom}>
        Create Room
      </button>

      <div className="lobby-input-group">
        <input
          type="text"
          placeholder="Enter Room Code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          className="lobby-input"
        />
        <button className="lobby-button" onClick={handleJoinRoom}>
          Join Room
        </button>
      </div>
    </div>
  );
};

export default Lobby;