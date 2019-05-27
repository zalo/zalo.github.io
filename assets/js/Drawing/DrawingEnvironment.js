// Hash generation
String.prototype.hashCode = function() {
  var hash = 0;
  if (this.length == 0) {
      return hash;
  }
  for (var i = 0; i < this.length; i++) {
      var char = this.charCodeAt(i);
      hash = ((hash<<5)-hash)+char;
      hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

var DrawingEnvironment = function () {
  //this.fullEditor = document.currentScript.getAttribute("full") == "enabled";
  this.movePath = true;
  this.brushWidth = 5;
  this.skinningWidth = 3;
  this.frameRate = 24;
  this.removeCmd = 'Remove-';

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
    window.onload = function () {
      paper.setup(drawingEnvironment.canvas);
      paper.project.activeLayer.name = "Frame-0";
      paper.project.activeLayer.addChildren(
        new paper.Group({ name:'Drawing' }), 
        new paper.Group({ name:'Undo', visible: false }),
        new paper.Group({ name:'Redo', visible: false }));

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
        // Read the file!
        drawingEnvironment.reader.readAsText(document.getElementById("svg-file").files[0]);
      });

      // Process the uploaded file
      drawingEnvironment.reader.addEventListener("load", () => {
        paper.project.importSVG(drawingEnvironment.reader.result, {
          expandShapes: true,
          insert: false,
          onLoad: (item) => {
            // Detect if it's an animation
            if (item.children[0].name && item.children[0].name.includes("Frame-0")) {
              let removeFirstLater = false;
              let layerIndex = paper.project.activeLayer.index;
              if (paper.project.layers.length == 1 && paper.project.activeLayer.children[0].children.length == 0) {
                removeFirstLater = true;
              }
              console.log("Animation Loading Success! Found " + item.children.length + " frames.");
              for (let i = 0; i < item.children.length; i++) {
                item.children[i].visible = true;
                let nextIndex = paper.project.activeLayer.index + 1;
                let nextFrameLayer = new paper.Layer({
                  name: item.children[i].name,
                  children: item.children[i].children
                });
                paper.project.insertLayer(nextIndex, nextFrameLayer);
                nextFrameLayer.activate();
              }
              if (removeFirstLater) { paper.project.layers[0].remove(); }
              paper.project.layers[layerIndex].activate();
            } else {
              // Otherwise just import this .svg dumbly
              console.log("Static SVG Loading Success! Found " + item.children.length + " groups.");
              paper.project.activeLayer.children[0].addChild(item);
            }
          },
          onError: (errMsg) => { console.error(errMsg); }
        });
        drawingEnvironment.updateOnionSkinning();
        document.getElementById("svg-file").value = null;
      });
    }
  }

  // Initialize the callbacks for the mouse tool
  this.initOmniTool = function () {
    this.omniTool = new paper.Tool();
    this.omniTool.lastTolerance = 5;
    this.omniTool.onMouseDown = function (event) {
      this.button = event.event.button;

      if (this.button == 0) {
        // Begin creating a new brush stroke
        this.currentPath = new paper.Path();
        this.currentPath.strokeColor = 'black';
        this.currentPath.add(event.point);
        this.currentPath.strokeWidth = drawingEnvironment.brushWidth;
        this.currentPath.strokeCap = 'round';
      } else {
        this.currentSegment = this.currentPath = null;
        let hitResult = this.hitTestActiveLayer(event.point);

        // Return if we didn't hit anything
        if (!hitResult)
          return;

        // Select an element for movement
        if (this.button == 1) {
          this.currentPath = hitResult.item;
          if(this.currentPath){
            this.saveItemStateForUndo(hitResult.item);
            if (hitResult.type == 'segment') {
              this.currentSegment = hitResult.segment;
            } else if (hitResult.type == 'stroke' || hitResult.type == 'fill') {
              if (drawingEnvironment.movePath) {
                this.currentSegment = null;
              } else {
                let location = hitResult.location;
                this.currentSegment = this.currentPath.insert(location.index + 1, event.point);
                this.currentPath.smooth();
              }
            }
          }
        }

        // Delete this element
        if (this.button == 2) {
          if (hitResult.type == 'segment') {
            if (hitResult.segment.path.segments.length == 2) {
              paper.project.activeLayer.children[1].addChild(hitResult.item);
            } else {
              this.saveItemStateForUndo(hitResult.item);
              hitResult.segment.remove();
            }
          } else if (hitResult.type == 'stroke' || hitResult.type == 'fill') {
            this.saveItemStateForUndo(hitResult.item);
            hitResult.item.remove();
          }
          return;
        }
      }
    }
    this.omniTool.onMouseMove = function (event) {
      paper.project.activeLayer.selected = false;
      let hit = this.hitTestActiveLayer(event.point);
      if (hit) {
        hit.item.selected = true;
        if (hit.item.strokeWidth) {
          this.lastTolerance = Math.max(hit.item.strokeWidth / 4.0, 5);
        }
      }
    }
    this.omniTool.onMouseDrag = function (event) {
      if (this.button == 0) {
        paper.project.activeLayer.selected = false;
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
    this.omniTool.onMouseUp = function (event) {
      if (this.button == 0) {
        this.currentPath.simplify(10);
        this.currentPath.name = "Stroke-" + this.currentPath.toString().hashCode();
        this.currentPath.addTo(paper.project.activeLayer.children[0]);

        // Add Undo Object to Remove Stroke Later
        paper.project.activeLayer.children[1].addChild(
          new paper.Group({ name: drawingEnvironment.removeCmd+this.currentPath.name }));
          
        // Clear the redo "history" (it's technically invalid now...)
        paper.project.activeLayer.children[2].removeChildren();
      }
    }
    this.omniTool.onKeyDown = function (event) {
      if (event.modifiers.control) {
        if(event.key == 'z') {
          // If pressing the Undo shortcut...
          this.processDoCommand(
            paper.project.activeLayer.children[0],
            paper.project.activeLayer.children[1],
            paper.project.activeLayer.children[2]);
        } else if(event.key == 'y') {
          // If pressing the Redo shortcut...
          this.processDoCommand(
            paper.project.activeLayer.children[0],
            paper.project.activeLayer.children[2],
            paper.project.activeLayer.children[1]);
        }
      }
    }
    this.omniTool.processDoCommand = function(drawingLayer, commandLayer, reverseLayer){
      let command = commandLayer.lastChild;
      if (command) {
        // If this item's name starts with the removeCmd...
        if(command.name && command.name.startsWith(drawingEnvironment.removeCmd)){
          // Find this item and "delete" it...
          let condemnedName = command.name.substring(
            drawingEnvironment.removeCmd.length);
          let condemnedStroke = drawingLayer.getItem({
            match: (item)=>{ return item.name == condemnedName; }
          });
          reverseLayer.addChild(condemnedStroke);
          command.remove();
        } else {
          // Check and see if this item already exists
          let strokeToReplace = drawingLayer.getItem({
            match: (item)=>{ return item.name == command.name; }
          });
          if (strokeToReplace) {
            // If it does exist, just replace it
            let clone = strokeToReplace.clone();
            clone.name = strokeToReplace.name;
            reverseLayer.addChild(clone);

            // Use 'replaceWith' to preserve layer order!
            strokeToReplace.replaceWith(command);
          } else {
            // If it does not exist, create it
            drawingLayer.addChild(command);
            reverseLayer.addChild(new paper.Group({ 
                name: drawingEnvironment.removeCmd+command.name 
            }));
          }
        }
      }
    }
    this.omniTool.saveItemStateForUndo = function(item){
      // If an object doesn't have a name, give it one :)
      if(!item.name){
        item.name = "ForeignObject-"+item.toString().hashCode();
      }
      let clone = item.clone();
      clone.name = item.name;
      paper.project.activeLayer.children[1].addChild(clone);

      // Clear the redo "history" (it's technically invalid now...)
      paper.project.activeLayer.children[2].removeChildren();
    }
    this.omniTool.hitTestActiveLayer = function (point) {
      return paper.project.hitTest(point, {
        segments: true,
        stroke: true,
        fill: true,
        tolerance: this.lastTolerance,
        match: (hit) => {
          return hit.item.layer == paper.project.activeLayer;
        }
      });
    }
  }

  // Generates CSS such that only one frame shows at a time
  // This is the "magic" that animates the SVG!
  this.generateAnimationCSS = function (frameRate = 24) {
    let frameTime = 1.0 / frameRate;
    let animationTime = frameTime * paper.project.layers.length;
    let animationString =
      '  <style type="text/css">\n' +
      '    @keyframes flash { 0%   { visibility: visible; }\n' +
      '                       ' + (100.0 / paper.project.layers.length) + '%  { visibility: hidden;  } }\n';
    for (let i = 0; i < paper.project.layers.length; i++) {
      animationString += '    #' + paper.project.layers[i].name + ' { animation: flash ' + animationTime + 's linear infinite ' + (frameTime * i) + 's;    }\n';
    }
    animationString += '  </style>';
    return animationString;
  }

  this.saveSVG = function () {
    // Ensure that all frames (but the first) are opaque and hidden by default
    for (let i = 0; i < paper.project.layers.length; i++) {
      paper.project.layers[i].visible = false;
      paper.project.layers[i].opacity = 1;
    }

    let fileName = "drawingExport.svg";
    let svgString = paper.project.exportSVG({ asString: true });
    svgString = svgString.substring(0, svgString.length - 6) +
      this.generateAnimationCSS(this.frameRate) +
      svgString.substring(svgString.length - 6);
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
    paper.project.activeLayer.selected = false;
    let nextIndex = paper.project.activeLayer.index + 1;
    if (paper.project.layers.length == nextIndex) {
      let nextFrameLayer = new paper.Layer();
      paper.project.insertLayer(nextIndex, nextFrameLayer);
      nextFrameLayer.activate();
      nextFrameLayer.addChildren(
        new paper.Group({ name:'Drawing' }), 
        new paper.Group({ name:'Undo', visible: false }),
        new paper.Group({ name:'Redo', visible: false }));
    } else {
      paper.project.layers[nextIndex].activate();
    }
    this.updateOnionSkinning();
  }

  // If there is content in this frame, create a new frame
  // If this is a new frame, copy from the previous frame
  this.duplicateFrame = function () {
    paper.project.activeLayer.selected = false;
    let currentLayer = paper.project.activeLayer;

    if (currentLayer.children[0].children.length > 0) {
      let nextFrameLayer = new paper.Layer();
      nextFrameLayer.copyContent(currentLayer);
      paper.project.insertLayer(currentLayer.index + 1, nextFrameLayer);
      nextFrameLayer.activate();
      this.updateOnionSkinning();
    } else {
      currentLayer.copyContent(paper.project.layers[Math.max(0, currentLayer.index - 1)]);
      currentLayer.opacity = 1;
    }
  }

  // Go back one frame
  this.prevFrame = function () {
    paper.project.activeLayer.selected = false;
    paper.project.layers[Math.max(0, paper.project.activeLayer.index - 1)].activate();
    this.updateOnionSkinning();
  }

  // Ensure all frames are named and rendering properly
  this.updateOnionSkinning = function () {
    let currentActiveIndex = paper.project.activeLayer.index;
    let minIndex = Math.max(0, currentActiveIndex - this.skinningWidth);
    let maxIndex = Math.min(paper.project.layers.length, currentActiveIndex + this.skinningWidth);
    for (let i = 0; i < paper.project.layers.length; i++) {
      paper.project.layers[i].name = "Frame-" + i;

      // Update opacity and visibility...
      if (i == currentActiveIndex) {
        paper.project.layers[i].visible = true;
        paper.project.layers[i].opacity = 1;
      } else if (i >= minIndex && i <= maxIndex) {
        paper.project.layers[i].visible = true;
        paper.project.layers[i].opacity = (1.0 - ((Math.abs(i - currentActiveIndex)) / (this.skinningWidth + 1))) * 0.25;
      } else {
        paper.project.layers[i].visible = false;
        paper.project.layers[i].opacity = 0;
      }
    }
  }

  // Initialize on construct
  this.init();
}

// Create a new Drawing Environment
var drawingEnvironment = new DrawingEnvironment();
