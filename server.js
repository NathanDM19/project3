const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
let userId = 0;
let currentRound = 0;
let totalUsers = 0;
let totalReady = 0;
let allUsers = {};
let users = {};
let score = { blue: 0, red: 0 };
let startingPositions2 = { blue: { x: 300, y: 360 }, red: { x: 1100, y: 360 } };
let startingPositions4 = { blue: [{ x: 300, y: 220 }, { x: 300, y: 510 }], red: [{ x: 1100, y: 220 }, { x: 1100, y: 510 }] };

let teams = { red: {}, blue: {} };
const PORT = process.env.PORT || 3000

app.use(express.static('public'));

server.listen(PORT, () => {
  console.log(`Webserver listening on port ${PORT}`);
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

  // Team join
  socket.on('teamJoin', data => {
    if (data.team === "blue") {
      teams.blue[data.id] = data.name
    } else if (data.team === "red") {
      teams.red[data.id] = data.name
    }
    socket.broadcast.emit('teamJoin', data);
  })
  socket.on('ready', data => {
    totalReady++;
    users[data.id] = {}
    users[data.id].team = data.team
    users[data.id].character = data.character;
    io.emit('ready', {totalReady, totalUsers });
    if (totalReady === totalUsers) {
      totalReady = 0;
      if (totalUsers === 2) {
        console.log("Starting game")
        io.emit('startGame', { startingPositions2, users, teams })
      } else if (totalUsers === 4) {
        io.emit('startGame', { startingPositions4, users, teams })
      } // 400 200
      io.emit('whiteWall', { x: 500, y: 300, scaleX: 0.02, scaleY: 1.5, type: 6 })
      io.emit('whiteWall', { x: 400, y: 500, scaleX: 0.15, scaleY: 0.25, type: 1 })
      io.emit('whiteWall', { x: 1000, y: 200, scaleX: 0.15, scaleY: 0.25, type: 2 })
      io.emit('whiteWall', { x: 1000, y: 500, scaleX: 0.02, scaleY: 1.5, type: 1 })
    }
  })
  socket.on('joinedLobby', data => {
    socket.emit('ready', { totalReady, totalUsers });
  });
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
    socket.broadcast.emit('movement', data)
    allUsers[data.id].x = data.x
    allUsers[data.id].y = data.y
  })
  socket.on('death', team => {
    if (team === "red") {
      io.emit('point', 'blue')
      score.blue++;
    } else if (team === "blue") {
      io.emit('point', 'red')
      score.red++;
    }
    currentRound++;
    if (score.red < 5 && score.blue < 5) {
      io.emit('startGame', { startingPositions2, users, teams, newRound: true })
    } else if (score.red === 5) { 
      io.emit('winner', 'Red')
    } else if (score.blue === 5) {
      io.emit('winner', 'Blue')
    }
  })
  // Wall capture
  socket.on('whiteCapture', data => {
    let round = currentRound;
    io.emit('wall', data)
    setTimeout(function () {
      if (round === currentRound) {
        let random = Math.random();
        if (random > 0.75) {
          io.emit('whiteWall', { x: Math.random() * 900 + 250, y: Math.random() * 380 + 160, scaleX: 0.02, scaleY: 1.5, type: 1 });
        } else if (random > 0.5) {
          io.emit('whiteWall', { x: Math.random() * 900 + 250, y: Math.random() * 380 + 160, scaleX: 0.15, scaleY: 0.25, type: 2 });
        } else if (random > 0.375) {
          io.emit('whiteWall', { x: Math.random() * 700 + 350, y: Math.random() * 180 + 260, scaleX: 0.04, scaleY: 0.5, type: 3 });
        } else if (random > 0.25) {
          io.emit('whiteWall', { x: Math.random() * 500 + 450, y: Math.random() * 80 + 310, scaleX: 0.06, scaleY: 0.75, type: 4 });
        } else if (random > 0.125) {    
          io.emit('whiteWall', {x: Math.random() * 760 + 320, y: Math.random() * 225 + 240, type: 5})
        } else if (random > 0) {
          io.emit('whiteWall', { x: Math.random() * 760 + 320, y: Math.random() * 225 + 240, type: 6})
        }
      }
    }, 7000);
  })
  socket.on('reset', () => {
    currentRound = 0;
    allUsers = {};
    users = {}
    teams = { red: {}, blue: {} };
    score = { blue: 0, red: 0 };
  })
  socket.on('ability', data => {
    socket.broadcast.emit('ability', data)
  })
});

