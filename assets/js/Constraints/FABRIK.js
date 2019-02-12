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
  var circle = new Path.Circle(chain.segments[i].point, length);
  circle.strokeWidth = 1;
  circle.strokeColor = 'black';
  circle.visible = false;
  circles.push(circle);
}

//Records the mouse position
var mousePos = view.center;
function onMouseMove(event) {
  mousePos = event.point;

  //Set the first link's position to be at the mouse
  chain.segments[0].point = mousePos;
  //-*Reach Forwards*- (this pulls the chain off of its anchor)
  for (var i = 0; i < points - 1; i++) {
    chain.segments[i + 1].point = ConstrainDistance(chain.segments[i + 1].point, chain.segments[i].point, length);
  }

  //Set the last link's position to be at the center
  chain.segments[points - 1].point = view.center;
  //-*Reach Backwards*- (this pulls the chain back to the anchor)
  for (var i = points - 1; i > 0; i--) {
    chain.segments[i - 1].point = ConstrainDistance(chain.segments[i - 1].point, chain.segments[i].point, length);
  }

  //Draw the Joints and Circles in the correct place
  for (var i = 0; i < points; i++) {
    joints[i].position = chain.segments[i].point;
    circles[i].position = chain.segments[i].point;
  }
  //Give the chain its rigid segmentedness
  chain.smooth({ type: 'geometric', factor: 0.1 });
}

//Projects 'point' to be within 'distance' of 'anchor'
function ConstrainDistance(point, anchor, distance) {
  return ((point - anchor).normalize() * distance) + anchor;
}

function onMouseDown(event) {
  for (var i = 0; i < points; i++) {
    circles[i].visible = true;
  }
}

function onMouseUp(event) {
  for (var i = 0; i < points; i++) {
    circles[i].visible = false;
  }
}