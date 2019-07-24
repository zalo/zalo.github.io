// Run at http://sketch.paperjs.org

var circleRadius = 40; // How big the black circle is
var boxDimension = 175; // How big the moving frame is
var currentDragging; // The Current item that is being dragged

// Define the Bounding Frame that the Object will be confined in...
var movingFrame = new Group([
    new Path.Rectangle({
        point: [-boxDimension, -boxDimension],
        size: [boxDimension*2, boxDimension*2],
        strokeColor: '#9999',
        fillColor: 'white',
        radius: new Size(2, 2)
})]);
movingFrame.applyMatrix = false;
//movingFrame.position.set(view.center);
movingFrame.lastPos = movingFrame.position.clone();
movingFrame.lastRot = 0;

// Define the object wanting to be free...
var circle = new Path.RegularPolygon({
        center: new Point(0, -140),
        sides: 10,
        radius: circleRadius,
        fillColor: 'black',
        applyMatrix: false
});

//var cursor = new Path.RegularPolygon({
//  center: view.center/2,
//  sides: 10,
//  radius: 10,
//  fillColor: 'black',
//  applyMatrix: false
//});

var mousePos = new Point(0,0);
function onMouseDown(event){
  mousePos.set(event.point);
  if(event.item){
    event.item.oldLocal = event.item.globalToLocal(mouseToProject(event.point)); 
    currentDragging = event.item;
  }
}
function onMouseMove(event){ mousePos.set(mouseToProject(event.point)); }
function onMouseUp  (event){ currentDragging = undefined; }

//TODO: Make this work
function mouseToProject (point) {
  return point;
}


function onFrame(event){
    var floor = document.getElementsByTagName('footer')[0].offsetTop - view.element.offsetTop - 251 - 60;

    view.element.style.border = "#9999 0px solid";
    var m = movingFrame.globalMatrix.clone();
    // Translation Only
    view.element.style.transform = "matrix(1, 0, 0, 1, "+m._tx+", "+m._ty+")";
    view.matrix.translate((-m.translation + [250, 250]) - view.matrix.translation);

    // Full Rotation and Translation - Couldn't figure out how to get the mouse coordinates to work...
    //view.element.style.transform = "matrix("+m._a+", "+m._b+", "+m._c+", "+m._d+", "+m._tx+", "+m._ty+")";
    //view.matrix.set(movingFrame.globalMatrix.translate(-boxDimension, -boxDimension).inverted());

    //cursor.position = mousePos - [0, 15];
    //movingFrame.rotation = 0;
    //movingFrame.position.set(view.center);
    //console.log(movingFrame.globalMatrix);

    //-*Use Verlet Integration to add inertia to the frame*-
    var tempRot = movingFrame.rotation;
    var tempPos = movingFrame.position.clone();
    movingFrame.position += (movingFrame.position - movingFrame.lastPos);//*0.95;
    movingFrame.rotation += (movingFrame.rotation - movingFrame.lastRot);//*0.95;
    movingFrame.lastPos.set(tempPos);
    movingFrame.lastRot = tempRot;
    movingFrame.position += [0, 1]; // Exert gravity by translating downwards 
                                    // half a pixel each frame
    
    // If the mouse is held down, exert the dragging force
    if(currentDragging) {
        dragPointToPoint(currentDragging, 
                         currentDragging.localToGlobal(currentDragging.oldLocal), 
                         mousePos);
    }
    
    for(var i = 0; i < 2; i++){
      if(circle.position.y + circleRadius > floor){
        dragPointToPoint(circle, circle.position + new Point(0, circleRadius), new Point(circle.position.x, floor));
      }
      for (var j = 0; j < movingFrame.children[0].segments.length; j++) {
        var globalCorner = movingFrame.localToGlobal(movingFrame.children[0].segments[j].point);
        if(globalCorner.y > floor){
          dragPointToPoint(movingFrame, globalCorner, new Point(globalCorner.x, floor));
        }
      }
    }

    // Collide the Left/Right/Top/Bottom edges with the Circle
    for(var i = 0; i < 2; i++){
        // Collide Left/Right Edges
        var localCircle = movingFrame.globalToLocal(circle.position);
        var localEdge = localCircle.clone();
        var localCircumfrence = localCircle.clone();
        if(Math.abs(localCircle.x) + circleRadius > boxDimension ) {
            localEdge.x = Math.sign(localCircle.x) * boxDimension;
            localCircumfrence.x += Math.sign(localCircle.x) * circleRadius;
            
            var globalEdge = movingFrame.localToGlobal(localEdge);
            var globalCircumfrence = movingFrame.localToGlobal(localCircumfrence);
            dragPointToPoint(movingFrame, globalEdge, globalCircumfrence);
        }
        
        // Collide Top/Bottom Edges
        localEdge = localCircle.clone();
        localCircumfrence = localCircle.clone();
        if(Math.abs(localCircle.y) + circleRadius > boxDimension ) {
            localEdge.y = Math.sign(localCircle.y) * boxDimension;
            localCircumfrence.y += Math.sign(localCircle.y) * circleRadius;
            
            var globalEdge = movingFrame.localToGlobal(localEdge);
            var globalCircumfrence = movingFrame.localToGlobal(localCircumfrence);
            dragPointToPoint(movingFrame, globalEdge, globalCircumfrence);
        }
    }
}

// Define the function that drags an object by a point
// Finds the rotation that minimizes per-point translation
function dragPointToPoint(obj, fromPoint, toPoint) {
  if (fromPoint && toPoint) {
    // The easy part, find the translation
    var translation = toPoint.clone() - fromPoint;

    // The hard part, find the rotation
    var startingPoints = []; var endPoints = [];
    var nObj = obj;
    if(obj.children) { nObj = obj.children[0]; }
    for (var i = 0; i < nObj.segments.length; i++) {
      var curPoint = obj.localToGlobal(nObj.segments[i].point) - toPoint;
      startingPoints.push((curPoint.clone()));
      endPoints.push((curPoint.clone() + translation));
    }

    // Start the least squares rotation solve
    // Find the rotation that minimizes per-point translation
    // Between startingPoints and endPoints when rotated about
    // the "toPoint" as a pivot
    var angle = 0.0;
    for (var iters = 0; iters < 10; iters++) {
      var curCrossSum = 0.0; var curDotSum = 0.0;
      for (var i = 0; i < endPoints.length; i++) {
        curCrossSum += endPoints[i].cross(startingPoints[i]);
        curDotSum += Math.abs(startingPoints[i].dot  (endPoints[i]));
      }
      var curAngle = curCrossSum / curDotSum;
      if (Math.abs(curAngle) < 0.0000001) { break; } // This usually stops at iteration 1 or 2!! Nearly Analytic!
      curAngle *= 57.2958; // Convert to degrees
      for (var i = 0; i < endPoints.length; i++) {
        endPoints[i] = endPoints[i].rotate(curAngle);
      }
      angle += curAngle;
    }
    obj.translate(translation);
    obj.rotate(angle, toPoint);
  }
}
