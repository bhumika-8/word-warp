import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import './lobby.css';
import useDisableBackButton from "./disable";

const Lobby = () => {
  const [roomCode, setRoomCode] = useState("");
  const [openRooms, setOpenRooms] = useState([]);
  const navigate = useNavigate();

  useDisableBackButton();

  const handleExit = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleCreateRoom = () => {
    socket.emit("createRoom");
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) return;
    socket.emit("joinRoom", roomCode);
  };

  useEffect(() => {
    socket.on("connect", () => {});

    socket.on("join-error", () => {
      alert("Game Started");
    });

    socket.on("roomCreated", (roomId) => {
      navigate(`/room/${roomId}`);
    });

    socket.on("roomJoined", (data) => {
      if (!data?.roomId) return;
      navigate(`/room/${data.roomId}`);
    });

    socket.on("roomListUpdate", (rooms) => {
      setOpenRooms(rooms);
    });

    socket.on("error", (message) => {
      alert("Error: " + message);
    });

    return () => {
      socket.off("connect");
      socket.off("roomCreated");
      socket.off("roomJoined");
      socket.off("roomListUpdate");
      socket.off("error");
      socket.off("join-error");
    };
  }, [navigate]);

  useEffect(() => {
    socket.emit("getRoomList");
  }, []);

  return (
    <div className="lobby-container">
      <h1 className="lobby-heading">Word Warp</h1>

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

      <div className="open-rooms">
        <h2>Open Rooms</h2>
        {openRooms.length === 0 ? (
          <p>No open rooms right now.</p>
        ) : (
          <ul>
            {openRooms.map((room) => (
              <li key={room.code} className="room-card">
                <div>
                  <span><strong>Code:</strong> {room.code}</span><br />
                  <span><strong>Players:</strong> {room.members}/6</span>
                </div>
                <button
                  className="join-room-btn"
                  onClick={() => socket.emit("joinRoom", room.code)}
                  disabled={room.members >= 6}
                >
                  {room.members >= 6 ? "Full" : "Join"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="lobby-exit-button" onClick={handleExit}>
        Exit
      </button>
    </div>
  );
};

export default Lobby;
