// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Lobby from "./pages/Lobby";
import Room from "./pages/Room";
import Game from "./pages/Game"
function App() {
  console.log("Lobby:", Lobby); // Should log a function, not an object
console.log("Room:", Room);   // Same here

  return (
    
    <Router>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/game" element={<Game />} />

      </Routes>
    </Router>
  );
}

export default App;
