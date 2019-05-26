with(paper) {
  var DrawingEnvironment = function () {
    //this.fullEditor = document.currentScript.getAttribute("full") == "enabled";
    this.movePath = true;
    this.brushWidth = 5;
    this.skinningWidth = 3;
    this.frameRate = 24;

    this.reader = new FileReader();

    this.init = function () {
      // Create the Canvas Element
      this.canvas = document.createElement('canvas');
      this.canvas.id = "DrawingEnvironmentCanvas";
      this.canvas.width = 640;//window.innerWidth-20;
      this.canvas.height = 480;
      this.canvas.setAttribute("resize", "true");
      this.canvas.setAttribute("hidpi", "on");
      this.canvas.setAttribute("oncontextmenu", "return false;");
      document.currentScript.parentNode.insertBefore(this.canvas, document.currentScript.nextSibling);

      // Only execute our code once the DOM is ready
      window.onload = function() {
          setup(drawingEnvironment.canvas);
          project.activeLayer.name = "Drawing";

          // Register Animation and Resizing Callbacks
          //view.onFrame  = function(event) { }
          //view.onResize = function(event) { }

          // Initialize the Brush/Manipulator/Eraser Tool
          drawingEnvironment.initOmniTool();

          // Add the Brush Width Slider
          document.getElementById("brushWidth").addEventListener('change', (data) => { 
            drawingEnvironment.brushWidth = data.target.value;
          });

          // Allow users to upload SVGs from past sessions
          document.getElementById("svg-file").addEventListener('input', () => {
            drawingEnvironment.reader.addEventListener("load", () => { 
              project.importSVG(drawingEnvironment.reader.result, {
                expandShapes: true,
                insert: false,
                onLoad: (item) => {
                  // Detect if it's an animation
                  if(item.children[0].name && item.children[0].name.includes("Frame-0")){
                    let removeFirstLater = false;
                    let layerIndex = project.activeLayer.index;
                    if(project.layers.length == 1 && project.activeLayer.children.length==0){
                      removeFirstLater = true;
                    }
                    console.log("Animation Loading Success! Found "+item.children.length+" frames.");
                    for (let i = 0; i < item.children.length; i++) {
                      item.children[i].visible = true;
                      let nextIndex = project.activeLayer.index + 1;
                      let nextFrameLayer = new Layer({
                        name: item.children[i].name,
                        children: item.children[i].children
                      });
                      project.insertLayer(nextIndex, nextFrameLayer);
                      nextFrameLayer.activate();
                    }
                    if(removeFirstLater){ project.layers[0].remove(); }
                    project.layers[layerIndex].activate();
                  } else {
                    // Otherwise just import this .svg dumbly
                    console.log("Static SVG Loading Success! Found " + item.children.length + " groups.");
                    project.activeLayer.addChild(item);
                  }
                },
                onError: (errMsg) => { console.error(errMsg); }
              });
              drawingEnvironment.updateOnionSkinning();
            }); 

            // Read the file!
            drawingEnvironment.reader.readAsText(document.getElementById("svg-file").files[0]);
          });
      }
    }

    // Initialize the callbacks for the mouse tool
    this.initOmniTool = function() {
      this.omniTool = new Tool();
      this.omniTool.lastTolerance = 5;
      this.omniTool.onMouseDown = function(event) {
        this.button = event.event.button;

        if (this.button == 0) {
          this.currentPath = new Path();
          this.currentPath.strokeColor = 'black';
          this.currentPath.add(event.point);
          this.currentPath.strokeWidth = drawingEnvironment.brushWidth;
          this.currentPath.strokeCap = 'round';
        } else {
          this.currentSegment = this.currentPath = null;
          let hitResult = this.hitTestActiveLayer(event.point);

          // Return if there's nothing to move or delete
          if (!hitResult)
            return;
        
          if (this.button == 1) {
            this.currentPath = hitResult.item;
            if (hitResult.type == 'segment') {
              this.currentSegment = hitResult.segment;
            } else if (hitResult.type == 'stroke' || hitResult.type == 'fill') {
              if(drawingEnvironment.movePath){
                this.currentSegment = null;
              } else {
                let location = hitResult.location;
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
            } else if (hitResult.type == 'stroke' || hitResult.type == 'fill') {
              hitResult.item.remove();
            }
            return;
          }
        }
      }
      this.omniTool.onMouseMove = function(event) {
        project.activeLayer.selected = false;
        let hit = this.hitTestActiveLayer(event.point);
        if (hit){
          hit.item.selected = true;
          if(hit.item.strokeWidth){
            this.lastTolerance = Math.max(hit.item.strokeWidth/4.0, 5);
          }
        }
      }
      this.omniTool.onMouseDrag = function(event) {
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
      this.omniTool.onMouseUp = function(event){
        if (this.button == 0) {
          this.currentPath.simplify(10);
        }
      }
      this.omniTool.hitTestActiveLayer = function(point){
        return project.hitTest(point, {
          segments: true,
          stroke: true,
          fill: true,
          tolerance: this.lastTolerance,
          match: (hit) => {
            return hit.item.layer == project.activeLayer; 
          }
        });
      }
    }

    // Generates CSS such that only one frame shows at a time
    this.generateAnimationCSS = function(frameRate = 24) {
      let frameTime = 1.0/frameRate;
      let animationTime = frameTime*project.layers.length;
      let animationString = 
        '  <style type="text/css">\n'+
        '    @keyframes flash { 0%   { visibility: visible; }\n'+
        '                       '+(100.0/project.layers.length)+'%  { visibility: hidden;  } }\n';
        for (let i = 0; i < project.layers.length; i++) {
          animationString += '    #' + project.layers[i].name + ' { animation: flash '+animationTime+'s linear infinite '+(frameTime*i)+'s;    }\n';
        }
      animationString += '  </style>';
      return animationString;
    }

    this.saveSVG = function () {
      // Ensure that all frames (but the first) are opaque and hidden by default
      for (let i = 0; i < project.layers.length; i++) {
        project.layers[i].visible = false;
        project.layers[i].opacity = 1;
      }

      let fileName = "drawingExport.svg";
      let svgString = project.exportSVG({asString:true});
      svgString = svgString.substring(0, svgString.length-6) + 
                    this.generateAnimationCSS(this.frameRate) + 
                    svgString.substring(svgString.length-6);
      let url = "data:image/svg+xml;utf8," + encodeURIComponent(svgString);
      let link = document.createElement("a");
      link.download = fileName;
      link.href = url;
      link.click();

      // Re-set the onion skinning
      this.updateOnionSkinning();
    }

    // Create a new frame if one doesn't exist
    this.nextFrame = function () {
      project.activeLayer.selected = false;
      let nextIndex = project.activeLayer.index + 1;
      if (project.layers.length == nextIndex) {
        let nextFrameLayer = new Layer();
        project.insertLayer(nextIndex, nextFrameLayer);
        nextFrameLayer.activate();
      } else {
        project.layers[nextIndex].activate();
      }
      this.updateOnionSkinning();
    }

    // If there is content in this frame, create a new frame
    // If this is a new frame, copy from the previous frame
    this.duplicateFrame = function () {
      project.activeLayer.selected = false;
      let currentLayer = project.activeLayer;

      if (currentLayer.children.length > 0) {
        let nextFrameLayer = new Layer();
        nextFrameLayer.copyContent(currentLayer);
        project.insertLayer(currentLayer.index + 1, nextFrameLayer);
        nextFrameLayer.activate();
        this.updateOnionSkinning();
      } else {
        currentLayer.copyContent(project.layers[Math.max(0, currentLayer.index - 1)]);
        currentLayer.opacity = 1;
      }
    }

    // Go back one frame
    this.prevFrame = function () {
      project.activeLayer.selected = false;
      project.layers[Math.max(0, project.activeLayer.index - 1)].activate();
      this.updateOnionSkinning();
    }

    // Ensure all frames are named and rendering properly
    this.updateOnionSkinning = function () {
      let currentActiveIndex = project.activeLayer.index;
      let minIndex = Math.max(0, currentActiveIndex - this.skinningWidth);
      let maxIndex = Math.min(project.layers.length, currentActiveIndex + this.skinningWidth);
      for (let i = 0; i < project.layers.length; i++) {
        project.layers[i].name = "Frame-" + i;

        // Update opacity and visibility...
        if (i== currentActiveIndex) {
          project.layers[i].visible = true;
          project.layers[i].opacity = 1;
        } else if (i >= minIndex && i <= maxIndex) {
          project.layers[i].visible = true;
          project.layers[i].opacity = (1.0 - ((Math.abs(i - currentActiveIndex))/(this.skinningWidth+1)))*0.25;
        } else {
          project.layers[i].visible = false;
          project.layers[i].opacity = 0;
        }
      }
    }

    // Initialize on construct
    this.init();
  }
}

// Create a new Drawing Environment
var drawingEnvironment = new DrawingEnvironment();