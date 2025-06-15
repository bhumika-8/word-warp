import React, { useState, useEffect } from "react";
import socket from "../socket";
import './game.css';
import { useNavigate } from "react-router-dom";
import useDisableBackButton from "./disable";
const Game = () => {
 

  const room = localStorage.getItem("roomCode");
  const currentUser = socket.id;
  const navigate = useNavigate();
 useDisableBackButton();
  const [prompt, setPrompt] = useState(localStorage.getItem("prompt") || "");
  const [judge, setJudge] = useState(localStorage.getItem("judge") || "");
  const [response, setResponse] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [allResponses, setAllResponses] = useState([]);
  const [expectedResponses, setExpectedResponses] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [finalReveal, setFinalReveal] = useState([]);
  const [winnerId, setWinnerId] = useState(null);
const [creator, setCreator] = useState(localStorage.getItem("creator"));


  const playerNames = JSON.parse(localStorage.getItem("playerNames") || "{}");
  const getPlayerName = (id) => playerNames[id] || id;

  const isJudge = currentUser === judge;

  const handleSubmit = () => {
    if (hasSubmitted || response.trim() === "") return;
    socket.emit("submit-response", {
      user: currentUser,
      response: response.trim(),
      room,
    });
    setHasSubmitted(true);
    setResponse("");
  };

  const handleJudgeSubmit = (index) => {
    if (index === null || !allResponses[index]) return;
    socket.emit("judge-select", {
      room,
      winner: allResponses[index].user,
      responses: allResponses,
    });
    setSelectedIndex(index);
  };

  const handleNextRound = () => {
    socket.emit("startNextRound", { room });
  };

  const handleExit = () => {
    socket.emit("leave-room", { room, user: currentUser });
    localStorage.clear();
    window.location.href = "/";
  };

  useEffect(() => {
    socket.on("all-responses", ({ totalNonJudges, responses }) => {
      setExpectedResponses(totalNonJudges);
      setAllResponses(responses);
    });
    socket.on("reveal-answers", ({ responses, winner }) => {
      setFinalReveal(responses);
      setWinnerId(winner);
    });
    socket.on("gameStarted", ({ prompt: newPrompt, selectedUser }) => {
      localStorage.setItem("prompt", newPrompt);
      localStorage.setItem("judge", selectedUser);
      setPrompt(newPrompt);
      setJudge(selectedUser);
      setResponse("");
      setHasSubmitted(false);
      setAllResponses([]);
      setExpectedResponses(0);
      setSelectedIndex(null);
      setFinalReveal([]);
      setWinnerId(null);
    });
    return () => {
      socket.off("all-responses");
      socket.off("reveal-answers");
      socket.off("gameStarted");
    };
  }, []);
useEffect(() => {
  const handleNewCreator = ({ newCreator }) => {
    console.log("👑 Received newCreator:", newCreator);
    localStorage.setItem("creator", newCreator);
    setCreator(newCreator); // 🔁 triggers re-render
  };

  socket.on("newCreator", handleNewCreator);

  return () => {
    socket.off("newCreator", handleNewCreator);
  };
}, []);

useEffect(() => {
  const code = localStorage.getItem("roomCode");
  console.log("👀 roomCode on mount:", code);

  socket.on("newCreator", ({ newCreator, newJudge, roomCode }) => {
    if (roomCode) localStorage.setItem("roomCode", roomCode);

    localStorage.setItem("creator", newCreator);
    localStorage.setItem("judge", newJudge);
    setJudge(newJudge);

    if (newCreator === socket.id) {
      alert("You are now the room creator and the judge.");
    }
  });

  return () => {
    socket.off("newCreator");
  };
}, []);




useEffect(() => {
  console.log("👀 roomCode on mount:", localStorage.getItem("roomCode"));
}, []);


  useEffect(() => {
    const storedNames = localStorage.getItem("playerNames");
    if (storedNames) {
      try {
        const playerNames = JSON.parse(storedNames);
        console.log("Player Names:", playerNames);
      } catch (error) {
        console.error("Failed to parse playerNames:", error);
      }
    } else {
      console.log("No playerNames found in localStorage");
    }
  }, []);

  useEffect(() => {
    socket.on("notEnoughPlayers", () => {
      alert("Game ended — not enough players left.");
      localStorage.removeItem("prompt");
      localStorage.removeItem("judge");

      navigate(`/room/${localStorage.getItem("roomCode")}`);
    });
    return () => {
      socket.off("notEnoughPlayers");
    };
  }, []);
useEffect(() => {
  socket.on("nextRoundReady", ({ nextJudge }) => {
    localStorage.removeItem("prompt");  
    localStorage.removeItem("judge");

    setJudge(nextJudge);
    localStorage.setItem("judge", nextJudge);

    if (nextJudge === socket.id) {
      alert("You're the new judge!");
    }
  });

  return () => {
    socket.off("nextRoundReady");
  };
}, []);
useEffect(() => {
  socket.on("newJudge", ({ newJudge, roomCode }) => {
    console.log("👨‍⚖️ New judge assigned:", newJudge);
    setJudge(newJudge);
    localStorage.setItem("judge", newJudge); // optional
  });

  return () => {
    socket.off("newJudge");
  };
}, []);

return (
  <div className="game-container">
    <button onClick={handleExit} className="exit-button">Exit Room</button>

    <div className="glass-box">
      <h2 className="judge-name">The Judge: {playerNames[judge]}</h2>
      <p className="prompt-text">{prompt}</p>

      {!isJudge && !hasSubmitted && (
        <div className="response-input">
          <input
            type="text"
            placeholder="Type your response..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
          />
          <button onClick={handleSubmit} className="custom-button">
            Submit
          </button>
        </div>
      )}

      {!isJudge && hasSubmitted && (
        <p className="waiting-message">Response submitted. Waiting for others...</p>
      )}

      {isJudge && allResponses.length === expectedResponses && !finalReveal.length && (
        <div className="response-options">
          <h3 className="select-title">Select the best response:</h3>
          {allResponses.map((r, index) => (
            <button
              key={index}
              onClick={() => handleJudgeSubmit(index)}
              className={`custom-button ${
                selectedIndex === index ? "bg-green-100 border-green-500" : ""
              }`}
            >
              {r.response}
            </button>
          ))}
        </div>
      )}

      {finalReveal.length > 0 && (
        <>
          <div className="reveal-section">
            <h3 className="reveal-title">Responses Revealed:</h3>
            <ul className="list-disc">
              {finalReveal.map((r, index) => (
                <li
                  key={index}
                  className={`response-item ${
                    r.user === winnerId ? "winner-response" : "normal-response"
                  }`}
                >
                  {r.response} — <span className="player-name">{getPlayerName(r.user)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="winner-banner">
            {winnerId === currentUser ? "You" : getPlayerName(winnerId) || "Unknown"} win
            {winnerId === currentUser ? "" : "s"} this round!
          </div>

          {socket.id===creator && (
            <button
              onClick={handleNextRound}
              className="custom-button"
              style={{ marginTop: "2rem" }}
            >
               Next Round
            </button>
          )}
        </>
      )}
    </div>
  </div>
);

};

export default Game;
