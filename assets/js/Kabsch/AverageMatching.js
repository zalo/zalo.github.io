var AverageMatchingEnvironment = function () {
  this.environment = new Environment();
  this.updating = false;

  this.boxGeometry = new THREE.BoxBufferGeometry(100, 100, 100);
  this.white = new THREE.MeshLambertMaterial({ color: 0x888888 });
  this.blue = new THREE.MeshPhongMaterial({ color: 0x3399dd });

  this.pointsRef = [];
  this.pointsToMatch = [];

  this.numPoints = 5;

  this.initPoints = function () {
    let scl = new THREE.Vector3(100, 100, 100);
    for (let i = 0; i < this.numPoints; i++) {
      let box = new THREE.Mesh(this.boxGeometry, this.blue);
      this.environment.scene.add(box);
      box.scale.set(0.075, 0.075, 0.075);
      box.position.set(
        (Math.random() * scl.x) - (scl.x / 2),
        (Math.random() * scl.y) - (scl.y / 2) + 100,
        (Math.random() * scl.z) - (scl.z / 2));
      box.castShadow = true;
      this.environment.draggableObjects.push(box);
      this.pointsRef.push(box);
    }

    let rcl = new THREE.Vector3(20, 20, 20);
    for (let i = 0; i < this.numPoints; i++) {
      let box = new THREE.Mesh(this.boxGeometry, this.white);
      this.environment.scene.add(box);
      box.scale.set(0.05, 0.05, 0.05);
      let randomOffset = new THREE.Vector3(
        (Math.random() * rcl.x) - (rcl.x / 2),
        (Math.random() * rcl.y) - (rcl.y / 2) + 100,
        (Math.random() * rcl.z) - (rcl.z / 2));

      box.position.copy(randomOffset.add(this.pointsRef[i].position));
      box.castShadow = true;
      this.pointsToMatch.push(box);
    }


    let average = this.getAverage(this.pointsRef);
    this.environment.camera.position.y = 150;
    this.environment.camera.lookAt(average);
    if (this.environment.orbit) {
      this.environment.controls.target.set(average.x, average.y, average.z);
      this.environment.controls.update();
    }

    this.avg = new THREE.Mesh(this.boxGeometry, new THREE.MeshPhongMaterial({ color: 0xdd3333 }));
    this.environment.scene.add(this.avg);
    this.avg.scale.set(0.075, 0.075, 0.075);
    this.avg.position.set(average.x, average.y, average.z);
    this.avg.castShadow = true;
  }

  this.getAverage = function (points) {
    let average = new THREE.Vector3(0, 0, 0);
    for (let i = 0; i < points.length; i++) {
      average.add(points[i].position);
    }
    average.divideScalar(points.length);
    return average;
  }

  this.animate = function animatethis() {
    requestAnimationFrame(() => this.animate());
    //Set up a lazy render loop where it only renders if it's been interacted with in the last second
    if (this.environment.viewDirty) {
      this.environment.lastTimeRendered = this.environment.time.getElapsedTime();
      this.environment.viewDirty = false;
    }

    if (this.environment.time.getElapsedTime() - this.environment.lastTimeRendered < 2.0) {
      let averageRef = this.getAverage(this.pointsRef);
      let averageToMatch = this.getAverage(this.pointsToMatch);
      this.avg.position.set(averageRef.x, averageRef.y, averageRef.z);

      for (let i = 0; i < this.numPoints; i++) {
        this.pointsToMatch[i].position.add(averageRef.clone().sub(averageToMatch));
      }

      this.environment.renderer.render(this.environment.scene, this.environment.camera);
    }
  };

  this.initPoints();
  this.animate();
  // Initialize the view in-case we're lazy rendering...
  this.environment.renderer.render(this.environment.scene, this.environment.camera);
}

new AverageMatchingEnvironment();