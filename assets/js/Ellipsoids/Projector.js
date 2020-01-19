var Projector = function (environment, ellipsoids, lineDrawer, fov = 120, numRays = 4) {

  this.environment = environment;
  this.ellipsoids = ellipsoids;
  this.drawer = lineDrawer;
  this.numLines = numRays > 0 ? numRays : 5;
  this.camera = new THREE.PerspectiveCamera(fov, 1, 1, 201.5);
  this.environment.scene.add(this.camera);

  // Update the Projector's Raycasting Loop
  this.update = function () {

    for (let x = 0.0; x < this.numLines; x++) {
      for (let y = 0.0; y < this.numLines; y++) {
        
        let viewportPos = new THREE.Vector3(
          (x / this.numLines) - 0.5,
          (y / this.numLines) - 0.5, 1);
        let worldRay = viewportPos.unproject(this.camera);

        let rayOrigin = this.camera.position.clone();
        let rayDirection = worldRay.sub(this.camera.position).normalize();
        let hitPoint = new THREE.Vector3(); let hitNormal = new THREE.Vector3();

        let totalRayLength = 0;
        for (let i = 0; i < this.ellipsoids.length; i++) {
          this.ellipsoids[i].raytraceEllipsoid(rayOrigin, rayDirection, hitPoint, hitNormal);

          this.drawer.drawLine(rayOrigin, hitPoint);

          totalRayLength += hitPoint.clone().sub(rayOrigin).length();

          rayOrigin.copy(hitPoint);
          rayDirection.reflect(hitNormal);
        }

        this.drawer.drawLine(rayOrigin, rayOrigin.clone().add(rayDirection.clone().multiplyScalar(200)));//100000 - totalRayLength)));
      }
    }
  }

  this.update();
}
