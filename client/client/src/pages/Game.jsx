import React, { useState, useEffect } from "react";
import socket from "../socket";
import './game.css';

const Game = () => {
  const room = localStorage.getItem("roomCode");
  const currentUser = socket.id;

  const [prompt, setPrompt] = useState(localStorage.getItem("prompt") || "");
  const [judge, setJudge] = useState(localStorage.getItem("judge") || "");
  const [response, setResponse] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [allResponses, setAllResponses] = useState([]);
  const [expectedResponses, setExpectedResponses] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [finalReveal, setFinalReveal] = useState([]);
  const [winnerId, setWinnerId] = useState(null);
const creator = localStorage.getItem("creator");
//const playerNames = JSON.parse(localStorage.getItem("playerNames") || "{}");

// const getDisplayName = (id) => {
//   if (id === socket.id) return "You";
//   return playerNames[id] || "Unknown Player";
// };
const playerNames = JSON.parse(localStorage.getItem("playerNames") || "{}");
const currentUserName = playerNames[socket.id] || "You";

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
    socket.emit("startGame", { roomCode: room });
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
  socket.on("newCreator", ({ newCreator, newJudge }) => {
    localStorage.setItem("creator", newCreator);
    localStorage.setItem("judge", newJudge);
    setJudge(newJudge);
    if (newCreator === socket.id) {
  alert("You are now the room creator and the judge.");
}
 // assuming you have this in state
  });

  return () => {
    socket.off("newCreator");
    
  };
}, []);
//import { useEffect } from "react";

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



  return (
    <div className="game-container p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-[#4A628A]">The Judge: {judge}</h2>
        <button onClick={handleExit} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Exit Room
        </button>
      </div>

      <p className="text-xl mb-6">{prompt}</p>

      {!isJudge && !hasSubmitted && (
        <div className="response-input flex gap-2">
          <input
            type="text"
            placeholder="Type your response..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="custom-input"
          />
          <button onClick={handleSubmit} className="custom-button">
            Submit
          </button>
        </div>
      )}

      {!isJudge && hasSubmitted && (
        <p className="mt-4 text-green-600 font-medium text-lg">
          Response submitted. Waiting for others...
        </p>
      )}

      {isJudge && allResponses.length === expectedResponses && !finalReveal.length && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Select the best response:</h3>
          <div className="flex flex-col gap-2">
            {allResponses.map((r, index) => (
  <button
    key={index}
    onClick={() => handleJudgeSubmit(index)}
    className={`custom-button text-left ${
      selectedIndex === index ? "bg-green-100 border-green-500 border-2" : ""
    }`}
  >
    {r.response}
  </button>
            ))}
          </div>
        </div>
      )}

      {finalReveal.length > 0 && (
        <>
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Responses Revealed:</h3>
            <ul className="list-disc ml-6">
              {finalReveal.map((r, index) => (
                <li
                  key={index}
                  className={`mb-1 ${
                    r.user === winnerId ? "font-bold text-green-700" : "text-gray-800"
                  }`}
                >
                  {r.response} — <span className="text-xs italic">{r.user}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="winner-banner mt-6 text-xl font-semibold">
            🎉 {winnerId === currentUser ? "You" : winnerId} win{winnerId === currentUser ? "" : "s"} this round!
          </div>

          {currentUser === creator && (
  <button
    onClick={handleNextRound}
    className="custom-button mt-4 bg-[#4A628A] text-white hover:bg-[#3a4f6a]"
  >
    🔄 Next Round
  </button>
)}

        </>
      )}
    </div>
  );
};

export default Game;
