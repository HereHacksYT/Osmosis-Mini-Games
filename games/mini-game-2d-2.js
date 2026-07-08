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
    this.guesserRemainingGuesses = {};
    this.secretWord = '';
    this.winner = null;
    this.totalAttemptsUsed = 0;
    this.maxTotalAttempts = 0;

    this.drawCanvas = document.createElement('canvas');
    this.drawCtx = this.drawCanvas.getContext('2d');
    this.drawingColor = '#FF0000';
    this.drawingLineWidth = 8;
    this.isDrawing = false;
    this.lastPoint = null;

    this.buttons = [];
    this.particles = [];
    this.colorPanelOpen = false;
    this.colorGrid = [];

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

    // Renk paleti - tüm tonlar
    this.colorPalette = [
      '#FF0000', '#FF1A1A', '#FF3333', '#FF4D4D', '#FF6666', '#FF8080', '#FF9999', '#CC0000', '#990000',
      '#FF4400', '#FF5500', '#FF6600', '#FF7700', '#FF8800', '#FF9900', '#FFAA00', '#FFBB00', '#CC5500',
      '#FFD700', '#FFDD00', '#FFEE00', '#FFFF00', '#FFE600', '#FFCC00', '#FFB800', '#CCA800', '#997F00',
      '#CCFF00', '#99FF00', '#66FF00', '#33FF00', '#00FF00', '#00E600', '#00CC00', '#009900', '#006600',
      '#00FF33', '#00FF66', '#00FF99', '#00FFCC', '#00FFFF', '#00E6E6', '#00CCCC', '#009999', '#006666',
      '#00CCFF', '#0099FF', '#0066FF', '#0033FF', '#0000FF', '#0000E6', '#0000CC', '#000099', '#000066',
      '#3300FF', '#6600FF', '#9900FF', '#CC00FF', '#FF00FF', '#E600E6', '#CC00CC', '#990099', '#660066',
      '#FF00CC', '#FF0099', '#FF0066', '#FF0033', '#FF0080', '#E60060', '#CC0040', '#990030', '#660020',
      '#FFFFFF', '#E6E6E6', '#CCCCCC', '#B3B3B3', '#999999', '#808080', '#666666', '#4D4D4D', '#333333',
      '#000000', '#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F5DEB3', '#D2691E', '#FF6347', '#FF69B4'
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
    
    const allGuessers = [];
    for (let i = 0; i < this.totalPlayers; i++) {
      if (i !== this.drawerIndex) allGuessers.push(i);
    }
    this.guessers = this.shuffleArray(allGuessers);
    
    this.guesserRemainingGuesses = {};
    for (const g of this.guessers) {
      this.guesserRemainingGuesses[g] = 3;
    }
    
    this.currentGuesserIndex = 0;
    this.totalAttemptsUsed = 0;
    this.maxTotalAttempts = this.guessers.length * 3;
    
    this.secretWord = this.wordPool[Math.floor(Math.random() * this.wordPool.length)];
    this.winner = null;
    this.state = 'DRAWER_WARNING';
    this.colorPanelOpen = false;
    this.clearDrawing();
    this.particles = [];
    this.defineButtons();
  }

  clearDrawing() {
    this.drawCtx.clearRect(0, 0, this.width, this.height);
    this.drawCtx.fillStyle = '#CCCCCC';
    this.drawCtx.fillRect(0, 0, this.width, this.height);
  }

  // Renk paneli grid hesaplama
  buildColorGrid() {
    this.colorGrid = [];
    const cols = 9;
    const panelX = 20;
    const panelY = 120;
    const panelW = this.width - 40;
    const panelH = this.height - 280;
    const cellW = panelW / cols;
    const cellH = cellW;
    const rows = Math.floor(panelH / cellH);
    
    for (let i = 0; i < Math.min(this.colorPalette.length, rows * cols); i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      this.colorGrid.push({
        x: panelX + col * cellW + 2,
        y: panelY + row * cellH + 2,
        w: cellW - 4,
        h: cellH - 4,
        color: this.colorPalette[i]
      });
    }
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
      if (this.colorPanelOpen) {
        // Panel açıkken sadece kapatma butonu var (üstte)
        // Renk seçimi colorGrid üzerinden yapılır
        this.buildColorGrid();
      } else {
        // Normal çizim butonları
        
        // Hızlı renkler (6 renk)
        const quickColors = ['#FF0000', '#0000FF', '#FFD700', '#FF00FF', '#00FF00', '#FF6600'];
        const btnRadius = 22;
        const startX = 40;
        const y = 130;
        
        for (let i = 0; i < quickColors.length; i++) {
          this.buttons.push({
            type: 'circle',
            id: 'quickColor_' + i,
            cx: startX + i * (btnRadius * 2 + 15),
            cy: y,
            radius: btnRadius,
            color: quickColors[i],
            action: 'setColor',
            value: quickColors[i]
          });
        }
        
        // RENK SEÇ BUTONU
        this.buttons.push({
          type: 'oval',
          id: 'colorPanelBtn',
          x: startX + 6 * (btnRadius * 2 + 15) + 10,
          y: y - 12,
          w: 140,
          h: 50,
          radius: 25,
          color: '#8B00FF',
          text: '🎨 Renk Seç',
          textSize: 16,
          action: 'openColorPanel'
        });
        
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
          y: 130,
          w: 140,
          h: 50,
          radius: 25,
          color: '#FF3333',
          text: '🧹 Temizle',
          action: 'clear'
        });
      }
      
      // Bitti butonu her zaman altta
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

  getCurrentGuesserRemaining() {
    const guesser = this.guessers[this.currentGuesserIndex];
    return this.guesserRemainingGuesses[guesser] || 0;
  }

  findNextValidGuesser() {
    let checked = 0;
    while (checked < this.guessers.length) {
      this.currentGuesserIndex++;
      if (this.currentGuesserIndex >= this.guessers.length) {
        this.currentGuesserIndex = 0;
      }
      if (this.getCurrentGuesserRemaining() > 0) {
        return true;
      }
      checked++;
    }
    return false;
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
      // Panel açıksa renk seçimi kontrolü
      if (this.colorPanelOpen) {
        // Panel dışı tıklama = kapat
        const panelBounds = {
          x: 20,
          y: 120,
          w: this.width - 40,
          h: this.height - 280
        };
        
        if (px < panelBounds.x || px > panelBounds.x + panelBounds.w ||
            py < panelBounds.y || py > panelBounds.y + panelBounds.h) {
          this.colorPanelOpen = false;
          this.defineButtons();
          return;
        }
        
        // Renk grid hücresi kontrolü
        for (const cell of this.colorGrid) {
          if (px >= cell.x && px <= cell.x + cell.w &&
              py >= cell.y && py <= cell.y + cell.h) {
            this.drawingColor = cell.color;
            this.colorPanelOpen = false;
            this.defineButtons();
            return;
          }
        }
        return;
      }
      
      // Normal buton kontrolü
      const btn = this.hitTest(px, py);
      if (btn) {
        if (btn.action === 'setColor') this.drawingColor = btn.value;
        else if (btn.action === 'setThickness') this.drawingLineWidth = btn.value;
        else if (btn.action === 'clear') this.clearDrawing();
        else if (btn.action === 'openColorPanel') {
          this.colorPanelOpen = true;
          this.defineButtons();
        }
        else if (btn.action === 'done') {
          this.state = 'GUESSING';
          this.currentGuesserIndex = 0;
          if (this.getCurrentGuesserRemaining() === 0) {
            this.findNextValidGuesser();
          }
          this.defineButtons();
        }
        this.isDrawing = false;
        return;
      }
      
      // Çizim (panel kapalıysa ve üst/alt bar dışında)
      if (!this.colorPanelOpen && py > 105 && py < this.height - 140) {
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
        this.useGuessAndNext();
      }
      
    } else if (this.state === 'RESULT') {
      const btn = this.hitTest(px, py);
      if (btn && btn.action === 'replay') {
        this.resetGame();
      }
    }
  }

  useGuessAndNext() {
    const guesser = this.guessers[this.currentGuesserIndex];
    this.guesserRemainingGuesses[guesser]--;
    this.totalAttemptsUsed++;

    if (this.getCurrentGuesserRemaining() <= 0) {
      const found = this.findNextValidGuesser();
      if (!found) {
        this.winner = { type: 'drawer', index: this.drawerIndex };
        this.state = 'RESULT';
      }
    } else {
      const found = this.findNextValidGuesser();
      if (!found) {
        this.winner = { type: 'drawer', index: this.drawerIndex };
        this.state = 'RESULT';
      }
    }

    this.defineButtons();
  }

  onTouchMove(id, relX, relY) {
    const px = relX * this.width;
    const py = relY * this.height;
    if (this.state === 'DRAWING' && this.isDrawing && !this.colorPanelOpen) {
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

  // Renk panelini çiz
  drawColorPanel() {
    // Yarı saydam arka plan
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Panel alanı
    const panelX = 20;
    const panelY = 120;
    const panelW = this.width - 40;
    const panelH = this.height - 280;
    
    // Panel arka planı
    this.ctx.fillStyle = '#2a2a2e';
    this.ctx.fillRect(panelX - 5, panelY - 5, panelW + 10, panelH + 10);
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(panelX - 5, panelY - 5, panelW + 10, panelH + 10);
    
    // Başlık
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 22px "Segoe UI"';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🎨 Renk Seç (Tıklayınca kapanır)', this.width / 2, panelY - 15);
    
    // Grid hücrelerini çiz
    for (const cell of this.colorGrid) {
      this.ctx.fillStyle = cell.color;
      this.ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
      this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);
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
      this.ctx.drawImage(this.drawCanvas, 0, 0);
      
      // Üst bar
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      this.ctx.fillRect(0, 0, this.width, 105);
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillRect(0, 105, this.width, 3);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 20px "Segoe UI"';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`🎨 Oyuncu ${this.drawerIndex + 1} çiziyor`, 20, 40);
      
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 30px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`"${this.secretWord}"`, this.width / 2, 75);
      
      // Aktif renk göstergesi (kelimenin yanında)
      this.ctx.beginPath();
      this.ctx.arc(this.width / 2 - 150, 62, 12, 0, Math.PI * 2);
      this.ctx.fillStyle = this.drawingColor;
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      this.drawAllButtons();
      
      // Panel açıksa en üstte çiz
      if (this.colorPanelOpen) {
        this.drawColorPanel();
        // Sadece Bitti butonunu göster
        for (const btn of this.buttons) {
          if (btn.id === 'done') this.drawOvalButton(btn);
        }
      }
      
    // ---------- GUESSING ----------
    } else if (this.state === 'GUESSING') {
      this.ctx.drawImage(this.drawCanvas, 0, 0);
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      const guesserIdx = this.guessers[this.currentGuesserIndex];
      const remaining = this.getCurrentGuesserRemaining();
      
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      this.ctx.fillRect(0, 0, this.width, 85);
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillRect(0, 85, this.width, 3);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 26px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`🤔 Sıra: Oyuncu ${guesserIdx + 1}`, this.width / 2, 40);
      
      let stars = '';
      for (let s = 0; s < remaining; s++) stars += '⭐';
      for (let s = remaining; s < 3; s++) stars += '☆';
      
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 20px "Segoe UI"';
      this.ctx.fillText(`Bu oyuncunun kalan hakkı: ${stars}`, this.width / 2, 70);
      
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
    if (this.colorPanelOpen) return; // Panel açıkken butonları çizme
    for (const btn of this.buttons) {
      if (btn.type === 'circle') {
        this.drawCircleButton(btn);
      } else if (btn.type === 'oval') {
        this.drawOvalButton(btn);
      }
    }
  }
}