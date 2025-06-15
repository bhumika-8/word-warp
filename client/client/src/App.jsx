// src/App.jsx
import React ,{useEffect} from 'react';

import Lobby from "./pages/Lobby";
import Room from "./pages/Room";
import Game from "./pages/Game";

import BlobbyBackground from './components/BlobbyBackground';
import LandingPage from './pages/Landingpage';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
 // adjust as per your imports


const AppWrapper = () => {
  const location = useLocation();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Only show blobs if not on the landing page */}
      {location.pathname !== "/" && <BlobbyBackground />}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </div>
  );
};

// Wrap with Router outside
const App = () => (
  <Router>
    <AppWrapper />
  </Router>
);

export default App;

