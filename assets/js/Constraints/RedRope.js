// Run this example at http://sketch.paperjs.org/

// Adapted from the following paper js example:
// http://paperjs.org/examples/chain/
// Which was adapted from the following Processing example:
// http://processing.org/learning/topics/follow3.html

// The number of points in the rope:
var points = 10;
// The distance between the points:
var length = 25;

//The Red Rope (and its previous positions)
var rope = new Path({
	strokeColor: 'red',
	strokeWidth: 5,
	strokeCap: 'round'
});
var ropeOld = new Path();
var start = view.center / [5, 0.5];
for (var i = 0; i < points; i++) {
	rope.add(start + new Point(i * length, 0));
	ropeOld.add(start + new Point(i * length, 0));
}

//The Black Circle
var circle = new Path.Circle(view.center, 50);
circle.strokeWidth = 5;
circle.strokeColor = 'black';

//The Black Ball (at the end of The Red Rope)	
var ball = new Path.Circle(view.center, 5);
ball.strokeWidth = 10;
ball.strokeColor = 'black';
ballPrev = new Point(view.center);

//Records the mouse position (and depenetrates it from The Black Circle)
var mousePos = view.center;
function onMouseMove(event) {
	mousePos = event.point;
	if ((mousePos - circle.position).length <= 55) {
		mousePos = setDistance(mousePos, circle.position, 55);
	}
}

//Integrates the points forward in time based off their current and previous positions
function verletIntegrate(currentSegment, previousSegment) {
	var tempCurPtx = currentSegment.point.x;
	var tempCurPty = currentSegment.point.y;
	currentSegment.point.x += (currentSegment.point.x - previousSegment.point.x);
	currentSegment.point.y += (currentSegment.point.y - previousSegment.point.y);
	previousSegment.point.x = tempCurPtx;
	previousSegment.point.y = tempCurPty;
}

//Projects 'currentPoint' to be within 'distance' of 'anchor'
function setDistance(currentPoint, anchor, distance) {
	var toAnchor = currentPoint - anchor;
	toAnchor.length = distance;
	return toAnchor + anchor;
}

function onFrame(event) {
	for (var i = 0; i < points - 1; i++) {
		//Verlet Integration
		verletIntegrate(rope.segments[i + 1], ropeOld.segments[i + 1]);
		//Add gravity
		rope.segments[i + 1].point += new Point(0, 0.5);
	}

	//Iterate 10 times to resolve the constraints
	for (var j = 0; j < 10; j++) {
		for (var i = 0; i < points - 1; i++) {
			var nextSegment = rope.segments[i + 1];

			//Pull the segments toward eachother
			var segment = rope.segments[i];
			var toNext = segment.point - nextSegment.point;
			if (toNext.length > length) {
				toNext.length = length;
				var offset = (segment.point - nextSegment.point) - toNext;
				nextSegment.point += offset / 2;
				segment.point -= offset / 2;
			}

			//Set the first link's position to be at the mouse
			if (i == 0) rope.segments[0].point = mousePos;

			//Long-Distance Length Constraint (reduces iterations)
			if ((nextSegment.point - mousePos).length > (i + 1) * length) {
				nextSegment.point = setDistance(nextSegment.point, mousePos, (i + 1) * length);
			}
		}
	}

	//Handle positioning and collision with the circle in the center
	circle.position = view.center;
	for (var i = 0; i < points - 1; i++) {
		var nextSegment = rope.segments[i + 1];
		var radius = (i == points - 2) ? 62.5 : 55;
		if ((nextSegment.point - view.center).length < radius) {
			nextSegment.point = setDistance(nextSegment.point, view.center, radius);
		}
	}

	//Also draw a little ball at the end of the rope :)
	ball.position = rope.segments[points - 1].point;

	//Give the rope its buttery smoothness
	rope.smooth({ type: 'continuous' });
}

function onMouseDown(event) {
	rope.fullySelected = true;
	rope.strokeColor = 'red';
}

function onMouseUp(event) {
	rope.fullySelected = false;
	rope.strokeColor = '#e4141b';
}