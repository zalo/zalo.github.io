---
title: "Constraints"
date: 2019-2-6 20:05:33 -0000
categories: blog
tags:
  - Constraints
  - Verlet
---
The essence of constraints is projection.

**Find the minimum movement that satisfies the constraint.**

The most basic constraint is the distance constraint

<!-- Add the ability to toggle code blocks... -->
<script type="text/javascript">
  function toggle_visibility(id) {
    var e = document.getElementById(id);
    if(e.style.display == 'block')
       e.style.display = 'none';
    else
      e.style.display = 'block';
  }
</script>
<!-- Load the Paper.js library -->
<script type="text/javascript" src="../../assets/js/paper-full.min.js"></script>
<script type="text/paperscript" canvas="distance1">
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
    	toNext.length = length;
    	var offset = (mousePos - ball.position) - toNext;
    	ball.position += offset;
	}
}

//Subscribe to prevent scrolling on iOS
function onMouseDown(event) {}
function onMouseUp(event) {}
</script>
<canvas id="distance1" width="350" height="350"></canvas>

It is satisfied by projecting the point onto a circle around the anchor.

~~~ javascript
function ConstrainDistance(point, anchor, distance) {
  return ((point - anchor).normalized * distance) + anchor;
}
~~~

* * *

As with all constraints, distance constraints can be chained together

<script type="text/paperscript" canvas="distance2">
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
var start = view.center;
for (var i = 0; i < points; i++) {
	rope.add(start + new Point(i * length, 0));
}

//Records the mouse position
var mousePos = view.center;
function onMouseMove(event) {
	mousePos = event.point;
	
  //Set the first link's position to be at the mouse
	rope.segments[0].point = mousePos;
	for (var i = 0; i < points - 1; i++) {
		var segment = rope.segments[i];
		var nextSegment = rope.segments[i + 1];

		//Pull the segments toward eachother
		var toNext = segment.point - nextSegment.point;
		toNext.length = length;
		var offset = (segment.point - nextSegment.point) - toNext;
		nextSegment.point += offset;
	}
}

//Projects 'currentPoint' to be within 'distance' of 'anchor'
function setDistance(currentPoint, anchor, distance) {
	var toAnchor = currentPoint - anchor;
	toAnchor.length = distance;
	return toAnchor + anchor;
}

function onFrame(event) {
    //Give the rope its buttery smoothness
    rope.smooth({ type: 'continuous' });
}

function onMouseDown(event) {
	rope.fullySelected = true;
}

function onMouseUp(event) {
	rope.fullySelected = false;
}
</script>
<canvas id="distance2" width="350" height="350"></canvas>

<a onclick="toggle_visibility('pseudocode1');">Toggle Pseudocode</a>
<section id="pseudocode1" markdown="1" style="display:none;">
~~~ javascript
//Set the first link's position to be at the mouse
rope.segments[0] = mousePos;
for (i = 1; i < segments.length; i++) {
  //Pull the next segment to the previous one
  rope.segments[i] = ConstrainDistance(
    rope.segments[i], rope.segments[i-1], distance
  );
}
~~~
</section>

The order in which constraints are satisfied is important.

* * *

If the distance constraints are first solved in one direction, and then the other, it creates a form of Inverse Kinematics called "FABRIK"

<script type="text/paperscript" canvas="distance3">
// The number of points in the rope:
var points = 4;
// The distance between the points:
var length = 50;

//The Red Rope (and its previous positions)
var rope = new Path({
	strokeColor: 'red',
	strokeWidth: 5,
	strokeCap: 'round'
});
var start = view.center;
for (var i = 0; i < points; i++) {
	rope.add(start + new Point(i * length, 0));
}

//The Black Ball	
var ball = new Path.Circle(view.center, 5);
ball.strokeWidth = 10;
ball.strokeColor = 'black';

//Records the mouse position
var mousePos = view.center;
function onMouseMove(event) {
	mousePos = event.point;
}

//Projects 'currentPoint' to be within 'distance' of 'anchor'
function setDistance(currentPoint, anchor, distance) {
	var toAnchor = currentPoint - anchor;
	toAnchor.length = distance;
	return toAnchor + anchor;
}

function onFrame(event) {
    //Set the first link's position to be at the mouse
    //And solve from first to last
	rope.segments[0].point = mousePos;
	for (var i = 0; i < points - 1; i++) {
		rope.segments[i + 1].point = 
		    setDistance(rope.segments[i + 1].point, 
		                rope.segments[i].point, length);
	}
	
	//Set the last link's position to be at the anchor
	//And solve from last to first
	rope.segments[points-1].point = ball.position;
	for (var i = points - 1; i > 0; i--) {
		rope.segments[i - 1].point = 
		    setDistance(rope.segments[i - 1].point, 
		                rope.segments[i].point, length);
	}
    
    rope.smooth({ type: 'geometric', factor: 0.1});
}

