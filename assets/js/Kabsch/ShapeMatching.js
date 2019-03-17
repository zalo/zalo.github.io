var ShapeMatchingEnvironment = function () {
  this.environment = new Environment();
  this.updating = false;

  this.sphereGeometry = new THREE.SphereBufferGeometry(100, 20, 20);
  this.cheapSphereGeometry = new THREE.SphereBufferGeometry(100, 10, 10);
  this.white = new THREE.MeshLambertMaterial({ color: 0x888888 });
  this.blue = new THREE.MeshPhongMaterial({ color: 0x3399dd });
  this.invisible = new THREE.MeshPhongMaterial({ color: 0x3399dd });
  this.invisible.visible = false;

  this.pointsRef = [];
  this.pointsToMatch = [];
  this.curQuaternion = new THREE.Quaternion(0,0,0,1);
  this.pastPoints = [];

  this.kabschAlpha = 0.5;
  this.numPoints = 10;
  this.collisionIterations = 5;

  this.initPoints = function () {
    // Clear Scene
    for (let i = 0; i < this.pointsRef.length; i++) {
      this.environment.scene.remove(this.pointsRef[i]);
      this.environment.scene.remove(this.environment.draggableObjects[i]);
      this.environment.scene.remove(this.pointsToMatch[i]);
    }
    this.pointsRef.length = 0;
    this.pointsToMatch.length = 0;
    this.pastPoints.length = 0;
    this.environment.draggableObjects.length = 0;

    let scl = new THREE.Vector3(100, 100, 100);
    for (let i = 0; i < this.numPoints; i++) {
      let sphere = new THREE.Mesh(this.sphereGeometry, this.blue);
      this.environment.scene.add(sphere);
      sphere.scale.set(0.075, 0.075, 0.075);
      sphere.position.set(
        (Math.random() * scl.x) - (scl.x / 2),
        (Math.random() * scl.y) - (scl.y / 2) + 100,
        (Math.random() * scl.z) - (scl.z / 2));
      sphere.castShadow = true;
      this.pointsRef.push(sphere);
      this.pastPoints.push(sphere.position.clone());

      let dragSphere = new THREE.Mesh(this.cheapSphereGeometry, this.invisible);
      this.environment.scene.add(dragSphere);
      dragSphere.scale.set(0.075, 0.075, 0.075);
      dragSphere.position.copy(sphere.position);
      this.environment.draggableObjects.push(dragSphere);

      let rigidSphere = new THREE.Mesh(this.cheapSphereGeometry, this.invisible);
      this.environment.scene.add(rigidSphere);
      rigidSphere.scale.set(0.07, 0.07, 0.07);
      rigidSphere.position.copy(sphere.position);
      this.pointsToMatch.push(rigidSphere);
    }

    this.stiffnessSlider = document.getElementById("stiffness");
    this.stiffnessSlider.addEventListener('change', (data) => { this.environment.viewDirty = true; this.kabschAlpha = data.target.value/100.0; });
    this.numParticlesSlider = document.getElementById("numParticles");
    this.numParticlesSlider.addEventListener('change', (data) => { this.environment.viewDirty = true; this.numPoints = data.target.value; this.initPoints(); });
    this.collisionIterationsSlider = document.getElementById("iterations");
    this.collisionIterationsSlider.addEventListener('change', (data) => { this.environment.viewDirty = true; this.collisionIterations = data.target.value; });
  }

  this.verletIntegrate = function(curPoints, pastPoints){
    for (let i = 0; i < curPoints.length; i++) {
      var temp = curPoints[i].position.clone();
      curPoints[i].position.add(curPoints[i].position.clone().sub(pastPoints[i]));
      pastPoints[i].copy(temp);
    }
  }

  this.getAverage = function (points) {
    let average = new THREE.Vector3(0, 0, 0);
    for (let i = 0; i < points.length; i++) {
      average.add(points[i].position);
    }
    average.divideScalar(points.length);
    return average;
  }

  //https://animation.rwth-aachen.de/media/papers/2016-MIG-StableRotation.pdf
  //Iteratively apply torque to the basis using Cross products (in place of SVD)
  this.quaternionTorqueDecomposition = function (A, curQuaternion, iterations = 9) {
    // Cancels out the momentum from the prior frame
    curQuaternion.copy(new THREE.Quaternion(0,0,0,1));
    
    let QuatBasis = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
    let quatMatrix = new THREE.Matrix4().makeRotationFromQuaternion(curQuaternion);

    for (let iter = 0; iter < iterations; iter++) {
      quatMatrix.makeRotationFromQuaternion(curQuaternion);
      quatMatrix.extractBasis(QuatBasis[0], QuatBasis[1], QuatBasis[2]);

      let omegaDenom = Math.abs(
        QuatBasis[0].dot(A[0]) +
        QuatBasis[1].dot(A[1]) +
        QuatBasis[2].dot(A[2]) + 0.00000001);

      let omega =
        QuatBasis[0].clone().cross(A[0]).add(
          QuatBasis[1].clone().cross(A[1])).add(
            QuatBasis[2].clone().cross(A[2])).divideScalar(omegaDenom);

      let w = omega.length();
      if (w < 0.00000001) { break; }
      curQuaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(omega.normalize(), w));
      curQuaternion.normalize(); //Normalizes the Quaternion; critical for error suppression
    }
  }

  this.transposeMult = function(vec1, vec2) {
    let covariance = [ // Initialize Cross Covariance Matrix
      new THREE.Vector3(0, 0, 0), 
      new THREE.Vector3(0, 0, 0), 
      new THREE.Vector3(0, 0, 0)];

    for (let i = 0; i < 3; i++) {               //i is the row in this matrix
      for (let j = 0; j < 3; j++) {             //j is the column in the other matrix
        for (let k = 0; k < vec1.length; k++) { //k is the column in this matrix
          covariance[i].setComponent(j, 
            covariance[i].getComponent(j) + (vec1[k].getComponent(i) * vec2[k].getComponent(j)));
        }
      }
    }
    return covariance;
  }

  this.kabschPoints = function (pointsIn, pointsRef) {
    let workingRef = []; let workingIn = [];
    let refAverage = this.getAverage(pointsRef);
    let inAverage = this.getAverage(pointsIn);

    // Mean-center the points for the optimal translation
    for (let i = 0; i < pointsRef.length; i++) {
      workingRef.push(pointsRef[i].position.clone().sub(refAverage));
      workingIn.push(pointsIn[i].position.clone().sub(inAverage));
    }

    // Calculate the optimal rotation
    let crossCovarianceMatrix = this.transposeMult(workingIn, workingRef);
    this.quaternionTorqueDecomposition(crossCovarianceMatrix, this.curQuaternion, 9);

    // Apply the optimal translation and rotation
    for (let i = 0; i < workingIn.length; i++) {
      workingIn[i].applyQuaternion(this.curQuaternion);
      pointsIn[i].position.copy(workingIn[i].add(refAverage));
    }
  }

  this.animate = function animatethis() {
    requestAnimationFrame(() => this.animate());
    //Set up a lazy render loop where it only renders if it's been interacted with in the last second
    if (this.environment.viewDirty) {
      this.environment.lastTimeRendered = this.environment.time.getElapsedTime();
      this.environment.viewDirty = false;
    }

    if (this.environment.time.getElapsedTime() - this.environment.lastTimeRendered < 3.0) {
      // Apply Inertia and Gravity
      this.verletIntegrate(this.pointsRef, this.pastPoints);
      for (let i = 0; i < this.pointsRef.length; i++) {
        this.pointsRef[i].position.sub(new THREE.Vector3(0,0.981,0));
      }

      // Make dragging physics spheres work
      let draggingIndex = -1;
      for(let i = 0; i < this.environment.draggableObjects.length; i++){
        if(this.environment.draggableObjects[i]._isDragging){
          draggingIndex = i;
        }else{
          this.environment.draggableObjects[i].position.copy(this.pointsRef[i].position);
        }
      }

      for(let iter = 0; iter < this.collisionIterations; iter++){
        // Reset the dragged sphere's position
        if(draggingIndex != -1) { this.pointsRef[draggingIndex].position.copy(this.environment.draggableObjects[draggingIndex].position); }

        // Move the rigid spheres to match the physics spheres
        this.kabschPoints(this.pointsToMatch, this.pointsRef);

        // Move physics spheres to match the rigid spheres
        for (let i = 0; i < this.pointsRef.length; i++) {
          this.pointsRef[i].position.lerp(this.pointsToMatch[i].position, this.kabschAlpha);
        }

        // Collide with the ground
        for (let i = 0; i < this.pointsRef.length; i++) {
          if(this.pointsRef[i].position.y < 7.5){
            this.pointsRef[i].position.y = 7.5;
            // Friction
            let perpendicularVelocity = this.pointsRef[i].position.clone().sub(this.pastPoints[i]);
            perpendicularVelocity.y = 0;
            this.pointsRef[i].position.sub(perpendicularVelocity.multiplyScalar(0.25));
          }
        }

        let blobAverage = this.getAverage(this.pointsRef);
        this.environment.light2.position.copy(blobAverage.add(new THREE.Vector3(0, 200, 100)));

      }

      this.environment.renderer.render(this.environment.scene, this.environment.camera);
    }
  };

  setTimeout(() => { this.initPoints(); this.animate(); }, 1000);
  
  // Initialize the view in-case we're lazy rendering...
  this.environment.renderer.render(this.environment.scene, this.environment.camera);
}
new ShapeMatchingEnvironment()