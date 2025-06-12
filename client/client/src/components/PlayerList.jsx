import React from "react";
import "./PlayerList.css";

const PlayerList = ({ players }) => {
  console.log("PlayerList props:", players);

  return (
    <div className="player-list-container">
      {players.map((p, idx) => (
        <div key={idx} className="player-card">
         <p className="player-name">{`Player ${idx + 1}`}</p>
        </div>
      ))}
    </div>
  );
};

export default PlayerList;
