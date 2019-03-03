var SegmentSegmentEnvironment = function () {
  this.environment = new Environment();
  this.updating = false;

  this.points = [];
  this.boxGeometry = new THREE.BoxBufferGeometry(100, 100, 100);
  this.white = new THREE.MeshLambertMaterial({ color: 0x888888 });
  this.dark = new THREE.MeshLambertMaterial({ color: 0x555555 });
  this.blue = new THREE.MeshPhongMaterial({ color: 0x3399dd });
  this.red = new THREE.MeshPhongMaterial({ color: 0xdd3333 });
  this.darkline = new THREE.LineBasicMaterial({ color: 0x555555 });
  this.redline = new THREE.LineBasicMaterial({ color: 0xdd3333 });

  this.debug = document.currentScript.getAttribute("debug") == "enabled";

  this.initPoints = function () {
    this.environment.camera.position.set(0, 100, 200);
    let target = this.environment.camera.position.clone().add(new THREE.Vector3(0, 0, -200));
    this.environment.camera.lookAt(target);
    if (this.environment.orbit) {
      this.environment.controls.target.set(target.x, target.y, target.z);
      this.environment.controls.update();
    }

    this.a = new THREE.Mesh(this.boxGeometry, this.blue);
    this.a.scale.set(0.075, 0.075, 0.075);
    this.a.position.set(-50, 100, 0);
    this.a.castShadow = true;
    this.environment.scene.add(this.a);
    this.environment.draggableObjects.push(this.a);

    this.b = new THREE.Mesh(this.boxGeometry, this.blue);
    this.b.scale.set(0.075, 0.075, 0.075);
    this.b.position.set(50, 110, 0);
    this.b.castShadow = true;
    this.environment.scene.add(this.b);
    this.environment.draggableObjects.push(this.b);

    this.line1Geo = new THREE.Geometry();
    this.line1Geo.vertices.push(
      this.a.position,
      this.b.position
    );
    this.line1 = new THREE.Line(this.line1Geo, this.darkline);
    this.environment.scene.add(this.line1);

    this.pointAB = new THREE.Mesh(this.boxGeometry, this.red);
    this.pointAB.scale.set(0.05, 0.05, 0.05);
    this.pointAB.position.set(20, 120, 0);
    this.pointAB.castShadow = true;
    this.environment.scene.add(this.pointAB);




    this.c = new THREE.Mesh(this.boxGeometry, this.blue);
    this.c.scale.set(0.075, 0.075, 0.075);
    this.c.position.set(-30, 70, -30);
    this.c.castShadow = true;
    this.environment.scene.add(this.c);
    this.environment.draggableObjects.push(this.c);

    this.d = new THREE.Mesh(this.boxGeometry, this.blue);
    this.d.scale.set(0.075, 0.075, 0.075);
    this.d.position.set(50, 70, 40);
    this.d.castShadow = true;
    this.environment.scene.add(this.d);
    this.environment.draggableObjects.push(this.d);

    this.line2Geo = new THREE.Geometry();
    this.line2Geo.vertices.push(
      this.c.position,
      this.d.position
    );
    this.line2 = new THREE.Line(this.line2Geo, this.darkline);
    this.environment.scene.add(this.line2);

    this.pointCD = new THREE.Mesh(this.boxGeometry, this.red);
    this.pointCD.scale.set(0.05, 0.05, 0.05);
    this.pointCD.position.set(20, 120, 0);
    this.pointCD.castShadow = true;
    this.environment.scene.add(this.pointCD);

    this.ABToCD = new THREE.ArrowHelper(new THREE.Vector3(-1, 1, 0).normalize(), this.c.position, 40, 0xdd3333);
    this.ABToCD.setLength(40, 10, 5);
    this.environment.scene.add(this.ABToCD);

    this.CDToAB = new THREE.ArrowHelper(new THREE.Vector3(-1, 1, 0).normalize(), this.c.position, 40, 0xdd3333);
    this.CDToAB.setLength(40, 10, 5);
    this.environment.scene.add(this.CDToAB);

    this.planarC = new THREE.Mesh(this.boxGeometry, this.dark);
    this.planarC.scale.set(0.04, 0.04, 0.04);
    this.planarC.castShadow = true;
    this.environment.scene.add(this.planarC);
    this.planarC.visible = this.debug;

    this.planarD = new THREE.Mesh(this.boxGeometry, this.dark);
    this.planarD.scale.set(0.04, 0.04, 0.04);
    this.planarD.castShadow = true;
    this.environment.scene.add(this.planarD);
    this.planarD.visible = this.debug;

    this.planarPointCD = new THREE.Mesh(this.boxGeometry, this.dark);
    this.planarPointCD.scale.set(0.03, 0.03, 0.03);
    this.planarPointCD.castShadow = true;
    this.environment.scene.add(this.planarPointCD);
    this.planarPointCD.visible = this.debug;


    this.plane = new THREE.GridHelper(1000, 40, 0x000000, 0x000000);
    this.plane.material.opacity = 0.1;
    this.plane.material.transparent = true;
    this.environment.scene.add(this.plane);
    this.plane.visible = this.debug;

    this.line3Geo = new THREE.Geometry();
    this.line3Geo.vertices.push(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    );
    this.line3 = new THREE.Line(this.line3Geo, this.darkline);
    this.environment.scene.add(this.line3);
    this.line3.visible = this.debug;


    // Lines into the plane
    this.dashedMaterial = new THREE.LineDashedMaterial({
      color: 0x555555,
      linewidth: 2,
      scale: 1,
      dashSize: 5,
      gapSize: 2,
    });
    this.line4Geo = new THREE.Geometry();
    this.line4Geo.vertices.push(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    );
    this.line4 = new THREE.Line(this.line4Geo, this.dashedMaterial);
    this.line4.computeLineDistances();
    this.environment.scene.add(this.line4);
    this.line4.visible = this.debug;
    this.line5Geo = new THREE.Geometry();
    this.line5Geo.vertices.push(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    );
    this.line5 = new THREE.Line(this.line5Geo, this.dashedMaterial);
    this.line5.computeLineDistances();
    this.environment.scene.add(this.line5);
    this.line5.visible = this.debug;
    this.line6Geo = new THREE.Geometry();
    this.line6Geo.vertices.push(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    );
    this.line6 = new THREE.Line(this.line6Geo, this.dashedMaterial);
    this.line6.computeLineDistances();
    this.environment.scene.add(this.line6);
    this.line6.visible = this.debug;

    this.line7Geo = new THREE.Geometry();
    this.line7Geo.vertices.push(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    );
    this.line7 = new THREE.Line(this.line7Geo, this.redline);
    this.line7.computeLineDistances();
    this.environment.scene.add(this.line7);
    this.line7.visible = this.debug;
  }

  // Stupid lack of operator overloading, this looks so dumb
  this.closestToSegment = function (point, a, b) {
    let ba = b.clone().sub(a);
    let t = point.clone().sub(a).dot(ba) / ba.lengthSq();
    return a.clone().lerp(b, Math.min(Math.max(t, 0), 1));
  }

  this.closestPointOnSegmentToLine = function (segA, segB, lineA, lineB) {
    let lineBAAxis = lineB.clone().sub(lineA).normalize();
    let inPlaneA = segA.clone().sub(lineA).projectOnPlane(lineBAAxis).add(lineA);
    let inPlaneB = segB.clone().sub(lineA).projectOnPlane(lineBAAxis).add(lineA);
    let inPlaneBA = inPlaneB.clone().sub(inPlaneA);
    let t = lineA.clone().sub(inPlaneA).dot(inPlaneBA) / inPlaneBA.lengthSq();

    this.planarC.position.copy(inPlaneA); // These two lines aren't necessary
    this.planarD.position.copy(inPlaneB); // But are nice for visualization

    return segA.clone().lerp(segB, Math.min(Math.max(t, 0), 1));
  }

  this.closestPointOnSegmentToSegment = function (segA, segB, segC, segD, pointAB, pointCD) {
    let rayPoint = this.closestPointOnSegmentToLine(segA, segB, segC, segD);
    pointCD.copy(this.closestToSegment(rayPoint, segC, segD));
    pointAB.copy(this.closestToSegment(pointCD, segA, segB));
  }

  this.animate = function animatethis() {
    requestAnimationFrame(() => this.animate());
    //Set up a lazy render loop where it only renders if it's been interacted with in the last second
    if (this.environment.viewDirty) {
      this.environment.lastTimeRendered = this.environment.time.getElapsedTime();
      this.environment.viewDirty = false;
    }

    if (this.environment.time.getElapsedTime() - this.environment.lastTimeRendered < 1.0) {
      this.line1.geometry.vertices[0].copy(this.a.position);
      this.line1.geometry.vertices[1].copy(this.b.position);
      this.line1.geometry.verticesNeedUpdate = true;

      this.line2.geometry.vertices[0].copy(this.c.position);
      this.line2.geometry.vertices[1].copy(this.d.position);
      this.line2.geometry.verticesNeedUpdate = true;

      this.closestPointOnSegmentToSegment(this.c.position, this.d.position, this.a.position, this.b.position, this.pointCD.position, this.pointAB.position);

      // Closest Points
      this.ABToCD.position.copy(this.pointAB.position);
      let dir = this.pointCD.position.clone().sub(this.pointAB.position);
      this.ABToCD.setLength(dir.length());
      this.ABToCD.setDirection(dir.normalize());

      this.CDToAB.position.copy(this.pointCD.position);
      dir = this.pointAB.position.clone().sub(this.pointCD.position);
      this.CDToAB.setLength(dir.length());
      this.CDToAB.setDirection(dir.normalize());

      // In-plane visualizations
      this.plane.position.copy(this.a.position);
      let planeNormal = this.a.position.clone().sub(this.b.position).normalize();
      this.plane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), planeNormal);

      this.planarPointCD.position.copy(this.pointCD.position.clone().sub(this.a.position).projectOnPlane(planeNormal).add(this.a.position));

      this.line3.geometry.vertices[0].copy(this.planarC.position);
      this.line3.geometry.vertices[1].copy(this.planarD.position);
      this.line3.geometry.verticesNeedUpdate = true;

      this.line4.geometry.vertices[0].copy(this.c.position);
      this.line4.geometry.vertices[1].copy(this.planarC.position);
      this.line4.computeLineDistances();
      this.line4.geometry.lineDistancesNeedUpdate = true;
      this.line4.geometry.verticesNeedUpdate = true;
      this.line5.geometry.vertices[0].copy(this.d.position);
      this.line5.geometry.vertices[1].copy(this.planarD.position);
      this.line5.geometry.verticesNeedUpdate = true;
      this.line5.computeLineDistances();
      this.line5.geometry.lineDistancesNeedUpdate = true;
      this.line6.geometry.vertices[0].copy(this.pointCD.position);
      this.line6.geometry.vertices[1].copy(this.planarPointCD.position);
      this.line6.geometry.verticesNeedUpdate = true;
      this.line6.computeLineDistances();
      this.line6.geometry.lineDistancesNeedUpdate = true;

      this.line7.geometry.vertices[0].copy(this.a.position);
      this.line7.geometry.vertices[1].copy(this.planarPointCD.position);
      this.line7.geometry.verticesNeedUpdate = true;

      this.environment.renderer.render(this.environment.scene, this.environment.camera);
    }
  };

  this.initPoints();
  this.animate();
  // Initialize the view in-case we're lazy rendering...
  this.environment.renderer.render(this.environment.scene, this.environment.camera);
}

new SegmentSegmentEnvironment();