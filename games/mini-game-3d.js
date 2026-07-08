import * as THREE from 'three';

export class MiniGame3D {
  constructor(canvas, playerIndex) {
    this.canvas = canvas;
    this.playerIndex = playerIndex;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(`hsl(${playerIndex * 90}, 60%, 12%)`);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    this.camera.position.set(0, 9, 9);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.targets = [];
    this.score = 0;
    this.playerBall = null;
    this.targetPos = new THREE.Vector3(0, 0.5, 0);
    this.touchActive = false;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initScene();
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.width = parent.clientWidth;
    this.height = parent.clientHeight;
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  initScene() {
    // Işıklandırma
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 10, 5);
    this.scene.add(dir);

    // Zemin
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    this.scene.add(ground);

    // Oyuncu topu
    const ballGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      roughness: 0.2,
      emissive: 0x331100
    });
    this.playerBall = new THREE.Mesh(ballGeo, ballMat);
    this.playerBall.position.set(0, 0.5, 0);
    this.scene.add(this.playerBall);

    // Hedef küpler
    for (let i = 0; i < 8; i++) this.spawnTarget();
  }

  spawnTarget() {
    const size = 0.4 + Math.random() * 0.6;
    const color = new THREE.Color(`hsl(${Math.random() * 360}, 85%, 60%)`);
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshStandardMaterial({ color, roughness: 0.3, emissive: color, emissiveIntensity: 0.25 })
    );
    cube.position.x = (Math.random() - 0.5) * 8;
    cube.position.z = (Math.random() - 0.5) * 8;
    cube.position.y = size / 2;
    cube.userData.collected = false;
    this.scene.add(cube);
    this.targets.push(cube);
  }

  start() {
    this.update();
  }

  onTouchStart(id, relX, relY) {
    this.touchActive = true;
    this.updateTargetFromTouch(relX, relY);
  }

  onTouchMove(id, relX, relY) {
    if (!this.touchActive) return;
    this.updateTargetFromTouch(relX, relY);
  }

  onTouchEnd() {
    this.touchActive = false;
  }

  updateTargetFromTouch(relX, relY) {
    const ndcX = relX * 2 - 1;
    const ndcY = -(relY * 2 - 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, point)) {
      point.x = Math.max(-4.2, Math.min(4.2, point.x));
      point.z = Math.max(-4.2, Math.min(4.2, point.z));
      point.y = 0.5;
      this.targetPos.copy(point);
    }
  }

  update() {
    // Topu hedefe yumuşak hareket ettir
    if (this.playerBall) {
      this.playerBall.position.lerp(this.targetPos, 0.12);
    }

    // Çarpışma ve toplama kontrolü
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      if (t.userData.collected) continue;
      if (this.playerBall.position.distanceTo(t.position) < 0.9) {
        this.scene.remove(t);
        this.targets.splice(i, 1);
        this.score += 10;
        this.spawnTarget();
      }
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.update());
  }
}