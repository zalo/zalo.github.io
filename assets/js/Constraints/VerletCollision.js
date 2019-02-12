// The distance between the mouse and the point:
var length = 50;
// The number of balls:
var num = 30;

//The Black Circle
var circle = new Path.Circle(view.center, length);
circle.strokeWidth = 0;
circle.strokeColor = 'black';

//The Black Domain
var domain = new Path.Circle(view.center, 152.5);
domain.strokeWidth = 5;
domain.strokeColor = 'black';

//The Black Balls
var balls = [];
var prevBalls = [];
for (i = 0; i < num; i++) {
  balls.push(Path.Circle(view.center + new Point((Math.random() * 100) - 50,
    (Math.random() * 100) - 50), 5));
  prevBalls.push(new Point(balls[i].position.x, balls[i].position.y));
  balls[i].strokeWidth = 10;
  balls[i].strokeColor = 'black';
}

//Integrates the points forward in time based off their current and previous positions
function verletIntegrate(i) {
  var tempCurPtx = balls[i].position.x;
  var tempCurPty = balls[i].position.y;
  balls[i].position.x += (balls[i].position.x - prevBalls[i].x);
  balls[i].position.y += (balls[i].position.y - prevBalls[i].y);
  prevBalls[i].x = tempCurPtx;
  prevBalls[i].y = tempCurPty;
}

//Records the mouse position
var mousePos = view.center;
function onMouseMove(event) {
  mousePos = event.point;
}

function onFrame(event) {
  circle.position = mousePos;

  for (var i = 0; i < num; i++) {
    //Verlet Integration
    verletIntegrate(i);
    //Add gravity
    balls[i].position += new Point(0, Math.min(1, event.delta * 30));
  }

  //Separate the balls from the mouse
  for (iter = 0; iter < 5; iter++) {
    for (i = 0; i < num; i++) {
      var toNext = circle.position - balls[i].position;
      if (toNext.length < length + 10) {
        toNext.length = length + 10;
        var offset = (circle.position - balls[i].position) - toNext;
        balls[i].position += offset;
      }
    }

    //Separate the balls from each other
    for (i = 0; i < num; i++) {
      for (j = i; j < num; j++) {
        var toNext = balls[j].position - balls[i].position;
        if (toNext.length < 20) {
          toNext.length = 20;
          var offset = (balls[j].position - balls[i].position) - toNext;
          balls[i].position += offset / 2;
          balls[j].position -= offset / 2;
        }
      }
    }

    //Keep the balls inside the domain
    for (i = 0; i < num; i++) {
      var toNext = domain.position - balls[i].position;
      if (toNext.length > 150 - 10) {
        toNext.length = 150 - 10;
        var offset = (domain.position - balls[i].position) - toNext;
        balls[i].position += offset;
      }
    }
  }
}
//Subscribe to prevent scrolling on iOS
function onMouseDown(event) { }
function onMouseUp(event) { }