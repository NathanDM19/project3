const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
let userId = 0;
let totalUsers = 0;
const PORT = process.env.PORT || 3000

app.use(express.static('public'));

server.listen(PORT, () => {
  console.log('Webserver listening on port 3000...');
});

io.on('connection', socket => {
  // Initial connection
  let currentUser = userId;
  console.log(`Connected to user ${userId}`);
  socket.emit('connection', userId);
  userId++;
  totalUsers++;
  setTimeout(() => {
    socket.emit('whiteWall', { x: 400, y: 200, scaleX: 0.02, scaleY: 1.5, type: 1 })
    socket.emit('whiteWall', { x: 400, y: 500, scaleX: 0.15, scaleY: 0.25, type: 2 })
    socket.emit('whiteWall', { x: 1000, y: 200, scaleX: 0.15, scaleY: 0.25, type: 2 })
    socket.emit('whiteWall', { x: 1000, y: 500, scaleX: 0.02, scaleY: 1.5, type: 1 })
  }, 1000);


  // Disconenct
  socket.on('disconnect', (data) => {
    console.log(`User ${currentUser} disconnected`);
    totalUsers--;
    socket.broadcast.emit('userDisconnect', currentUser);
    return;
  })

  // Movement
  socket.on('movement', data => {
    console.log(data)
    socket.broadcast.emit('movement', data)
  })

  // Wall capture
  socket.on('whiteCapture', data => {
    socket.broadcast.emit('wall', data);
  })
  socket.on('whiteCreate', () => {
    let random = Math.random();
    if (random > 0.66) {
      io.emit('whiteWall', { x: Math.random() * 900 + 250, y: Math.random() * 380 + 160, scaleX: 0.02, scaleY: 1.5, type: 1 });
    } else if (random > 0.33) {
      io.emit('whiteWall', { x: Math.random() * 900 + 250, y: Math.random() * 380 + 160, scaleX: 0.15, scaleY: 0.25, type: 2 });
    } else if (random > 0) {
      io.emit('whiteWall', { x: Math.random() * 700 + 350, y: Math.random() * 180 + 260, scaleX: 0.04, scaleY: 0.5, type: 3});
    }
  })
});