function onMouseDown(event) {
	rope.fullySelected = true;
}

function onMouseUp(event) {
	rope.fullySelected = false;
}
</script>
<canvas id="distance3" width="350" height="350"></canvas>

~~~ javascript
//Set the first link's position to be at the mouse
rope.segments[0] = mousePos;
for (i = 1; i < segments.length; i++) {
  //Pull the current segment to the previous one
  rope.segments[i] = ConstrainDistance(
    rope.segments[i], rope.segments[i-1], distance
  );
}

//Set the base link's position to be at the ball
rope.segments[segments.length - 1] = ball;
for (i = segments.length - 1; i > 0; i--) {
  //Pull the previous segment to the current one
  rope.segments[i-1] = ConstrainDistance(
    rope.segments[i-1], rope.segments[i], distance
  );
}
~~~

* * *

Distance Constraints can also be used to separate

<script type="text/paperscript" canvas="distance4">
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
for(i = 0; i < num; i++){
    balls.push(Path.Circle(view.center + new Point((Math.random() * 100)-50, 
                                                   (Math.random() * 100)-50), 5));
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
    for(i = 0; i < num; i++){
        var toNext = circle.position - balls[i].position;
	    if (toNext.length < length+10) {
        	toNext.length = length+10;
        	var offset = (circle.position - balls[i].position) - toNext;
        	balls[i].position += offset;
	    }
    }
    
    //Separate the balls from each other
    for(i = 0; i < num; i++){
        for(j = i; j < num; j++){
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
function onMouseDown(event) {}
function onMouseUp(event) {}
</script>
<canvas id="distance4" width="350" height="350"></canvas>

~~~ javascript
//Separate the balls from the mouse
float cRadius = mRadius + bRadius;
for(i = 0; i < balls.length; i++){
  //If the mouse is closer than some distance
  if((mousePos-balls[i]).magnitude < cRadius){
    //Push the ball away from the mouse
    balls[i] = ConstrainDistance(balls[i], mousePos, cRadius);
  }
}

//Separate the balls from each other
for(i = 0; i < balls.length; i++){
  for(j = i; j < balls.length; j++){
    //If the balls are closer than 2x their radius
    var curDisplacement = balls[j].position - balls[i].position;
    if (curDisplacement.magnitude < bRadius*2) {
      //Move each ball half of the distance away from the other
      var temp = ConstrainDistance(balls[i], balls[j], bRadius);
      balls[j] = ConstrainDistance(balls[j], balls[i], bRadius);
      balls[i] = temp;
    }
  }
}
~~~

* * *

If the constraints act symmetrically, and their contributuions are averaged, then the order of satisfaction does not matter

<script type="text/paperscript" canvas="line4">
// The number of points in the rope:
var points = 10;
// The distance between the points:
var length = 10;

//The Red Rope (and its previous positions)
var rope = new Path({
	strokeColor: 'red',
	strokeWidth: 5,
	strokeCap: 'round'
});
var start = view.center;
for (var i = 0; i < points; i++) {
	rope.add(start + new Point(i * length, 0));
}

//The Black Ball	
var ball = new Path.Circle(view.center, 5);
ball.strokeWidth = 10;
ball.strokeColor = 'black';

//Records the mouse position
var mousePos = view.center;
function onMouseMove(event) {
	mousePos = event.point;
}

//Projects 'currentPoint' to be within 'distance' of 'anchor'
function setDistance(currentPoint, anchor, distance) {
	var toAnchor = currentPoint - anchor;
	toAnchor.length = distance;
	return toAnchor + anchor;
}

function onFrame(event) {
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
		}
		rope.segments[points-1].point = view.center;
	}

	//Give the rope its buttery smoothness
	rope.smooth({ type: 'continuous' });
}

function onMouseDown(event) {
	rope.fullySelected = true;
}

function onMouseUp(event) {
	rope.fullySelected = false;
}
</script>
<canvas id="line4" width="350" height="350"></canvas>

As you can see, the chain no longer prioritizes anchors.  This makes it more physically correct, but also more expensive to compute.

* * *

By adding momentum (with Verlet Integration), one can simulate physics with these constraints

<script type="text/paperscript" src="../../assets/js/RedRope.js" canvas="redRope"></script>
<canvas id="redRope" width="350" height="350"></canvas>

If one wraps this rope into a circle, and constrains the shape's volume, one can create a volume preserving soft-body

<script type="text/paperscript" src="../../assets/js/VolumeBlob.js" canvas="softBody"></script>
<canvas id="softBody" width="350" height="350"></canvas>