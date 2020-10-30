"use strict";

//Declare Variables
var gravity = 0.1;
var wind = 0;
var density = 0;

var targetOffset = 0;
var playerHeight = 5000;

var playing = true;
var landed = false;

var gameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        player.calculateCoeffs();
        this.interval = setInterval(updateGameArea, 20);
    },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

var player = {
  //static properties
  width : 10,
  height : 100,
  color : "black",

  //dynamic properties
  positionx : Math.round(((window.innerWidth)/2)-5),
  positiony : 0,

  velocityy : 0,
  velocityx : 0,

  angle : 0,
  angularVelocity : 0,
  
  calculateCoeffs : function() {
    this.dragCoeffx = calculateDragCoeff("x", this.angle, this.width, this.height);
    this.dragCoeffy = calculateDragCoeff("y", this.angle, this.width, this.height);
  },

  twr : 2,
  rollAuth : 1,

  update : function() {
    this.calculateCoeffs();

    checkInput();

    this.angularVelocity = this.angularVelocity + calculateAngularDrag(this.angle, this.velocityx, this.velocityy);
    this.angle = this.angle + this.angularVelocity;
    
    this.velocityy = this.velocityy + gravity - calculateDrag(this.dragCoeffy, this.velocityy, density);
    this.positiony = this.positiony + this.velocityy;
    
    //console.log(Math.round(this.positiony));

    this.velocityx = this.velocityx + wind - calculateDrag(this.dragCoeffx, this.velocityx, density);
    this.positionx = this.positionx + this.velocityx;
    
    console.log(this.velocityy.toFixed(2));
  }
};

var target = {
  positionx : Math.round(((window.innerWidth)/2)) + targetOffset,
  height : playerHeight,
};


//Define input Variables
var rightPressed;
var leftPressed;
var upPressed;

//Listen for KeyDown
document.addEventListener('keydown', function(event) {
    if (event.keyCode == 37) {
      leftPressed = true;
    }
    if (event.keyCode == 39) {
      rightPressed = true;
    }
    if (event.keyCode == 38) {
      upPressed = true;
    }
}, true);

//Listen for KeyUp
document.addEventListener('keyup', function(event) {
  if (event.keyCode == 37) {
    leftPressed = false;
  }
  if (event.keyCode == 39) {
    rightPressed = false;
  }
  if (event.keyCode == 38) {
    upPressed = false;
  }
}, true);

//Read Input and apply changes to vehicle dynamics
function checkInput() {
  if (upPressed == true) {
    player.velocityy += Math.cos(player.angle * Math.PI / 180)*(-1*(player.twr / 10));
    player.velocityx += -1 *  Math.sin(player.angle * Math.PI / 180)*(-1*(player.twr / 10))
  }
  if (leftPressed == true) {
    player.angularVelocity += -0.01*(player.rollAuth)
  }
  if (rightPressed == true) {
    player.angularVelocity += 0.01*(player.rollAuth)
  }
}

//Render vehicle
function drawPlayer(x, y, width, height, degrees) {
  var draw = gameArea.context;
  // first save the untranslated/unrotated context
  draw.save();

  draw.beginPath();
  // move the rotation point to the center of the rect
  draw.translate(x + width / 2, y + height / 2);
  // rotate the rect
  draw.rotate(degrees * Math.PI / 180);

  // draw the rect on the transformed context
  // Note: after transforming [0,0] is visually [x,y]
  //       so the rect needs to be offset accordingly when drawn
  draw.rect(-width / 2, -height / 2, width, height);

  draw.fillStyle = "black"
  draw.fill();

  // restore the context to its untranslated/unrotated state
  draw.restore();
}

function drawGround(offset, playerx, playery, height) {
  var draw = gameArea.context;
  draw.fillStyle = "#888888";
  draw.fillRect(0, height - playery, window.innerWidth, 10);
}

function drawText() {
  var draw = gameArea.context;
  draw.font = "30px Comic Sans MS"
  draw.fillStyle = "black";
  draw.fillText(target.height - Math.round(player.positiony) - 130, 10, 50);
  draw.fillText(Math.round(player.velocityy * 5), window.innerWidth - 60, 50);
}

function calculateDragCoeff(axis, angle, width, height) {
  if (axis == "y") {
    var radians = angle * Math.PI / 180;
    return 0.05*((height * Math.sin(radians)) + (width * Math.cos(radians)));
  }

  else if (axis == "x") {
    var radians = angle * Math.PI / 180;
    var coeff = 0.05*((width * Math.sin(radians)) + (height * Math.cos(radians)));
    return coeff;
  }
}

function calculateDrag(coeff, velocity, functionDensity) {
  return Math.abs(0.002 * coeff * density * velocity * velocity);
}

function calculateAngularDrag(angle, velocityx, velocityy) {
  var angularDrag = -0.0001 * angle * velocityy * density;
  return angularDrag;
}

function startGame() {
  gameArea.start();

}

function updateGameArea() {
  if (playing == true && landed == false) {
    window.gameArea.clear();
    player.update();
    drawPlayer(player.positionx, 30, player.width, player.height, player.angle);
    drawGround(target.positionx, player.positionx, player.positiony, target.height);
    drawText();
    if ((target.height - player.positiony - 130) < 0) {
      if ((player.velocityy > 1.4)||(Math.abs(player.velocityx) > 1)||(player.angle > 6)) {
        console.log("ded");
        alert("ded");
        player.positionx = 1870;
        playing = false;
      }
      else {
        landed = true;
        console.log("landed");
        alert("landed");
        return;
      }
      clearInterval(gameArea.interval);
    }
  }
}

startGame();