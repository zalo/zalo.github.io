var PlaneFittingEnvironment = function () {
  this.environment = new Environment();
  this.updating = false;

  this.points = [];
  this.residuals = [];
  this.boxGeometry = new THREE.BoxBufferGeometry(100, 100, 100);
  this.white = new THREE.MeshLambertMaterial({ color: 0x888888 });
  this.dark = new THREE.MeshLambertMaterial({ color: 0x555555 });
  this.blue = new THREE.MeshPhongMaterial({ color: 0x3399dd });
  this.primaryAxis = new THREE.Vector3(1, 0, 0);
  this.secondaryAxis = new THREE.Vector3(0, 1, 0);

  this.showResiduals = document.currentScript.getAttribute("residuals") == "enabled";

  this.initPoints = function () {
    let scl = new THREE.Vector3(100, 25, 100);
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

    this.grid = new THREE.GridHelper(100, 10, 0x000000, 0xdd3333);
    this.grid.material.opacity = 0.5;
    this.grid.material.transparent = true;
    this.grid.position.set(average.x, average.y, average.z);
    this.environment.scene.add(this.grid);
  }

  this.getAverage = function (points) {
    let average = new THREE.Vector3(0, 0, 0);
    for (let i = 0; i < points.length; i++) {
      average.add(points[i].position);
    }
    average.divideScalar(points.length);
    return average;
  }

  this.fitPlane = function (points, average) {
    this.primaryAxis.copy(new THREE.Vector3(1, 0, 0));
    this.secondaryAxis.copy(new THREE.Vector3(0, 1, 0));
    let newDirection1 = new THREE.Vector3();
    let newDirection2 = new THREE.Vector3();
    for (let i = 0; i < 100; i++) {
      newDirection1.set(0, 0, 0);
      newDirection2.set(0, 0, 0);
      for (let i = 0; i < points.length; i++) {
        let centeredPoint = points[i].position.clone().sub(average);
        newDirection1.add(centeredPoint.clone().multiplyScalar(this.primaryAxis.clone().dot(centeredPoint)));
        newDirection2.add(centeredPoint.clone().multiplyScalar(this.secondaryAxis.clone().dot(centeredPoint)));
      }
      this.primaryAxis.copy(newDirection1.normalize());
      this.secondaryAxis.copy(newDirection2.projectOnPlane(this.primaryAxis).normalize());
    }
    let normal = this.primaryAxis.cross(this.secondaryAxis).normalize();
    if (normal.y < 0) { normal.multiplyScalar(-1); }
    return normal;
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
      let steppedFit = this.fitPlane(this.points, average);

      this.grid.position.copy(average);
      this.grid.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), steppedFit);

      if (this.showResiduals) {
        for (let i = 0; i < this.residuals.length; i++) {
          let pointPos = this.points[i].position;
          let closest = pointPos.clone().sub(average).projectOnPlane(steppedFit).add(average);
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
}

new PlaneFittingEnvironment();