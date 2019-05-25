with(paper){
  var DrawingEnvironment = function () {
    //this.fullEditor = document.currentScript.getAttribute("full") == "enabled";
    this.movePath = true;
    this.brushWidth = 5;

    this.init = function () {
      // Create the Canvas Element
      this.canvas = document.createElement('canvas');
      this.canvas.id = "DrawingEnvironmentCanvas";
      this.canvas.width = window.innerWidth-20;
      this.canvas.height = 480;
      this.canvas.setAttribute("resize", "true");
      this.canvas.setAttribute("hidpi", "on");
      this.canvas.setAttribute("oncontextmenu", "return false;");
      document.currentScript.parentNode.insertBefore(this.canvas, document.currentScript.nextSibling);

      // Only execute our code once the DOM is ready
      window.onload = function() {
          setup(drawingEnvironment.canvas);

          view.onFrame  = function(event) { }
          view.onResize = function(event) { }

          drawingEnvironment.initBrushTool();

          document.getElementById("brushWidth").addEventListener('change', (data) => { 
            drawingEnvironment.brushWidth = data.target.value;
          });
      }
    }

    this.initBrushTool = function() {
      this.brush = new Tool();
      this.brush.onMouseDown = function(event) {
        this.button = event.event.button;

        if (this.button == 0) {
          this.currentPath = new Path();
          this.currentPath.strokeColor = 'black';
          this.currentPath.add(event.point);
          this.currentPath.strokeWidth = drawingEnvironment.brushWidth;
          this.currentPath.strokeCap = 'round';
        } else {
          this.currentSegment = this.currentPath = null;
          var hitResult = project.hitTest(event.point, {
            segments: true,
            stroke: true,
            fill: false,
            tolerance: this.lastTolerance
          });

          // Return if there's nothing to move or delete
          if (!hitResult)
            return;
        
          if (this.button == 1) {
            this.currentPath = hitResult.item;
            if (hitResult.type == 'segment') {
              this.currentSegment = hitResult.segment;
            } else if (hitResult.type == 'stroke') {
              if(drawingEnvironment.movePath){
                this.currentSegment = null;
              } else {
                var location = hitResult.location;
                this.currentSegment = this.currentPath.insert(location.index + 1, event.point);
                this.currentPath.smooth();
              }
            }
            //drawingEnvironment.movePath = hitResult.type == 'fill';
            //if (drawingEnvironment.movePath)
            //  project.activeLayer.addChild(hitResult.item);
          }

          if (this.button == 2) {
            if (hitResult.type == 'segment') {
              if(hitResult.segment.path.segments.length == 2){
                hitResult.segment.path.remove();
              }else{
                hitResult.segment.remove();
              }
            } else if (hitResult.type == 'stroke') {
              hitResult.item.remove();
            }
            return;
          }
        }
      }
      this.brush.onMouseMove = function(event) {
        project.activeLayer.selected = false;
        if (event.item){
          event.item.selected = true;
          if(event.item.strokeWidth){
            this.lastTolerance = Math.max(event.item.strokeWidth/2.0, 10);
          }
        }
      }
      this.brush.onMouseDrag = function(event) {
        if (this.button == 0) {
          project.activeLayer.selected = false;
          this.currentPath.add(event.point);
        } else {
          if (this.currentSegment) {
            this.currentSegment.point = this.currentSegment.point.add(event.delta);
            //this.currentPath.smooth();
          } else if (this.currentPath) {
            this.currentPath.position = this.currentPath.position.add(event.delta);
          }
        }
      }
      this.brush.onMouseUp = function(event){
        if (this.button == 0) {
          this.currentPath.simplify(10);
        }
      }
    }

    this.saveSVG = function () {
      let fileName = "drawingExport.svg";
      var url = "data:image/svg+xml;utf8," + encodeURIComponent(project.exportSVG({asString:true}));
      var link = document.createElement("a");
      link.download = fileName;
      link.href = url;
      link.click();
    }

    this.init();
  }
}
var drawingEnvironment = new DrawingEnvironment();