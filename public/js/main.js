const socket = io.connect(window.location.hostname);
// const socket = io.connect("http://localhost:3000")

// GLOBALS
let gameEdit, player, ability, playerNameText, directionTemp, teamText, name, ready;
let team = "nutin";
let id = null;
let activeGame = false;
let playerAbility = { used: false, cooldown: 0, barNum: 0, bar: "", barBack: "", type: "main"};
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
let direction = 'turn'
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
  console.log("Connected!");
});
// Setting id for user
socket.on('connection', data => {
  console.log("Welcome user " + data.currentUser)
  id = data.currentUser
  playerDetails = data.allUsers

});
socket.on('userConnect', id => {
  console.log("User " + id + " has connected.")
  playerDetails[id] = {x: 400, y: 490, direction: 'turn', ability: null};
})
// Movement of other players
socket.on('movement', data => {
  playerDetails[data.id].x = data.x
  playerDetails[data.id].y = data.y
  playerDetails[data.id].direction = data.direction
})
socket.on('startGame', data => {
  player.disableBody();
  playerAbility.barNum = 0;
  activeGame = false;
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
  walls.redCounter = 0;
  walls.blueCounter = 0;
  walls.whiteCounter = 0;
  player.x = data.startingPositions2[team].x
  player.y = data.startingPositions2[team].y
  console.log("Placing player at", data.startingPositions2[team].x, data.startingPositions2[team].y)
  for (key in data.users) {
    if (key != id) {
      playerSprites[parseInt(key)].x = data.startingPositions2[data.users[key]].x
      playerSprites[parseInt(key)].y = data.startingPositions2[data.users[key]].y
      playerAbilities[key].bar.x = playerSprites[key].x - ((100 - playerAbilities[key].barNum) / 3)
      playerAbilities[key].bar.y = playerSprites[key].y - 46;
      playerAbilities[key].bar.setScale(playerAbilities[key].barNum / 50, 0.5)
      playerAbilities[key].barBack.x = playerSprites[key].x;
      playerAbilities[key].barBack.y = playerSprites[key].y - 46;
      playerAbilities[key].barNum = 0;
    }
  }
  $('#secondDiv').css({ display: 'none' });
  $('canvas').css({ display: "block" });
  if (data.newRound) {
    makeWhiteWall(400, 200, 0.02, 1.5, walls.whiteCounter, 1);
    makeWhiteWall(400, 500, 0.15, 0.25, walls.whiteCounter, 2)
    makeWhiteWall(1000, 200, 0.15, 0.25, walls.whiteCounter, 2)
    makeWhiteWall(1000, 500, 0.02, 1.5, walls.whiteCounter, 1)

  }
  let timer = 3;
  let countdownText = gameEdit.add.text(700, 300, '3', { fontSize: '50px', fill: 'rgb(0, 0, 255)', fontFamily: 'helvetica' });
  let startCounter = window.setInterval(function () {
    timer--;
    countdownText.setText(timer)
    if (timer === 0) {
      player.enableBody(true, data.startingPositions2[team].x, data.startingPositions2[team].y);
      countdownText.setText("")
      window.clearInterval(startCounter)
      activeGame = true;
    }
  }, 1000)
})
// User disconnects
socket.on('userDisconnect', data => {
  playerDetails[data] = 'disconnected';
});
socket.on('ready', data => {
  $('#totalReady').text(`${data.totalReady} / ${data.totalUsers} Ready`)
})
socket.on('point', team => {
  score[team]++;
  score[`${team}Text`].setText(score[team]);
})
// Spawn white wall;
socket.on('whiteWall', data => {
  console.log("making wall")
  makeWhiteWall(data.x, data.y, data.scaleX, data.scaleY, walls.whiteCounter, data.type);
});
// Spawn color walls;
socket.on('wall', data => {
  spawnColorWall(data);
})
socket.on('ability', data => {
  if (data.type === 1) {
    console.log("id", id)
    if (!playerDetails[data.id].ability) {
      console.log("created")
      playerDetails[data.id].ability = ability.create(data.x, data.y, 'ability').setScale(0.5).refreshBody();
      playerAbilities[data.id].barNum = 0;
      playerAbilities[data.id].type = "use"
    } else {
      console.log("deleted")
      playerDetails[data.id].ability.setScale(0);
      playerDetails[data.id].ability.disableBody();
      playerDetails[data.id].ability = null;
      playerAbilities[data.id].barNum = 0;
      playerAbilities[data.id].type = "main"
    }
  }
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
  this.load.multiatlas('ninja', 'assets/ninja.json', 'assets')
  this.load.image('wall', 'assets/platform.png');
  this.load.image('redWall', 'assets/redWall.png');
  this.load.image('blueWall', 'assets/blueWall.png');
  this.load.image('whiteWall', 'assets/whiteWall.png');
  this.load.image('background', 'assets/black.png');
  this.load.image('ability', 'assets/ability.png')
  this.load.image('abilityBar', 'assets/abilityBar.png')
  this.load.image('abilityBarBack', 'assets/abilityBarBack.png')
}
function create() {
  // Creating player and walls
  walls.redGroup = this.physics.add.staticGroup();
  walls.blueGroup = this.physics.add.staticGroup();
  background = this.physics.add.staticGroup();
  const border = this.physics.add.staticGroup();
  walls.whiteGroup = this.physics.add.staticGroup();
  ability = this.physics.add.staticGroup();
  player = this.physics.add.sprite(690, 320, 'ninja', "Idle__000.png").setScale(0.15);
  playerNameText = this.add.text(200, 200, `Player ${id}`, { fontSize: '12px', fill: '#FFF', fontFamily: "helvetica" });
  player.disableBody();
  playerAbility.barBack = ability.create(100, 100, 'abilityBarBack').setScale(2, 0.5).refreshBody();
  playerAbility.bar = ability.create(100, 100, 'abilityBar').setScale(2, 0.5).refreshBody()
  playerNameText.depth = 1;
  border.create(700, 100, 'wall').setScale(2.5, 1).refreshBody()
  border.create(700, 600, 'wall').setScale(2.5, 1).refreshBody()
  border.create(184, 350, 'wall').setScale(0.08, 16.64).refreshBody()
  border.create(1216, 350, 'wall').setScale(0.08, 16.64).refreshBody()
  let bg1 = background.create(700, 15, 'background').setScale(1, 0.1).refreshBody();
  let bg2 = background.create(100, 350, 'background').setScale(0.1, 1).refreshBody(); 
  let bg3 = background.create(1300, 350, 'background').setScale(0.1, 1).refreshBody(); 
  let bg4 = background.create(700, 684, 'background').setScale(1, 0.1).refreshBody(); 

  bg1.depth = bg2.depth = bg3.depth = bg4.depth = -0.5;
  this.physics.add.collider(player, walls);
  score.blueText = gameEdit.add.text(390, 20, '0', { fontSize: '50px', fill: 'rgb(0, 0, 255)', fontFamily: 'helvetica' });
  score.redText = gameEdit.add.text(1000, 20, '0', { fontSize: '50px', fill: 'rgb(255, 0, 0)', fontFamily: 'helvetica' })
  teamText = gameEdit.add.text(660, 40, `${team[0].toUpperCase()+ team.slice(1)}`, {fontSize: '30px', fill: team, fontFamily: 'helvetica'})
  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNames('ninja', {
      start: 0, end: 9, zeroPad: 3,
      prefix: 'Run__', suffix: '.png'
    }),
    frameRate: 9,
    repeat: -1
  });
  this.anims.create({
    key: 'turn',
    frames: [{ key: 'ninja', frame: 'Idle__000.png' }],
    frameRate: 20
  });
  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNames('ninja', {
      start: 0, end: 9, zeroPad: 3,
      prefix: 'Run__', suffix: '.png'
    }),
    frameRate: 9,
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
        playerCreated[key] = true
        playerNames[key] = gameEdit.add.text(100, 100, `Player ${key}`, { fontSize: '12px', fill: '#FFF', fontFamily: 'Helvetica' });
        playerAbilities[key] = {};
        playerAbilities[key].barBack = ability.create(100, 100, 'abilityBarBack').setScale(2, 0.5).refreshBody();
        playerAbilities[key].bar = ability.create(100, 100, 'abilityBar').setScale(2, 0.5).refreshBody();
        playerAbilities[key].barNum = 0;
        playerAbilities[key].type = "main";
      }
      playerAbilities[key].bar.x = playerSprites[key].x - ((100 - playerAbilities[key].barNum) / 3)
      playerAbilities[key].bar.y = playerSprites[key].y - 46;
      playerAbilities[key].bar.setScale(playerAbilities[key].barNum / 50, 0.5)
      playerAbilities[key].barBack.x = playerSprites[key].x;
      playerAbilities[key].barBack.y = playerSprites[key].y - 46;
      if (playerSprites[key].x !== playerDetails[key].x || playerSprites[key].y !== playerDetails[key].y || playerDetails[key].direction !== playerDetails[key].tempDirection) {
        playerDetails[key].tempDirection = playerDetails[key].direction
        playerSprites[key].x = playerDetails[key].x;
        playerSprites[key].y = playerDetails[key].y;
        playerNames[key].x = playerDetails[key]['x'] - 27;
        playerNames[key].y = playerDetails[key]['y'] - 72;
        playerSprites[key].anims.play(playerDetails[key].direction, true);
        if (playerDetails[key].direction === 'left') {
          playerSprites[key].flipX = true
        } else if (playerDetails[key].direction === 'right') {
          playerSprites[key].flipX = false
        }
      }
    }
  }
  x = player.x
  y = player.y
  playerNameText.x = player.x - 22;
  playerNameText.y = player.y - 72;
  playerAbility.bar.x = player.x - ((100 - playerAbility.barNum) / 3)
  playerAbility.bar.y = player.y - 46;
  playerAbility.bar.setScale(playerAbility.barNum / 50, 0.5)
  playerAbility.barBack.x = player.x;
  playerAbility.barBack.y = player.y - 46;
  // healthBar.x = player.x - ((100 - health) / 4)
  // healthBar.y = player.y - 36
  if (player.y <= 137) {
    player.y = 562.9;
  } else if (player.y >= 563) {
    player.y = 137.1;
  } else if (player.x <= 212) {
    player.x = 1187.9;
  } else if (player.x >= 1188) {
    console.log(player.x)
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
    player.setVelocityX(-200);
    direction = 'left';
    player.anims.play('left', true);
    player.flipX = true;
  }
  if (cursors.right.isDown) {
    player.setVelocityX(200)
    direction = 'right';
    player.anims.play('right', true);
    player.flipX = false;
  }
  if (cursors.up.isDown) {
    if (cursors.left.isUp && cursors.right.isUp) {
      direction = 'turn'
      player.anims.play('right', true);
    }
    player.setVelocityY(-200)
  }
  if (cursors.down.isDown) {
    if (cursors.left.isUp && cursors.right.isUp) {
      direction = 'turn';
      player.anims.play('right', true)
    }
    player.setVelocityY(200)
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
  if (cursors.space.isDown && playerAbility.barNum === 100) {
    if (!playerAbility.used) {
      playerAbility.used = true;
      playerAbility.obj = ability.create(player.x, player.y, 'ability').setScale(0.5).refreshBody();
      playerAbility.type = "use"
      playerAbility.barNum = 0;
      socket.emit('ability', {type: 1, id, x: player.x, y: player.y})
    } else if (playerAbility.used) {
      player.x = playerAbility.obj.x;
      player.y = playerAbility.obj.y;
      playerAbility.used = false;
      playerAbility.obj.setScale(0);
      playerAbility.obj.disableBody();
      playerAbility.type = "main"
      playerAbility.barNum = 0;
      socket.emit('ability', { type: 1, id})
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
    }
    walls[team][key].refreshBody();
  }
  // Red Wall Movement
  for (key in walls.red) {
    if (walls.red[key].type === 1) {
      wallMovement('red', key, 196, 1204)
    } else if (walls.red[key].type === 2) {
      wallMovement('red', key, 112, 588)
    }
  }
  for (key in walls.blue) {
    if (walls.blue[key].type === 1) {
      wallMovement('blue', key, 196, 1204)
    } else if (walls.blue[key].type === 2) {
      wallMovement('blue', key, 112, 588)
    }
  }
  // Team identifier
  if (teamText.text !== team) {
    teamText.setText(team[0].toUpperCase()+ team.slice(1))
    teamText.setStyle({color: team, fontSize: '30px', fontFamily: 'helvetica'})
  }
}
const makeWhiteWall = function (x, y, scaleX, scaleY, id, type) {
  console.log(id)
  walls.white[id] = walls.whiteGroup.create(x, y, 'whiteWall').setScale(scaleX, scaleY).refreshBody();
  gameEdit.physics.add.overlap(player, walls.white[id], () => capture(walls.white[id].x, walls.white[id].y, id, direction, type), null, this);
  walls.whiteCounter++;
}
const capture = function (x, y, id, direction, type) {
  walls.white[id].setScale(0)
  walls.white[id].disableBody();
  spawnColorWall({ team, x, y, id, owner: true, direction, type })
  socket.emit('whiteCapture', {team, x, y, id, direction, type})
}
const collide = function (team, wall) {
  if (team !== wall) {
    socket.emit('death', team);
    player.disableBody();
  }
}
const spawnColorWall = function (data) {
  walls.white[data.id].setScale(0);
  walls.white[data.id].disableBody();
  if (data.type === 1 || data.type === 2) {
    if (data.type === 1) {
      walls[data.team][walls[`${data.team}Counter`]] = walls[`${data.team}Group`].create(data.x, data.y, `${data.team}Wall`).setScale(0.02, 40).refreshBody();
    } else if (data.type === 2) {
      walls[data.team][walls[`${data.team}Counter`]] = walls[`${data.team}Group`].create(data.x, data.y, `${data.team}Wall`).setScale(5, 0.2).refreshBody();
    }
    gameEdit.physics.add.overlap(player, walls[data.team][walls[`${data.team}Counter`]], () => collide(team, data.team), null, this);
    walls[data.team][walls[`${data.team}Counter`]].depth = -1;
    walls[data.team][walls[`${data.team}Counter`]].direction = data.direction;
    walls[data.team][walls[`${data.team}Counter`]].type = data.type;
    walls[`${data.team}Array`].push(walls[`${data.team}Counter`])
  } else if (data.type === 3 || data.type === 4) {
    for (let i = 0; i < 3; i++) {
      walls[data.team][walls[`${data.team}Counter`] + i] = walls[`${data.team}Group`].create(data.x, data.y, `${data.team}Wall`).setScale(0.3, 0.2).refreshBody();
      gameEdit.physics.add.overlap(player, walls[data.team][walls[`${data.team}Counter`] + i], () => collide(team, data.team), null, this);
      walls[data.team][walls[`${data.team}Counter`] + i].depth = -1;
      walls[data.team][walls[`${data.team}Counter`] + i].direction = data.direction;
      walls[data.team][walls[`${data.team}Counter`] + i].type = data.type;
      walls[data.team][walls[`${data.team}Counter`] + i].degree = i * 120 + 120;
      walls[data.team][walls[`${data.team}Counter`] + i].rotation = i * 120 + 120;
      walls[data.team][walls[`${data.team}Counter`] + i].center = {x: data.x, y: data.y}
      walls[`${data.team}Array`].push(walls[`${data.team}Counter`] + i)
    }
    walls[`${data.team}Counter`] += 2;
  }
  window.setTimeout(() => {
    let total = 0;
    let cancel = false;
    if (data.type === 1 || data.type === 2) {
      total = 1;
    } else if (data.type === 3 || data.type === 4) {
      total = 3;
    }
    for (let i = 0; i < total; i++) {
      if (walls[data.team][key]) {
        walls[data.team][key].setScale(0);
        walls[data.team][walls[`${data.team}Array`][0]].disableBody();
        delete walls[data.team][walls[`${data.team}Array`][0]]
        walls[`${data.team}Array`].shift();
      } else {
        cancel = true;
      }
    }
    if (data.owner) {
      window.setTimeout(() => {
        if (!cancel) {
          socket.emit('whiteCreate');
        }
      }, 2000)
    }
  }, 5000);
  walls[`${data.team}Counter`]++;

}
// Spinning walls interval
window.setInterval(function () {
  for (key in walls.blue) {
    if (walls.blue[key].type === 3 || walls.blue[key].type === 4) {
      let dist = 0;
      if (walls.blue[key].type === 3) {
        dist = 80;
      } else if (walls.blue[key].type === 4) {
        dist = 160;
      }
      walls.blue[key].degree++
      walls.blue[key].x = (walls.blue[key].center.x + dist * Math.cos((walls.blue[key].degree % 360) / 57))
      walls.blue[key].y = (walls.blue[key].center.y + dist * Math.sin((walls.blue[key].degree % 360) / 57))
      walls.blue[key].rotation = (walls.blue[key].degree % 360) / 57
    }
  }
  for (key in walls.red) {
    if (walls.red[key].type === 3 || walls.red[key].type === 4) {
      let dist = 0;
      if (walls.red[key].type === 3) {
        dist = 80;
      } else if (walls.red[key].type === 4) {
        dist = 160;
      }
      walls.red[key].degree++
      walls.red[key].x = (walls.red[key].center.x + dist * Math.cos((walls.red[key].degree % 360) / 57))
      walls.red[key].y = (walls.red[key].center.y + dist * Math.sin((walls.red[key].degree % 360) / 57))
      walls.red[key].rotation = (walls.red[key].degree % 360) / 57
    }
  }
}, 20)
// Ability cooldown
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
}, 100);
window.setInterval(function () {
  if (activeGame) {
    if (playerAbility.barNum < 100 && playerAbility.type === "use") {
      playerAbility.barNum++;
    }
    for (key in playerAbilities) {
      if (playerAbilities[key].barNum < 100 && playerAbilities[key].type === "use") {
        playerAbilities[key].barNum++;
      }
    }
  }
}, 15)
// document.getElementsByTagName('canvas')[1]
$(document).ready(function() {
  $('#continueButton').click(function () {
    name = $('#nameText').val();
    $('#firstDiv').css({ display: 'none' });
    $('#secondDiv').css({ display: 'block' });
    $('#readyButton').css({ top: `${window.innerHeight - 200}px`, left: `${window.innerWidth/2 - 80}px` })
    $('#totalReady').css({ top: `${window.innerHeight - 150}px`, left: `${window.innerWidth / 2 - 100}px` });
    socket.emit('joinedLobby', id);
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
      socket.emit('ready', { id, team });
      ready = true;
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