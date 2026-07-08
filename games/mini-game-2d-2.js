export class SecretCanvas {
  constructor(canvas, playerIndex, totalPlayers) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.totalPlayers = totalPlayers;
    this.playerIndex = playerIndex;

    // Oyun durumu
    this.state = 'DRAWER_WARNING';
    this.drawerIndex = -1;
    this.currentGuesserIndex = 0;
    this.guessers = [];
    this.secretWord = '';
    this.winner = null;
    this.roundGuessCount = 0;
    this.totalGuessAttempts = 0;
    this.maxGuessAttempts = 0;

    // Çizim canvas'ı (offscreen)
    this.drawCanvas = document.createElement('canvas');
    this.drawCtx = this.drawCanvas.getContext('2d');
    this.drawingColor = '#FF0000'; // Saf kırmızı
    this.drawingLineWidth = 8;
    this.isDrawing = false;
    this.lastPoint = null;

    // UI elementleri
    this.buttons = [];
    this.particles = [];

    // Kelime havuzu
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

  start() {
    this.resetGame();
    this.update();
  }

  resetGame() {
    this.drawerIndex = Math.floor(Math.random() * this.totalPlayers);
    
    this.guessers = [];
    for (let i = 0; i < this.totalPlayers; i++) {
      if (i !== this.drawerIndex) this.guessers.push(i);
    }
    
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
    this.drawCtx.fillStyle = '#CCCCCC'; // Açık gri çizim alanı
    this.drawCtx.fillRect(0, 0, this.width, this.height);
  }

  defineButtons() {
    this.buttons = [];
    
    if (this.state === 'DRAWER_WARNING') {
      // BAŞLA butonu
      this.buttons.push({
        type: 'oval',
        id: 'startReveal',
        x: this.width / 2 - 120,
        y: this.height / 2 + 40,
        w: 240,
        h: 80,
        radius: 40,
        color: '#00CC00', // Saf yeşil
        text: '🚀 BAŞLA',
        textSize: 28,
        action: 'startReveal'
      });
      
    } else if (this.state === 'DRAWING') {
      // Renk paleti - saf parlak renkler
      const colors = ['#FF0000', '#0000FF', '#FFD700', '#FF00FF', '#00FF00', '#FF6600'];
      const btnRadius = 22;
      const startX = 40;
      const y = 45;
      
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
      
      // Fırça kalınlıkları
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
      
      // Temizle butonu
      this.buttons.push({
        type: 'oval',
        id: 'clear',
        x: this.width - 160,
        y: 25,
        w: 140,
        h: 50,
        radius: 25,
        color: '#FF3333',
        text: '🧹 Temizle',
        action: 'clear'
      });
      
      // Bitti butonu
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
      // Çizimi Gör butonu
      this.buttons.push({
        type: 'oval',
        id: 'showDrawing',
        x: this.width / 2 - 120,
        y: this.height / 2 - 50,
        w: 240,
        h: 90,
        radius: 45,
        color: '#FF0000',
        text: '👁️ Çizimi Gör\n(basılı tut)',
        textSize: 20,
        action: 'showDrawing',
        hold: true
      });
      
      // Doğru bildi
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
      
      // Bilemedi
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
      // Yeniden oyna
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
        // Direkt çizime geç, kelime üstte sabit duracak
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
      
      // Sadece buton alanı dışında çizime izin ver
      // Üst bar (100px) ve alt buton alanı hariç
      if (py > 100 && py < this.height - 140) {
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
      if (btn && btn.id === 'showDrawing') {
        this.showDrawing = true;
      } else if (btn && btn.action === 'correctGuess') {
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
      // Çizimi sınırla
      if (py > 100 && py < this.height - 140) {
        this.drawCtx.lineTo(px, py);
        this.drawCtx.stroke();
        this.lastPoint = { x: px, y: py };
      }
    }
  }

  onTouchEnd(id, relX, relY) {
    if (this.state === 'DRAWING') {
      this.isDrawing = false;
    } else if (this.state === 'GUESSING') {
      this.showDrawing = false;
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
      // Gölge
      this.ctx.beginPath();
      this.ctx.arc(btn.cx, btn.cy + 2, btn.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
      this.ctx.fill();
      
      // Ana buton
      this.ctx.beginPath();
      this.ctx.arc(btn.cx, btn.cy, btn.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = btn.color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      
      // Seçili göstergesi
      if (this.drawingColor === btn.color && this.state === 'DRAWING') {
        this.ctx.beginPath();
        this.ctx.arc(btn.cx, btn.cy, btn.radius + 5, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
      }
    } else if (btn.thickness) {
      // Gölge
      this.ctx.beginPath();
      this.ctx.arc(btn.cx, btn.cy + 2, btn.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
      this.ctx.fill();
      
      // Ana buton
      this.ctx.beginPath();
      this.ctx.arc(btn.cx, btn.cy, btn.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fill();
      this.ctx.strokeStyle = '#999';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Kalınlık çizgisi
      this.ctx.beginPath();
      this.ctx.moveTo(btn.cx - btn.radius * 0.6, btn.cy);
      this.ctx.lineTo(btn.cx + btn.radius * 0.6, btn.cy);
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = btn.thickness;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
      
      // Seçili göstergesi
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
    
    // Gölge
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + 3, btn.w / 2, btn.h / 2, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.fill();
    
    // Ana buton
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy, btn.w / 2, btn.h / 2, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = btn.color || '#666666';
    this.ctx.fill();
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    
    // Parlama efekti
    const gradient = this.ctx.createRadialGradient(cx, cy - btn.h * 0.2, btn.w * 0.05, cx, cy, btn.w * 0.7);
    gradient.addColorStop(0, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // Metin
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
      this.ctx.fillStyle = '#808080'; // Gri arka plan
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // Uyarı
      this.ctx.fillStyle = '#FF0000';
      this.ctx.font = '80px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('⚠️', this.width / 2, this.height / 2 - 120);
      
      this.ctx.fillStyle = '#000';
      this.ctx.font = 'bold 42px "Segoe UI"';
      this.ctx.fillText(`Oyuncu ${this.drawerIndex + 1} Çiziyor!`, this.width / 2, this.height / 2 - 40);
      
      this.ctx.fillStyle = '#FF0000';
      this.ctx.font = 'bold 24px "Segoe UI"';
      this.ctx.fillText('Diğer oyuncular ekrana bakmasın! 🙈', this.width / 2, this.height / 2 + 20);
      
      this.drawAllButtons();
      
    // ---------- DRAWING ----------
    } else if (this.state === 'DRAWING') {
      // Gri arka plan
      this.ctx.fillStyle = '#808080';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // Çizim alanı (üst bar ve alt butonlar dışında)
      this.ctx.drawImage(this.drawCanvas, 0, 0);
      
      // ÜST BİLGİ BAR - Kelime burada sabit
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      this.ctx.fillRect(0, 0, this.width, 100);
      
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 22px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`🎨 Oyuncu ${this.drawerIndex + 1} çiziyor`, this.width / 2, 35);
      
      // Kelime - sağ üst köşede küçük
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 20px "Segoe UI"';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(`Kelime: "${this.secretWord}"`, this.width - 20, 70);
      
      // Alt çizgi
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillRect(0, 100, this.width, 2);
      
      // Butonları çiz
      this.drawAllButtons();
      
      // Aktif renk göstergesi (sol alt)
      this.ctx.beginPath();
      this.ctx.arc(35, this.height - 35, 15, 0, Math.PI * 2);
      this.ctx.fillStyle = this.drawingColor;
      this.ctx.fill();
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
    // ---------- GUESSING ----------
    } else if (this.state === 'GUESSING') {
      this.ctx.fillStyle = '#808080';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      const guesserIdx = this.guessers[this.currentGuesserIndex];
      
      // Üst bar
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      this.ctx.fillRect(0, 0, this.width, 80);
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillRect(0, 80, this.width, 2);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 24px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`🤔 Sıra: Oyuncu ${guesserIdx + 1}`, this.width / 2, 50);
      
      // Kalan hak
      const remainingGuesses = 3 - this.roundGuessCount;
      let stars = '';
      for (let s = 0; s < remainingGuesses; s++) stars += '⭐';
      for (let s = remainingGuesses; s < 3; s++) stars += '☆';
      
      this.ctx.fillStyle = '#000';
      this.ctx.font = 'bold 22px "Segoe UI"';
      this.ctx.fillText(`Kalan hak: ${stars}`, this.width / 2, 120);
      
      // Çizimi göster
      if (this.showDrawing) {
        this.ctx.drawImage(this.drawCanvas, 0, 0);
        this.ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
        this.ctx.fillRect(0, 0, this.width, this.height);
      } else {
        this.ctx.fillStyle = '#000';
        this.ctx.font = '24px "Segoe UI"';
        this.ctx.fillText('Çizimi görmek için butona basılı tutun 👆', this.width / 2, this.height / 2 - 100);
      }
      
      this.drawAllButtons();
      
    // ---------- RESULT ----------
    } else if (this.state === 'RESULT') {
      this.ctx.fillStyle = '#808080';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // Havai fişek
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
      
      // Kazanan
      const isDrawerWin = this.winner.type === 'drawer';
      
      // Arka plan kutusu
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(this.width / 2 - 200, this.height / 2 - 120, 400, 200);
      this.ctx.strokeStyle = '#FFD700';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(this.width / 2 - 200, this.height / 2 - 120, 400, 200);
      
      this.ctx.fillStyle = isDrawerWin ? '#FFD700' : '#00FF00';
      this.ctx.font = 'bold 38px "Segoe UI"';
      this.ctx.textAlign = 'center';
      
      if (isDrawerWin) {
        this.ctx.fillText(`🏆 Oyuncu ${this.winner.index + 1}`, this.width / 2, this.height / 2 - 50);
        this.ctx.fillText(`(Çizen) Kazandı!`, this.width / 2, this.height / 2);
      } else {
        this.ctx.fillText(`🎉 Oyuncu ${this.winner.index + 1}`, this.width / 2, this.height / 2 - 50);
        this.ctx.fillText(`Doğru Bildi!`, this.width / 2, this.height / 2);
      }
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 24px "Segoe UI"';
      this.ctx.fillText(`Kelime: "${this.secretWord}"`, this.width / 2, this.height / 2 + 60);
      
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