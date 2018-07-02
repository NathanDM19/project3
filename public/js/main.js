const socket = io.connect('http://localhost:4200');

// GLOBALS
let gameEdit;
let id = null;
let player;
let playerDetails = {};
let playerCreated = {};
let playerSprites = {};
let x = 0;
let y = 0;
let xTemp = 0;
let yTemp = 0;
let direction = 'turn'
let directionTemp;
let team = 'blue';
let walls = {
  white: {},
  whiteGroup: "",
  whiteCounter: 0,
  red: {},
  redGroup: "",
  redCounter: 0,
  redArray: [],
  blue: {},
  blueGroup: "",
  blueCounter: 0,
  blueArray: []
}
let testWall;
let teamText;

// On connection, emit response to server
socket.on('connect', () => {
  console.log("Connected!");
});
// Setting id for user
socket.on('connection', data => {
  console.log("User connected, setting id to", data)
  if (id === null) {
    id = data;
  }
});
// Movement of other players
socket.on('movement', data => {
  playerDetails[data['id']] = { 'x': data['x'], 'y': data['y'], 'direction': data['direction']}
})
// User disconnects
socket.on('userDisconnect', data => {
  playerDetails[data] = 'disconnected';
});

// Spawn white wall;
socket.on('whiteWall', data => {
  console.log("making wall")
  makeWhiteWall(data.x, data.y, data.scaleX, data.scaleY, walls.whiteCounter);
});
// Spawn color walls;
socket.on('wall', data => {
  spawnColorWall(data);
})

var config = {
  type: Phaser.AUTO,
  width: 1400,
  height: 670,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
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
  this.load.spritesheet('playerRun', '../assets/ninjaRun.png', { frameWidth: 66, frameHeight: 87.5 });
  this.load.spritesheet('playerIdle', '../assets/ninjaIdle.png', {
    frameWidth: 46, frameHeight: 88
  });
  this.load.image('wall', 'assets/platform.png');
  this.load.image('redWall', 'assets/redWall.png');
  this.load.image('blueWall', 'assets/blueWall.png');
  this.load.image('whiteWall', 'assets/whiteWall.png');
  this.load.image('background', 'assets/black.png');
}

function create() {
  // Creating player and walls
  walls.redGroup = this.physics.add.staticGroup();
  walls.blueGroup = this.physics.add.staticGroup();
  background = this.physics.add.staticGroup();
  const border = this.physics.add.staticGroup();
  walls.whiteGroup = this.physics.add.staticGroup();
  player = this.physics.add.sprite(690, 320, 'playerIdle');
  border.create(700, 100, 'wall').setScale(2.5, 1).refreshBody()
  border.create(700, 600, 'wall').setScale(2.5, 1).refreshBody()
  border.create(184, 350, 'wall').setScale(0.08, 16.64).refreshBody()
  border.create(1216, 350, 'wall').setScale(0.08, 16.64).refreshBody()
  let bg1 = background.create(700, 15, 'background').setScale(1, 0.1).refreshBody();
  let bg2 = background.create(100, 350, 'background').setScale(0.1, 1).refreshBody(); 
  let bg3 = background.create(1300, 350, 'background').setScale(0.1, 1).refreshBody(); 
  let bg4 = background.create(700, 684, 'background').setScale(1, 0.1).refreshBody(); 

  bg1.depth = -0.5;
  bg2.depth = -0.5;
  bg3.depth = -0.5;
  bg4.depth = -0.5;
  // player.body.setSize(58, 110);
  this.physics.add.collider(player, walls);
  gameEdit.add.text(200, 20, `Blue Team`, { fontSize: '50px', fill: 'rgb(0, 0, 255)', fontFamily: 'helvetica' });
  gameEdit.add.text(970, 20, 'Red Team', { fontSize: '50px', fill: 'rgb(255, 0, 0)', fontFamily: 'helvetica' })
  teamText = gameEdit.add.text(660, 40, `${team[0].toUpperCase()+ team.slice(1)}`, {fontSize: '30px', fill: team, fontFamily: 'helvetica'})
  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('playerRun', { start: 0, end: 9 }),
    frameRate: 9,
    repeat: -1
  });
  this.anims.create({
    key: 'turn',
    frames: [{ key: 'playerIdle', frame: 0 }],
    frameRate: 20
  });
  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('playerRun', { start: 0, end: 9 }),
    frameRate: 9,
    repeat: -1
  });
  cursors = this.input.keyboard.createCursorKeys();
  // Spawning white walls
}

