var Environment = function () {
  this.time = new THREE.Clock();
  this.lastTimeRendered = 0.0;
  this.camera = new THREE.PerspectiveCamera(45, 1, 1, 2000); //new THREE.OrthographicCamera(300 / - 2, 300 / 2, 300 / 2, 300 / - 2, 1, 1000);
  this.scene = new THREE.Scene();
  this.isVisible = true;
  this.orbit = document.currentScript.getAttribute("orbit") == "enabled";
  this.square = document.currentScript.getAttribute("square") == "enabled";
  this.viewDirty = true;

  this.intersecting = function (entry) {
    if (entry.isIntersecting) {
      this.isVisible = true;
      console.log("Intersecting!");
    } else {
      this.isVisible = false;
      console.log("Not Intersecting!");
    }
  }

  this.initEnvironment = function () {
    this.camera.position.set(50, 100, 150);
    this.camera.lookAt(0, 45, 0);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);//0xa0a0a0
    this.scene.fog = new THREE.Fog(0xffffff, 200, 600);//0xa0a0a0

    var light = new THREE.HemisphereLight(0xffffff, 0x444444);
    light.position.set(0, 200, 0);
    this.light2 = new THREE.DirectionalLight(0xbbbbbb);
    this.light2.position.set(0, 200, 100);
    this.light2.castShadow = true;
    this.light2.shadow.camera.top = 180;
    this.light2.shadow.camera.bottom = - 100;
    this.light2.shadow.camera.left = - 120;
    this.light2.shadow.camera.right = 120;
    this.scene.add(light);
    this.scene.add(this.light2);
    //scene.add(new THREE.CameraHelper(light.shadow.camera));
    var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    var grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    this.scene.add(grid);

    this.ludic = new THREE.Mesh(new THREE.BoxBufferGeometry(30, 30, 30), 
                                new THREE.MeshPhongMaterial({ color: 0x111111 }));
    this.ludic.position.set(1200, 0, -100);
    this.ludic.castShadow = true;
    this.scene.add(this.ludic);

    var curCanvas = document.createElement('canvas');
    //curCanvas.id = canvasId;
    document.currentScript.parentNode.insertBefore(curCanvas, document.currentScript.nextSibling);
    this.renderer = new THREE.WebGLRenderer({ canvas: curCanvas, antialias: true });
    this.renderer.setPixelRatio(2);
    var parentWidth = document.currentScript.parentNode.getBoundingClientRect().width;
    if (this.square) { parentWidth = 350; }
    this.renderer.setSize(parentWidth, 350);
    this.renderer.shadowMap.enabled = true;
    this.camera.aspect = parentWidth / 350;
    this.camera.updateProjectionMatrix();

    this.draggableObjects = [this.ludic];
    this.dragControls = new THREE.DragControls(this.draggableObjects, this.camera, this.renderer.domElement);

    if (this.orbit) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.target.set(0, 45, 0);
      this.controls.panSpeed = 2;
      this.controls.zoomSpeed = 1;
      this.controls.screenSpacePanning = true;
      this.controls.update();
      this.controls.addEventListener('change', () => this.viewDirty = true);
      this.dragControls.addEventListener('dragstart', (data) => { this.controls.enabled = false;  data.object._isDragging = true; 
         if(data.object === this.ludic) { window.location.href = '/yrtemoegcidulbus' }});
      this.dragControls.addEventListener('dragend', (data) => { this.controls.enabled = true; data.object._isDragging = false; });
    }
    this.dragControls.addEventListener('drag', () => this.viewDirty = true);

    //If not on iOS, use the Intersection Observer to see if this is visible
    this.iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
    if (!this.iOS) {
      this.observer = new IntersectionObserver((entries) =>
        entries.forEach((entry) => this.intersecting(entry)));
      this.observer.observe(this.renderer.domElement);
    }
  }

  this.initEnvironment();
}
