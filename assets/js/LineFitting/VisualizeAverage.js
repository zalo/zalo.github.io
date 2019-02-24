var AverageEnvironment = function () {
  this.environment = new Environment();
  this.updating = false;

  this.points = [];
  this.boxGeometry = new THREE.BoxBufferGeometry(100, 100, 100);
  this.white = new THREE.MeshLambertMaterial({ color: 0x888888 });
  this.blue = new THREE.MeshPhongMaterial({ color: 0x3399dd });

  this.initPoints = function () {
    let scl = new THREE.Vector3(100, 100, 100);
    for (let i = 0; i < 10; i++) {
      var box = new THREE.Mesh(this.boxGeometry, this.blue);
      this.environment.scene.add(box);
      box.scale.set(0.075, 0.075, 0.075);
      box.position.set(
        (Math.random() * scl.x) - (scl.x / 2),
        (Math.random() * scl.y) - (scl.y / 2) + 100,
        (Math.random() * scl.z) - (scl.z / 2));
      box.castShadow = true;
      this.environment.draggableObjects.push(box);
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
      let average = this.getAverage(this.points);
      this.avg.position.set(average.x, average.y, average.z);

      this.environment.renderer.render(this.environment.scene, this.environment.camera);
    }
  };

  this.initPoints();
  this.animate();
  // Initialize the view in-case we're lazy rendering...
  this.environment.renderer.render(this.environment.scene, this.environment.camera);
}

new AverageEnvironment();