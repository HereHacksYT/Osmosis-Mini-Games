import * as THREE from 'three';

export class MiniGame3D {
  constructor(canvas, playerIndex) {
    this.canvas = canvas;
    this.playerIndex = playerIndex;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(`hsl(${playerIndex * 70}, 60%, 8%)`);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    this.camera.position.set(0, 10, 10);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.targets = [];
    this.particles = [];
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
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 12, 5);
    this.scene.add(dir);

    // Zemin
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    this.scene.add(ground);

    // Oyuncu topu
    const ballGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.2, emissive: 0x220000 });
    this.playerBall = new THREE.Mesh(ballGeo, ballMat);
    this.playerBall.position.set(0, 0.5, 0);
    this.scene.add(this.playerBall);

    // Hedef küpler (dönecek)
    for (let i = 0; i < 10; i++) this.spawnTarget();
  }

  spawnTarget() {
    const size = 0.4 + Math.random() * 0.5;
    const color = new THREE.Color(`hsl(${Math.random() * 360}, 85%, 60%)`);
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshStandardMaterial({ color, roughness: 0.2, emissive: color, emissiveIntensity: 0.3 })
    );
    cube.position.x = (Math.random() - 0.5) * 8;
    cube.position.z = (Math.random() - 0.5) * 8;
    cube.position.y = size / 2;
    cube.userData = {
      rotSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.04
      )
    };
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
      point.x = Math.max(-4.5, Math.min(4.5, point.x));
      point.z = Math.max(-4.5, Math.min(4.5, point.z));
      point.y = 0.5;
      this.targetPos.copy(point);
    }
  }

  createParticles(position, color) {
    for (let i = 0; i < 20; i++) {
      const partGeo = new THREE.SphereGeometry(0.08, 4, 4);
      const partMat = new THREE.MeshBasicMaterial({ color });
      const part = new THREE.Mesh(partGeo, partMat);
      part.position.copy(position);
      part.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          Math.random() * 0.2 + 0.1,
          (Math.random() - 0.5) * 0.2
        ),
        life: 1.0
      };
      this.scene.add(part);
      this.particles.push(part);
    }
  }

  update() {
    // Top hareketi
    if (this.playerBall) {
      this.playerBall.position.lerp(this.targetPos, 0.1);
    }

    // Küpleri döndür ve çarpışma kontrolü
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const cube = this.targets[i];
      cube.rotation.x += cube.userData.rotSpeed.x;
      cube.rotation.y += cube.userData.rotSpeed.y;
      cube.rotation.z += cube.userData.rotSpeed.z;

      if (this.playerBall.position.distanceTo(cube.position) < 0.85) {
        this.score += 10;
        this.createParticles(cube.position.clone(), cube.material.color);
        this.scene.remove(cube);
        this.targets.splice(i, 1);
        this.spawnTarget();
      }
    }

    // Partikülleri güncelle
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.userData.life -= 0.02;
      if (p.userData.life <= 0) {
        this.scene.remove(p);
        this.particles.splice(i, 1);
        continue;
      }
      p.position.x += p.userData.velocity.x;
      p.position.y += p.userData.velocity.y;
      p.position.z += p.userData.velocity.z;
      p.userData.velocity.y -= 0.005;
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.update());
  }
}