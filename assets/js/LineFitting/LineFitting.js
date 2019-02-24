var LineFittingEnvironment = function () {
  this.environment = new Environment();
  this.updating = false;

  this.points = [];
  this.residuals = [];
  this.boxGeometry = new THREE.BoxBufferGeometry(100, 100, 100);
  this.white = new THREE.MeshLambertMaterial({ color: 0x888888 });
  this.dark = new THREE.MeshLambertMaterial({ color: 0x555555 });
  this.blue = new THREE.MeshPhongMaterial({ color: 0x3399dd });
  this.lineDir = new THREE.Vector3(1, 0, 0);

  this.showResiduals = document.currentScript.getAttribute("residuals") == "enabled";

  this.initPoints = function () {
    let scl = new THREE.Vector3(100, 50, 50);
    for (let i = 0; i < 10; i++) {
      var box = new THREE.Mesh(this.boxGeometry, this.blue);
      this.environment.scene.add(box);
      box.scale.set(0.05, 0.05, 0.05);
      box.position.set(
        (Math.random() * scl.x) - (scl.x / 2),
        (Math.random() * scl.y) - (scl.y / 2) + 75,
        (Math.random() * scl.z) - (scl.z / 2));
      box.castShadow = true;
      this.environment.draggableObjects.push(box);
      this.points.push(box);

      if (this.showResiduals) {
        var residual = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), box.position, 15, 0x666666);
        residual.setLength(15, 3, 1);
        this.environment.scene.add(residual);
        this.residuals.push(residual);

        residual.line.material.transparent = true;
        residual.cone.material.transparent = true;
        residual.line.material.opacity = 0.5;
        residual.cone.material.opacity = 0.5;
      }
    }
    let average = this.getAverage(this.points);
    this.environment.camera.position.y = 150;
    this.environment.camera.lookAt(average);
    if (this.environment.orbit) {
      this.environment.controls.target.set(average.x, average.y, average.z);
      this.environment.controls.update();
    }

    this.avg = new THREE.Mesh(this.boxGeometry, new THREE.MeshPhongMaterial({ color: 0xdd3333 }));
    this.environment.scene.add(this.avg);
    this.avg.scale.set(0.05, 0.05, 0.05);
    this.avg.position.set(average.x, average.y, average.z);
    this.avg.castShadow = true;
    this.avg.visible = !this.showResiduals;

    this.fitDirForward = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), this.avg.position, 40, 0xdd3333);
    this.fitDirBackward = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), this.avg.position, 40, 0xdd3333);
    this.fitDirForward.setLength(800, 10, 5);
    this.fitDirBackward.setLength(800, 10, 5);
    this.environment.scene.add(this.fitDirForward);
    this.environment.scene.add(this.fitDirBackward);
  }

  this.getAverage = function (points) {
    let average = new THREE.Vector3(0, 0, 0);
    for (let i = 0; i < points.length; i++) {
      average.add(points[i].position);
    }
    average.divideScalar(points.length);
    return average;
  }

  this.fitLine = function (points, average, normalizedDirection) {
    let newDirection = new THREE.Vector3(0, 0, 0);
    for (let i = 0; i < 10; i++) {
      newDirection.set(0, 0, 0);
      for (let i = 0; i < points.length; i++) {
        let centeredPoint = points[i].position.clone().sub(average);
        newDirection.add(centeredPoint.multiplyScalar(normalizedDirection.clone().dot(centeredPoint)));
      }
      newDirection.normalize();
      normalizedDirection.set(newDirection.x, newDirection.y, newDirection.z);
    }
    return normalizedDirection;
  }

  //Projects 'point' to be within 'distance' of 'anchor'
  this.setDistance = function ConstrainDistance(point, anchor, distance) {
    return point.sub(anchor).normalize().multiplyScalar(distance).add(anchor);
  }

  this.animate = function animatethis() {
    requestAnimationFrame(() => this.animate());
    //Set up a lazy render loop where it only renders if it's been interacted with in the last second
    if (this.environment.viewDirty) {
      this.environment.lastTimeRendered = this.environment.time.getElapsedTime();
      this.environment.viewDirty = false;
    }

    if (this.environment.time.getElapsedTime() - this.environment.lastTimeRendered < 1.0) {
      let average = this.getAverage(this.points);
      this.avg.position.set(average.x, average.y, average.z);
      this.fitDirForward.position.set(average.x, average.y, average.z);
      this.fitDirBackward.position.set(average.x, average.y, average.z);

      let steppedFit = this.fitLine(this.points, average, this.lineDir);
      this.fitDirForward.setDirection(steppedFit);
      this.fitDirBackward.setDirection(steppedFit.clone().multiplyScalar(-1));

      if (this.showResiduals) {
        for (let i = 0; i < this.residuals.length; i++) {
          let pointPos = this.points[i].position;
          let closest = pointPos.clone().sub(average).projectOnVector(steppedFit).add(average);
          let residual = closest.clone().sub(pointPos);
          this.residuals[i].position.set(pointPos.x, pointPos.y, pointPos.z);
          let length = residual.length();
          this.residuals[i].setLength(length, length * 0.1, length * 0.1);
          this.residuals[i].setDirection(residual.normalize());
        }
      }

      this.environment.renderer.render(this.environment.scene, this.environment.camera);
    }
  };

  this.initPoints();
  this.animate();
  // Initialize the view in-case we're lazy rendering...
  this.environment.renderer.render(this.environment.scene, this.environment.camera);
}

new LineFittingEnvironment();