// The number of points in the rope:
var points = 12;
// The distance between the points:
var radius = 50;

//Precalculate certain intrinsics
var area = radius * radius * 3.14159;
var circumfrence = radius * 2 * 3.14159;
var length = circumfrence * 1.15 / points;

//The Black Blob
var blob = new Path();
var blobOld = new Path();
var accumulatedDisplacements = [];
var normals = [];
blob.closed = true;
for (var i = 0; i < points; i++) {
	var delta = new Point({ length: radius, angle: (360 / points) * i });
	blob.add(view.center + delta);
	blobOld.add(view.center + delta);
	normals[i] = (new Path.Line(view.center + delta, view.center + (delta * 1.5)));
	//normals[i].strokeColor = 'black'; //Uncomment to visualize the surface normals
}
blob.fillColor = 'black';
blob.strokeColor = 'black';
blob.strokeWidth = 5;

//The Black Circle
var circle = new Path.Circle(view.center, 152.5);
circle.strokeWidth = 5;
circle.strokeColor = 'black';

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

//Records the mouse position
var mousePos = view.center;
function onMouseMove(event) {
	mousePos = event.point;
}

function onFrame(event) {
	for (var i = 0; i < points; i++) {
		//Verlet Integration
		verletIntegrate(blob.segments[i], blobOld.segments[i]);
		//Add gravity
		blob.segments[i].point += new Point(0, event.delta * 30);
	}

	//Iterate 10 times to resolve the constraints
	for (var j = 0; j < 10; j++) {
		for (var i = 0; i < points; i++) {
			var segment = blob.segments[i];
			var nextIndex = (i == points - 1) ? 0 : i + 1;
			var nextSegment = blob.segments[nextIndex];

			//Pull the segments toward eachother
			var toNext = segment.point - nextSegment.point;
			if (toNext.length > length) {
				toNext.length = length;
				var offset = (segment.point - nextSegment.point) - toNext;
				accumulatedDisplacements[(i * 3)] -= offset.x / 2;
				accumulatedDisplacements[(i * 3) + 1] -= offset.y / 2;
				accumulatedDisplacements[(i * 3) + 2] += 1.0;
				accumulatedDisplacements[(nextIndex * 3)] += offset.x / 2;
				accumulatedDisplacements[(nextIndex * 3) + 1] += offset.y / 2;
				accumulatedDisplacements[(nextIndex * 3) + 2] += 1.0;
			}
		}

		//Calculate area of The Black Blob and compare to desired area
		var deltaArea = (blob.area < area * 2) ? area - blob.area : 0;
		var dilationDistance = deltaArea / circumfrence;

		//Dilate The Black Blob by the distance required to achieve the desired area
		for (var i = 0; i < points; i++) {
			var prevIndex = i == 0 ? points - 1 : i - 1;
			var nextIndex = i == points - 1 ? 0 : i + 1;
			var normal = blob.segments[nextIndex].point - blob.segments[prevIndex].point;
			normal.angle -= 90; normal.length = 1;
			normals[i].segments[0].point = blob.segments[i].point;
			normals[i].segments[1].point = blob.segments[i].point + (normal * 20);
			accumulatedDisplacements[(i * 3)] += normal.x * dilationDistance;
			accumulatedDisplacements[(i * 3) + 1] += normal.y * dilationDistance;
			accumulatedDisplacements[(i * 3) + 2] += 1.0;
		}

		//Apply Accumulated Forces
		for (var i = 0; i < points; i++) {
			if (accumulatedDisplacements[(i * 3) + 2] > 0) {
				blob.segments[i].point += new Point(accumulatedDisplacements[(i * 3)],
					accumulatedDisplacements[(i * 3) + 1]) / accumulatedDisplacements[(i * 3) + 2];
			}
		}
		//Reset the accumulated forces for the next frame
		for (var i = 0; i < points * 3; i++) { accumulatedDisplacements[i] = 0; }

		//Handle collisions
		for (var i = 0; i < points; i++) {
			if ((blob.segments[i].point - mousePos).length < 40) {
				blob.segments[i].point = setDistance(blob.segments[i].point, mousePos, 40);
			}
			if ((blob.segments[i].point - view.center).length > 150) {
				blob.segments[i].point = setDistance(blob.segments[i].point, view.center, 150);
			}
		}
	}
	//Ensure The Black Circle stays centered in the view
	circle.position = view.center;

	//Give The Black Blob its buttery form
	blob.smooth({ type: 'continuous' });
}

function onMouseDown(event) {
	blob.fullySelected = true;
}

function onMouseUp(event) {
	blob.fullySelected = false;
}