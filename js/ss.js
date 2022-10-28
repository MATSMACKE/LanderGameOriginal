"use strict";
var paused = false;

var flipanglev = 0;
var flipangle = 90;
var flipped = false;
var flipping = false;
var ongoingTouches = [];
var renderPlayer = true;
var xbcontroller = false;
window.addEventListener("gamepadconnected", function(e) {
  console.log("Gamepad connected");
  xbcontroller = true;
  
});

window.addEventListener("gamepaddisconnected", function(e) {
  console.log("Gamepad connected");
  xbcontroller = false;
});

//Get query string
var url = new URL(window.location);

//Declare Variables
var gravity = Number(url.searchParams.get("gravity"))/100;
var wind = Number(url.searchParams.get("wind"))/1000;
var density = Number(url.searchParams.get("density"));

if (density < 0.05) {
  flipped = true;
  flipangle = 0;
}

var targetOffset = Number(url.searchParams.get("offset"));
var playerHeight = Number(url.searchParams.get("altitude")) + 130;

var playing = true;
var landed = false;
var explosion = false;
var explosionParticles = 0;

var settingOgPosX = true;

var terrain = url.searchParams.get("terrain");

var gameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = window.innerWidth - 4;
        this.canvas.height = window.innerHeight - 6;
        this.canvas.unselectable = "on";
        this.canvas.oncontextmenu = "return false";
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        player.calculateCoeffs();
        generateClouds();
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

  twr : Number(url.searchParams.get("power")),
  rollAuth : Number(url.searchParams.get("rollauth")),
  fuel : Number(url.searchParams.get("fuel")),

  update : function() {
    if (flipped == false && flipping == false) {
      console.log("bellyflop");
      this.calculateCoeffs();

      checkInput();

      this.angularVelocity = this.angularVelocity + calculateAngularDrag(this.angle, this.velocityx, this.velocityy);
      this.angle = this.angle + this.angularVelocity;
      
      this.velocityy = this.velocityy + gravity - calculateDrag(this.dragCoeffy, this.velocityy, density);
      this.positiony = this.positiony + this.velocityy;

      this.velocityx = this.velocityx + (wind * density) - calculateDrag(this.dragCoeffx, this.velocityx, density) + calculateLift(this.angle, this.velocityy);
      this.positionx = this.positionx + this.velocityx;

      this.twr = Number(url.searchParams.get("power"))/((this.fuel/100)+1);
      this.rollAuth = Number(url.searchParams.get("rollauth"))/((this.fuel/100) + 0.3);
    }
    else if (flipping == true) {
      console.log("flip update");
      if (flipangle > 45) {
        flipanglev += 0.03;
      }
      else if (flipangle < 45) {
        flipanglev -= 0.029;
      }
      flipangle -= flipanglev;
      this.calculateCoeffs();

      checkInput();

      this.angularVelocity = this.angularVelocity + calculateAngularDrag(this.angle, this.velocityx, this.velocityy);
      this.angle = this.angle + this.angularVelocity;
      
      this.velocityy = this.velocityy + gravity - calculateDrag(this.dragCoeffy, this.velocityy, density);
      this.positiony = this.positiony + this.velocityy;
      
      //console.log(Math.round(this.positiony));

      this.velocityx = this.velocityx + (wind * density) - calculateDrag(this.dragCoeffx, this.velocityx, density) + calculateLift(this.angle, this.velocityy);
      this.positionx = this.positionx + this.velocityx;

      this.twr = Number(url.searchParams.get("power"))/((this.fuel/100)+1);
      this.rollAuth = Number(url.searchParams.get("rollauth"))/((this.fuel/100) + 0.3);
      if (flipangle <= 0) {
        flipping = false;
        flipped = true;
        this.angularVelocity += flipanglev;
      }
    }
    else {
      this.calculateCoeffs();

      checkInput();

      this.angularVelocity = this.angularVelocity + calculateAngularDrag(this.angle, this.velocityx, this.velocityy);
      this.angle = this.angle + this.angularVelocity;
      
      this.velocityy = this.velocityy + gravity - calculateDrag(this.dragCoeffy, this.velocityy, density);
      this.positiony = this.positiony + this.velocityy;
      
      //console.log(Math.round(this.positiony));

      this.velocityx = this.velocityx + (wind * density) - calculateDrag(this.dragCoeffx, this.velocityx, density) - calculateLift(this.angle, this.velocityy);
      this.positionx = this.positionx + this.velocityx;

      this.twr = Number(url.searchParams.get("power"))/((this.fuel/100)+1);
      this.rollAuth = Number(url.searchParams.get("rollauth"))/((this.fuel/100) + 0.3);
    }
    
  },
  postUpdate : function() {
    if (landed == true) {
      if (this.angle > 0) {
        this.angularVelocity += -0.1;
      }
      else if (this.angle < 0) {
        this.angularVelocity += 0.1;
      }
      else if (Math.abs(this.angle) < 0.1) {
        this.angularVelocity = 0;
        return;
      }
      this.angularVelocity = this.angularVelocity*0.5;
    }
  
  else if (player.velocityy < 2 && renderPlayer == true) {
    while (settingOgPosX == true) {
      this.ogPosX = this.positionx;
      settingOgPosX = false;
    }
    this.angularVelocity *= 1.02;
    if (this.angle < 90) {
    this.ogPosX = this.ogPosX + 10 - 50*Math.cos(this.angle*Math.PI/180) +10;
    this.positiony = -40*Math.cos(this.angle*Math.PI/180) + playerHeight - 95;
    }
    else {
    this.ogPosX = this.ogPosX + 10 + 50*Math.cos(this.angle*Math.PI/180);
    this.positiony = -40*Math.cos(this.angle*Math.PI/180) + playerHeight - 95;
    }
  }
  
    this.angle = this.angle + this.angularVelocity;

    if (Math.abs(this.angle) > 90){
      particleSettings.density = 1000;
      particleSettings.maxLife = 500;
      window.explosion = true;
      renderPlayer=false;
    }
  }
};

