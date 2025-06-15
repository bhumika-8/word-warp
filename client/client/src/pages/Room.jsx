// src/pages/Room.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../socket';
import PlayerList from '../components/PlayerList';
import './room.css';
import './lobby.css';
import useDisableBackButton from './disable';

function Room() {
  const navigate = useNavigate();
  useDisableBackButton();

  const { roomId } = useParams();
  const [players, setPlayers] = useState([]);
  const [creator, setCreator] = useState(null);

  const handleStartGame = () => {
    socket.emit("startGame", { roomCode: roomId });
  };

  const handleExit = () => {
    const roomCode = localStorage.getItem("roomCode");
    const userId = socket.id;

    socket.emit("leave-room", { room: roomCode, user: userId });
    navigate('/lobby');

    setTimeout(() => {
      localStorage.clear();
    }, 500);
  };

  // On game start
  useEffect(() => {
    socket.on("gameStarted", ({ prompt, selectedUser }) => {
      localStorage.setItem("prompt", prompt);
      localStorage.setItem("judge", selectedUser);
      navigate("/game");
    });

    return () => {
      socket.off("gameStarted");
    };
  }, [navigate]);

  // Initial room join + updates
  useEffect(() => {
    if (!roomId) return;

    if (socket.disconnected) {
      socket.connect();
    }

    socket.emit('joinRoom', roomId);

    socket.on('roomJoined', ({ roomId, existingMembers, creator, playerNames }) => {
      localStorage.setItem("roomCode", roomId);
      localStorage.setItem("playerNames", JSON.stringify(playerNames));
      localStorage.setItem("creator", creator);

      setCreator(creator);

      setPlayers(
        [socket.id, ...existingMembers].map(id => ({
          id,
          name: playerNames[id],
        }))
      );
    });

    socket.on('roomUpdate', ({ playerNames }) => {
      const newPlayers = Object.entries(playerNames).map(([id, name]) => ({
        id,
        name,
      }));
      setPlayers(newPlayers);
    });

    return () => {
      socket.off('roomJoined');
      socket.off('roomUpdate');
    };
  }, [roomId]);

  // Handle creator reassignment
  useEffect(() => {
    socket.on("newCreator", ({ newCreator, newJudge, roomCode, playerNames }) => {
      setCreator(newCreator);
      localStorage.setItem("creator", newCreator);

      const updatedPlayers = Object.entries(playerNames).map(([id, name]) => ({
        id,
        name,
      }));
      setPlayers(updatedPlayers);
    });

    return () => {
      socket.off("newCreator");
    };
  }, []);

  return (
    <div className="room-container">
      <h2 className="room-heading">Room Code: {roomId}</h2>
      <p className="identity-label">
        You are:{" "}
        <span className="identity-name">
          {players.find(p => p.id === socket.id)?.name || "Unknown"}
        </span>
      </p>

      <h3 className="room-subheading">Players in Room</h3>
      <PlayerList players={players} />

      {socket.id === creator && (
        <button className="start-button" onClick={handleStartGame}>
          Start Game
        </button>
      )}

      <button className="lobby-exit-button" onClick={handleExit}>Exit</button>
    </div>
  );
}

export default Room;
