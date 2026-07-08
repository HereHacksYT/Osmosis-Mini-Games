export class SecretCanvas {
  constructor(canvas, playerIndex, totalPlayers) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.totalPlayers = totalPlayers;
    this.playerIndex = playerIndex;

    this.state = 'DRAWER_WARNING';
    this.drawerIndex = -1;
    this.currentGuesserIndex = 0;
    this.guessers = [];
    this.secretWord = '';
    this.winner = null;
    this.roundGuessCount = 0;
    this.totalGuessAttempts = 0;
    this.maxGuessAttempts = 0;

    this.drawCanvas = document.createElement('canvas');
    this.drawCtx = this.drawCanvas.getContext('2d');
    this.drawingColor = '#FF0000';
    this.drawingLineWidth = 8;
    this.isDrawing = false;
    this.lastPoint = null;

    this.buttons = [];
    this.particles = [];

    this.wordPool = [
      'Kıskançlık', 'Özgürlük', 'Kabus', 'Pişmanlık', 'Mucize',
      'Heyecan', 'Sonsuzluk', 'Karanlık', 'Fırtına', 'Deprem',
      'Girdap', 'Yankı', 'Sessizlik', 'Açlık', 'Korku',
      'Rüya', 'Gölge', 'Sis', 'Zehir', 'Büyü',
      'Lanet', 'Kıyamet', 'İhanet', 'Yalnızlık', 'Cesaret',
      'Kibir', 'Öfke', 'Sabır', 'Umut', 'Zaman',
      'Melodi', 'Yıldırım', 'Kasırga', 'Volkan', 'Şimşek',
      'Hortum', 'Tufan', 'Kutup', 'Çığ', 'Heyelan',
      'Gökkuşağı', 'Kuzey Işıkları', 'Serap', 'Meteor', 'Tutulma',
      'Lav', 'Buzul', 'Safari', 'Çığlık', 'Fısıltı'
    ];

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.width = parent.clientWidth;
    this.height = parent.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.drawCanvas.width = this.width;
    this.drawCanvas.height = this.height;
  }

  // Fisher-Yates shuffle
  shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  start() {
    this.resetGame();
    this.update();
  }

  resetGame() {
    this.drawerIndex = Math.floor(Math.random() * this.totalPlayers);
    
    // Tahmincileri rastgele sırala
    const allGuessers = [];
    for (let i = 0; i < this.totalPlayers; i++) {
      if (i !== this.drawerIndex) allGuessers.push(i);
    }
    this.guessers = this.shuffleArray(allGuessers);
    
    this.currentGuesserIndex = 0;
    this.roundGuessCount = 0;
    this.totalGuessAttempts = 0;
    this.maxGuessAttempts = this.guessers.length * 3;
    
    this.secretWord = this.wordPool[Math.floor(Math.random() * this.wordPool.length)];
    this.winner = null;
    this.state = 'DRAWER_WARNING';
    this.clearDrawing();
    this.particles = [];
    this.defineButtons();
  }

  clearDrawing() {
    this.drawCtx.clearRect(0, 0, this.width, this.height);
    this.drawCtx.fillStyle = '#CCCCCC';
    this.drawCtx.fillRect(0, 0, this.width, this.height);
  }

  defineButtons() {
    this.buttons = [];
    
    if (this.state === 'DRAWER_WARNING') {
      this.buttons.push({
        type: 'oval',
        id: 'startReveal',
        x: this.width / 2 - 120,
        y: this.height / 2 + 60,
        w: 240,
        h: 80,
        radius: 40,
        color: '#00CC00',
        text: '🚀 BAŞLA',
        textSize: 28,
        action: 'startReveal'
      });
      
    } else if (this.state === 'DRAWING') {
      const colors = ['#FF0000', '#0000FF', '#FFD700', '#FF00FF', '#00FF00', '#FF6600'];
      const btnRadius = 22;
      const startX = 40;
      const y = 130;
      
      for (let i = 0; i < colors.length; i++) {
        this.buttons.push({
          type: 'circle',
          id: 'color_' + i,
          cx: startX + i * (btnRadius * 2 + 15),
          cy: y,
          radius: btnRadius,
          color: colors[i],
          action: 'setColor',
          value: colors[i]
        });
      }
      
      const thicknesses = [3, 6, 10, 16];
      const thickY = y + btnRadius * 2 + 20;
      for (let i = 0; i < thicknesses.length; i++) {
        this.buttons.push({
          type: 'circle',
          id: 'thick_' + i,
          cx: startX + i * (btnRadius * 2 + 15),
          cy: thickY,
          radius: btnRadius,
          thickness: thicknesses[i],
          action: 'setThickness',
          value: thicknesses[i]
        });
      }
      
      this.buttons.push({
        type: 'oval',
        id: 'clear',
        x: this.width - 160,
        y: 130,
        w: 140,
        h: 50,
        radius: 25,
        color: '#FF3333',
        text: '🧹 Temizle',
        action: 'clear'
      });
      
      this.buttons.push({
        type: 'oval',
        id: 'done',
        x: this.width / 2 - 100,
        y: this.height - 120,
        w: 200,
        h: 65,
        radius: 32,
        color: '#0066FF',
        text: 'BİTTİ! 🚀',
        textSize: 22,
        action: 'done'
      });
      
    } else if (this.state === 'GUESSING') {
      this.buttons.push({
        type: 'oval',
        id: 'correct',
        x: this.width / 2 - 170,
        y: this.height - 130,
        w: 150,
        h: 55,
        radius: 27,
        color: '#00CC00',
        text: '✅ Doğru!',
        textSize: 20,
        action: 'correctGuess'
      });
      
      this.buttons.push({
        type: 'oval',
        id: 'wrong',
        x: this.width / 2 + 20,
        y: this.height - 130,
        w: 150,
        h: 55,
        radius: 27,
        color: '#FF3333',
        text: '❌ Bilemedi',
        textSize: 18,
        action: 'wrongGuess'
      });
      
    } else if (this.state === 'RESULT') {
      this.buttons.push({
        type: 'oval',
        id: 'replay',
        x: this.width / 2 - 100,
        y: this.height - 130,
        w: 200,
        h: 60,
        radius: 30,
        color: '#0066FF',
        text: '🔄 Yeniden Oyna',
        textSize: 20,
        action: 'replay'
      });
    }
  }

  onTouchStart(id, relX, relY) {
    const px = relX * this.width;
    const py = relY * this.height;
    
    if (this.state === 'DRAWER_WARNING') {
      const btn = this.hitTest(px, py);
      if (btn && btn.action === 'startReveal') {
        this.state = 'DRAWING';
        this.defineButtons();
      }
      return;
    }
    
    if (this.state === 'DRAWING') {
      const btn = this.hitTest(px, py);
      if (btn) {
        if (btn.action === 'setColor') this.drawingColor = btn.value;
        else if (btn.action === 'setThickness') this.drawingLineWidth = btn.value;
        else if (btn.action === 'clear') this.clearDrawing();
        else if (btn.action === 'done') {
          this.state = 'GUESSING';
          this.currentGuesserIndex = 0;
          this.roundGuessCount = 0;
          this.totalGuessAttempts = 0;
          this.defineButtons();
        }
        this.isDrawing = false;
        return;
      }
      
      // Üst barın altından itibaren çizime izin ver
      if (py > 105 && py < this.height - 140) {
        this.isDrawing = true;
        this.lastPoint = { x: px, y: py };
        this.drawCtx.strokeStyle = this.drawingColor;
        this.drawCtx.lineWidth = this.drawingLineWidth;
        this.drawCtx.lineCap = 'round';
        this.drawCtx.lineJoin = 'round';
        this.drawCtx.beginPath();
        this.drawCtx.moveTo(px, py);
      }
      
    } else if (this.state === 'GUESSING') {
      const btn = this.hitTest(px, py);
      if (btn && btn.action === 'correctGuess') {
        this.winner = { type: 'guesser', index: this.guessers[this.currentGuesserIndex] };
        this.state = 'RESULT';
        this.defineButtons();
      } else if (btn && btn.action === 'wrongGuess') {
        this.nextGuesserOrAttempt();
      }
      
    } else if (this.state === 'RESULT') {
      const btn = this.hitTest(px, py);
      if (btn && btn.action === 'replay') {
        this.resetGame();
      }
    }
  }

  onTouchMove(id, relX, relY) {
    const px = relX * this.width;
    const py = relY * this.height;
    if (this.state === 'DRAWING' && this.isDrawing) {
      if (py > 105 && py < this.height - 140) {
        this.drawCtx.lineTo(px, py);
        this.drawCtx.stroke();
        this.lastPoint = { x: px, y: py };
      }
    }
  }

  onTouchEnd(id, relX, relY) {
    if (this.state === 'DRAWING') {
      this.isDrawing = false;
    }
  }

  hitTest(x, y) {
    for (const btn of this.buttons) {
      if (btn.type === 'circle') {
        const dx = x - btn.cx;
        const dy = y - btn.cy;
        if (dx * dx + dy * dy <= btn.radius * btn.radius) {
          return btn;
        }
      } else if (btn.type === 'oval') {
        const cx = btn.x + btn.w / 2;
        const cy = btn.y + btn.h / 2;
        const rx = btn.w / 2;
        const ry = btn.h / 2;
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          return btn;
        }
      }
    }
    return null;
  }

  nextGuesserOrAttempt() {
    this.roundGuessCount++;
    this.totalGuessAttempts++;
    
    if (this.roundGuessCount >= 3) {
      this.roundGuessCount = 0;
      this.currentGuesserIndex++;
    }
    
    if (this.totalGuessAttempts >= this.maxGuessAttempts) {
      this.winner = { type: 'drawer', index: this.drawerIndex };
      this.state = 'RESULT';
    }
    
    this.defineButtons();
  }

  createFireworks() {
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: this.width / 2 + (Math.random() - 0.5) * 300,
        y: this.height / 2 + (Math.random() - 0.5) * 200,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.8) * 7 - 2,
        life: 1,
        color: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'][Math.floor(Math.random() * 6)],
        size: 3 + Math.random() * 6
      });
    }
  }

  drawCircleButton(btn) {
    if (btn.color) {
      this.ctx.beginPath();
      this.ctx.arc(btn.cx, btn.cy + 2, btn.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.arc(btn.cx, btn.cy, btn.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = btn.color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      
      if (this.drawingColor === btn.color && this.state === 'DRAWING') {
        this.ctx.beginPath();
        this.ctx.arc(btn.cx, btn.cy, btn.radius + 5, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
      }
    } else if (btn.thickness) {
      this.ctx.beginPath();
      this.ctx.arc(btn.cx, btn.cy + 2, btn.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.arc(btn.cx, btn.cy, btn.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fill();
      this.ctx.strokeStyle = '#999';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.moveTo(btn.cx - btn.radius * 0.6, btn.cy);
      this.ctx.lineTo(btn.cx + btn.radius * 0.6, btn.cy);
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = btn.thickness;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
      
      if (this.drawingLineWidth === btn.thickness && this.state === 'DRAWING') {
        this.ctx.beginPath();
        this.ctx.arc(btn.cx, btn.cy, btn.radius + 5, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
      }
    }
  }

  drawOvalButton(btn) {
    const cx = btn.x + btn.w / 2;
    const cy = btn.y + btn.h / 2;
    
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + 3, btn.w / 2, btn.h / 2, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy, btn.w / 2, btn.h / 2, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = btn.color || '#666666';
    this.ctx.fill();
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    
    const gradient = this.ctx.createRadialGradient(cx, cy - btn.h * 0.2, btn.w * 0.05, cx, cy, btn.w * 0.7);
    gradient.addColorStop(0, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    if (btn.text) {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const fontSize = btn.textSize || 18;
      this.ctx.font = `bold ${fontSize}px "Segoe UI"`;
      const lines = btn.text.split('\n');
      const lineHeight = fontSize + 6;
      const startY = cy - ((lines.length - 1) * lineHeight) / 2;
      for (let i = 0; i < lines.length; i++) {
        this.ctx.fillText(lines[i], cx, startY + i * lineHeight);
      }
    }
  }

  update() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // ---------- DRAWER_WARNING ----------
    if (this.state === 'DRAWER_WARNING') {
      this.ctx.fillStyle = '#808080';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      this.ctx.fillStyle = '#FF0000';
      this.ctx.font = '80px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('⚠️', this.width / 2, this.height / 2 - 140);
      
      this.ctx.fillStyle = '#000';
      this.ctx.font = 'bold 40px "Segoe UI"';
      this.ctx.fillText(`Oyuncu ${this.drawerIndex + 1} Çiziyor!`, this.width / 2, this.height / 2 - 50);
      
      this.ctx.fillStyle = '#FF0000';
      this.ctx.font = 'bold 22px "Segoe UI"';
      this.ctx.fillText('Diğer oyuncular ekrana bakmasın! 🙈', this.width / 2, this.height / 2 + 5);
      
      this.drawAllButtons();
      
    // ---------- DRAWING ----------
    } else if (this.state === 'DRAWING') {
      this.ctx.fillStyle = '#808080';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // Çizimi göster
      this.ctx.drawImage(this.drawCanvas, 0, 0);
      
      // ÜST BAR - DAHA BÜYÜK
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      this.ctx.fillRect(0, 0, this.width, 105);
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillRect(0, 105, this.width, 3);
      
      // Çizen bilgisi
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 20px "Segoe UI"';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`🎨 Oyuncu ${this.drawerIndex + 1} çiziyor`, 20, 40);
      
      // KELİME - ORTADA BÜYÜK
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 30px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`"${this.secretWord}"`, this.width / 2, 75);
      
      this.drawAllButtons();
      
    // ---------- GUESSING: Çizim hep gözüküyor ----------
    } else if (this.state === 'GUESSING') {
      // ÇİZİMİ HEP GÖSTER
      this.ctx.drawImage(this.drawCanvas, 0, 0);
      
      // Hafif gölge overlay
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      const guesserIdx = this.guessers[this.currentGuesserIndex];
      
      // Üst bar
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      this.ctx.fillRect(0, 0, this.width, 85);
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillRect(0, 85, this.width, 3);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 26px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`🤔 Sıra: Oyuncu ${guesserIdx + 1}`, this.width / 2, 40);
      
      // Kalan hak
      const remainingGuesses = 3 - this.roundGuessCount;
      let stars = '';
      for (let s = 0; s < remainingGuesses; s++) stars += '⭐';
      for (let s = remainingGuesses; s < 3; s++) stars += '☆';
      
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 20px "Segoe UI"';
      this.ctx.fillText(`Kalan: ${stars}`, this.width / 2, 70);
      
      // Alt bilgi
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(0, this.height - 160, this.width, 50);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '18px "Segoe UI"';
      this.ctx.fillText('Tahminini söyle, sonra butona bas', this.width / 2, this.height - 135);
      
      this.drawAllButtons();
      
    // ---------- RESULT ----------
    } else if (this.state === 'RESULT') {
      this.ctx.fillStyle = '#808080';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      if (this.particles.length === 0) this.createFireworks();
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life -= 0.015;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.globalAlpha = 1;
      
      const isDrawerWin = this.winner.type === 'drawer';
      
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      this.ctx.fillRect(this.width / 2 - 220, this.height / 2 - 130, 440, 220);
      this.ctx.strokeStyle = '#FFD700';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(this.width / 2 - 220, this.height / 2 - 130, 440, 220);
      
      this.ctx.fillStyle = isDrawerWin ? '#FFD700' : '#00FF00';
      this.ctx.font = 'bold 38px "Segoe UI"';
      this.ctx.textAlign = 'center';
      
      if (isDrawerWin) {
        this.ctx.fillText(`🏆 Oyuncu ${this.winner.index + 1}`, this.width / 2, this.height / 2 - 55);
        this.ctx.fillText(`(Çizen) Kazandı!`, this.width / 2, this.height / 2 - 5);
      } else {
        this.ctx.fillText(`🎉 Oyuncu ${this.winner.index + 1}`, this.width / 2, this.height / 2 - 55);
        this.ctx.fillText(`Doğru Bildi!`, this.width / 2, this.height / 2 - 5);
      }
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 26px "Segoe UI"';
      this.ctx.fillText(`Kelime: "${this.secretWord}"`, this.width / 2, this.height / 2 + 55);
      
      this.drawAllButtons();
    }

    requestAnimationFrame(() => this.update());
  }

  drawAllButtons() {
    for (const btn of this.buttons) {
      if (btn.type === 'circle') {
        this.drawCircleButton(btn);
      } else if (btn.type === 'oval') {
        this.drawOvalButton(btn);
      }
    }
  }
}