var target = {
  positionx : Math.round(((window.innerWidth)/2)) + targetOffset,
  height : playerHeight,
};

var particleIndex = 0;
var particles = {};
var particleSettings = {
    density: 20,
    particleSize: 3,
    startingX: 0,
    startingY: 0,
    gravity: 0.1,
    maxLife: 10
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
    if (event.keyCode == 82) {
      location.reload();
    }
    if (event.keyCode == 66) {
      history.back();
    }
    if (event.keyCode == 80) {
      if (paused == true) {
        gameArea.interval = setInterval(updateGameArea, 20);
        paused = false;
      }
      else {
        clearInterval(gameArea.interval);
        paused = true;
      }
    }
}, true);

var upPressedi;
var leftPressedi;
var rightPressedi;

//Touch Function Definitions
function copyTouch({ identifier, pageX, pageY }) {
  return { identifier, pageX, pageY };
}

//prevent right click
document.addEventListener('contextmenu', event => event.preventDefault());

//Listen for touchstart
document.addEventListener('touchstart', function(event) {
  event.preventDefault();
  var touches = event.changedTouches;
        
  for (var i = 0; i < touches.length; i++) {
    ongoingTouches.push(copyTouch(touches[i]));
  }
  
  for (var i = 0; i < touches.length; i++) {
    if (event.touches[i].pageY < (window.innerHeight/2)) {
      upPressed = true;
    }

    else {
      if (event.touches[i].pageX < (window.innerWidth/2)) {
        leftPressed = true;
      }
      if (event.touches[i].pageX > (window.innerWidth/2)) {
        rightPressed = true;
      }
    }
  }
}, true);

