// src/pages/Room.jsx
import React, { useState, useEffect, use } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket';
import PlayerList from '../components/PlayerList';
import './room.css';
import './lobby.css'
import { useNavigate } from "react-router-dom";
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

useEffect(() => {
  socket.on("gameStarted", ({ prompt, selectedUser }) => {
    // Store this data in local storage or context/state as needed
    localStorage.setItem("prompt", prompt);
    localStorage.setItem("judge", selectedUser);
    //console.log(selectedUser.username)
    navigate("/game"); // Use react-router navigate
  });

  return () => socket.off("gameStarted");
}, [navigate]);
// useEffect(() => {
//   const handlePlayerListUpdate = (players) => {
//     // Prevent empty overwrites (optional but useful)
//     if (players.length === 0) {
//       console.warn("🚨 Empty player list received — ignoring.");
//       return;
//     }

//     console.log("✅ Updated players from server:", players);
//     setPlayers(players);
//   };

//   socket.on("playerListUpdate", handlePlayerListUpdate);

//   return () => {
//     socket.off("playerListUpdate", handlePlayerListUpdate);
//   };
// }, []);
console.log("🧪 Room.jsx mounted. Attempting to join room:", roomId);

  useEffect(() => {
    if (!roomId) return;

  // Wait for socket to be connected
  if (socket.disconnected) {
    socket.connect(); // If it's not already connected
  }
    socket.emit('joinRoom', roomId);

 socket.on('roomJoined', ({ roomId, existingMembers, creator, playerNames }) => {
  console.log("📩 Received 'roomJoined' with roomId:", roomId);
  console.log("🟢 playerNames from backend:", playerNames);

  localStorage.setItem("roomCode", roomId);
  localStorage.setItem("playerNames", JSON.stringify(playerNames));
  localStorage.setItem("creator", creator);

  setCreator(creator);

  // Build the player list using playerNames
  setPlayers(
  [socket.id, ...existingMembers].map(id => ({
    id,
    name: playerNames[id],
  }))
);


});


socket.on('roomUpdate', ({ playerNames }) => {
  // ✅ Replace players with full info using the updated playerNames
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

// useEffect(() => {
//   socket.on("playerListUpdate", (updatedList) => {
//     setPlayers(updatedList); // or whatever your state setter is
//   });

//   return () => {
//     socket.off("playerListUpdate");
//   };
// }, []);

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
      <div >
        <PlayerList players={players} />
      </div>
      {socket.id === creator && (
  <button className="start-button" onClick={handleStartGame}>
    Start Game
  </button>
)}

    </div>
  );
}

export default Room;
