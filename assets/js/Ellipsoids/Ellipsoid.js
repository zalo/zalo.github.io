var Ellipsoid = function (environment, focus1Pos, focus2Pos, minorAxisIn, invertEllipsoid = false, focus1 = null) {

  this.environment       = environment;
  this.sphereGeometry    = new THREE.SphereBufferGeometry(0.5, 50, 50);
  this.blue              = new THREE.MeshPhongMaterial  ({ color: 0x3399dd });
  this.transparentGreen  = new THREE.MeshLambertMaterial({ color: 0x777777, transparent: true, opacity: 0.45, side: invertEllipsoid?THREE.BackSide:THREE.FrontSide });
  this.inverted = invertEllipsoid;
  this.minorAxis = minorAxisIn;

  // Set up the ellipsoid's shell
  this.ellipsoid = new THREE.Mesh(this.sphereGeometry, this.transparentGreen);
  this.environment.scene.add(this.ellipsoid);

  // Set up the ellipsoid's foci

  // This allows them to be chained!!
  if (focus1 == null) {
    this.focus1 = new THREE.Mesh(this.sphereGeometry, this.blue);
    this.environment.scene.add(this.focus1);
    this.focus1.scale.set(15, 15, 15);
    this.focus1.position.set(focus1Pos.x, focus1Pos.y, focus1Pos.z);
    this.environment.draggableObjects.push(this.focus1);
  } else {
    this.focus1 = focus1;
  }

  this.focus2 = new THREE.Mesh(this.sphereGeometry, this.blue);
  this.environment.scene.add(this.focus2);
  this.focus2.scale.set(15, 15, 15);
  this.focus2.position.set(focus2Pos.x, focus2Pos.y, focus2Pos.z);
  this.environment.draggableObjects.push(this.focus2);

  // Set up convenience matrices that represent the conversion to sphere space
  this.sphereToSceneSpace = this.ellipsoid.matrix;
  this.sceneToSphereSpace = this.sphereToSceneSpace.clone().getInverse(this.sphereToSceneSpace);

  // Update the Ellipsoid's Intrinsics from its Foci
  this.updateEllipsoid = function () {
    let interFociDistance = this.focus1.position.distanceTo(this.focus2.position);

    this.ellipsoid.position.set(
      (this.focus1.position.x + this.focus2.position.x)/2, 
      (this.focus1.position.y + this.focus2.position.y)/2, 
      (this.focus1.position.z + this.focus2.position.z)/2);
    this.ellipsoid.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), this.focus2.position.clone().sub(this.focus1.position).normalize());
    this.majorAxis = Math.sqrt(Math.pow(interFociDistance / 2, 2) + Math.pow(this.minorAxis / 2, 2)) * 2;
    this.ellipsoid.scale.set(this.minorAxis, this.minorAxis, this.majorAxis );
    this.ellipsoid.updateMatrix();

    this.sphereToSceneSpace = this.ellipsoid.matrix;
    this.sceneToSphereSpace.getInverse(this.sphereToSceneSpace);
  }
  this.updateEllipsoid();

  // Raytrace the ellipsoid by 
  // converting the ray origin/direction to sphere space
  // Raytracing the sphere
  // Converting back to scene space
  this.raytraceEllipsoid = function(rayOrigin, rayDirection, hitPoint, hitNormal){
    let sphereSpaceRayOrigin    = rayOrigin.clone().applyMatrix4(this.sceneToSphereSpace);
    let sphereSpaceRayDirection = rayOrigin.clone().add(rayDirection).applyMatrix4(this.sceneToSphereSpace).sub(sphereSpaceRayOrigin).normalize();
    let intersectionTime = this.intersectLineSphere(sphereSpaceRayOrigin, sphereSpaceRayDirection, new THREE.Vector3(), 0.25, !this.inverted);
    if(intersectionTime > 0){
      let sphereSpaceHitPoint = sphereSpaceRayOrigin.add(sphereSpaceRayDirection.multiplyScalar(intersectionTime));

      let sphereSpaceNormal = sphereSpaceHitPoint.clone().normalize().multiplyScalar(-1);
      sphereSpaceNormal.set(
        sphereSpaceNormal.x / Math.pow(this.minorAxis / 2, 2), 
        sphereSpaceNormal.y / Math.pow(this.minorAxis / 2, 2), 
        sphereSpaceNormal.z / Math.pow(this.majorAxis / 2, 2));
      sphereSpaceNormal.normalize();

      hitPoint .copy(sphereSpaceHitPoint.clone().applyMatrix4(this.sphereToSceneSpace));
      hitNormal.copy(sphereSpaceNormal.add(sphereSpaceHitPoint).applyMatrix4(this.sphereToSceneSpace).sub(hitPoint).normalize());
    }else{
      hitPoint.copy(rayOrigin.clone());
      hitNormal.copy(rayDirection.clone());
      //console.log("Negative Intersection!  Something's wrong!!");
    }
  }

  // A bog standard line/sphere intersection
  this.intersectLineSphere = function(Origin, Direction, spherePos, SphereRadiusSqrd, frontSide = false) {
    let L = spherePos.clone().sub(Origin);
    let offsetFromSphereCenterToRay = L.clone().projectOnVector(Direction).sub(L);
    return (offsetFromSphereCenterToRay.lengthSq() <= SphereRadiusSqrd) ? 
          L.dot(Direction) - (Math.sqrt(SphereRadiusSqrd - offsetFromSphereCenterToRay.lengthSq()) * (frontSide ? 1 : -1)) : 
          -1;
  }
}
