// const socket = io.connect(window.location.hostname);
// const socket = io.connect("http://10.1.5.248:3000")
const socket = io.connect("http://localhost:3000");

// GLOBALS
let gameEdit, player, ability, playerNameText, directionTemp, teamText, name, ready, winner, roundWinText;
let team = "nutin";
let speed = 200;
let id = null;
let activeGame = false;

let currentRound = 0;
let character = "ninja";
let playerAbility = { cooldown: 0, barNum: 0, bar: "", barBack: "", type: "main" };
let playerDetails = {};
let playerCreated = {};
let playerSprites = {};
let playerNames = {};
let playerAbilities = {};
let score = { blue: 0, red: 0, blueText: null, redText: null };
let x = 0;
let y = 0;
let xTemp = 0;
let yTemp = 0;
let direction = 'idle'
let walls = {
  white: {},
  whiteGroup: "",
  whiteCounter: 0,
  // Object with objects of walls
  red: {},
  // Group for making walls
  redGroup: "",
  // Wall counter to make unique walls
  redCounter: 0,
  // Current alive wall ids to be able to delete them
  redArray: [],
  blue: {},
  blueGroup: "",
  blueCounter: 0,
  blueArray: [],
}

// On connection, emit response to server
socket.on('connect', () => {
});
// Setting id for user
socket.on('connection', data => {
  console.log("Welcome user " + data.currentUser)
  id = data.currentUser
  playerDetails = data.allUsers

});
socket.on('userConnect', id => {
  console.log("User " + id + " has connected.")
  playerDetails[id] = {x: 400, y: 490, direction: 'idle', ability: null};
})
// Movement of other players
socket.on('movement', data => {
  playerDetails[data.id].x = data.x
  playerDetails[data.id].y = data.y
  playerDetails[data.id].direction = data.direction
})
socket.on('startGame', data => {
  currentRound++;
  speed = 200;
  player.disableBody();
  playerAbility.barNum = 0;
  activeGame = false;
  if (roundWinText) {
    roundWinText.setText("");
  }
  playerNameText.setText(name)
  playerNameText.setStyle({fontSize: '20px', fill: team, fontFamily: "Orbitron" })
  for (key in data.teams.red) {
    for (names in playerNames) {
      if (key === names) {
        playerNames[names].setText(data.teams.red[key])
        playerNames[names].setStyle({ fontSize: '20px', fill: 'red', fontFamily: "Orbitron" })
      }
    }
  }
  for (key in data.teams.blue) {
    for (names in playerNames) {
      if (key === names) {
        playerNames[names].setText(data.teams.blue[key])
        playerNames[names].setStyle({ fontSize: '20px', fill: 'blue', fontFamily: "Orbitron" })
      }
    }
  }
  for (key in walls.blue) {
    walls.blue[key]
    walls.blue[key].setScale(0);
    walls.blue[key].disableBody();
    delete walls.blue[key]
    walls.blueArray.shift();
  }
  for (key in walls.red) {
    walls.red[key]
    walls.red[key].setScale(0);
    walls.red[key].disableBody();
    delete walls.red[key]
    walls.redArray.shift();
  }
  for (key in walls.white) {
    walls.white[key]
    walls.white[key].setScale(0);
    walls.white[key].disableBody();
    delete walls.white[key]
  }
  if (playerAbility.obj) {
    playerAbility.obj.setScale(0);
    playerAbility.obj.disableBody();
    playerAbility.type = "main";
    delete playerAbility.obj;
  }
  for (key in playerDetails) {
    if (playerDetails[key].ability) {
      playerDetails[key].ability.setScale(0);
      playerDetails[key].ability.disableBody();
      playerDetails[key].ability = null;  
    }
  }
  walls.redCounter = 0;
  walls.blueCounter = 0;
  walls.whiteCounter = 0;
  player.x = data.startingPositions2[team].x
  player.y = data.startingPositions2[team].y
  // Useless comment
  for (key in data.users) {
    if (key != id) {
      playerSprites[parseInt(key)].x = data.startingPositions2[data.users[key].team].x
      playerSprites[parseInt(key)].y = data.startingPositions2[data.users[key].team].y
      playerNames[key].x = playerSprites[key].x - 37;
      playerNames[key].y = playerSprites[key].y - 80;
      playerAbilities[key].bar.x = playerSprites[key].x - ((100 - playerAbilities[key].barNum) / 3)
      playerAbilities[key].bar.y = playerSprites[key].y - 46;
      playerAbilities[key].bar.setScale(playerAbilities[key].barNum / 50, 0.5)
      playerAbilities[key].barBack.x = playerSprites[key].x;
      playerAbilities[key].barBack.y = playerSprites[key].y - 46;
      playerAbilities[key].barNum = 0;
      playerAbilities[key].type = "main";
      playerDetails[key].character = data.users[key].character;
      playerSprites[key].anims.play(`${playerDetails[key].character}Idle`, true);
    }
  }
  $('#secondDiv').css({ display: 'none' });
  $('canvas').css({ display: "block" });
  $('#gameDiv').css({display: "block"})
  if (data.newRound) {
    makeWhiteWall(400, 200, 0.02, 1.5, walls.whiteCounter, 2);
    makeWhiteWall(400, 500, 0.15, 0.25, walls.whiteCounter, 1);
    makeWhiteWall(1000, 200, 0.15, 0.25, walls.whiteCounter, 2);
    makeWhiteWall(1000, 500, 0.02, 1.5, walls.whiteCounter, 1);
  } else {
    document.getElementById('gameAudio').play();
  }
  let timer = 3;
  let countdownText = gameEdit.add.text(680, 300, '3', { fontSize: '80px', fill: 'white', fontFamily: 'Orbitron' });
  let startCounter = window.setInterval(function () {
    timer--;
    countdownText.setText(timer)
    if (timer === 0) {
      player.enableBody(true, data.startingPositions2[team].x, data.startingPositions2[team].y);
      countdownText.setText("");
      window.clearInterval(startCounter);
      activeGame = true;
      console.log("CHANGED BEFORE", player.x, player.y)
    }
  }, 1000)
})
socket.on('timeout', data => {
  activeGame = false;
})
// User disconnects
socket.on('userDisconnect', data => {
  playerDetails[data] = 'disconnected';
});
socket.on('winner', data => {
  player.disableBody();
  $('canvas').css({ display: 'none' })
  winner = data;
  $('#endDiv').css({ display: 'block' });
  $('#winnerText').text(`${winner} Team has won the game!`);
})
socket.on('ready', data => {
  $('#totalReady').text(`${data.totalReady} / ${data.totalUsers} Ready`)
})
socket.on('point', team => {
  score[team]++;
  activeGame = false;
  $(`#${team}Score`).text(`${score[team]}`)
  roundWinText = gameEdit.add.text(300, 300, `${team[0].toUpperCase() + team.slice(1)} Team has won the round!`, { fontSize: '50px', fill: 'white', fontFamily: 'Orbitron' });
  roundWinText.depth = 100;
  if (score[team] === 1) {
    $(`#${team}Score`).css({ top: '-40px', left: '17px' })
  } else {
    $(`#${team}Score`).css({ top: '-40px', left: '6px' })
  }
})
// Spawn white wall;
socket.on('whiteWall', data => {
  if (data.type === 5) {
    makeWhiteWall(data.x, data.y, data.scaleX, data.scaleY, walls.whiteCounter, 5.1);
    makeWhiteWall(data.x, data.y, data.scaleX, data.scaleY, walls.whiteCounter, 5.2);    
  } else if (data.type === 6) {
    makeWhiteWall(data.x, data.y, data.scaleX, data.scaleY, walls.whiteCounter, 6.1);
    makeWhiteWall(data.x, data.y, data.scaleX, data.scaleY, walls.whiteCounter, 6.2);  
  }  else {
    makeWhiteWall(data.x, data.y, data.scaleX, data.scaleY, walls.whiteCounter, data.type);
  }
});
// Spawn color walls;
socket.on('wall', data => {
  spawnColorWall(data);
})
socket.on('ability', data => {
  if (data.type === "ninja") {
    if (!playerDetails[data.id].ability) {
      playerDetails[data.id].ability = ability.create(data.x, data.y, 'ability').setScale(0.15).refreshBody();
      playerAbilities[data.id].barNum = 0;
      playerAbilities[data.id].type = "use"
    } else {
      playerDetails[data.id].ability.setScale(0);
      playerDetails[data.id].ability.disableBody();
      playerDetails[data.id].ability = null;
      playerAbilities[data.id].barNum = 0;
      playerAbilities[data.id].type = "main"
    }
  } else if (data.type === "robot" || data.type === "dog") {
    playerAbilities[data.id].type = "use";
  } else if (data.type === "cowboy") {
    speed = 120;
    playerAbilities[data.id].type = "use";
  }
})

