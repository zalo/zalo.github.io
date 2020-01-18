var EllipsoidEnvironment = function () {
  this.environment = new Environment();

  this.invertedEllipsoid = document.currentScript.getAttribute("inverted" ) == "enabled";
  this.enableProjector   = document.currentScript.getAttribute("projector") == "enabled";

  // Create the elements in the scene
  this.ellipsoid   = new Ellipsoid(
    this.environment, 
    new THREE.Vector3(-60,30,0), 
    new THREE.Vector3(40,60,0), 100, this.invertedEllipsoid);
  this.drawer      = new LineDrawer(this.environment);

  if(this.enableProjector) { this.projector   = new Projector (this.environment, [this.ellipsoid], this.drawer); }

  this.animate = function animatethis() {
    requestAnimationFrame(() => this.animate());
    //Set up a lazy render loop where it only renders if it's been interacted with in the last second
    if (this.environment.viewDirty) {
      this.environment.lastTimeRendered = this.environment.time.getElapsedTime();
      this.environment.viewDirty = false;
    }

    if (this.environment.time.getElapsedTime() - this.environment.lastTimeRendered < 3.0) {
      this.ellipsoid.updateEllipsoid();

      if(this.enableProjector) { 
        this.projector.camera.position.copy(this.ellipsoid.focus1.position);
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