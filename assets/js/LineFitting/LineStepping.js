var LineSteppingEnvironment = function () {
  this.environment = new Environment();
  this.updating = false;

  this.points = [];
  this.boxGeometry = new THREE.BoxBufferGeometry(100, 100, 100);
  this.white = new THREE.MeshLambertMaterial({ color: 0x888888 });
  this.dark = new THREE.MeshLambertMaterial({ color: 0x555555 });
  this.blue = new THREE.MeshPhongMaterial({ color: 0x3399dd });

  this.initPoints = function () {
    let scl = new THREE.Vector3(100, 50, 50);
    for (let i = 0; i < 10; i++) {
      var box = new THREE.Mesh(this.boxGeometry, this.dark);
      this.environment.scene.add(box);
      box.scale.set(0.05, 0.05, 0.05);
      box.position.set(
        (Math.random() * scl.x) - (scl.x / 2),
        (Math.random() * scl.y) - (scl.y / 2) + 75,
        (Math.random() * scl.z) - (scl.z / 2));
      box.castShadow = true;
      //this.environment.draggableObjects.push(box);
      this.points.push(box);
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
    this.avg.scale.set(0.07, 0.07, 0.07);
    this.avg.position.set(average.x, average.y, average.z);
    this.avg.castShadow = true;

    /*this.step = new THREE.Mesh(this.boxGeometry, new THREE.MeshPhongMaterial({ color: 0xdd9933 }));
    this.environment.scene.add(this.step);
    this.step.scale.set(0.07, 0.07, 0.07);
    this.step.position.set(average.x, average.y, average.z);
    this.step.castShadow = true;*/

    this.startHandle = new THREE.Mesh(this.boxGeometry, this.blue);
    this.startHandle.scale.set(0.075, 0.075, 0.075);
    this.startHandle.position.set(average.x, average.y + 40, average.z);
    this.startHandle.castShadow = true;
    this.environment.scene.add(this.startHandle);
    this.environment.draggableObjects.push(this.startHandle);

    this.startDir = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), this.avg.position, 40, 0x1177bb);
    this.startDir.setLength(40, 10, 5);
    this.environment.scene.add(this.startDir);

    this.steppedDirForward = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), this.avg.position, 40, 0xdd3333);
    this.steppedDirForward.setLength(40, 10, 5);
    this.environment.scene.add(this.steppedDirForward);
    this.steppedDirBackward = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), this.avg.position, 40, 0xdd3333);
    this.steppedDirBackward.setLength(40, 10, 5);
    this.environment.scene.add(this.steppedDirBackward);
  }

  this.getAverage = function (points) {
    let average = new THREE.Vector3(0, 0, 0);
    for (let i = 0; i < points.length; i++) {
      average.add(points[i].position);
    }
    average.divideScalar(points.length);
    return average;
  }

  this.stepLineFit = function (points, average, normalizedDirection) {
    let newDirection = new THREE.Vector3(0, 0, 0);
    for (let i = 0; i < points.length; i++) {
      let centeredPoint = points[i].position.clone().sub(average);
      newDirection.add(centeredPoint.multiplyScalar(normalizedDirection.clone().dot(centeredPoint)));
    }
    newDirection.normalize();
    return newDirection;
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

      this.startHandle.position.z = average.z;
      let startDirection = this.startHandle.position.clone().sub(average).normalize();
      this.startDir.setDirection(startDirection);

      let steppedFit = this.stepLineFit(this.points, average, startDirection);
      this.steppedDirForward.setDirection(steppedFit);
      this.steppedDirBackward.setDirection(steppedFit.clone().multiplyScalar(-1));

      this.environment.renderer.render(this.environment.scene, this.environment.camera);
    }
  };

  this.initPoints();
  this.animate();
  // Initialize the view in-case we're lazy rendering...
  this.environment.renderer.render(this.environment.scene, this.environment.camera);
}

new LineSteppingEnvironment();