var config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: true
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config);

function preload() {
  gameEdit = this;
  this.load.multiatlas('ninja', 'assets/ninja.json', 'assets');
  this.load.multiatlas('robot', 'assets/robot.json', 'assets');
  this.load.multiatlas('dog', 'assets/dog.json', 'assets');
  this.load.multiatlas('cowboy', 'assets/cowboy.json', 'assets');
  this.load.image('wall', 'assets/platform.png');
  this.load.image('redWall', 'assets/Red_laser.png');
  this.load.image('redWallUp', 'assets/Red_laser_up.png')
  this.load.image('blueWall', 'assets/Blue_laser.png');
  this.load.image('blueWallUp', 'assets/Blue_laser_up.png')
  this.load.image('whiteWall', 'assets/Green_laser.png');
  this.load.image('whiteWallUp', '/assets/Green_laser_up.png')
  this.load.image('whiteWallCircle', '/assets/Green_laser_circle.png')
  this.load.image('background', 'assets/background.jpg');
  this.load.image('ability', 'assets/ninjaStar.png')
  this.load.image('abilityBar', 'assets/abilityBar.png')
  this.load.image('abilityBarBack', 'assets/abilityBarBack.png')
  this.load.image('arena', 'assets/arena.png');
  this.load.image('leftArena', 'assets/leftArena.png');
  this.load.image('topArena', 'assets/topArena.png')
  this.load.image('bottomArena', 'assets/bottomArena.png')
}
function create() {
  // Creating player and walls
  walls.redGroup = this.physics.add.staticGroup();
  walls.blueGroup = this.physics.add.staticGroup();
  background = this.physics.add.staticGroup();
  const border = this.physics.add.staticGroup();
  walls.whiteGroup = this.physics.add.staticGroup();
  ability = this.physics.add.staticGroup();
  let backgroundImage = background.create(700, 400, 'background').setScale(1).refreshBody();
  let arena = background.create(442, 220, 'arena').setScale(1.008, 1.06).refreshBody();
  let leftArena = background.create(-599, 212, 'leftArena').setScale(1, 1.078).refreshBody();
  let topArena = background.create(442, -484, 'topArena').setScale(1.008, 1).refreshBody()
  let bottomArena = background.create(974, 1184, 'bottomArena').setScale(1.009, 1).refreshBody();
  let rightArena = background.create(2000, 212, 'leftArena').setScale(1, 1.078).refreshBody()
  bottomArena.depth = 0.1;
  backgroundImage.depth = -3;
  topArena.depth = 0.1;
  leftArena.depth = 0.1;
  rightArena.depth = 0.1;
  rightArena.flipX = true;
  arena.depth = -2;
  player = this.physics.add.sprite(690, 320, 'ninja', "Idle__000.png").setScale(0.15);
  player.depth = 10;
  playerNameText = this.add.text(200, 200, `Player ${id}`, { fontSize: '12px', fill: '#FFF', fontFamily: "Orbitron" });
  player.disableBody();
  playerAbility.barBack = ability.create(100, 100, 'abilityBarBack').setScale(2, 0.5).refreshBody();
  playerAbility.barBack.depth = 1;
  playerAbility.bar = ability.create(100, 100, 'abilityBar').setScale(2, 0.5).refreshBody()
  playerAbility.bar.depth = 2;
  playerNameText.depth = 2;
  this.physics.add.collider(player, walls);
  this.anims.create({
    key: 'ninjaIdle',
    frames: [{ key: 'ninja', frame: 'Idle__001.png' }],
    frameRate: '20'
  });
  this.anims.create({
    key: 'ninjaRun',
    frames: this.anims.generateFrameNames('ninja', {
      start: 0, end: 9, zeroPad: 3,
      prefix: 'Run__', suffix: '.png'
    }),
    frameRate: 12,
    repeat: -1
  });
  this.anims.create({
    key: 'robotIdle',
    frames: [{ key: 'robot', frame: 'Idle (1).png' }],
    frameRate: '20'
  });
  this.anims.create({
    key: 'robotRun',
    frames: this.anims.generateFrameNames('robot', {
      start: 1, end: 8, zeroPad: 1,
      prefix: 'Run (', suffix: ').png'
    }),
    frameRate: 12,
    repeat: -1
  });
  this.anims.create({
    key: 'dogIdle',
    frames: [{ key: 'dog', frame: 'Idle (1).png' }],
    frameRate: '20'
  });
  this.anims.create({
    key: 'dogRun',
    frames: this.anims.generateFrameNames('dog', {
      start: 1, end: 8, zeroPad: 1,
      prefix: 'Run (', suffix: ').png'
    }),
    frameRate: 12,
    repeat: -1
  });
  this.anims.create({
    key: 'cowboyIdle',
    frames: [{ key: 'cowboy', frame: 'Idle__001.png' }],
    frameRate: '20'
  });
  this.anims.create({
    key: 'cowboyRun',
    frames: this.anims.generateFrameNames('cowboy', {
      start: 1, end: 9, zeroPad: 3,
      prefix: 'Run__', suffix: '.png'
    }),
    frameRate: 12,
    repeat: -1
  });
  cursors = this.input.keyboard.createCursorKeys();
}
function update() {
  for (let key in playerDetails) {
    // If player has left, remove sprite
    if (playerDetails[key] === 'disconnected') {
      if (playerSprites[key]) {
        playerSprites[key].disableBody();
        playerSprites[key].setScale(0)
        playerNames[key].setScale(0)
        playerAbilities[key].bar.setScale(0);
        playerAbilities[key].barBack.setScale(0)
      }
    } else {
      if (!playerCreated[key]) {
        playerSprites[key] = gameEdit.physics.add.sprite(400, 490, 'player').setScale(0.15)
        playerSprites[key].depth = 10;
        playerCreated[key] = true
        playerNames[key] = gameEdit.add.text(100, 100, `Player ${key}`, { fontSize: '12px', fill: '#FFF', fontFamily: 'Helvetica' });
        playerNames[key].depth = 2;
        playerAbilities[key] = {};
        playerAbilities[key].barBack = ability.create(100, 100, 'abilityBarBack').setScale(2, 0.5).refreshBody();
        playerAbilities[key].barBack.depth = 1;
        playerAbilities[key].bar = ability.create(100, 100, 'abilityBar').setScale(2, 0.5).refreshBody();
        playerAbilities[key].bar.depth = 2;
        playerAbilities[key].barNum = 0;
        playerAbilities[key].type = "main";
      }
      playerAbilities[key].bar.x = playerSprites[key].x - ((100 - playerAbilities[key].barNum) / 3)
      playerAbilities[key].bar.y = playerSprites[key].y - 46;
      playerAbilities[key].bar.setScale(playerAbilities[key].barNum / 50, 0.5)
      playerAbilities[key].barBack.x = playerSprites[key].x;
      playerAbilities[key].barBack.y = playerSprites[key].y - 46;
      if (playerSprites[key].x !== playerDetails[key].x || playerSprites[key].y !== playerDetails[key].y || playerDetails[key].direction !== playerDetails[key].tempDirection) {
        playerDetails[key].tempDirection = playerDetails[key].direction;
        playerSprites[key].x = playerDetails[key].x;
        playerSprites[key].y = playerDetails[key].y;
        playerNames[key].x = playerDetails[key].x - 37;
        playerNames[key].y = playerDetails[key].y - 80;
        if (activeGame) {
          if (playerDetails[key].direction === 'idle') {
            playerSprites[key].anims.play(`${playerDetails[key].character}Idle`, true);
          } else {
            playerSprites[key].anims.play(`${playerDetails[key].character}Run`, true);
          }
          if (playerDetails[key].direction === 'left') {
            playerSprites[key].flipX = true;
          } else if (playerDetails[key].direction === 'right') {
            playerSprites[key].flipX = false;
          }
        }
      }
    }
  }
  x = player.x
  y = player.y
  playerNameText.x = player.x - 37;
  playerNameText.y = player.y - 80;
  playerAbility.bar.x = player.x - ((100 - playerAbility.barNum) / 3)
  playerAbility.bar.y = player.y - 46;
  playerAbility.bar.setScale(playerAbility.barNum / 50, 0.5)
  playerAbility.barBack.x = player.x;
  playerAbility.barBack.y = player.y - 46;
  if (player.y <= 151) {
    player.y = 549.9
  } else if (player.y >= 550) {
    player.y = 151.1;
  } else if (player.x <= 225) {
    player.x = 1180.9;
  } else if (player.x >= 1181) {
    player.x = 225.1;
  }
  if (x > xTemp + 2 || x < xTemp - 2 || y > yTemp + 2 || y < yTemp - 2 || direction !== directionTemp) {
    x = Math.round(x);
    y = Math.round(y);
    socket.emit('movement', { id, x, y, direction })
    xTemp = x
    yTemp = y
    directionTemp = direction
  }
  // PLAYER MOVEMENT
  if (cursors.left.isDown) {
    player.setVelocityX(-speed);
    direction = 'left';
    player.anims.play(`${character}Run`, true);
    player.flipX = true;
  }
  if (cursors.right.isDown) {
    player.setVelocityX(speed)
    direction = 'right';
    player.anims.play(`${character}Run`, true);
    player.flipX = false;
  }
  if (cursors.up.isDown) {
    if (cursors.left.isUp && cursors.right.isUp) {
      direction = 'idle'
      player.anims.play(`${character}Run`, true);
    }
    player.setVelocityY(-speed)
  }
  if (cursors.down.isDown) {
    if (cursors.left.isUp && cursors.right.isUp) {
      direction = 'idle';
      player.anims.play(`${character}Run`, true)
    }
    player.setVelocityY(speed)
  }
  if (cursors.left.isUp && cursors.right.isUp) {
    direction = 'idle'
    player.setVelocityX(0)

  }
  if (cursors.up.isUp && cursors.down.isUp) {
    if (cursors.left.isUp && cursors.right.isUp) {
      direction = 'idle'
      player.anims.play(`${character}Idle`)
    }
    player.setVelocityY(0)
  }
  // BASIC ATTACK
  if (cursors.space.isDown && playerAbility.barNum === 100 && activeGame) {
    if (character === "ninja") {
      if (playerAbility.type === "main") {
        playerAbility.obj = ability.create(player.x, player.y, 'ability').setScale(0.15).refreshBody();
        playerAbility.type = "use"
        playerAbility.barNum = 0;
        socket.emit('ability', { type: "ninja", id, x: player.x, y: player.y })
      } else if (playerAbility.type === "use") {
        player.x = playerAbility.obj.x;
        player.y = playerAbility.obj.y;
        playerAbility.obj.setScale(0);
        playerAbility.obj.disableBody();
        playerAbility.type = "main"
        playerAbility.barNum = 0;
        socket.emit('ability', { type: "ninja", id })
      }
    } else if (character === "robot") {
      if (playerAbility.type === "main") {
        player.god = true;
        playerAbility.type = "use"
        socket.emit('ability', { type: 'robot', id })
      }
    } else if (character === "dog") {
      if (playerAbility.type === "main") {
        speed = 350;
        playerAbility.type = "use"
        socket.emit('ability', { type: 'dog', id })
      }
    } else if (character === "cowboy") {
      if (playerAbility.type === "main") {
        playerAbility.type = "use"
        socket.emit('ability', { type: 'cowboy', id });
      }
    }
  }
  if (playerAbility.barNum === 0 && playerAbility.type === "use" && character === "robot") {
    playerAbility.type = "main"
    player.god = false;
  } else if (playerAbility.barNum === 0 && playerAbility.type === "use" && character === "dog") {
    playerAbility.type = "main"
    speed = 200;
  } else if (playerAbility.barNum === 0 && playerAbility.type === "use" && character === "cowboy") {
    playerAbility.type = "main"
  }
  if (activeGame) {

    for (key in walls.red) {
      if (walls.red[key].type === 1) {
        wallMovement('red', key, 196, 1204)
      } else if (walls.red[key].type === 2) {
        wallMovement('red', key, 112, 588)
      } else if (walls.red[key].type === 3 || walls.red[key].type === 4) {
        wallMovement('red', key)
      } else if (walls.red[key].type === 5) {
        wallMovement('red', key, 320, 1080)
      } else if (walls.red[key].type === 6) {
        wallMovement('red', key, 240, 465)
      }
    }
    for (key in walls.blue) {
      if (walls.blue[key].type === 1) {
        wallMovement('blue', key, 196, 1204)
      } else if (walls.blue[key].type === 2) {
        wallMovement('blue', key, 112, 588)
      } else if (walls.blue[key].type === 3 || walls.blue[key].type === 4) {
        wallMovement('blue', key)
      } else if (walls.blue[key].type === 5) {
        wallMovement('blue', key, 320, 1080)
      } else if (walls.blue[key].type === 6) {
        wallMovement('blue', key, 240, 465)
      }
    }
  }
}
const wallMovement = function (team, key, low, high) {
  if (walls[team][key].type === 1) {
    if (walls[team][key].direction === "right") {
      if (walls[team][key].x >= high) {
        walls[team][key].direction = 'left';
      } else {
        walls[team][key].x += 2;
      }
    } else {
      if (walls[team][key].x <= low) {
        walls[team][key].direction = 'right';
      } else {
        walls[team][key].x -= 2;
      }
    }
  } else if (walls[team][key].type === 2) {
    if (walls[team][key].direction === "right") {
      if (walls[team][key].y >= high) {
        walls[team][key].direction = 'left';
      } else {
        walls[team][key].y += 2;
      }
    } else {
      if (walls[team][key].y <= low) {
        walls[team][key].direction = 'right';
      } else {
        walls[team][key].y -= 2;
      }
    }
  } else if (walls[team][key].type === 3 || walls[team][key].type === 4) {
    let dist = 0;
    if (walls[team][key].type === 3) {
      dist = 80;
    } else if (walls[team][key].type === 4) {
      dist = 160;
    }
    walls[team][key].degree++
    walls[team][key].x = (walls[team][key].center.x + dist * Math.cos((walls[team][key].degree % 360) / 57))
    walls[team][key].y = (walls[team][key].center.y + dist * Math.sin((walls[team][key].degree % 360) / 57))
      // walls[team][key].rotation = (walls[team][key].degree % 360) / 57
  } else if (walls[team][key].type === 5) {
    if (walls[team][key].direction === "right") {
      if (walls[team][key].x >= high) {
        walls[team][key].direction = 'left';
      } else {
        walls[team][key].x += 2;
      }
    } else {
      if (walls[team][key].x <= low) {
        walls[team][key].direction = 'right';
      } else {
        walls[team][key].x -= 2;
      }
    }
  } else if (walls[team][key].type === 6) {
    if (walls[team][key].direction === "right") {
      if (walls[team][key].y >= high) {
        walls[team][key].direction = 'left';
      } else {
        walls[team][key].y += 2;
      }
    } else {
      if (walls[team][key].y <= low) {
        walls[team][key].direction = 'right';
      } else {
        walls[team][key].y -= 2;
      }
    }
  }
  walls[team][key].refreshBody();
}
  // Red Wall Movement
  // Team identifier
  // if (teamText.text !== team) {
  //   teamText.setText(team[0].toUpperCase()+ team.slice(1))
  //   teamText.setStyle({color: team, fontSize: '30px', fontFamily: 'helvetica'})
  // }
