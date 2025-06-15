// src/App.jsx
import React ,{useEffect} from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Lobby from "./pages/Lobby";
import Room from "./pages/Room";
import Game from "./pages/Game";
import socket from "./socket";
import BlobbyBackground from './components/BlobbyBackground';
function App() {
  console.log("Lobby:", Lobby); // Should log a function, not an object
console.log("Room:", Room);   // Same here
useEffect(() => {
  const handleBeforeUnload = () => {
    const roomCode = localStorage.getItem("roomCode");
    if (roomCode) {
      socket.emit("leave-room", {
        room: roomCode,
        user: socket.id,
      });
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, []);

  return (
      <div className="relative w-full h-screen overflow-hidden bg-black">
      <BlobbyBackground />
    <Router>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/game" element={<Game />} />

      </Routes>
    </Router>
    </div>
  );
}

export default App;