//Listen for touchend
document.addEventListener('touchend', function(event) {
  event.preventDefault();
  var touches = event.changedTouches;

  for (var i = 0; i < touches.length; i++) {
    ongoingTouches.splice(i, 1);
    
  }
  
  upPressedi = false;
  leftPressedi = false;
  rightPressedi = false;
  for (var i = 0; i < ongoingTouches.length; i++) {
  if (event.touches[i].pageY < (window.innerHeight/2)) {
      upPressedi = true;
    }

    else {
      if (event.touches[i].pageX < (window.innerWidth/2)) {
      leftPressedi = true;
    }
      if (event.touches[i].pageX > (window.innerWidth/2)) {
      rightPressedi = true;
    }
    }
  }
  if (upPressedi == true) {
    upPressed = true;
  }
  else {
    upPressed = false;
  }

  if (upPressedi == true) {
    leftPressed = true;
  }
  else {
    leftPressed = false;
  }
  
  if (upPressedi == true) {
    rightPressed = true;
  }
  else {
    rightPressed = false;
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
    if (flipped == true) {
      if (player.fuel > 0) {
        player.velocityy += Math.cos(player.angle * Math.PI / 180)*(-1*(player.twr / 10));
        player.velocityx += -1 * Math.sin(player.angle * Math.PI / 180)*(-1*(player.twr / 10));
        player.fuel += -0.1 * Number(url.searchParams.get("power"));
      }
    }
    else if (flipping == false) {
      flipping = true;
      console.log("flipping");
    }
  }
  if (flipping == true) {
    if (player.fuel > 0) {
      player.velocityy += Math.cos((player.angle-flipangle) * Math.PI / 180)*(-1*(player.twr / 40));
      player.velocityx += -1 * Math.sin((player.angle-flipangle) * Math.PI / 180)*(-1*(player.twr / 40));
      player.fuel += -0.05 * Number(url.searchParams.get("power"));
    }
  }
  if (flipped == false && flipping == false) {
    if (rightPressed == true && leftPressed == true) {
      player.dragCoeffx *= 1.5;
      player.dragCoeffy *= 1.5;
      console.log("braking");
    }
    if (leftPressed == true) {
      player.angularVelocity += -0.005*(player.rollAuth);
    }
    if (rightPressed == true) {
      player.angularVelocity += 0.005*(player.rollAuth);
    }
  }
  else {
    if (leftPressed == true) {
      player.angularVelocity += -0.01*(player.rollAuth);
    }
    if (rightPressed == true) {
      player.angularVelocity += 0.01*(player.rollAuth);
    }
  }
  if (xbcontroller) {
    if (flipped == true) {
      player.angularVelocity += 0.01*(player.rollAuth)*(window.gp.axes[0]);
    }
    else {
      player.angularVelocity += 0.005*(player.rollAuth)*(window.gp.axes[0]);
    }
    if (flipped == true) {
      if (player.fuel > 0) {
        player.velocityy += Math.cos(player.angle * Math.PI / 180)*(-1*(player.twr / 10))*(gp.buttons[7].value);
        player.velocityx += -1 * Math.sin(player.angle * Math.PI / 180)*(-1*(player.twr / 10))*(gp.buttons[7].value);
        player.fuel += -0.1 * Number(url.searchParams.get("power"))*(gp.buttons[7].value);
      }
    }
    else if (flipping == true) {
      if (player.fuel > 0) {
        player.velocityy += Math.cos((player.angle-flipangle) * Math.PI / 180)*(-1*(player.twr / 40));
        player.velocityx += -1 * Math.sin((player.angle-flipangle) * Math.PI / 180)*(-1*(player.twr / 40));
        player.fuel += -0.05 * Number(url.searchParams.get("power"));
      }
    }
    else if (flipping == false && gp.buttons[7].value.toFixed(2) > 0) {
      flipping = true;
      console.log("flipping");
    }
    
    
  }
}

function randomG(){ 
    var r = 0;
    for(var i = 3; i > 0; i --){
        r += Math.random();
    }
    return r / 3;
}

function Particle() {
  // Establish starting positions and velocities
  var radians = (player.angle-flipangle) * Math.PI / 180;
  if (explosion == false) {
    this.x = player.positionx + 5 - 46*Math.sin(radians);
    this.y = 46*Math.cos(radians) + 80;
  }

  else {
    this.x = player.positionx;
    this.y = 100;
    explosionParticles ++;
  }

  if (explosion == false) {
    // Determine original X-axis speed based on setting limitation
    this.vx = -Math.cos(radians)*(randomG() * 12 - 6) - Math.sin(radians)*((Math.random()*10) + 7);
    this.vy = Math.cos(radians)*((Math.random()*10) + 7) + Math.sin(radians)*(randomG() * 12 - 6);
    this.explosion = false;
  }
  else {
    this.vx = (randomG() * 12) - 6;
    this.vy = (randomG()*12) - 7;
    this.color = colorFade(0, 255, 0);
    this.explosion = true;
  }

  // Add new particle to the index
  // Object used as it's simpler to manage that an array
  particleIndex ++;
  particles[particleIndex] = this;
  this.id = particleIndex;
  this.life = 0;
  this.maxLife = 5;
}

Particle.prototype.draw = function() {
  this.x += this.vx;
  this.y += this.vy;

  // Adjust for gravity
  this.vy += particleSettings.gravity;

  // Age the particle
  this.life++;

  // If Particle is old, remove it
  if (this.life >= particleSettings.maxLife) {
    delete particles[this.id];
  }

  // Create the shapes
  var draw = gameArea.context;
  draw.beginPath();
  if (this.explosion == true && this.explosion == true) {
    draw.fillStyle = RGBToHex(255, this.color, 0);
  }
  else {
    draw.fillStyle = RGBToHex(colorFade(48, 209, this.life), colorFade(162, 240, this.life), colorFade(219, 255, this.life));
  }
  draw.arc(this.x, this.y, particleSettings.particleSize, 0, Math.PI*2, true); 
  draw.closePath();
  draw.fill();
}

function drawParticles() {
  // Draw the particles
  for (var i = 0; i < particleSettings.density; i++) {
    if (xbcontroller) {
      if (((upPressed == true || window.gp.buttons[7].value.toFixed(2) != 0) && player.fuel > 0 && landed != true)||(explosion == true && explosionParticles < 1000) || flipping == true) {
        // Introducing a random chance of creating a particle
        // corresponding to an chance of 1 per second,
        // per "density" value
        new Particle();
      }
    }
    else {
      if (((upPressed == true) && player.fuel > 0 && landed != true)||(explosion == true && explosionParticles < 1000) || flipping == true) {
        // Introducing a random chance of creating a particle
        // corresponding to an chance of 1 per second,
        // per "density" value
        new Particle();
      }
    }
  }

  for (var i in particles) {
    particles[i].draw();
  }
};

function RGBToHex(r,g,b) {
  r = r.toString(16);
  g = g.toString(16);
  b = b.toString(16);

  if (r.length == 1){
    r = "0" + r;}
  if (g.length == 1){
    g = "0" + g;}
  if (b.length == 1){
    b = "0" + b;}

  return "#" + r + g + b;
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
  if (flipped == false) {
    draw.rotate((degrees-flipangle) * Math.PI / 180);
  }
  else if (flipped == true) {
    draw.rotate((degrees) * Math.PI / 180);
  }

  if (flipping == true) {
    draw.drawImage(document.getElementById("flip"),-10, -50, 20, 100);
  }
  else if (flipped == true) {
    draw.drawImage(document.getElementById("neut"),-10, -50, 20, 100);
  }
  else {
    if (leftPressed == true && rightPressed == true) {
      draw.drawImage(document.getElementById("brake"),-10, -50, 20, 100);
    }
    else if (leftPressed == true) {
      draw.drawImage(document.getElementById("forwards"),-10, -50, 20, 100);
    }
    else if (rightPressed == true) {
      draw.drawImage(document.getElementById("back"),-10, -50, 20, 100);
    }
    else {
      draw.drawImage(document.getElementById("neut"),-10, -50, 20, 100);
    }
  }

  draw.restore();

}

function drawGround(playery, height) {
  var draw = gameArea.context;
  if (terrain == "land") {
    draw.fillStyle = "#318c3b";
  }
  else {
    draw.fillStyle = "#154e7d";
  }
  draw.fillRect(0, height - playery, window.innerWidth, window.innerHeight);
  if (terrain == "land") {
    draw.fillStyle = "#888888";
    draw.fillRect(Math.round(((window.innerWidth)/2)-50) + targetOffset, height - playery, 100, 20);
    draw.beginPath();
    draw.moveTo(Math.round(((window.innerWidth)/2)-50) + targetOffset, height - playery);
    draw.lineTo(Math.round(((window.innerWidth)/2)-50) + targetOffset, height - playery + 20);
    draw.lineTo(Math.round(((window.innerWidth)/2)+50) + targetOffset, height - playery + 20);
    draw.lineTo(Math.round(((window.innerWidth)/2)+50) + targetOffset, height - playery);
    draw.strokeStyle = "white";
    draw.stroke();
  }
  else {
    draw.fillStyle = "#444444";
    draw.fillRect(Math.round(((window.innerWidth)/2)-60) + targetOffset, height - playery, 120, 20);
    draw.beginPath();
    draw.moveTo(Math.round(((window.innerWidth)/2)-60) + targetOffset, height - playery);
    draw.lineTo(Math.round(((window.innerWidth)/2)-60) + targetOffset, height - playery + 20);
    draw.lineTo(Math.round(((window.innerWidth)/2)+60) + targetOffset, height - playery + 20);
    draw.lineTo(Math.round(((window.innerWidth)/2)+60) + targetOffset, height - playery);
    draw.strokeStyle = "yellow";
    draw.stroke();
  }
}

function drawTarget() {
  var draw = gameArea.context;
  draw.fillStyle = "red";
  if (window.innerHeight < (target.height - player.positiony - 20)) {
    draw.fillRect(Math.round(((window.innerWidth)/2)-50) + targetOffset, window.innerHeight - 50, 100, 30);
  }
}

function drawText() {
  var draw = gameArea.context;
  draw.font = "30px Custom";
  if (shadeManipulate(256) < 128) {
    draw.fillStyle = "white";
  }
  else {
    draw.fillStyle = "black";
  }
  draw.fillText(target.height - Math.round(player.positiony) - 130, 10, 50);
  draw.fillText(Math.round(player.velocityy * 5), window.innerWidth - 60, 50);
}

function drawFuelIndicator() {
  var draw = gameArea.context;
  draw.fillStyle = "green";
  draw.fillRect(10, Math.round((window.innerHeight / 2) - 100), 30, 200);
  draw.fillStyle = "red";
  draw.fillRect(10, Math.round((window.innerHeight / 2) - 100), 30, Math.round(200 - (player.fuel * 2)));
  draw.lineWidth = "3"
  draw.strokeStyle = "black";
  draw.strokeRect(10, Math.round((window.innerHeight / 2) - 100), 30, 200);
  draw.strokeRect(10, Math.round((window.innerHeight / 2) - 100), 30, Math.round(200 - (player.fuel * 2)));
  draw.strokeRect(10, Math.round((window.innerHeight / 2) - 100), 30, 200);
}

function generateClouds() {
  window.cloud1 = {x : Math.floor(Math.random() * 1001), y : Math.floor(Math.random() * 1001)};
  window.cloud2 = {x : Math.floor(Math.random() * 1001), y : Math.floor(Math.random() * 1001)};
  window.cloud3 = {x : Math.floor(Math.random() * 1001), y : Math.floor(Math.random() * 1001)};
  window.cloud4 = {x : Math.floor(Math.random() * 1001), y : Math.floor(Math.random() * 1001)};
}

function drawClouds() {
  drawCloud(cloud1.x, playerHeight - player.positiony - cloud1.y-130);
  drawCloud(cloud2.x, playerHeight - player.positiony - cloud2.y-1000);
  drawCloud(cloud3.x, playerHeight - player.positiony - cloud3.y-2000);
  drawCloud(cloud4.x, playerHeight - player.positiony - cloud4.y-3000);
}

function drawCloud(x, y) {
  var draw = gameArea.context;
  draw.beginPath();
  draw.arc(x, y, 60, Math.PI * 0.5, Math.PI * 1.5);
  draw.arc(x + 70, y - 60, 70, Math.PI * 1, Math.PI * 1.85);
  draw.arc(x + 152, y - 45, 50, Math.PI * 1.37, Math.PI * 1.91);
  draw.arc(x + 200, y, 60, Math.PI * 1.5, Math.PI * 0.5);
  draw.moveTo(x + 200, y + 60);
  draw.lineTo(x, y + 60);
  draw.fillStyle = "white";
  draw.fill();
}

function shadeManipulate(value){
  /*var altitude = target.height - Math.round(player.positiony) - 130;
  if (altitude < 10000) {
    return Math.round(value*density*(10000/altitude)/10000);
  }
  else {
    return Math.round(value*0.2);
  }*/
  return value;
}

function colorFade(c1, c2, value){
  if (explosion == true) {
    return Math.round(Math.random()*255);
  }
  else {
    return Math.round(((c1*(10-value))+(c2*value))/10);
  }
}

function calculateDragCoeff(axis, angle, width, height) {
  if (axis == "y") {
    var radians = (angle-flipangle) * Math.PI / 180;
    return 0.05*((height * Math.sin(radians)) + (width * Math.cos(radians)));
  }

  else if (axis == "x") {
    var radians = (angle-flipangle) * Math.PI / 180;
    return 0.05*((width * Math.sin(radians)) + (height * Math.cos(radians)));
  }
}

function calculateDrag(coeff, velocity, functionDensity) {
  if (velocity < 0) {
    return -1 * Math.abs(0.0012 * coeff * density * velocity * velocity);
  }
  else {
    return Math.abs(0.0012 * coeff * density * velocity * velocity);
  }
}

function calculateAngularDrag(angle, velocityx, velocityy) {
  var angularDrag = -0.0003 * angle * Math.abs(velocityy) * density;
  return angularDrag;
}

function calculateLift(angle, velocity) {
  var radians = angle * Math.PI / 180;
  return Math.sin(2*radians) * velocity * density * 0.005;
}

function startGame() {
  gameArea.start();

}

function updateGameArea() {
  if (xbcontroller) {
    window.gp = navigator.getGamepads()[0];
    if (-40*Math.cos(player.angle*Math.PI/180) + playerHeight - 90 - player.positiony > 0 && explosion == false) {
      particleSettings.density = window.gp.buttons[7].value * 20;
    }
    if (window.gp.buttons[0].value != 0) {
      location.reload();
    }
    if (window.gp.buttons[1].value != 0) {
      history.back();
    }
  }
  if (playing == true && landed == false) {
    if (flipping == true) {
      particleSettings.density = 10;
    }
    else if (xbcontroller == false) {
      particleSettings.density = 20;
    }
    if (player.angle > 180) {
      player.angle -= 360;
    }
    else if (player.angle < -180) {
      player.angle += 360;
    }
    window.gameArea.clear();
    drawClouds();
    player.update();
    drawPlayer(player.positionx, 30, player.width, player.height, player.angle);
    drawGround(player.positiony, target.height);
    drawText();
    drawTarget();
    drawFuelIndicator();
    drawParticles();
    gameArea.canvas.style.setProperty('background-color', "rgb(" + shadeManipulate(139) + ", " + shadeManipulate(209) + ", " + shadeManipulate(252) + ")");
    if (-40*Math.cos(player.angle*Math.PI/180) + playerHeight - 90 - player.positiony < 0) {
      if ((player.velocityy > 2)||(Math.abs(player.velocityx) > 0.5)|| Math.abs(player.angle) > 7){
        console.log("RUD");
        playing = false;
      }
      else if (Math.abs(player.positionx - (Math.round(((window.innerWidth)/2))-5 + targetOffset)) < 50) {
        landed = true;
        if (terrain == "land") {
          console.log("Landed on target");
        }
        else {
          console.log("Landed on ship");
        }
        return;
      }
      else {
        landed = true;
        if (terrain == "land") {
          console.log("Landed");
          
        console.log(player.angle % 360);
        }
        else {
          console.log("Soft splashdown");
        }
        return;
      }
    }
  }
  else {
    if (landed == true) {
      if (terrain == "land" || (Math.abs(player.positionx - (Math.round(((window.innerWidth)/2))-5 + targetOffset)) < 50)) {
        player.positiony = playerHeight - 130;
        window.player.postUpdate();
        window.gameArea.clear();
        drawClouds();
        drawPlayer(player.positionx, 30, player.width, player.height, player.angle);
        drawGround(player.positiony, target.height);
        drawText();
        drawTarget();
        drawFuelIndicator();
        drawParticles();
      }
      else if (terrain == "ship") {
        window.player.postUpdate();
        window.gameArea.clear();
        drawClouds();
        drawPlayer(player.positionx, 30, player.width, player.height, player.angle);
        drawGround(player.positiony, target.height);
        drawText();
        drawTarget();
        drawFuelIndicator();
        drawParticles();
        if (target.height - Math.round(player.positiony) - 130 > -131) {
          player.positiony += 0.5;
        }
      }
    }
    else if (player.velocityy > 2) {
      upPressed = false;
      player.positiony = playerHeight - 130;
      particleSettings.density = 1000;
      particleSettings.maxLife = 500;
      window.gameArea.clear();
      window.explosion = true;
      drawGround(player.positiony, target.height);
      drawFuelIndicator();
      drawClouds();
      drawText();
      drawParticles();
    }
    else {
      window.player.postUpdate();
      window.gameArea.clear();
      drawClouds();
      if (renderPlayer == true) {
      drawPlayer(player.positionx, 30, player.width, player.height, player.angle);}
      drawGround(player.positiony, target.height);
      drawText();
      drawTarget();
      drawFuelIndicator();
      drawParticles();
    }
  }
}

startGame();