const makeWhiteWall = function (x, y, scaleX, scaleY, id, type) {
  if (type === 1) {
    walls.white[id] = walls.whiteGroup.create(x, y, 'whiteWallUp').setScale(0.23, 0.16).refreshBody();
  } else if (type === 2) {
    walls.white[id] = walls.whiteGroup.create(x, y, 'whiteWall').setScale(0.16, 0.23).refreshBody();
  } else if (type === 3) {
    walls.white[id] = walls.whiteGroup.create(x, y, 'whiteWallCircle').setScale(0.5).refreshBody();
  } else if (type === 4) {
    walls.white[id] = walls.whiteGroup.create(x, y, 'whiteWallCircle').setScale(0.65).refreshBody();
  } else if (type === 5.1) {
    walls.white[id] = walls.whiteGroup.create(x, y, 'whiteWall').setScale(0.16, 0.23).refreshBody();
  } else if (type === 5.2) {
    walls.white[id] = walls.whiteGroup.create(x, y, 'whiteWallUp').setScale(0.23, 0.16).refreshBody();
  } else if (type === 6.1) {
    walls.white[id] = walls.whiteGroup.create(x, y, 'whiteWall').setScale(0.16, 0.23).refreshBody();
  } else if (type === 6.2) {
    walls.white[id] = walls.whiteGroup.create(x, y, 'whiteWallUp').setScale(0.23, 0.16).refreshBody();
  }
  gameEdit.physics.add.overlap(player, walls.white[id], () => capture(walls.white[id].x, walls.white[id].y, id, direction, type), null, this);
  walls.whiteCounter++;
}
const capture = function (x, y, id, direction, type) {
  console.log(type)
  if (Math.round(type) === 5 || Math.round(type) === 6) {
    if (type === 5.1 || type === 6.1) {
      walls.white[id].setScale(0)
      walls.white[id].disableBody();
      walls.white[id + 1].setScale(0)
      walls.white[id + 1].disableBody();
    } else {
      walls.white[id].setScale(0)
      walls.white[id].disableBody();
      walls.white[id - 1].setScale(0)
      walls.white[id - 1].disableBody();
    }
  } else {
    walls.white[id].setScale(0)
    walls.white[id].disableBody();
  }
  socket.emit('whiteCapture', {team, x, y, id, direction, type})
}
const collide = function (team, wall) {
  // console.log("el collido")
  if (team !== wall && !player.god && activeGame) {
    socket.emit('death', team);
  }
}
const spawnColorWall = function (data) {
  let round = currentRound;
  if (data.type === 5.1 || data.type === 6.1) {
    walls.white[data.id + 1].setScale(0)
    walls.white[data.id + 1].disableBody()
  } else if (data.type === 6.1 || data.type === 6.2) {
    walls.white[data.id - 1].setScale(0);
    walls.white[data.id - 1].disableBody(0);
  } 
  walls.white[data.id].setScale(0);
  walls.white[data.id].disableBody();
  if (data.type === 1 || data.type === 2) {
    if (data.type === 1) {
      walls[data.team][walls[`${data.team}Counter`]] = walls[`${data.team}Group`].create(data.x, 350, `${data.team}WallUp`).setScale(0.25, 0.93).refreshBody();
    } else if (data.type === 2) {
      walls[data.team][walls[`${data.team}Counter`]] = walls[`${data.team}Group`].create(701, data.y, `${data.team}Wall`).setScale(1.97, 0.25).refreshBody();
    }
    gameEdit.physics.add.overlap(player, walls[data.team][walls[`${data.team}Counter`]], () => collide(team, data.team), null, this);
    walls[data.team][walls[`${data.team}Counter`]].depth = -1;
    walls[data.team][walls[`${data.team}Counter`]].direction = data.direction;
    walls[data.team][walls[`${data.team}Counter`]].type = data.type;
    walls[`${data.team}Array`].push(walls[`${data.team}Counter`])
  } else if (data.type === 3 || data.type === 4) {
    for (let i = 0; i < 3; i++) {
      walls[data.team][walls[`${data.team}Counter`] + i] = walls[`${data.team}Group`].create(data.x, data.y, `${data.team}Wall`).setScale(0.25, 0.35).refreshBody();
      gameEdit.physics.add.overlap(player, walls[data.team][walls[`${data.team}Counter`] + i], () => collide(team, data.team), null, this);
      walls[data.team][walls[`${data.team}Counter`] + i].depth = -1;
      walls[data.team][walls[`${data.team}Counter`] + i].direction = data.direction;
      walls[data.team][walls[`${data.team}Counter`] + i].type = data.type;
      walls[data.team][walls[`${data.team}Counter`] + i].degree = i * 120 + 120;
      walls[data.team][walls[`${data.team}Counter`] + i].center = { x: data.x, y: data.y }
      walls[`${data.team}Array`].push(walls[`${data.team}Counter`] + i)
    }
    walls[`${data.team}Counter`] += 2;
  } else if (Math.round(data.type) === 5 || Math.round(data.type) === 6) {
    walls[data.team][walls[`${data.team}Counter`]] = walls[`${data.team}Group`].create(data.x, data.y, `${data.team}Wall`).setScale(0.5, 0.25).refreshBody();
    walls[data.team][walls[`${data.team}Counter`]].depth = -1;
    walls[data.team][walls[`${data.team}Counter`]].direction = data.direction;
    walls[data.team][walls[`${data.team}Counter`]].type = Math.round(data.type)
    walls[`${data.team}Array`].push(walls[`${data.team}Counter`])
    walls[data.team][walls[`${data.team}Counter`] + 1] = walls[`${data.team}Group`].create(data.x, data.y, `${data.team}WallUp`).setScale(0.25, 0.5).refreshBody();
    walls[data.team][walls[`${data.team}Counter`] + 1].depth = -1;
    walls[data.team][walls[`${data.team}Counter`] + 1].direction = data.direction;
    walls[data.team][walls[`${data.team}Counter`] + 1].type = Math.round(data.type)
    walls[`${data.team}Array`].push(walls[`${data.team}Counter`] + 1)
    gameEdit.physics.add.overlap(player, walls[data.team][walls[`${data.team}Counter`]], () => collide(team, data.team), null, this);
    gameEdit.physics.add.overlap(player, walls[data.team][walls[`${data.team}Counter`] + 1], () => collide(team, data.team), null, this);
    walls[`${data.team}Counter`] += 1;
  }
  window.setTimeout(() => {
    if (round === currentRound) {
      let total = 0;
      if (data.type === 1 || data.type === 2) {
        total = 1;
      } else if (data.type === 3 || data.type === 4) {
        total = 3;
      } else if (Math.round(data.type) === 5 || Math.round(data.type) === 6) {
        total = 2;
      }
      for (let i = 0; i < total; i++) {
        if (walls[data.team][walls[`${data.team}Array`][0]]) {
          walls[data.team][walls[`${data.team}Array`][0]].setScale(0);
          walls[data.team][walls[`${data.team}Array`][0]].disableBody();
          delete walls[data.team][walls[`${data.team}Array`][0]]
          walls[`${data.team}Array`].shift();
        }
      }
    }
  }, 5000);
  walls[`${data.team}Counter`]++;
}
window.setInterval(function () {
  if (activeGame) {
    if (playerAbility.barNum < 100 && playerAbility.type === "main") {
      playerAbility.barNum++;
    }
    for (key in playerAbilities) {
      if (playerAbilities[key].barNum < 100 && playerAbilities[key].type === "main") {
        playerAbilities[key].barNum++;
      }
    }
  }
}, 40); // 100
window.setInterval(function () {
  if (activeGame) {
    if (character === "ninja") {
      if (playerAbility.barNum < 100 && playerAbility.type === "use") {
        playerAbility.barNum++;
      }
    } else if (character === "robot" || character === "dog" || character === "cowboy") {
      if (playerAbility.barNum > 0 && playerAbility.type === "use") {
        playerAbility.barNum -= 0.5;
      }
    }
    for (key in playerAbilities) {
      if (playerDetails[key].character === "ninja") {
        if (playerAbilities[key].barNum < 100 && playerAbilities[key].type === "use") {
          playerAbilities[key].barNum++;
        }
      } else if (playerDetails[key].character === "robot" || playerDetails[key].character === "dog" || playerDetails[key].character === "cowboy") {
        if (playerAbilities[key].barNum > 0 && playerAbilities[key].type === "use") {
          playerAbilities[key].barNum -= 0.5;
        } else if (playerAbilities[key].barNum <= 0 && playerAbilities[key].type === "use") {
          playerAbilities[key].type = "main"
          if (playerDetails[key].character === "cowboy") {
            speed = 200;
          }
        }
      }
    }
  }
}, 5) // 15
$(document).ready(function () {
  // $('#firstDiv').css({ display: 'none' });
  // $('canvas').css({ display: 'block' })
  // team = "red"
  // socket.emit('ready', { id: team })
  // $('#gameDiv').css({ display: "block" })

  $('#blueScoreDiv').css({ top: '20px', left: `${window.innerWidth/3 - 45}px`})
  console.log("S")
  $('#blueScore').css({ top: '-40px', left: '6px' })
  $('#redScoreDiv').css({ top: '20px', left: `${window.innerWidth / 3 + window.innerWidth / 3 - 50}px` })
  console.log("S")
  $('#redScore').css({ top: '-40px', left: '6px' })

  $('#continueButton').click(function () {
    if ($('#nameText').val() !== "") {
      name = $('#nameText').val();
      $('#firstDiv').css({ display: 'none' });
      $('#secondDiv').css({ display: 'block' });
      $('#readyButton').css({ top: `${window.innerHeight - 200}px`, left: `${window.innerWidth/2 - 90}px` })
      $('#totalReady').css({ top: `${window.innerHeight - 150}px`, left: `${window.innerWidth / 2 - 140}px` });
      $('#character').css({top: `${window.innerHeight - 550}px`, left: `${window.innerWidth / 2 - 190}px`})
      socket.emit('joinedLobby', {id});
    }
  })
  let characters = ["ninja", "robot", "dog", "cowboy"];
  let characterAbilities = ["Teleportation", "Invincibility", "Speed", "Slow"]
  let characterSelected = 0;
  $('#right').click(function () {
    if (!ready) {
      if (characterSelected < characters.length - 1) {
        characterSelected++;
      } else {
        characterSelected = 0;
      }
      $('#characterImage').attr('src', `assets/${characters[characterSelected]}Idle.png`);
      $('#characterName').text(`${characters[characterSelected][0].toUpperCase() + characters[characterSelected].slice(1)}`)
      $('#ability').html(`Special Ability:<br/>${characterAbilities[characterSelected]}`);
    }
  })
  $('#left').click(function () {
    if (!ready) {
      if (characterSelected === 0) {
        characterSelected = characters.length - 1;
      } else {
        characterSelected--;
      }
      $('#characterImage').attr('src', `assets/${characters[characterSelected]}Idle.png`);
      $('#characterName').text(`${characters[characterSelected][0].toUpperCase() + characters[characterSelected].slice(1)}`)
      $('#ability').text(`Special Ability:\n${characterAbilities[characterSelected]}`);

    }
  })
  $('#blue').click(function () {
    if (!ready) {
      $(`.${name}`).remove();
      team = "blue"
      $('#blueList').append($(`<p class="blue ${name}">${name}</p>`))
      socket.emit('teamJoin', { name, id, team: 'blue' })
    }
  })
  $('#red').click(function () {
    if (!ready) {
      $(`.${name}`).remove();
      team = "red"
      $('#redList').append($(`<p class="red ${name}">${name}</p>`))
      socket.emit('teamJoin', { name, id, team: 'red' })
    }
  })
  $('#readyButton').click(function () {
    if (!ready && team !== "nutin") {
      character = characters[characterSelected];
      ready = true;
      socket.emit('ready', { id, team, character });
    }
  })
})
socket.on('teamJoin', data => {
  if (data.team === "blue") {
    $(`.${data.name}`).remove();
    $('#blueList').append($(`<p class="blue ${data.name}">${data.name}</p>`))
  } else if (data.team === "red") {
    $(`.${data.name}`).remove();
    $('#redList').append($(`<p class="red ${data.name}">${data.name}</p>`))
  }
})