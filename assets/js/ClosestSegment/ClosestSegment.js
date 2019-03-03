var ClosestSegmentEnvironment = function () {
  this.environment = new Environment();
  this.updating = false;

  this.points = [];
  this.boxGeometry = new THREE.BoxBufferGeometry(100, 100, 100);
  this.white = new THREE.MeshLambertMaterial({ color: 0x888888 });
  this.dark = new THREE.MeshLambertMaterial({ color: 0x555555 });
  this.blue = new THREE.MeshPhongMaterial({ color: 0x3399dd });
  this.red = new THREE.MeshPhongMaterial({ color: 0xdd3333 });

  this.initPoints = function () {
    this.environment.camera.position.set(0, 100, 200);
    let target = this.environment.camera.position.clone().add(new THREE.Vector3(0, 0, -200));
    this.environment.camera.lookAt(target);
    if (this.environment.orbit) {
      this.environment.controls.target.set(target.x, target.y, target.z);
      this.environment.controls.update();
    }

    this.a = new THREE.Mesh(this.boxGeometry, this.blue);
    this.a.scale.set(0.075, 0.075, 0.075);
    this.a.position.set(-50, 100, 0);
    this.a.castShadow = true;
    this.environment.scene.add(this.a);
    this.environment.draggableObjects.push(this.a);

    this.b = new THREE.Mesh(this.boxGeometry, this.blue);
    this.b.scale.set(0.075, 0.075, 0.075);
    this.b.position.set(50, 110, 0);
    this.b.castShadow = true;
    this.environment.scene.add(this.b);
    this.environment.draggableObjects.push(this.b);

    this.handle = new THREE.Mesh(this.boxGeometry, this.blue);
    this.handle.scale.set(0.075, 0.075, 0.075);
    this.handle.position.set(20, 120, 0);
    this.handle.castShadow = true;
    this.environment.scene.add(this.handle);
    this.environment.draggableObjects.push(this.handle);

    this.lineGeo = new THREE.Geometry();
    this.lineGeo.vertices.push(
      this.a.position,
      this.b.position
    );
    this.line = new THREE.Line(this.lineGeo, this.white);
    this.environment.scene.add(this.line);

    this.toSegment = new THREE.ArrowHelper(new THREE.Vector3(-1, 1, 0).normalize(), this.handle.position, 40, 0xdd3333);
    this.toSegment.setLength(40, 10, 5);
    this.environment.scene.add(this.toSegment);

    this.closest = new THREE.Mesh(this.boxGeometry, this.red);
    this.closest.scale.set(0.05, 0.05, 0.05);
    this.closest.position.set(20, 120, 0);
    this.closest.castShadow = true;
    this.environment.scene.add(this.closest);
  }

  // Stupid lack of operator overloading, this looks so dumb
  this.closestToSegment = function (point, a, b) {
    let ba = b.clone().sub(a);
    let t = (point.clone().sub(a)).dot(ba) / ba.lengthSq();
    return a.clone().lerp(b, Math.min(Math.max(t, 0), 1));
  }

  this.animate = function animatethis() {
    requestAnimationFrame(() => this.animate());
    //Set up a lazy render loop where it only renders if it's been interacted with in the last second
    if (this.environment.viewDirty) {
      this.environment.lastTimeRendered = this.environment.time.getElapsedTime();
      this.environment.viewDirty = false;
    }

    if (this.environment.time.getElapsedTime() - this.environment.lastTimeRendered < 1.0) {
      this.line.geometry.vertices[0].copy(this.a.position);
      this.line.geometry.vertices[1].copy(this.b.position);
      this.line.geometry.verticesNeedUpdate = true;

      this.toSegment.position.copy(this.handle.position);
      let onSegment = this.closestToSegment(this.handle.position, this.a.position, this.b.position)
      this.closest.position.copy(onSegment);
      onSegment.sub(this.handle.position);
      this.toSegment.setLength(onSegment.length());
      this.toSegment.setDirection(onSegment.normalize());

      this.environment.renderer.render(this.environment.scene, this.environment.camera);
    }
  };

  this.initPoints();
  this.animate();
  // Initialize the view in-case we're lazy rendering...
  this.environment.renderer.render(this.environment.scene, this.environment.camera);
}

new ClosestSegmentEnvironment();