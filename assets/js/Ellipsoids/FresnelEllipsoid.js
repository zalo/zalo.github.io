var EllipsoidEnvironment = function () {
  this.environment = new Environment();
  this.environment.camera.fov = this.environment.iOS ? 65 : 45;
  this.environment.camera.updateProjectionMatrix();
  this.environment.renderer.localClippingEnabled = true;

  // Create the clipping planes
  var clipPlanes = [
    new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 50 ),
    new THREE.Plane( new THREE.Vector3( 0, 0, - 1 ), -45 )
  ];

  // Create the material that uses them
  this.fresnelEllipsoidMaterial = new THREE.MeshLambertMaterial({
    color: 0x777777, transparent: true, opacity: 0.45, side: THREE.DoubleSide,
    clippingPlanes: clipPlanes, clipIntersection: false, depthWrite: false
  });

  // Create the base ellipsoid
  this.ellipsoids = [
    new Ellipsoid(
      this.environment,
      new THREE.Vector3(-50, 40, 0),
      new THREE.Vector3(50, 70, 0), 10, true, this.fresnelEllipsoidMaterial)
  ];

  // Create the 9 surrounding shell ellipsoids
  for (let i = 1; i < 20; i++){
    this.ellipsoids.push(
      new Ellipsoid(
        this.environment,
        this.ellipsoids[0].focus1,
        this.ellipsoids[0].focus2, 10 + (i*10), true, this.fresnelEllipsoidMaterial)
    );
  }

  this.animate = function animatethis() {
    requestAnimationFrame(() => this.animate());
    //Set up a lazy render loop where it only renders if it's been interacted with in the last second
    if (this.environment.viewDirty) {
      this.environment.lastTimeRendered = this.environment.time.getElapsedTime();
      this.environment.viewDirty = false;
    }

    if (this.environment.time.getElapsedTime() - this.environment.lastTimeRendered < 3.0) {
      for (let i = 0; i < this.ellipsoids.length; i++) {
        this.ellipsoids[i].updateEllipsoid();
      }

      this.environment.renderer.render(this.environment.scene, this.environment.camera);
    }
  }

  // Initialize the view in-case we're lazy rendering...
  this.animate();
  this.environment.renderer.render(this.environment.scene, this.environment.camera);

}

new EllipsoidEnvironment()