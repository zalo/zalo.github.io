var Projector = function (environment, ellipsoids, lineDrawer) {
    this.environment = environment;
    this.ellipsoids  = ellipsoids;
    this.drawer      = lineDrawer;
  
    this.numLines = 4;

    this.camera = new THREE.PerspectiveCamera( 120, 1, 1, 201.5 );
    this.environment.scene.add( this.camera );

    // Update the Projector's Raycasting Loop
    this.update = function () {
      for(let x = 0.0; x < this.numLines; x++){
        for(let y = 0.0; y < this.numLines; y++){
          let viewportPos = new THREE.Vector3(
              (x/this.numLines)-0.5, 
              (y/this.numLines)-0.5, 1);
          let worldRay = viewportPos.unproject( this.camera );

          let rayDirection = worldRay.sub(this.camera.position).normalize();
          let hitPoint = new THREE.Vector3(); let hitNormal = new THREE.Vector3();
          this.ellipsoids[0].raytraceEllipsoid(this.camera.position, rayDirection, hitPoint, hitNormal);
          let rayEnd = hitPoint.clone().add(rayDirection.clone().reflect(hitNormal).multiplyScalar(200.5 - hitPoint.clone().sub(this.camera.position).length()));

          this.drawer.drawLine(this.camera.position, hitPoint);
          this.drawer.drawLine(rayEnd, hitPoint);
        }
      }
    }
    this.update();
  }
  