const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
let userId = 0;
let totalUsers = 0;
let allUsers = {}
const PORT = process.env.PORT || 3000

app.use(express.static('public'));

server.listen(PORT, () => {
  console.log('Webserver listening on port 3000...');
});

io.on('connection', socket => {
  // Initial connection
  let currentUser = userId;
  console.log(`Connected to user ${userId}`);
  socket.emit('connection', {currentUser, allUsers});
  allUsers[userId] = {x: 400, y: 490, direction: 'turn', ability: null};
  socket.broadcast.emit('userConnect', userId);
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
    delete allUsers[currentUser]
    return;
  })

  // Movement
  socket.on('movement', data => {
    console.log(data)
    socket.broadcast.emit('movement', data)
    allUsers[data.id].x = data.x
    allUsers[data.id].y = data.y
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
    } else if (random > 0.16) {
      io.emit('whiteWall', { x: Math.random() * 700 + 350, y: Math.random() * 180 + 260, scaleX: 0.04, scaleY: 0.5, type: 3});
    } else if (random > 0) {
      io.emit('whiteWall', { x: Math.random() * 500 + 450, y: Math.random() * 80 + 310, scaleX: 0.06, scaleY: 0.75, type: 4});
    }
  })
  socket.on('ability', data => {
    socket.broadcast.emit('ability', data)
  })
});

