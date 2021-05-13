require('dotenv').config();
const port = process.env.PORT || 5000;
const { v4: uuidV4 } = require('uuid');
const io = require('socket.io')(port, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

let allRooms = [];

io.on("connection", socket => {

  console.log("connection");

  socket.on("chat", () => {
    if (!allRooms.length) {
      // ROOM EMPTY, CREATE ROOM
      const newRoomName = uuidV4();
      allRooms.push(newRoomName);
      socket.join(newRoomName);
      return;
    }
    
    const roomName = allRooms[Math.floor(Math.random() * allRooms.length)];
    socket.join(roomName);
    socket.broadcast.to(roomName).emit("strangerJoin", roomName);
    socket.emit("joined", roomName);
    allRooms = allRooms.filter(room => room !== roomName);
  });

  socket.on("leave", (roomName) => {
    socket.broadcast.to(roomName).emit("strangerLeave", roomName);
    socket.leave(roomName);
    socket.emit("youLeave");
  });

  socket.on("message", ({ textMessage, room: roomName }) => {
    socket.broadcast.to(roomName).emit("newMessage", { textMessage, sender: socket.id });
  });

  socket.on("isTyping", ({ room: roomName, isTyping }) => {
    socket.broadcast.to(roomName).emit("isTyping", isTyping);
  });

  socket.on("disconnect", () => {
    console.log("disconnect");
  })
});