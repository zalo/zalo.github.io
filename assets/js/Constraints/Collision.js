// The distance between the mouse and the point:
var length = 50;
// The number of balls:
var num = 20;

//The Black Circle
var circle = new Path.Circle(view.center, length);
circle.strokeWidth = 1;
circle.strokeColor = 'black';

//The Black Balls
var balls = [];
for (i = 0; i < num; i++) {
  balls.push(Path.Circle(view.center + new Point((Math.random() * 100) - 50, (Math.random() * 100) - 50), 5));
  balls[i].strokeWidth = 10;
  balls[i].strokeColor = 'black';
}

//Records the mouse position
var mousePos = view.center;
function onMouseMove(event) {
  mousePos = event.point;
}

function onFrame(event) {
  circle.position = mousePos;

  //Separate the balls from the mouse
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
}
//Subscribe to prevent scrolling on iOS
function onMouseDown(event) { }
function onMouseUp(event) { }