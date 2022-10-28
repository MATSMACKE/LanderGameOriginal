"use strict";

var level=10;
var alt;
var aoa;
var av;
var posx;
var waitTimer400 = 0;

function doAiCycle() {
  alt = target.height - Math.round(player.positiony) - 130;
  aoa = player.angle;
  av = player.angularVelocity;
  posx = player.positionx;
  if (level == 10) {
    if (alt > 1500) {
      if (posx > -400+(Math.round(((window.innerWidth)/2)-5))) {
        if (aoa < 45 && av < 1) {
          rightPressed = true;
          leftPressed = false;
          console.log('pressing right');
        }
        else {
          rightPressed = false;
          leftPressed = false;
          console.log("neutral");
        }
      }
      else {
        leftPressed = false;
        rightPressed = false;
      }
    }
    else {
      if (alt > 600) {
        waitTimer400 += 1;
        console.log(waitTimer400);
        if (waitTimer400 > 50) {
          if (aoa < -35) {
            rightPressed = true;
          }
          else {
            rightPressed = false;
            leftPressed = false;
          }
        }
        else {
          rightPressed = false;
          leftPressed = false;
        }
      
        console.log('pressing right');
        
      }
      else if (alt < 600 && alt>80) {
        leftPressed = false;
      }
    }
  }
}

var AiTimerinterval = setInterval(doAiCycle, 20);
