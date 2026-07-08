export class SecretCanvas {
  constructor(canvas, playerIndex, totalPlayers) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.totalPlayers = totalPlayers;
    this.playerIndex = playerIndex;

    // Oyun durumu
    this.state = 'DRAWER_REVEAL'; // DRAWER_REVEAL, DRAWING, GUESSING, RESULT
    this.drawerIndex = -1;
    this.currentGuesserIndex = 0;
    this.guessers = [];
    this.secretWord = '';
    this.winner = null;
    this.roundGuessCount = 0;      // Her tahminci için 3 hak
    this.totalGuessAttempts = 0;   // Toplam tahmin denemesi
    this.maxGuessAttempts = 0;     // Toplam maksimum tahmin (tahminci sayısı × 3)

    // Çizim canvas'ı (offscreen)
    this.drawCanvas = document.createElement('canvas');
    this.drawCtx = this.drawCanvas.getContext('2d');
    this.drawingColor = '#ff2d95';
    this.drawingLineWidth = 8;
    this.isDrawing = false;
    this.lastPoint = null;

    // UI elementleri
    this.buttons = [];
    this.particles = [];
    this.revealStartTime = 0;
    this.revealDuration = 3000; // 3 saniye göster

    // Kelime havuzu - Bilindik ama çizmesi zor
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
      'Deprem', 'Tsunami', 'Lav', 'Buzul', 'Safari',
      'Orman Yangını', 'Su Baskını', 'Kum Fırtınası', 'Çığlık', 'Fısıltı'
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
    // Rastgele çizer seç
    this.drawerIndex = Math.floor(Math.random() * this.totalPlayers);
    
    // Tahminciler listesi (çizer dışındakiler)
    this.guessers = [];
    for (let i = 0; i < this.totalPlayers; i++) {
      if (i !== this.drawerIndex) this.guessers.push(i);
    }
    
    this.currentGuesserIndex = 0;
    this.roundGuessCount = 0;
    this.totalGuessAttempts = 0;
    this.maxGuessAttempts = this.guessers.length * 3; // Her tahminciye 3 hak
    
    this.secretWord = this.wordPool[Math.floor(Math.random() * this.wordPool.length)];
    this.winner = null;
    this.state = 'DRAWER_REVEAL';
    this.revealStartTime = Date.now();
    this.clearDrawing();
    this.particles = [];
    this.defineButtons();
  }

  clearDrawing() {
    this.drawCtx.clearRect(0, 0, this.width, this.height);
    this.drawCtx.fillStyle = '#2a2a2e';
    this.drawCtx.fillRect(0, 0, this.width, this.height);
  }

  defineButtons() {
    this.buttons = [];
    
    if (this.state === 'DRAWER_REVEAL') {
      // Sadece bekleme ekranı - buton yok
    } else if (this.state === 'DRAWING') {
      // Renk paleti - yuvarlak butonlar
      const colors = ['#ff2d95', '#00f5d4', '#fee440', '#9b5de5', '#f15bb5', '#00bbf9'];
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
      
      // Fırça kalınlıkları - yuvarlak
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
      
      // Temizle butonu - oval
      this.buttons.push({
        type: 'oval',
        id: 'clear',
        x: this.width - 160,
        y: 25,
        w: 140,
        h: 50,
        radius: 25,
        color: '#ff6b6b',
        text: '🧹 Temizle',
        action: 'clear'
      });
      
      // Bitti butonu - büyük oval
      this.buttons.push({
        type: 'oval',
        id: 'done',
        x: this.width / 2 - 100,
        y: this.height - 120,
        w: 200,
        h: 65,
        radius: 32,
        color: '#00d2ff',
        text: 'BİTTİ! 🚀',
        textSize: 22,
        action: 'done'
      });
      
    } else if (this.state === 'GUESSING') {
      // Çizimi Gör butonu - büyük oval
      this.buttons.push({
        type: 'oval',
        id: 'showDrawing',
        x: this.width / 2 - 120,
        y: this.height / 2 - 50,
        w: 240,
        h: 90,
        radius: 45,
        color: '#ff2d95',
        text: '👁️ Çizimi Gör\n(basılı tut)',
        textSize: 20,
        action: 'showDrawing',
        hold: true
      });
      
      // Doğru bildi butonu
      this.buttons.push({
        type: 'oval',
        id: 'correct',
        x: this.width / 2 - 170,
        y: this.height - 130,
        w: 150,
        h: 55,
        radius: 27,
        color: '#00d2ff',
        text: '✅ Doğru!',
        textSize: 20,
        action: 'correctGuess'
      });
      
      // Bilemedi butonu
      this.buttons.push({
        type: 'oval',
        id: 'wrong',
        x: this.width / 2 + 20,
        y: this.height - 130,
        w: 150,
        h: 55,
        radius: 27,
        color: '#ff6b6b',
        text: '❌ Bilemedi',
        textSize: 18,
        action: 'wrongGuess'
      });
      
    } else if (this.state === 'RESULT') {
      // Yeniden oyna butonu
      this.buttons.push({
        type: 'oval',
        id: 'replay',
        x: this.width / 2 - 100,
        y: this.height - 130,
        w: 200,
        h: 60,
        radius: 30,
        color: '#00d2ff',
        text: '🔄 Yeniden Oyna',
        textSize: 20,
        action: 'replay'
      });
    }
  }

  onTouchStart(id, relX, relY) {
    const px = relX * this.width;
    const py = relY * this.height;
    
    if (this.state === 'DRAWER_REVEAL') {
      // Reveal süresi dolduysa çizime geç
      if (Date.now() - this.revealStartTime > this.revealDuration) {
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
          // Tahmin aşamasına geç
          this.state = 'GUESSING';
          this.currentGuesserIndex = 0;
          this.roundGuessCount = 0;
          this.totalGuessAttempts = 0;
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
        this.showDrawing = true;
      } else if (btn && btn.action === 'correctGuess') {
        // Doğru tahmin - hemen kazanır
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
      this.drawCtx.lineTo(px, py);
      this.drawCtx.stroke();
      this.lastPoint = { x: px, y: py };
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
        // Oval/rounded rectangle hit test
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
    
    // Aynı tahminci 3 hakkını doldurdu mu?
    if (this.roundGuessCount >= 3) {
      this.roundGuessCount = 0;
      this.currentGuesserIndex++;
    }
    
    // Tüm tahminciler bitti mi?
    if (this.totalGuessAttempts >= this.maxGuessAttempts) {
      // Kimse bilemedi → çizer kazandı
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
        color: `hsl(${Math.random() * 360}, 100%, 65%)`,
        size: 3 + Math.random() * 6
      });
    }
  }

  // Yuvarlak buton çizme
  drawCircleButton(btn) {
    if (btn.color) {
      // Renk butonu
      this.ctx.beginPath();
      this.ctx.arc(btn.cx, btn.cy, btn.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = btn.color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      if (this.drawingColor === btn.color && this.state === 'DRAWING') {
        this.ctx.beginPath();
        this.ctx.arc(btn.cx, btn.cy, btn.radius + 4, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
      }
    } else if (btn.thickness) {
      // Kalınlık butonu
      this.ctx.beginPath();
      this.ctx.arc(btn.cx, btn.cy, btn.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#3a3a42';
      this.ctx.fill();
      
      // Kalınlık çizgisi
      this.ctx.beginPath();
      this.ctx.moveTo(btn.cx - btn.radius * 0.6, btn.cy);
      this.ctx.lineTo(btn.cx + btn.radius * 0.6, btn.cy);
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = btn.thickness;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
      
      if (this.drawingLineWidth === btn.thickness && this.state === 'DRAWING') {
        this.ctx.beginPath();
        this.ctx.arc(btn.cx, btn.cy, btn.radius + 4, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#fee440';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
      }
    }
  }

  // Oval buton çizme
  drawOvalButton(btn) {
    this.ctx.beginPath();
    const cx = btn.x + btn.w / 2;
    const cy = btn.y + btn.h / 2;
    this.ctx.ellipse(cx, cy, btn.w / 2, btn.h / 2, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = btn.color || '#4a4a55';
    this.ctx.fill();
    
    // Hafif parlama efekti
    const gradient = this.ctx.createRadialGradient(cx, cy - btn.h * 0.2, btn.w * 0.05, cx, cy, btn.w * 0.7);
    gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // Metin
    if (btn.text) {
      this.ctx.fillStyle = '#fff';
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

    if (this.state === 'DRAWER_REVEAL') {
      // Koyu gri arka plan
      this.ctx.fillStyle = '#2a2a2e';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      const elapsed = Date.now() - this.revealStartTime;
      
      if (elapsed < this.revealDuration) {
        // Uyarı ve kelime gösterimi
        this.ctx.fillStyle = '#ff2d95';
        this.ctx.font = 'bold 48px "Segoe UI"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`⚠️ Oyuncu ${this.drawerIndex + 1} Çiziyor ⚠️`, this.width / 2, this.height / 2 - 80);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 28px "Segoe UI"';
        this.ctx.fillText('Kimseye gösterme!', this.width / 2, this.height / 2 - 20);
        
        // Kelime - büyük ve parlak
        const progress = Math.min(elapsed / this.revealDuration, 1);
        const scale = 1 + Math.sin(progress * Math.PI) * 0.1;
        
        this.ctx.save();
        this.ctx.translate(this.width / 2, this.height / 2 + 60);
        this.ctx.scale(scale, scale);
        this.ctx.fillStyle = '#fee440';
        this.ctx.font = 'bold 56px "Segoe UI"';
        this.ctx.fillText(`"${this.secretWord}"`, 0, 0);
        this.ctx.restore();
        
        // Kalan süre
        const remaining = Math.ceil((this.revealDuration - elapsed) / 1000);
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '22px "Segoe UI"';
        this.ctx.fillText(`${remaining} saniye içinde ezberle...`, this.width / 2, this.height / 2 + 130);
        
      } else {
        // Süre doldu, çizime geç
        this.state = 'DRAWING';
        this.defineButtons();
      }
      
    } else if (this.state === 'DRAWING') {
      // Koyu gri arka plan
      this.ctx.fillStyle = '#2a2a2e';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // Çizim canvas'ını göster
      this.ctx.drawImage(this.drawCanvas, 0, 0);
      
      // Butonları çiz
      this.drawAllButtons();
      
      // Üst bilgi çubuğu
      this.ctx.fillStyle = 'rgba(42, 42, 46, 0.9)';
      this.ctx.fillRect(0, 0, this.width, 100);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 20px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`🎨 Oyuncu ${this.drawerIndex + 1} çiziyor`, this.width / 2, 60);
      
      // Aktif renk göstergesi
      this.ctx.beginPath();
      this.ctx.arc(this.width - 40, 50, 16, 0, Math.PI * 2);
      this.ctx.fillStyle = this.drawingColor;
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
    } else if (this.state === 'GUESSING') {
      this.ctx.fillStyle = '#2a2a2e';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      const guesserIdx = this.guessers[this.currentGuesserIndex];
      
      // Üst bilgi
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 26px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`🤔 Oyuncu ${guesserIdx + 1} tahmin ediyor`, this.width / 2, 55);
      
      // Kalan hak bilgisi
      const remainingGuesses = 3 - this.roundGuessCount;
      this.ctx.fillStyle = '#fee440';
      this.ctx.font = 'bold 20px "Segoe UI"';
      this.ctx.fillText(`Kalan hak: ${'⭐'.repeat(remainingGuesses)}`, this.width / 2, 90);
      
      // Toplam ilerleme
      this.ctx.fillStyle = '#aaa';
      this.ctx.font = '16px "Segoe UI"';
      this.ctx.fillText(`Toplam tahmin: ${this.totalGuessAttempts + 1}/${this.maxGuessAttempts}`, this.width / 2, 120);
      
      // Eğer basılı tutuluyorsa çizimi göster
      if (this.showDrawing) {
        this.ctx.drawImage(this.drawCanvas, 0, 0);
        // Hafif overlay ile tahmin modunda olduğunu belirt
        this.ctx.fillStyle = 'rgba(42, 42, 46, 0.3)';
        this.ctx.fillRect(0, 0, this.width, this.height);
      } else {
        // Gizli ekran mesajı
        this.ctx.fillStyle = '#ddd';
        this.ctx.font = '24px "Segoe UI"';
        this.ctx.fillText('Çizimi görmek için butona', this.width / 2, this.height / 2 - 130);
        this.ctx.fillText('basılı tutun 👆', this.width / 2, this.height / 2 - 95);
      }
      
      this.drawAllButtons();
      
    } else if (this.state === 'RESULT') {
      this.ctx.fillStyle = '#2a2a2e';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      // Havai fişek partikülleri
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
        
        // Kuyruk efekti
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.beginPath();
        this.ctx.arc(p.x - p.vx * 3, p.y - p.vy * 3, p.size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.globalAlpha = 1;
      
      // Kazanan metni
      const isDrawerWin = this.winner.type === 'drawer';
      
      this.ctx.fillStyle = isDrawerWin ? '#fee440' : '#00f5d4';
      this.ctx.font = 'bold 44px "Segoe UI"';
      this.ctx.textAlign = 'center';
      
      if (isDrawerWin) {
        this.ctx.fillText(`🏆 Oyuncu ${this.winner.index + 1}`, this.width / 2, this.height / 2 - 80);
        this.ctx.fillText(`(Çizen) Kazandı!`, this.width / 2, this.height / 2 - 30);
      } else {
        this.ctx.fillText(`🎉 Oyuncu ${this.winner.index + 1}`, this.width / 2, this.height / 2 - 80);
        this.ctx.fillText(`Doğru Bildi!`, this.width / 2, this.height / 2 - 30);
      }
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 28px "Segoe UI"';
      this.ctx.fillText(`Kelime: "${this.secretWord}"`, this.width / 2, this.height / 2 + 40);
      
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