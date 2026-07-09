export class TimeArena {
  constructor(canvas, playerIndex, totalPlayers) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.totalPlayers = totalPlayers;
    this.playerIndex = playerIndex;

    this.width = 0;
    this.height = 0;
    
    this.players = [];
    this.alivePlayers = 0;
    
    this.joysticks = [];
    this.activeTouches = {};
    
    this.crystals = [];
    this.crystalSpawnTimer = 0;
    this.maxCrystals = 3;
    
    this.dangers = [];
    this.maxDangers = 4;
    
    this.state = 'PLAYING';
    this.gameOver = false;
    this.winner = -1;
    
    this.lastTime = 0;
    
    this.playerColors = [
      { main: '#E63946', light: '#FF6B6B', dark: '#B71C1C', name: 'Kırmızı' },
      { main: '#2196F3', light: '#64B5F6', dark: '#0D47A1', name: 'Mavi' },
      { main: '#4CAF50', light: '#81C784', dark: '#1B5E20', name: 'Yeşil' },
      { main: '#FFD600', light: '#FFEE58', dark: '#F9A825', name: 'Sarı' }
    ];
    
    this.colors = {
      bg: '#1A1A2E',
      arenaBorder: '#E0E0E0',
      crystal: '#FF6D00',
      crystalGlow: '#FFAB40',
      danger: '#D50000',
      dangerDark: '#8B0000'
    };

    this.initGame();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  initGame() {
    this.players = [];
    this.alivePlayers = this.totalPlayers;
    this.crystals = [];
    this.dangers = [];
    this.gameOver = false;
    this.winner = -1;
    this.state = 'PLAYING';
    this.activeTouches = {};
    this.lastTime = performance.now();

    this.joysticks = [];
    const joySize = 70;
    const margin = 30;
    
    const positions = [
      { x: margin + joySize, y: this.height - margin - joySize },
      { x: this.width - margin - joySize, y: this.height - margin - joySize },
      { x: margin + joySize, y: margin + joySize + 60 },
      { x: this.width - margin - joySize, y: margin + joySize + 60 }
    ];

    for (let i = 0; i < this.totalPlayers; i++) {
      const pos = positions[i];
      this.joysticks.push({
        id: i,
        baseX: pos.x,
        baseY: pos.y,
        radius: joySize,
        knobX: pos.x,
        knobY: pos.y,
        knobRadius: 28,
        active: false,
        touchId: null
      });

      const angle = (i / this.totalPlayers) * Math.PI * 2;
      const spawnDist = Math.min(this.width, this.height) * 0.12;
      this.players.push({
        id: i,
        x: this.width / 2 + Math.cos(angle) * spawnDist,
        y: this.height / 2 + Math.sin(angle) * spawnDist,
        radius: 22,
        color: this.playerColors[i],
        vx: 0,
        vy: 0,
        time: 30,
        alive: true,
        speed: 1.0
      });
    }

    this.spawnDangers();
  }

  spawnDangers() {
    this.dangers = [];
    for (let i = 0; i < this.maxDangers; i++) {
      this.dangers.push({
        x: this.width * 0.25 + Math.random() * this.width * 0.5,
        y: this.height * 0.3 + Math.random() * this.height * 0.4,
        radius: 20,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 0.015
      });
    }
  }

  spawnCrystal() {
    if (this.crystals.length >= this.maxCrystals) return;
    
    let x, y;
    let attempts = 0;
    do {
      x = 80 + Math.random() * (this.width - 160);
      y = 100 + Math.random() * (this.height - 200);
      attempts++;
    } while (attempts < 20 && this.isNearDanger(x, y));
    
    this.crystals.push({
      x,
      y,
      radius: 18,
      timeBonus: 8,
      pulsePhase: Math.random() * Math.PI * 2,
      collected: false
    });
  }

  isNearDanger(x, y) {
    for (const danger of this.dangers) {
      const dx = x - danger.x;
      const dy = y - danger.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < danger.radius + 60) return true;
    }
    return false;
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.width = parent.clientWidth;
    this.height = parent.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    const joySize = 70;
    const margin = 30;
    const positions = [
      { x: margin + joySize, y: this.height - margin - joySize },
      { x: this.width - margin - joySize, y: this.height - margin - joySize },
      { x: margin + joySize, y: margin + joySize + 60 },
      { x: this.width - margin - joySize, y: margin + joySize + 60 }
    ];

    for (let i = 0; i < this.joysticks.length; i++) {
      this.joysticks[i].baseX = positions[i].x;
      this.joysticks[i].baseY = positions[i].y;
      this.joysticks[i].knobX = positions[i].x;
      this.joysticks[i].knobY = positions[i].y;
    }

    if (this.dangers.length === 0) {
      this.spawnDangers();
    }
  }

  start() {
    this.initGame();
    this.update();
  }

  onTouchStart(id, relX, relY) {
    if (this.gameOver) return;
    
    const px = relX * this.width;
    const py = relY * this.height;
    
    for (const joy of this.joysticks) {
      const dx = px - joy.baseX;
      const dy = py - joy.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < joy.radius * 1.5 && !joy.active) {
        joy.active = true;
        joy.touchId = id;
        this.activeTouches[id] = joy.id;
        joy.knobX = px;
        joy.knobY = py;
        this.updateJoystick(joy, px, py);
        break;
      }
    }
  }

  onTouchMove(id, relX, relY) {
    if (this.gameOver) return;
    
    const joyId = this.activeTouches[id];
    if (joyId === undefined) return;
    
    const joy = this.joysticks[joyId];
    if (!joy || !joy.active) return;
    
    const px = relX * this.width;
    const py = relY * this.height;
    this.updateJoystick(joy, px, py);
  }

  onTouchEnd(id, relX, relY) {
    const joyId = this.activeTouches[id];
    if (joyId !== undefined) {
      const joy = this.joysticks[joyId];
      if (joy) {
        joy.active = false;
        joy.touchId = null;
        joy.knobX = joy.baseX;
        joy.knobY = joy.baseY;
      }
      delete this.activeTouches[id];
    }
  }

  updateJoystick(joy, px, py) {
    const dx = px - joy.baseX;
    const dy = py - joy.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = joy.radius - joy.knobRadius;
    
    if (dist > maxDist) {
      const angle = Math.atan2(dy, dx);
      joy.knobX = joy.baseX + Math.cos(angle) * maxDist;
      joy.knobY = joy.baseY + Math.sin(angle) * maxDist;
    } else {
      joy.knobX = px;
      joy.knobY = py;
    }
  }

  getJoystickInput(playerIdx) {
    const joy = this.joysticks[playerIdx];
    if (!joy || !joy.active) return { x: 0, y: 0 };
    
    const dx = joy.knobX - joy.baseX;
    const dy = joy.knobY - joy.baseY;
    const maxDist = joy.radius - joy.knobRadius;
    
    return {
      x: dx / maxDist,
      y: dy / maxDist
    };
  }

  update() {
    // Gerçek delta time
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.gameOver) {
      this.draw();
      requestAnimationFrame(() => this.update());
      return;
    }

    for (const player of this.players) {
      if (!player.alive) continue;

      const input = this.getJoystickInput(player.id);
      
      const targetVx = input.x * player.speed;
      const targetVy = input.y * player.speed;
      
      player.vx += (targetVx - player.vx) * 8 * dt;
      player.vy += (targetVy - player.vy) * 8 * dt;
      
      player.x += player.vx;
      player.y += player.vy;
      
      const minX = player.radius;
      const maxX = this.width - player.radius;
      const minY = 60 + player.radius;
      const maxY = this.height - player.radius - 180;
      
      if (player.x < minX) { player.x = minX; player.vx *= -0.3; }
      if (player.x > maxX) { player.x = maxX; player.vx *= -0.3; }
      if (player.y < minY) { player.y = minY; player.vy *= -0.3; }
      if (player.y > maxY) { player.y = maxY; player.vy *= -0.3; }
      
      player.time -= dt;
      if (player.time <= 0) {
        player.alive = false;
        this.alivePlayers--;
        if (this.alivePlayers <= 1) {
          this.checkWinner();
        }
      }
    }

    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const p1 = this.players[i];
        const p2 = this.players[j];
        if (!p1.alive || !p2.alive) continue;
        
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = p1.radius + p2.radius;
        
        if (dist < minDist && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;
          
          p1.x -= nx * overlap * 0.5;
          p1.y -= ny * overlap * 0.5;
          p2.x += nx * overlap * 0.5;
          p2.y += ny * overlap * 0.5;
          
          const relVx = p1.vx - p2.vx;
          const relVy = p1.vy - p2.vy;
          const relVel = relVx * nx + relVy * ny;
          
          if (relVel > 0) {
            const impulse = relVel * 0.8;
            p1.vx -= nx * impulse * 0.5;
            p1.vy -= ny * impulse * 0.5;
            p2.vx += nx * impulse * 0.5;
            p2.vy += ny * impulse * 0.5;
          }
        }
      }
    }

    for (const danger of this.dangers) {
      danger.x += danger.vx;
      danger.y += danger.vy;
      danger.rotation += danger.rotSpeed;
      
      if (danger.x - danger.radius < 0 || danger.x + danger.radius > this.width) {
        danger.vx *= -1;
      }
      if (danger.y - danger.radius < 60 || danger.y + danger.radius > this.height - 180) {
        danger.vy *= -1;
      }
      
      for (const player of this.players) {
        if (!player.alive) continue;
        
        const dx = player.x - danger.x;
        const dy = player.y - danger.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = player.radius + danger.radius;
        
        if (dist < minDist) {
          player.time -= 10 * dt;
          
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          player.vx += nx * 5 * dt;
          player.vy += ny * 5 * dt;
          
          if (player.time <= 0) {
            player.alive = false;
            this.alivePlayers--;
            if (this.alivePlayers <= 1) {
              this.checkWinner();
            }
          }
        }
      }
    }

    this.crystalSpawnTimer += dt;
    if (this.crystalSpawnTimer > 3 + Math.random() * 2) {
      this.crystalSpawnTimer = 0;
      this.spawnCrystal();
    }
    
    for (let i = this.crystals.length - 1; i >= 0; i--) {
      const crystal = this.crystals[i];
      
      for (const player of this.players) {
        if (!player.alive) continue;
        
        const dx = player.x - crystal.x;
        const dy = player.y - crystal.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.radius + crystal.radius) {
          player.time += crystal.timeBonus;
          this.crystals.splice(i, 1);
          break;
        }
      }
    }

    this.checkWinner();
    this.draw();
    requestAnimationFrame(() => this.update());
  }

  checkWinner() {
    if (this.gameOver) return;
    
    const alive = this.players.filter(p => p.alive);
    if (alive.length <= 1) {
      this.gameOver = true;
      this.state = 'GAME_OVER';
      this.winner = alive.length === 1 ? alive[0].id : -1;
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    this.ctx.fillStyle = this.colors.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    const arenaX = 0;
    const arenaY = 60;
    const arenaW = this.width;
    const arenaH = this.height - 240;
    
    this.ctx.fillStyle = '#16213E';
    this.ctx.fillRect(arenaX, arenaY, arenaW, arenaH);
    this.ctx.strokeStyle = this.colors.arenaBorder;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(arenaX, arenaY, arenaW, arenaH);
    
    this.ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    this.ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < arenaW; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, arenaY);
      this.ctx.lineTo(x, arenaY + arenaH);
      this.ctx.stroke();
    }
    for (let y = arenaY; y < arenaY + arenaH; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(arenaW, y);
      this.ctx.stroke();
    }
    
    for (const danger of this.dangers) {
      this.ctx.save();
      this.ctx.translate(danger.x, danger.y);
      this.ctx.rotate(danger.rotation);
      
      this.ctx.beginPath();
      this.ctx.arc(0, 0, danger.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.colors.danger;
      this.ctx.fill();
      this.ctx.strokeStyle = this.colors.dangerDark;
      this.ctx.lineWidth = 4;
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.arc(0, 0, danger.radius * 0.5, 0, Math.PI * 2);
      this.ctx.fillStyle = this.colors.dangerDark;
      this.ctx.fill();
      
      this.ctx.fillStyle = '#FFD600';
      this.ctx.font = `bold ${danger.radius * 0.8}px "Segoe UI"`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('⚠', 0, 0);
      
      this.ctx.restore();
    }
    
    for (const crystal of this.crystals) {
      crystal.pulsePhase += 0.05;
      const pulse = 1 + Math.sin(crystal.pulsePhase) * 0.2;
      const r = crystal.radius * pulse;
      
      this.ctx.beginPath();
      this.ctx.arc(crystal.x, crystal.y, r, 0, Math.PI * 2);
      this.ctx.fillStyle = this.colors.crystal;
      this.ctx.fill();
      this.ctx.strokeStyle = this.colors.crystalGlow;
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = `bold ${r * 0.9}px "Segoe UI"`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('⌛', crystal.x, crystal.y);
    }
    
    for (const player of this.players) {
      if (!player.alive) continue;
      
      this.ctx.beginPath();
      this.ctx.arc(player.x + 3, player.y + 3, player.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = player.color.main;
      this.ctx.fill();
      this.ctx.strokeStyle = player.color.dark;
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, player.radius * 0.55, 0, Math.PI * 2);
      this.ctx.fillStyle = player.color.light;
      this.ctx.fill();
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = `bold ${player.radius * 0.9}px "Segoe UI"`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(player.id + 1, player.x, player.y);
    }
    
    for (const joy of this.joysticks) {
      this.ctx.beginPath();
      this.ctx.arc(joy.baseX, joy.baseY, joy.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255,255,255,0.08)';
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.arc(joy.knobX, joy.knobY, joy.knobRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = joy.active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)';
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 14px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`P${joy.id + 1}`, joy.baseX, joy.baseY - joy.radius - 15);
    }
    
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.width, 60);
    
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      const barX = 20 + i * (this.width / this.totalPlayers);
      const barW = (this.width / this.totalPlayers) - 40;
      const barH = 22;
      const barY = 8;
      
      this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
      this.ctx.fillRect(barX, barY, barW, barH);
      
      if (player.alive) {
        const timeRatio = Math.max(0, player.time / 30);
        const barColor = timeRatio > 0.5 ? player.color.main : 
                         timeRatio > 0.25 ? '#FF9800' : '#F44336';
        
        this.ctx.fillStyle = barColor;
        this.ctx.fillRect(barX, barY, barW * timeRatio, barH);
      } else {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(barX, barY, barW, barH);
        this.ctx.fillStyle = '#F44336';
        this.ctx.font = 'bold 12px "Segoe UI"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ELENDİ', barX + barW / 2, barY + barH / 2 + 4);
        continue;
      }
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 13px "Segoe UI"';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`P${i + 1}`, barX, barY + barH + 18);
      
      this.ctx.textAlign = 'right';
      this.ctx.fillText(`${Math.ceil(player.time)}s`, barX + barW, barY + barH + 18);
    }
    
    if (!this.gameOver) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
      this.ctx.fillRect(0, this.height - 180, this.width, 180);
    }
    
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 36px "Segoe UI"';
      this.ctx.textAlign = 'center';
      
      if (this.winner >= 0) {
        const color = this.playerColors[this.winner];
        this.ctx.fillStyle = color.main;
        this.ctx.fillText(`🏆 ${color.name} Kazandı! 🏆`, this.width / 2, this.height / 2 - 20);
      } else {
        this.ctx.fillText('💀 Berabere! 💀', this.width / 2, this.height / 2 - 20);
      }
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '20px "Segoe UI"';
      this.ctx.fillText('Sayfayı yenileyerek tekrar oyna', this.width / 2, this.height / 2 + 40);
    }
  }
}