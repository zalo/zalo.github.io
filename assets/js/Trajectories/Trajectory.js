// Run this example at http://sketch.paperjs.org/

var currentTime = 0.0;
var substeps = 10;

//The Black Catcher
var catcher = new Path.Circle(view.center + [-80, 40], 20);
catcher.strokeWidth = 3;
catcher.strokeColor = 'black';
var prevCatcher = new Point(catcher.position.x, catcher.position.y);

//The Trajectory
var trajectory = new Path.Line(view.center + [-80, 40],
  view.center + [80, 40]);
trajectory.strokeWidth = 1;
trajectory.strokeColor = 'black';
trajectory.fullySelected = true;
function getAcceleration(curve, time) {
  var dt = 1 / (60 * substeps)
  var epsilon = dt * dt / 2;
  var velocity1 = curve.getWeightedTangentAtTime(time - epsilon);
  var velocity2 = curve.getWeightedTangentAtTime(time + epsilon);
  return velocity2 - velocity1;
}

//The Floor
var domain = new Path.Line(view.center + [-800, 100], view.center + [800, 100]);
domain.strokeWidth = 5;
domain.strokeColor = 'black';

var ball = Path.Circle(view.center + new Point((Math.random() * 100) - 50, (Math.random() * 100) - 50), 5);
var prevBall = new Point(ball.position.x, ball.position.y);
ball.strokeWidth = 10;
ball.strokeColor = 'black';

//Integrates the points forward in time based off their current and previous positions
function verletIntegrate(curPt, prevPt) {
  var temp = new Point(curPt);
  curPt.set(curPt + (curPt - prevPt));
  prevPt.set(temp);
}

//Records the mouse position
var mousePos = view.center;
var prevMouse = new Point(mousePos.x, mousePos.y);
function onMouseMove(event) {
  prevMouse = mousePos;
  mousePos = event.point;
}

function onFrame(event) {
  for (var step = 0; step < substeps; step++) {
    //Verlet Integration
    verletIntegrate(ball.position, prevBall);
    verletIntegrate(catcher.position, prevCatcher);
    //Add gravity
    ball.position += new Point(0, Math.min(1, event.delta * 15 / (substeps * substeps)));
    catcher.position += new Point(0, Math.min(1, event.delta * 15 / (substeps * substeps)));
    //Floor Collision
    ball.position.y = Math.min(ball.position.y, view.center.y + 87.5);
    catcher.position.y = Math.min(catcher.position.y, view.center.y + 77.5);

    if (held) {
      if (step == substeps - 1) {
        ball.position = mousePos;
        prevBall = ((prevMouse - mousePos) / substeps) + mousePos;
      }
      currentTime = 0;
    } else {
      currentTime += (1 / (60 * substeps));
      // Set the Catcher to where it should be analytically
      //catcher.position = trajectory.curves[0].getPointAtTime(currentTime);

      //Apply movement to the catcher in thrust space!
      if (currentTime < 1 - 0.0001) {
        catcher.position += getAcceleration(trajectory.curves[0], currentTime);
      }

      // Move and show the visual trajectory so you can validate that it is indeed moving along it...
      trajectory.curves[0].point1 += ball.position - prevBall;
      trajectory.curves[0].point2 += ball.position - prevBall;
    }
  }
}
//Subscribe to prevent scrolling on iOS
var held = false;
function onMouseDown(event) { held = true; prevBall = mousePos.clone(); }
function onMouseUp(event) {
  held = false;
  trajectory.curves[0].handle1 = ((catcher.position - prevCatcher) - (ball.position - prevBall)) * (20 * substeps);
  trajectory.curves[0].point1 = catcher.position;
  trajectory.curves[0].point2 = ball.position;
  //Velocity to arrive at the destination with
  // This is relative, need to cancel out accumulated gravity too
  //trajectory.curves[0].handle2 = ((ball.position - prevBall) * (20 * substeps))+ [0,200]; 
}