function update() {
  for (let key in playerDetails) {
    // If player has left, remove sprite
    if (playerDetails[key] === 'disconnected') {
      if (playerSprites[key]) {
        playerSprites[key].disableBody();
        playerSprites[key].setScale(0)
      }
    } else {
      if (!playerCreated[key]) {
        playerSprites[key] = gameEdit.physics.add.sprite(400, 490, 'player');
        playerCreated[key] = true
      }
      if (playerSprites[key].x !== playerDetails[key]['x'] || playerSprites[key].y !== playerDetails[key]['y'] || playerDetails[key]['direction'] !== playerDetails[key]['tempDirection']) {
        playerDetails[key]['tempDirection'] = playerDetails[key]['direction']
        playerSprites[key].x = playerDetails[key]['x'];
        playerSprites[key].y = playerDetails[key]['y'];
        playerSprites[key].anims.play(playerDetails[key]['direction'], true);
        if (playerDetails[key]['direction'] === 'left') {
          playerSprites[key].flipX = true
        } else if (playerDetails[key]['direction'] === 'right') {
          playerSprites[key].flipX = false
        }
      }
    }
  }
  x = player.x
  y = player.y
  if (player.y <= 137) {
    player.y = 562.9;
  } else if (player.y >= 563) {
    player.y = 137.1;
  } else if (player.x <= 212) {
    player.x = 1187.9;
  } else if (player.x >= 1188) {
    player.x = 212.1;
  }
  if (x > xTemp + 2 || x < xTemp - 2 || y > yTemp + 2 || y < yTemp - 2 || direction !== directionTemp) {
    x = Math.round(x);
    y = Math.round(y); 
    socket.emit('movement', {id, x, y, direction})
    xTemp = x
    yTemp = y
    directionTemp = direction
  }
  // PLAYER MOVEMENT
  if (cursors.left.isDown) {
    player.setVelocityX(-160);
    direction = 'left';
    player.anims.play('left', true);
    player.flipX = true;
  }
  if (cursors.right.isDown) {
    player.setVelocityX(160)
    direction = 'right';
    player.anims.play('right', true);
    player.flipX = false;
  }
  if (cursors.up.isDown) {
    if (cursors.left.isUp && cursors.right.isUp) {
      direction = 'turn'
      player.anims.play('right', true);
    }
    player.setVelocityY(-160)
  }
  if (cursors.down.isDown) {
    if (cursors.left.isUp && cursors.right.isUp) {
      direction = 'turn';
      player.anims.play('right', true)
    }
    player.setVelocityY(160)
  }
  if (cursors.left.isUp && cursors.right.isUp) {
    direction = 'turn'
    player.setVelocityX(0)
  }
  if (cursors.up.isUp && cursors.down.isUp) {
    if (cursors.left.isUp && cursors.right.isUp) {
      direction = 'turn'
      player.anims.play('turn')
    }
    player.setVelocityY(0)
  }
  // BASIC ATTACK
  if (cursors.space.isDown) {
    player.anims.play('punch')
    direction = 'punch'
  }

  // Red Wall Movement
  for (key in walls.red) {
    if (walls.red[key]) {
      if (walls.red[key]['direction'] === "right") {
        if (walls.red[key].x >= 1204) {
          walls.red[key]['direction'] = 'left';
        } else {
          walls.red[key].x += 2;
        }
      } else {
        if (walls.red[key].x <= 196) {
          walls.red[key]['direction'] = 'right';
        } else {
          walls.red[key].x -= 2;
        }
      }
      walls.red[key].refreshBody()
    }
  }
  for (key in walls.blue) {
    if (walls.blue[key]) {
      if (walls.blue[key]['direction'] === "right") {
        if (walls.blue[key].x >= 1204) {
          walls.blue[key]['direction'] = 'left';
        } else {
          walls.blue[key].x += 2;
        }
      } else {
        if (walls.blue[key].x <= 196) {
          walls.blue[key]['direction'] = 'right';
        } else {
          walls.blue[key].x -= 2;
        }
      }
      walls.blue[key].refreshBody();
    }
  }
  // Team identifier
  if (teamText.text !== team) {
    teamText.setText(team[0].toUpperCase()+ team.slice(1))
    teamText.setStyle({color: team, fontSize: '30px', fontFamily: 'helvetica'})
  }
}
const makeWhiteWall = function (x, y, scaleX, scaleY, id) {
  console.log(id)
  walls.white[id] = walls.whiteGroup.create(x, y, 'whiteWall').setScale(scaleX, scaleY).refreshBody();
  gameEdit.physics.add.overlap(player, walls.white[id], () => capture(walls.white[id].x, walls.white[id].y, 'vertical', id, direction), null, this);
  walls.whiteCounter++;
}
const capture = function (x, y, dir, id, direction) {
  walls.white[id].setScale(0)
  walls.white[id].disableBody();
  spawnColorWall({ team, x, y, dir, id, owner: true, direction })
  socket.emit('whiteCapture', {team, x, y, dir, id, direction})
}
const collide = function (team, wall) {
  if (team !== wall) {
    player.disableBody();
  }
}
const spawnColorWall = function (data) {
  console.log(data)
  walls.white[data.id].setScale(0);
  walls.white[data.id].disableBody();
  walls[data.team][walls[`${data.team}Counter`]] = walls[`${data.team}Group`].create(data.x, data.y, `${data.team}Wall`).setScale(0.02, 40).refreshBody();
  gameEdit.physics.add.overlap(player, walls[data.team][walls[`${data.team}Counter`]], () => collide(team, data.team), null, this);
  walls[data.team][walls[`${data.team}Counter`]].depth = -1;
  walls[data.team][walls[`${data.team}Counter`]].direction = data.direction;
  walls[`${data.team}Array`].push(walls[`${data.team}Counter`])
  window.setTimeout(() => {
    walls[data.team][walls[`${data.team}Array`][0]].setScale(0);
    walls[data.team][walls[`${data.team}Array`][0]].disableBody();
    walls[`${data.team}Array`][0] = undefined;
    walls[`${data.team}Array`].shift();
    if (data.owner) {
      window.setTimeout(() => {
        socket.emit('whiteCreate');
      }, 2000)
    }
  }, 5000);
  walls[`${data.team}Counter`]++;

}