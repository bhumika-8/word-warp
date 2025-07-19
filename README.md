# Word Warp 

**Word Warp** is a real-time multiplayer party game built with **React**, **Node.js**, **Express**, and **Socket.IO**. Players can join or create rooms, receive creative prompts, submit anonymous responses, and vote on the best answer through a rotating judge system.

---

## Features

- Real-time multiplayer gameplay with Socket.IO
- Room creation & joining via code
- Rotating judge mechanism each round
- Prompt-based response submissions
- Anonymous voting and winner selection
- Handles player disconnections gracefully
- Fully deployed and playable online

---

## Stack

| Layer     | Tech                      |
|-----------|---------------------------|
| Frontend  | React, CSS |
| Backend   | Node.js, Express, Socket.IO |
| Hosting   | Vercel (frontend), Render (backend) |
| Storage   | In-memory (no database)   |

---

## Live Demo

- Frontend: [https://word-warp-ten.vercel.app](https://word-warp-ten.vercel.app)
- Backend: https://word-warp.onrender.com

---
## Local Development

### Clone the repo

```bash
git clone https://github.com/bhumika-8/word-warp.git
cd word-warp
```

### BACKEND SETUP
```bash
cd backend
npm install
cd server/src
nodemon index.js
```
Runs at http://localhost:5000

### Frontend Setup
```bash
cd ../client/client
npm install
npm run dev
```
Runs at http://localhost:3000

## Project Structure

```bash
word-warp/
├── client/
│   ├── public/
│   └── src/
│       ├── components/         # UI components (navbar, modal, etc.)
│       ├── pages/              # Route pages (Home, Room, Game)
│       ├── App.jsx             # Main component with routes
│       ├── index.js            # Entry point
│       └── socket.js           # Handles client-side socket events
│
├── server/
│   └── src/
│       ├── controllers/        # Functions handling game logic
│       ├── data/               # Static data (e.g. word lists)
│       ├── services/           # Business logic layer
│       ├── socket/             # Socket.IO server handlers
│       ├── utils/              # Utility helpers
│       └── index.js            # Server entry point
│
├── README.md
└── ...
```
## Future Enhancements

- Add in-game score tracking with a dynamic leaderboard for current game.
- Implement a global leaderboard to highlight top performers across sessions.
- Introduce user authentication to enable persistent profiles and game history.
- Build an admin panel for monitoring rooms, managing users, and moderating games.

## Author

**Bhumika**  
Computer Science Student  
GitHub: https://github.com/bhumika-8
