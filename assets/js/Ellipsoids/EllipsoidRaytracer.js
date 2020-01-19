var EllipsoidEnvironment = function () {
  this.environment       = new Environment();

  this.config            = parseInt  (document.currentScript.getAttribute("config"));
  this.invertedEllipsoid = document.currentScript.getAttribute("inverted" ) == "enabled";
  this.enableProjector   = document.currentScript.getAttribute("projector") == "enabled";

  this.numRays           = parseInt  (document.currentScript.getAttribute("numRays"));
  this.FoV               = parseFloat(document.currentScript.getAttribute("projectorFoV"));
  

  // Create the elements in the scene
  if (this.config == 0) {
    this.ellipsoids = [new Ellipsoid(
      this.environment,
      new THREE.Vector3(-50, 40, 0),
      new THREE.Vector3(50, 70, 0), 100, this.invertedEllipsoid)];
  } else if (this.config == 1) {
    let ellipsoid1 = new Ellipsoid(
      this.environment,
      new THREE.Vector3(-90, 70, -20),
      new THREE.Vector3(-20, 20, 0), 70, this.invertedEllipsoid);
    let ellipsoid2 = new Ellipsoid(
      this.environment,
      new THREE.Vector3(),
      new THREE.Vector3(40, 20, -20), 70, this.invertedEllipsoid, ellipsoid1.focus2);
    let ellipsoid3 = new Ellipsoid(
      this.environment,
      new THREE.Vector3(),
      new THREE.Vector3(60, 90, -50), 70, this.invertedEllipsoid, ellipsoid2.focus2);
    this.ellipsoids = [ellipsoid1, ellipsoid2, ellipsoid3];
  } else if (this.config == 2) {
    let ellipsoid1 = new Ellipsoid(
      this.environment,
      new THREE.Vector3(-60, 90, -20),
      new THREE.Vector3(-50, -20, -20), 70, true);
    let ellipsoid2 = new Ellipsoid(
      this.environment,
      new THREE.Vector3(),
      new THREE.Vector3(-105, 20, -20), 50, false, ellipsoid1.focus2);
    let ellipsoid3 = new Ellipsoid(
      this.environment,
      new THREE.Vector3(),
      new THREE.Vector3(60, 50, -20), 100, true, ellipsoid2.focus2);
    this.ellipsoids = [ellipsoid1, ellipsoid2, ellipsoid3];
  }
  this.drawer      = new LineDrawer(this.environment);

  if(this.enableProjector) { this.projector   = new Projector (this.environment, this.ellipsoids, this.drawer, this.FoV, this.numRays); }

  this.animate = function animatethis() {
    requestAnimationFrame(() => this.animate());
    //Set up a lazy render loop where it only renders if it's been interacted with in the last second
    if (this.environment.viewDirty) {
      this.environment.lastTimeRendered = this.environment.time.getElapsedTime();
      this.environment.viewDirty = false;
    }

    if (this.environment.time.getElapsedTime() - this.environment.lastTimeRendered < 3.0) {
      for (let i = 0; i < this.ellipsoids.length; i++) { this.ellipsoids[i].updateEllipsoid(); }

      if(this.enableProjector) { 
        this.projector.camera.position.copy(this.ellipsoids[0].focus1.position);
        this.projector.update();
      }

      this.environment.renderer.render(this.environment.scene, this.environment.camera);
      this.drawer.Commit();
    }
  }

  // Initialize the view in-case we're lazy rendering...
  this.animate();
  this.environment.renderer.render(this.environment.scene, this.environment.camera);
}
new EllipsoidEnvironment()