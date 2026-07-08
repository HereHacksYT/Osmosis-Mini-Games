export class MiniGame2D {
  constructor(canvas, playerIndex) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.playerIndex = playerIndex;
    this.width = 0;
    this.height = 0;
    this.targets = [];
    this.score = 0;
    this.touchX = null;
    this.touchY = null;
    this.touchActive = false;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.width = parent.clientWidth;
    this.height = parent.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  start() {
    this.spawnTarget();
    this.targetInterval = setInterval(() => this.spawnTarget(), 1500);
    this.update();
  }

  spawnTarget() {
    if (this.targets.length > 5) return;
    const radius = 20 + Math.random() * 25;
    const x = radius + Math.random() * (this.width - 2 * radius);
    const y = radius + Math.random() * (this.height - 2 * radius);
    const color = `hsl(${Math.random() * 360}, 90%, 65%)`;
    this.targets.push({ x, y, radius, color });
  }

  onTouchStart(id, relX, relY) {
    this.touchActive = true;
    this.touchX = relX * this.width;
    this.touchY = relY * this.height;
    this.checkHit();
  }

  onTouchMove(id, relX, relY) {
    if (!this.touchActive) return;
    this.touchX = relX * this.width;
    this.touchY = relY * this.height;
    this.checkHit();
  }

  onTouchEnd() {
    this.touchActive = false;
    this.touchX = null;
    this.touchY = null;
  }

  checkHit() {
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      const dx = this.touchX - t.x;
      const dy = this.touchY - t.y;
      if (Math.sqrt(dx * dx + dy * dy) < t.radius) {
        this.targets.splice(i, 1);
        this.score += 10;
        break;
      }
    }
  }

  update() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Dinamik arka plan rengi
    this.ctx.fillStyle = `hsl(${this.playerIndex * 90}, 70%, 8%)`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Hedefleri çiz
    for (const t of this.targets) {
      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = t.color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }

    // Dokunma işaretçisi
    if (this.touchActive && this.touchX !== null) {
      this.ctx.beginPath();
      this.ctx.arc(this.touchX, this.touchY, 18, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
      this.ctx.fill();
    }

    // Puan
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 20px "Segoe UI"';
    this.ctx.fillText(`⭐ ${this.score}`, 15, 35);

    requestAnimationFrame(() => this.update());
  }
}
