var LineDrawer = function (environment) {
  this.environment = environment;
  this.lines = [];
  this.currentLine = 0;

  // Start the line factory...
  this.dashedMaterial = new THREE.LineDashedMaterial({
    color: 0x777777,
    linewidth: 2,
    scale: 1,
    dashSize: 5,
    gapSize: 2,
    transparent: true,
    opacity: 0.5
  });

  this.drawLine = function (start, end) {
    if (this.currentLine < this.lines.length) {
      this.lines[this.currentLine].geometry.vertices[0].copy(start);
      this.lines[this.currentLine].geometry.vertices[1].copy(end);
      this.lines[this.currentLine].computeLineDistances();
      this.lines[this.currentLine].geometry.lineDistancesNeedUpdate = true;
      this.lines[this.currentLine].geometry.verticesNeedUpdate = true;
    } else {
      let lineGeo = new THREE.Geometry();
      lineGeo.vertices.push(start.clone(), end.clone());
      let line = new THREE.Line(lineGeo, this.dashedMaterial);
      line.computeLineDistances();
      this.lines.push(line);
      this.environment.scene.add(this.lines[this.lines.length - 1]);
    }
    this.currentLine++;
  }

  this.Commit = function () {
    for (let i = 0; i < this.lines.length; i++) {
      this.lines[i].visible = i < this.currentLine;
    }
    this.currentLine = 0;
  }
}
