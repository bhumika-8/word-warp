import { io } from 'socket.io-client';

const socket = io("https://word-warp.onrender.com", {
  transports: ["websocket"],
});
export default socket;