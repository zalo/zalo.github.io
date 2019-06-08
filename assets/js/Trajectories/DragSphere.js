// Run at http://sketch.paperjs.org

var circleRadius = 40; // How big the black circle is
var boxDimension = 175; // How big the moving frame is
var currentDragging; // The Current item that is being dragged

// Define the Bounding Frame that the Object will be confined in...
var movingFrame = new Group([
    new Path.Rectangle({
        point: [-boxDimension, -boxDimension],
        size: [boxDimension*2, boxDimension*2],
        strokeColor: 'black',
        fillColor: 'white',
        radius: new Size(2, 2)
})]);
movingFrame.applyMatrix = false;
//movingFrame.position.set(view.center);
movingFrame.lastPos = movingFrame.position.clone();
movingFrame.lastRot = 0;

// Define the object wanting to be free...
var circle = new Path.RegularPolygon({
        center: view.center/2,
        sides: 10,
        radius: circleRadius,
        fillColor: 'black',
        applyMatrix: false
});

var cursor = new Path.RegularPolygon({
  center: view.center/2,
  sides: 10,
  radius: 10,
  fillColor: 'black',
  applyMatrix: false
});

var mousePos = new Point(0,0);
function onMouseDown(event){
  if(event.item){
    event.item.oldLocal = event.item.globalToLocal(mouseToProject(event.point)); 
    currentDragging = event.item;
  }
}
function onMouseMove(event){ mousePos.set(mouseToProject(event.point)); }
function onMouseUp  (event){ currentDragging = undefined; }

//TODO: Make this work
function mouseToProject (point) {
  var decomposed = view.matrix.decompose();
  console.log(decomposed);
  return view.matrix.transform(point);// + movingOffset;
}


function onFrame(event){
    view.element.style.border = "#9999 1px solid";
    var m = movingFrame.globalMatrix.clone();
    view.element.style.transform = "matrix("+m._a+", "+m._b+", "+m._c+", "+m._d+", "+m._tx+", "+m._ty+")";

    view.matrix.set(movingFrame.globalMatrix.translate(-boxDimension, -boxDimension).inverted());

    cursor.position = mousePos - [0, 15];
    //movingFrame.rotation = 0;
    //movingFrame.position.set(view.center);
    //console.log(movingFrame.globalMatrix);

    //-*Use Verlet Integration to add inertia to the frame*-
    var tempRot = movingFrame.rotation;
    var tempPos = movingFrame.position.clone();
    movingFrame.position += (movingFrame.position - movingFrame.lastPos)*0.95;
    movingFrame.rotation += (movingFrame.rotation - movingFrame.lastRot)*0.95;
    movingFrame.lastPos.set(tempPos);
    movingFrame.lastRot = tempRot;
    //movingFrame.position += [0, 1]; // Exert gravity by translating downwards 
                                    // half a pixel each frame
    
    // If the mouse is held down, exert the dragging force
    if(currentDragging) {
        dragPointToPoint(currentDragging, 
                         currentDragging.localToGlobal(currentDragging.oldLocal), 
                         mousePos);
    }
    
    // Collide the Left/Right/Top/Bottom edges with the Circle
    for(var i = 0; i < 3; i++){
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

// Define the function that will take one point on an object
// and move/rotate that object so it is at a new point
function dragPointToPoint(obj, fromPoint, toPoint) {
    // Tired: Use Center of the Object as the Pivot
    var pivot = obj.position.clone();
    // Wired: Use Extrapolated Opposing Point as the Pivot
    var offset = obj.position - fromPoint;
    pivot += offset / (offset.dot(offset) * 0.0000002); //<- Controls the Inertia
    
    // Drag with Maximum Rotation/Minimum Translation (about the pivot)
    var angle = (fromPoint - pivot).getDirectedAngle(toPoint - pivot);
    var oldDistance = fromPoint.getDistance(pivot);
    var newPivot = (pivot - toPoint).normalize(oldDistance).add(toPoint);
    var dragMatrix = new Matrix().translate(newPivot.clone() - pivot)
                                 .rotate(angle, pivot);
    obj.transform(dragMatrix);
}
