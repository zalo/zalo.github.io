// Run this example at http://sketch.paperjs.org/

// The number of points in the chain:
var points = 5;
// The distance between the points:
var length = 50;

//Set up the drawable elements (the chain, joints, and circles)
var joints = [];
var circles = [];
var chain = new Path({
  strokeColor: 'black',
  strokeWidth: 3,
  strokeCap: 'round'
});
var start = view.center;
for (var i = 0; i < points; i++) {
  chain.add(start + new Point(i * length, 0));
  var ball = new Path.Circle(chain.segments[i].point, 5);
  ball.strokeWidth = 10;
  ball.strokeColor = 'black';
  joints.push(ball);
  if (i + 1 < points) {
    var circle = new Path.Circle(chain.segments[i].point, length);
    circle.strokeWidth = 1;
    circle.strokeColor = 'black';
    circle.visible = false;
    circles.push(circle);
  }
}

//Records the mouse position
var mousePos = view.center;
function onMouseMove(event) {
  mousePos = event.point;

  //Set the first link's position to be at the mouse
  chain.segments[0].point = mousePos;
  joints[0].position = chain.segments[0].point;
  circles[0].position = chain.segments[0].point;
  for (var i = 0; i < points - 1; i++) {
    //-*Pull the next segment to the previous one*-
    chain.segments[i + 1].point = ConstrainDistance(chain.segments[i + 1].point, chain.segments[i].point, length);

    //Draw the Joints and Circles in the correct place
    joints[i + 1].position = chain.segments[i + 1].point;
    if (i + 2 < points) {
      circles[i + 1].position = chain.segments[i + 1].point;
    }
  }
  //Give the chain its rigid segmentedness
  chain.smooth({ type: 'geometric', factor: 0.1 });
}

//Projects 'point' to be within 'distance' of 'anchor'
function ConstrainDistance(point, anchor, distance) {
  return ((point - anchor).normalize() * distance) + anchor;
}

function onMouseDown(event) {
  for (var i = 0; i < points - 1; i++) {
    circles[i].visible = true;
  }
}

function onMouseUp(event) {
  for (var i = 0; i < points - 1; i++) {
    circles[i].visible = false;
  }
}