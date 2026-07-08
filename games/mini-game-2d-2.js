export class SecretCanvas {
  constructor(canvas, playerIndex, totalPlayers) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.totalPlayers = totalPlayers; // 2-4
    this.playerIndex = playerIndex;   // her zaman 0 (tek canvas)

    // Oyun durumu
    this.state = 'DRAWING'; // DRAWING, GUESSING, RESULT
    this.drawerIndex = -1;
    this.currentGuesserIndex = 0;
    this.guessers = [];       // çizer dışındaki oyuncu indeksleri
    this.secretWord = '';
    this.winner = null;       // kazanan: { type: 'drawer' veya 'guesser', index: ... }

    // Çizim canvas'ı (offscreen)
    this.drawCanvas = document.createElement('canvas');
    this.drawCtx = this.drawCanvas.getContext('2d');
    this.drawingColor = '#ff006e'; // varsayılan neon pembe
    this.drawingLineWidth = 6;
    this.isDrawing = false;
    this.lastPoint = null;

    // Buton tanımlamaları (canvas üzerinde sanal butonlar)
    this.buttons = []; // her state için yeniden tanımlanacak

    // Partikül sistemi (sonuç ekranı için)
    this.particles = [];

    // Kelime havuzu (50 kelime)
    this.wordPool = [
      'Astronot', 'Helikopter', 'Denizaltı', 'Gitar', 'Kamp Ateşi',
      'Hamburger', 'Bukalemun', 'Hazine Sandığı', 'Dinozor', 'Uzay Gemisi',
      'Robot', 'Korsan', 'Şato', 'Yarış Arabası', 'Palyaço',
      'Sihirbaz', 'Deniz Kızı', 'Yanardağ', 'İtfaiyeci', 'Karavan',
      'Lunapark', 'Rüzgar Türbini', 'Deniz Feneri', 'Sörfçü', 'Kaykaycı',
      'Buz Hokeyi', 'Akordeon', 'Çikolata', 'Papağan', 'Kaktüs',
      'Dalgıç', 'Trambolin', 'Kum Saati', 'Pusula', 'Teleskop',
      'Satranç', 'Bowling', 'Havai Fişek', 'Uçurtma', 'Kar Küresi',
      'Bumerang', 'Yo-Yo', 'Daktilo', 'Plakçalar', 'Paten',
      'Kaykay', 'Sualtı', 'Kumsal', 'Orman', 'Gökdelen'
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

  // Platform tarafından çağrılan start
  start() {
    this.resetGame();
    this.update();
  }

  resetGame() {
    // Rastgele çizer seç
    this.drawerIndex = Math.floor(Math.random() * this.totalPlayers);
    // Tahminciler listesi
    this.guessers = [];
    for (let i = 0; i < this.totalPlayers; i++) {
      if (i !== this.drawerIndex) this.guessers.push(i);
    }
    this.currentGuesserIndex = 0;
    // Rastgele kelime
    this.secretWord = this.wordPool[Math.floor(Math.random() * this.wordPool.length)];
    this.winner = null;
    this.state = 'DRAWING';
    this.clearDrawing();
    this.particles = [];
    this.defineButtons();
  }

  clearDrawing() {
    this.drawCtx.clearRect(0, 0, this.width, this.height);
    // Arka planı hafif saydam siyah yap (çizim için kontrast)
    this.drawCtx.fillStyle = 'rgba(20, 20, 40, 0.9)';
    this.drawCtx.fillRect(0, 0, this.width, this.height);
  }

  // Her state için buton konumlarını ve metinlerini ayarla
  defineButtons() {
    this.buttons = [];
    if (this.state === 'DRAWING') {
      // Renk paleti (üst çubuk)
      const colors = ['#ff006e', '#00f5d4', '#fee440', '#9b5de5', '#f15bb5', '#00bbf9'];
      const btnSize = Math.min(40, this.width / 12);
      const startX = 20;
      const y = 20;
      for (let i = 0; i < colors.length; i++) {
        this.buttons.push({
          id: 'color_' + i,
          x: startX + i * (btnSize + 10),
          y: y,
          w: btnSize,
          h: btnSize,
          color: colors[i],
          action: 'setColor',
          value: colors[i]
        });
      }
      // Fırça kalınlıkları
      const thicknesses = [3, 6, 10, 16];
      const thickY = y + btnSize + 15;
      for (let i = 0; i < thicknesses.length; i++) {
        this.buttons.push({
          id: 'thick_' + i,
          x: startX + i * (btnSize + 10),
          y: thickY,
          w: btnSize,
          h: btnSize,
          thickness: thicknesses[i],
          action: 'setThickness',
          value: thicknesses[i]
        });
      }
      // Temizle ve Bitti butonları
      this.buttons.push({
        id: 'clear',
        x: this.width - 140,
        y: 30,
        w: 120,
        h: 50,
        text: '🧹 Temizle',
        action: 'clear'
      });
      this.buttons.push({
        id: 'done',
        x: this.width / 2 - 80,
        y: this.height - 100,
        w: 160,
        h: 60,
        text: 'BİTTİ! 🚀',
        action: 'done'
      });
    } else if (this.state === 'GUESSING') {
      const guesserIdx = this.guessers[this.currentGuesserIndex];
      // "Çizimi Gör" butonu (basılı tut)
      this.buttons.push({
        id: 'showDrawing',
        x: this.width / 2 - 100,
        y: this.height / 2 - 40,
        w: 200,
        h: 80,
        text: '👁️ Çizimi Gör\n(basılı tut)',
        action: 'showDrawing',
        hold: true
      });
      // Doğru / Bilemedi butonları
      this.buttons.push({
        id: 'correct',
        x: this.width / 2 - 160,
        y: this.height - 120,
        w: 140,
        h: 50,
        text: '✅ Doğru Bildi',
        action: 'correctGuess'
      });
      this.buttons.push({
        id: 'wrong',
        x: this.width / 2 + 20,
        y: this.height - 120,
        w: 140,
        h: 50,
        text: '❌ Bilemedi',
        action: 'wrongGuess'
      });
    } else if (this.state === 'RESULT') {
      this.buttons.push({
        id: 'replay',
        x: this.width / 2 - 80,
        y: this.height - 120,
        w: 160,
        h: 50,
        text: '🔄 Yeniden Oyna',
        action: 'replay'
      });
    }
  }

  // Touch event handlers (platformdan gelen normalize 0-1 koordinatlar)
  onTouchStart(id, relX, relY) {
    const px = relX * this.width;
    const py = relY * this.height;
    if (this.state === 'DRAWING') {
      // Buton kontrolü
      const btn = this.hitTest(px, py);
      if (btn) {
        if (btn.action === 'setColor') this.drawingColor = btn.value;
        else if (btn.action === 'setThickness') this.drawingLineWidth = btn.value;
        else if (btn.action === 'clear') this.clearDrawing();
        else if (btn.action === 'done') {
          this.state = 'GUESSING';
          this.currentGuesserIndex = 0;
          this.defineButtons();
        }
        this.isDrawing = false;
        return;
      }
      // Çizim başlangıcı
      this.isDrawing = true;
      this.lastPoint = { x: px, y: py };
      this.drawCtx.strokeStyle = this.drawingColor;
      this.drawCtx.lineWidth = this.drawingLineWidth;
      this.drawCtx.lineCap = 'round';
      this.drawCtx.lineJoin = 'round';
      this.drawCtx.beginPath();
      this.drawCtx.moveTo(px, py);
    } else if (this.state === 'GUESSING') {
      const btn = this.hitTest(px, py);
      if (btn && btn.id === 'showDrawing') {
        this.showDrawing = true; // basılı tutma başladı
      } else if (btn && btn.action === 'correctGuess') {
        // Doğru tahmin
        this.winner = { type: 'guesser', index: this.guessers[this.currentGuesserIndex] };
        this.state = 'RESULT';
        this.defineButtons();
      } else if (btn && btn.action === 'wrongGuess') {
        this.nextGuesser();
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
      this.drawCtx.lineTo(px, py);
      this.drawCtx.stroke();
      this.lastPoint = { x: px, y: py };
    }
  }

  onTouchEnd(id, relX, relY) {
    if (this.state === 'DRAWING') {
      this.isDrawing = false;
    } else if (this.state === 'GUESSING') {
      this.showDrawing = false; // parmak kalktı, çizimi gizle
    }
  }

  hitTest(x, y) {
    for (const btn of this.buttons) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        return btn;
      }
    }
    return null;
  }

  nextGuesser() {
    this.currentGuesserIndex++;
    if (this.currentGuesserIndex >= this.guessers.length) {
      // Kimse bilemedi -> çizer kazandı
      this.winner = { type: 'drawer', index: this.drawerIndex };
      this.state = 'RESULT';
    }
    this.defineButtons();
  }

  // Havai fişek partikülleri
  createFireworks() {
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: this.width / 2 + (Math.random() - 0.5) * 200,
        y: this.height / 2 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.8) * 5 - 2,
        life: 1,
        color: `hsl(${Math.random() * 360}, 100%, 60%)`,
        size: 3 + Math.random() * 5
      });
    }
  }

  update() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.state === 'DRAWING') {
      // Arka plan
      this.ctx.fillStyle = '#0a0a1a';
      this.ctx.fillRect(0, 0, this.width, this.height);

      // Çizim canvas'ını ana canvas'a kopyala (saydamlıkla)
      this.ctx.globalAlpha = 0.85;
      this.ctx.drawImage(this.drawCanvas, 0, 0);
      this.ctx.globalAlpha = 1;

      // Butonları çiz
      this.drawButtons();
      // Çizer bilgisi ve kelime
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 24px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`Oyuncu ${this.drawerIndex + 1} çiziyor`, this.width / 2, this.height / 2 - 120);
      this.ctx.font = 'bold 32px "Segoe UI"';
      this.ctx.fillStyle = '#fee440';
      this.ctx.fillText(`"${this.secretWord}"`, this.width / 2, this.height / 2 - 70);

    } else if (this.state === 'GUESSING') {
      this.ctx.fillStyle = '#0a0a1a';
      this.ctx.fillRect(0, 0, this.width, this.height);
      const guesserIdx = this.guessers[this.currentGuesserIndex];
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 28px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`Sıra: Oyuncu ${guesserIdx + 1}`, this.width / 2, 60);

      // Eğer basılı tutuluyorsa çizimi göster
      if (this.showDrawing) {
        this.ctx.drawImage(this.drawCanvas, 0, 0);
      } else {
        // Gizli mesaj
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '24px "Segoe UI"';
        this.ctx.fillText('"Çizimi Gör" butonuna basılı tut', this.width / 2, this.height / 2 - 100);
      }

      this.drawButtons();

    } else if (this.state === 'RESULT') {
      this.ctx.fillStyle = '#0a0a1a';
      this.ctx.fillRect(0, 0, this.width, this.height);

      // Partikül efekti
      if (this.particles.length === 0) this.createFireworks();
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life -= 0.02;
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

      // Kazanan metni
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 40px "Segoe UI"';
      this.ctx.textAlign = 'center';
      if (this.winner.type === 'drawer') {
        this.ctx.fillText(`🏆 Oyuncu ${this.winner.index + 1} (Çizen) Kazandı!`, this.width / 2, this.height / 2 - 40);
      } else {
        this.ctx.fillText(`🎉 Oyuncu ${this.winner.index + 1} Doğru Bildi!`, this.width / 2, this.height / 2 - 40);
      }
      this.ctx.font = '24px "Segoe UI"';
      this.ctx.fillText(`Kelime: "${this.secretWord}"`, this.width / 2, this.height / 2 + 20);

      this.drawButtons();
    }

    requestAnimationFrame(() => this.update());
  }

  drawButtons() {
    for (const btn of this.buttons) {
      if (btn.color) {
        // Renk seçim butonu
        this.ctx.fillStyle = btn.color;
        this.ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        if (this.drawingColor === btn.color && this.state === 'DRAWING') {
          // Seçili olduğunu belirt
          this.ctx.strokeStyle = '#000';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        }
      } else if (btn.thickness) {
        // Kalınlık butonu
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = btn.thickness;
        this.ctx.moveTo(btn.x + 10, btn.y + btn.h / 2);
        this.ctx.lineTo(btn.x + btn.w - 10, btn.y + btn.h / 2);
        this.ctx.stroke();
        if (this.drawingLineWidth === btn.thickness && this.state === 'DRAWING') {
          this.ctx.strokeStyle = '#fee440';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        }
      } else if (btn.text) {
        // Metinli buton
        this.ctx.fillStyle = '#0f3460';
        if (btn.id === 'done') this.ctx.fillStyle = '#e94560';
        if (btn.id === 'correct') this.ctx.fillStyle = '#2ecc71';
        if (btn.id === 'wrong') this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 18px "Segoe UI"';
        this.ctx.textAlign = 'center';
        // Çok satırlı metin için split
        const lines = btn.text.split('\n');
        const lineHeight = 22;
        const startY = btn.y + btn.h / 2 - ((lines.length - 1) * lineHeight) / 2;
        for (let i = 0; i < lines.length; i++) {
          this.ctx.fillText(lines[i], btn.x + btn.w / 2, startY + i * lineHeight + 6);
        }
      }
    }
  }
}