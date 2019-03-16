var KabschEnvironment = function () {
  this.environment = new Environment();
  this.updating = false;

  this.boxGeometry = new THREE.BoxBufferGeometry(100, 100, 100);
  this.white = new THREE.MeshLambertMaterial({ color: 0x888888 });
  this.blue = new THREE.MeshPhongMaterial({ color: 0x3399dd });

  this.pointsRef = [];
  this.pointsToMatch = [];
  this.curQuaternion = new THREE.Quaternion(0,0,0,1);

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

  //https://animation.rwth-aachen.de/media/papers/2016-MIG-StableRotation.pdf
  //Iteratively apply torque to the basis using Cross products (in place of SVD)
  this.quaternionTorqueDecomposition = function (A, curQuaternion, iterations = 9) {
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

    if (this.environment.time.getElapsedTime() - this.environment.lastTimeRendered < 2.0) {
      this.kabschPoints(this.pointsToMatch, this.pointsRef);

      let averageRef = this.getAverage(this.pointsRef);
      this.avg.position.set(averageRef.x, averageRef.y, averageRef.z);

      this.environment.renderer.render(this.environment.scene, this.environment.camera);
    }
  };

  this.initPoints();
  this.animate();
  // Initialize the view in-case we're lazy rendering...
  this.environment.renderer.render(this.environment.scene, this.environment.camera);
}

new KabschEnvironment();