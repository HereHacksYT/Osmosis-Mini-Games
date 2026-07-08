export class MiniGame2D {
  constructor(canvas, playerIndex) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.playerIndex = playerIndex;
    this.width = 0;
    this.height = 0;
    this.targets = [];
    this.particles = [];
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
    for (let i = 0; i < 6; i++) this.spawnTarget();
    this.update();
  }

  spawnTarget() {
    const radius = 20 + Math.random() * 20;
    const x = radius + Math.random() * (this.width - 2 * radius);
    const y = radius + Math.random() * (this.height - 2 * radius);
    const vx = (Math.random() - 0.5) * 2;
    const vy = (Math.random() - 0.5) * 2;
    const color = `hsl(${Math.random() * 360}, 85%, 65%)`;
    this.targets.push({ x, y, radius, vx, vy, color });
  }

  onTouchStart(id, relX, relY) {
    this.touchActive = true;
    this.touchX = relX * this.width;
    this.touchY = relY * this.height;
  }

  onTouchMove(id, relX, relY) {
    if (!this.touchActive) return;
    this.touchX = relX * this.width;
    this.touchY = relY * this.height;
  }

  onTouchEnd() {
    this.touchActive = false;
    this.touchX = null;
    this.touchY = null;
  }

  createParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color
      });
    }
  }

  update() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, `hsl(${this.playerIndex * 80}, 50%, 10%)`);
    grad.addColorStop(1, `hsl(${this.playerIndex * 80}, 50%, 5%)`);
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.x += t.vx;
      t.y += t.vy;

      if (t.x - t.radius < 0 || t.x + t.radius > this.width) t.vx *= -1;
      if (t.y - t.radius < 0 || t.y + t.radius > this.height) t.vy *= -1;

      if (this.touchActive && this.touchX !== null) {
        const dx = this.touchX - t.x;
        const dy = this.touchY - t.y;
        if (Math.sqrt(dx * dx + dy * dy) < t.radius + 18) {
          this.score += 10;
          this.createParticles(t.x, t.y, t.color);
          this.targets.splice(i, 1);
          this.spawnTarget();
          continue;
        }
      }

      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = t.color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;

    if (this.touchActive && this.touchX !== null) {
      this.ctx.beginPath();
      this.ctx.arc(this.touchX, this.touchY, 16, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 22px "Segoe UI"';
    this.ctx.fillText(`⭐ ${this.score}`, 15, 35);

    requestAnimationFrame(() => this.update());
  }
}