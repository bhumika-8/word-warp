import React from "react";
import socket from "../socket";
import "./PlayerList.css";


const PlayerList = ({ players }) => {

  return (
    <div className="player-list-room">
   {players.map((p, idx) => (
  <div
    key={idx}
    className="player-card-room" 
  >

          <p className="player-name-room">{`Player ${idx + 1}`}</p>
        </div>
      ))}
    </div>
  );
};

export default PlayerList;
