var IKEnvironment = function () {
  'use strict';

  this.environment = new Environment();
  this.updating = false;

  this.IKJoints = [];
  this.endEffector = null;
  this.boxGeometry = new THREE.BoxBufferGeometry(100, 100, 100);
  this.white = new THREE.MeshLambertMaterial({ color: 0x888888 });

  this.ccd = document.currentScript.getAttribute("ccd") == "enabled";
  this.hinge = document.currentScript.getAttribute("hinge") == "enabled";
  this.limits = document.currentScript.getAttribute("limits") == "enabled";

  this.initArm = function () {
    //Assemble the Robot Arm
    var base = this.addJoint(this.environment.scene, [0, 0, 0], [0, 1, 0], [0, 0], [0.05, 0.1, 0.05], [0, 5, 0]);
    var firstJoint = this.addJoint(base, [0, 11.52001, 0], [0, 1, 0], [-180, 180], [0.1, 0.1, 0.1], [0, 2.5, 0]);
    var secondJoint = this.addJoint(firstJoint, [-6.55, 4.6, 0.0], [1, 0, 0], [-90, 90], [0.1, 0.45, 0.1], [-3.450041, 14.7, 0]);
    var thirdJoint = this.addJoint(secondJoint, [1.247041, 32.02634, -0.0739485], [1, 0, 0], [-150, 150], [0.05, 0.35, 0.05], [2.8, 15.14, 0]);
    var fourthJoint = this.addJoint(thirdJoint, [2.984276, 30.01859, 0.0], [1, 0, 0], [-90, 90], [0.05, 0.05, 0.05], [4.8, 0.17, 0]);
    var fifthJoint = this.addJoint(fourthJoint, [4.333822, 4.200262, 0.0], [0, 1, 0], [-180, 180], [0.1, 0.035, 0.035], [3.156178, 0.3, 0]);
    this.endEffector = new THREE.Group();
    fifthJoint.add(this.endEffector);
    this.endEffector.position.set(8.3, 1.0, 0.0);

    var target = new THREE.Mesh(this.boxGeometry, new THREE.MeshPhongMaterial({ color: 0x3399dd }));
    target.position.set(0, 100, 0);
    target.scale.set(0.075, 0.075, 0.075);
    //target.transparent = true;
    //target.opacity = 0.25;
    target.castShadow = true;
    //target.receiveShadow = true;
    this.environment.scene.add(target);
    this.environment.draggableObjects.push(target);
  }

  this.addJoint = function (base, position, axis, limits, size, graphicsOffset) {
    var joint = new THREE.Group();
    base.add(joint);
    joint.position.set(position[0], position[1], position[2]);
    joint.axis = new THREE.Vector3(axis[0], axis[1], axis[2]);
    joint.minLimit = limits[0] * 0.0174533;
    joint.maxLimit = limits[1] * 0.0174533;
    this.IKJoints.push(joint);
    var box = new THREE.Mesh(this.boxGeometry, this.white);
    joint.add(box);
    box.scale.set(size[0], size[1], size[2]);
    box.position.set(graphicsOffset[0], graphicsOffset[1], graphicsOffset[2]);
    box.castShadow = true;
    //box.receiveShadow = true;
    return joint;
  }

  //Beautiful CCDIK
  this.solveIK = function (targetPosition) {
    var tooltipPosition = new THREE.Vector3();
    for (var i = this.IKJoints.length - 1; i >= 0; i--) {
      this.IKJoints[i].updateMatrixWorld();
      this.endEffector.getWorldPosition(tooltipPosition);

      //Rotate towards the Target
      //(Ideally this could be done entirely in worldspace (instead of local space))
      if (this.ccd) {
        var toolDirection = this.IKJoints[i].worldToLocal(tooltipPosition.clone()).normalize();
        var targetDirection = this.IKJoints[i].worldToLocal(targetPosition.clone()).normalize();
        var fromToQuat = new THREE.Quaternion(0, 0, 0, 1).setFromUnitVectors(toolDirection, targetDirection);
        this.IKJoints[i].quaternion.multiply(fromToQuat);
      }

      //Find the rotation from here to the parent, and rotate the axis by it...
      //This ensures that you're always rotating with the hinge
      if (this.hinge) {
        var invRot = this.IKJoints[i].quaternion.clone().inverse();
        var parentAxis = this.IKJoints[i].axis.clone().applyQuaternion(invRot);
        fromToQuat.setFromUnitVectors(this.IKJoints[i].axis, parentAxis);
        this.IKJoints[i].quaternion.multiply(fromToQuat);
      }

      //Clamp to Joint Limits - Relies on sensical computation of these values... only works for x-axis here ¯\_(ツ)_/¯
      //Seems like rotations range from -pi, pi... not the worst... but bad for clamps through there
      if (this.limits) {
        var clampedRot = this.IKJoints[i].rotation.toVector3().clampScalar(this.IKJoints[i].minLimit, this.IKJoints[i].maxLimit);
        this.IKJoints[i].rotation.setFromVector3(clampedRot);
      }

      this.IKJoints[i].updateMatrixWorld();
    }
  }

  this.animate = function animatethis() {
    requestAnimationFrame(() => this.animate());

    //Set up a lazy render loop where it only renders if it's been interacted with in the last second
    if (this.environment.viewDirty) {
      this.environment.lastTimeRendered = this.environment.time.getElapsedTime();
      this.environment.viewDirty = false;
    }
    if (this.environment.time.getElapsedTime() - this.environment.lastTimeRendered < 1.0) {
      // Keep the target from going beneath the floor...
      if (this.limits == "enabled") {
        this.environment.draggableObjects[0].position.y = Math.max(0, this.environment.draggableObjects[0].position.y);
      }

      this.solveIK(this.environment.draggableObjects[0].position);
      this.environment.renderer.render(this.environment.scene, this.environment.camera);
    }
  };

  this.initArm();
  this.animate();
  // Initialize the view in-case we're lazy rendering...
  this.environment.renderer.render(this.environment.scene, this.environment.camera);
}

new IKEnvironment();