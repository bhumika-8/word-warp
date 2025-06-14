// src/pages/Room.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket';
import PlayerList from '../components/PlayerList';
import './room.css';
import './lobby.css'
import { useNavigate } from "react-router-dom";


function Room() {
  const navigate = useNavigate();

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

  useEffect(() => {
    socket.emit('joinRoom', roomId);

    socket.on('roomJoined', ({ roomId , existingMembers,creator ,playerNames}) => {
       localStorage.setItem("roomCode", roomId);
        console.log("🟢 playerNames from backend:", playerNames);
    setPlayers([{ id: socket.id, name: "You" }, ...existingMembers.map(id => ({ id, name: `Player` }))])
 localStorage.setItem("playerNames", JSON.stringify(playerNames)); 
      setCreator(creator);
      localStorage.setItem("creator", creator); // from roomJoined

    });

   socket.on('roomUpdate', ({ newMember }) => {
  setPlayers((prev) => {
    const alreadyExists = prev.some(p => p.id === newMember);
    if (!alreadyExists) {
      return [...prev, { id: newMember, name: `Player` }];
    }
    return prev;
  });
});


    return () => {
      socket.off('roomJoined');
      socket.off('roomUpdate');
    };
  }, [roomId]);
useEffect(() => {
  console.log("Updated players:", players);
}, [players]);
useEffect(() => {
  socket.on("playerListUpdate", (updatedList) => {
    setPlayers(updatedList); // or whatever your state setter is
  });

  return () => {
    socket.off("playerListUpdate");
  };
}, []);

  return (
    <div className="room-container">
      <h2 className="room-heading">Room Code: {roomId}</h2>
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
