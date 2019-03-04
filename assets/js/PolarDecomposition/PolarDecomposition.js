var PolarDecompositionEnvironment = function () {
  this.environment = new Environment();
  this.updating = false;

  this.points = [];
  this.boxGeometry = new THREE.BoxBufferGeometry(100, 100, 100);
  this.white = new THREE.MeshLambertMaterial({ color: 0x888888 });
  this.dark = new THREE.MeshLambertMaterial({ color: 0x555555 });
  this.blue = new THREE.MeshPhongMaterial({ color: 0x3399dd });
  this.red = new THREE.MeshPhongMaterial({ color: 0xdd3333 });
  this.green = new THREE.MeshPhongMaterial({ color: 0x33dd33 });
  this.blue = new THREE.MeshPhongMaterial({ color: 0x3333dd });
  this.darkline = new THREE.LineBasicMaterial({ color: 0x555555 });
  this.redline = new THREE.LineBasicMaterial({ color: 0xdd3333 });
  this.greenline = new THREE.LineBasicMaterial({ color: 0x33dd33 });
  this.blueline = new THREE.LineBasicMaterial({ color: 0x3333dd });
  this.arrowOrigin = new THREE.Vector3(0, 100, 0);

  this.cheapDecomposition = document.currentScript.getAttribute("crossProductDecomposition") == "enabled";

  this.currentQuaternion = new THREE.Quaternion(0, 0, 0, 1);

  this.initPoints = function () {
    this.environment.camera.position.set(75, 150, 200);
    let target = this.arrowOrigin;//this.environment.camera.position.clone().add(new THREE.Vector3(0, 0, -200));
    this.environment.camera.lookAt(target);
    if (this.environment.orbit) {
      this.environment.controls.target.set(target.x, target.y, target.z);
      this.environment.controls.update();
    }

    this.right = new THREE.Mesh(this.boxGeometry, this.red);
    this.right.scale.set(0.075, 0.075, 0.075);
    this.right.position.set(70, 100, 0);
    this.right.castShadow = true;
    this.environment.scene.add(this.right);
    this.environment.draggableObjects.push(this.right);
    this.rightArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0).normalize(), this.arrowOrigin, 40, 0xdd3333);
    this.environment.scene.add(this.rightArrow);

    this.up = new THREE.Mesh(this.boxGeometry, this.green);
    this.up.scale.set(0.075, 0.075, 0.075);
    this.up.position.set(0, 170, 0);
    this.up.castShadow = true;
    this.environment.scene.add(this.up);
    this.environment.draggableObjects.push(this.up);
    this.upArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0).normalize(), this.arrowOrigin, 40, 0x33dd33);
    this.environment.scene.add(this.upArrow);

    this.forward = new THREE.Mesh(this.boxGeometry, this.blue);
    this.forward.scale.set(0.075, 0.075, 0.075);
    this.forward.position.set(0, 100, 70);
    this.forward.castShadow = true;
    this.environment.scene.add(this.forward);
    this.environment.draggableObjects.push(this.forward);
    this.forwardArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1).normalize(), this.arrowOrigin, 40, 0x3333dd);
    this.environment.scene.add(this.forwardArrow);

    // Decomposition Bases
    this.quatRightArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0).normalize(), this.arrowOrigin, 50, 0xdd3333);
    this.environment.scene.add(this.quatRightArrow);
    this.quatUpArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0).normalize(), this.arrowOrigin, 50, 0x33dd33);
    this.environment.scene.add(this.quatUpArrow);
    this.quatForwardArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1).normalize(), this.arrowOrigin, 50, 0x3333dd);
    this.environment.scene.add(this.quatForwardArrow);

    if (this.cheapDecomposition) {
      this.crossRightArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0).normalize(), this.arrowOrigin, 50, 0x33dddd);
      this.environment.scene.add(this.crossRightArrow);
      this.crossUpArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0).normalize(), this.arrowOrigin, 50, 0x33dddd);
      this.environment.scene.add(this.crossUpArrow);
      this.crossForwardArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1).normalize(), this.arrowOrigin, 50, 0x33dddd);
      this.environment.scene.add(this.crossForwardArrow);
    }
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

  // Unfurl the basis like a blooming flower :)
  // _Much_ Faster, converges in like 5 iters, atemporal, no quaternions
  // but can be up to 10 degrees off or more in some cases
  this.crossProductDecomposition = function (A, iterations = 9) {
    let mB = [A[0].length(), A[1].length(), A[2].length()];
    let avgLength = (mB[0] + mB[1] + mB[2]) / 3.0;
    mB[0] = mB[0] / avgLength; mB[1] = mB[1] / avgLength; mB[2] = mB[2] / avgLength;
    let cB = [
      A[0].clone().setLength(mB[0]),
      A[1].clone().setLength(mB[1]),
      A[2].clone().setLength(mB[2])];
    let nB = [cB[0].clone(), cB[1].clone(), cB[2].clone()];

    for (let iter = 0; iter < iterations; iter++) {
      nB[0].crossVectors(cB[1], cB[2]).lerp(cB[0], 0.5).normalize();
      nB[1].crossVectors(cB[2], cB[0]).lerp(cB[1], 0.5).normalize();
      nB[2].crossVectors(cB[0], cB[1]).lerp(cB[2], 0.5).normalize();
      cB[0].copy(nB[0].clone().multiplyScalar(mB[0]));
      cB[1].copy(nB[1].clone().multiplyScalar(mB[1]));
      cB[2].copy(nB[2].clone().multiplyScalar(mB[2]));
    }
    return nB;
  }

  this.animate = function animatethis() {
    requestAnimationFrame(() => this.animate());
    //Set up a lazy render loop where it only renders if it's been interacted with in the last second
    if (this.environment.viewDirty) {
      this.environment.lastTimeRendered = this.environment.time.getElapsedTime();
      this.environment.viewDirty = false;
    }

    if (this.environment.time.getElapsedTime() - this.environment.lastTimeRendered < 2.0) {
      let curBasis = [];

      dir = this.right.position.clone().sub(this.rightArrow.position);
      curBasis.push(dir.clone());
      this.rightArrow.setLength(dir.length());
      this.rightArrow.setDirection(dir.normalize());

      dir = this.up.position.clone().sub(this.upArrow.position);
      curBasis.push(dir.clone());
      this.upArrow.setLength(dir.length());
      this.upArrow.setDirection(dir.normalize());

      dir = this.forward.position.clone().sub(this.forwardArrow.position);
      curBasis.push(dir.clone());
      this.forwardArrow.setLength(dir.length());
      this.forwardArrow.setDirection(dir.normalize());

      // Begin the Quaternion Torque Decomposition
      if (this.cheapDecomposition) {
        let orthogonalBasis = this.crossProductDecomposition(curBasis);
        this.crossRightArrow.setDirection(orthogonalBasis[0]);
        this.crossUpArrow.setDirection(orthogonalBasis[1]);
        this.crossForwardArrow.setDirection(orthogonalBasis[2]);
      }

      // Begin the Quaternion Torque Decomposition
      this.quaternionTorqueDecomposition(curBasis, this.currentQuaternion);
      let quatMatrix = new THREE.Matrix4().makeRotationFromQuaternion(this.currentQuaternion);
      quatMatrix.extractBasis(curBasis[0], curBasis[1], curBasis[2]);
      this.quatRightArrow.setDirection(curBasis[0].normalize());
      this.quatUpArrow.setDirection(curBasis[1].normalize());
      this.quatForwardArrow.setDirection(curBasis[2].normalize());

      this.environment.renderer.render(this.environment.scene, this.environment.camera);
    }
  };

  this.initPoints();
  this.animate();
  // Initialize the view in-case we're lazy rendering...
  this.environment.renderer.render(this.environment.scene, this.environment.camera);
}

new PolarDecompositionEnvironment();