// The distance between the mouse and the point:
var length = 50;

//The Black Circle
var circle = new Path.Circle(view.center, length);
circle.strokeWidth = 1;
circle.strokeColor = 'black';

//The Black Ball	
var ball = new Path.Circle(view.center, 5);
ball.strokeWidth = 10;
ball.strokeColor = 'black';

//Records the mouse position
var mousePos = view.center;
function onMouseMove(event) {
  mousePos = event.point;

  circle.position = mousePos;

  var toNext = mousePos - ball.position;
  if (toNext.length > length) {
    //-*Pull the next segment to the previous one*-
    ball.position = ConstrainDistance(
      ball.position, mousePos, length
    );
  }
}

//Projects 'point' to be within 'distance' of 'anchor'
function ConstrainDistance(point, anchor, distance) {
  return ((point - anchor).normalize() * distance) + anchor;
}

//Subscribe to prevent scrolling on iOS
function onMouseDown(event) { }
function onMouseUp(event) { }