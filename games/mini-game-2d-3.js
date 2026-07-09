export class BlockMine {
  constructor(canvas, playerIndex, totalPlayers) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.totalPlayers = totalPlayers;
    this.playerIndex = playerIndex;

    this.state = 'MENU';
    this.currentPlayer = 0;
    this.scores = [];
    this.winner = -1;
    this.grid = [];
    this.gridRows = 12;
    this.gridCols = 10; // 8'den 10'a çıkarıldı (yanlardan +1)
    this.cellSize = 0;
    this.gridOffsetX = 0;
    this.gridOffsetY = 0;
    this.playerPositions = [];
    this.currentPos = { row: 0, col: 0 };
    this.bombsPlacedByPlayer = []; // Hangi oyuncu bombasını koydu?

    this.colors = {
      grass: '#7EC850',
      dirt: '#B8763A',
      path: '#D4A056',
      treeTrunk: '#6B4226',
      treeLeaves: '#4AA52E',
      treeLeavesDark: '#3D8B26',
      player: '#FFFFFF',
      bomb: '#FF3333',
      gridLine: '#8B6914',
      bg: '#5C4033',
      startZone: '#55AA33',
      endZone: '#FFD700',
      dangerHigh: '#FF0000',
      dangerMed: '#FF8800',
      dangerLow: '#FFCC00',
      safe: '#FFFFFF'
    };

    this.playerColors = ['#FF4444', '#4488FF', '#44FF44', '#FFAA00'];
    this.buttons = [];

    this.resetGame();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resetGame() {
    this.scores = new Array(this.totalPlayers).fill(0);
    this.winner = -1;
    this.state = 'MENU';
    this.currentPlayer = 0;
    this.bombsPlacedByPlayer = new Array(this.totalPlayers).fill(false);
    this.initGrid();
    this.defineButtons();
  }

  initGrid() {
    this.grid = [];
    for (let r = 0; r < this.gridRows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.gridCols; c++) {
        this.grid[r][c] = {
          type: 'empty',
          owner: -1,
          treeStyle: 0
        };
      }
    }

    // Ağaç yerleştirme (%10 alan) - başlangıç/bitiş bölgelerine KOYMA
    const totalCells = this.gridRows * this.gridCols;
    const targetTrees = Math.floor(totalCells * 0.10);
    let treesPlaced = 0;

    while (treesPlaced < targetTrees) {
      const r = Math.floor(Math.random() * this.gridRows);
      const c = Math.floor(Math.random() * this.gridCols);

      // Başlangıç (col 0-1) ve bitiş (col gridCols-2, gridCols-1) bölgelerine ağaç koyma
      if (c <= 1 || c >= this.gridCols - 2) continue;
      if (this.grid[r][c].type === 'empty') {
        this.grid[r][c].type = 'tree';
        this.grid[r][c].treeStyle = Math.floor(Math.random() * 3);
        treesPlaced++;
      }
    }

    // Başlangıç pozisyonları - her oyuncu için sol kenarda rastgele satır
    this.playerPositions = [];
    const usedRows = new Set();
    for (let i = 0; i < this.totalPlayers; i++) {
      let row;
      do {
        row = Math.floor(Math.random() * this.gridRows);
      } while (usedRows.has(row) && usedRows.size < this.gridRows);
      usedRows.add(row);
      this.playerPositions.push({ row, col: 0 });
    }
    this.currentPos = { ...this.playerPositions[0] };
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.width = parent.clientWidth;
    this.height = parent.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    const availableHeight = this.height - 200;
    const availableWidth = this.width - 40;
    this.cellSize = Math.floor(Math.min(
      availableWidth / this.gridCols,
      availableHeight / this.gridRows
    ));
    this.gridOffsetX = Math.floor((this.width - this.cellSize * this.gridCols) / 2);
    this.gridOffsetY = 80;
    this.defineButtons();
  }

  defineButtons() {
    this.buttons = [];

    if (this.state === 'MENU') {
      this.buttons.push({
        type: 'rect',
        x: this.width / 2 - 120,
        y: this.height / 2,
        w: 240,
        h: 70,
        color: '#7EC850',
        text: '🚀 BAŞLA',
        textSize: 26,
        action: 'startGame'
      });
    } else if (this.state === 'BOMB_PLACING') {
      this.buttons.push({
        type: 'rect',
        x: this.width / 2 - 140,
        y: this.height - 70,
        w: 280,
        h: 55,
        color: '#B8763A',
        text: '💣 BOMBA YERLEŞTİRİLDİ',
        textSize: 18,
        action: 'bombPlaced'
      });
    } else if (this.state === 'MOVING') {
      const arrowSize = 50;
      const arrowGap = 10;
      const centerX = this.width / 2;
      const baseY = this.height - 130;

      this.buttons.push({
        type: 'rect',
        x: centerX - arrowSize / 2,
        y: baseY - arrowSize - arrowGap / 2,
        w: arrowSize,
        h: arrowSize,
        color: '#6B4226',
        text: '⬆',
        textSize: 24,
        action: 'moveUp'
      });
      this.buttons.push({
        type: 'rect',
        x: centerX - arrowSize - arrowGap,
        y: baseY,
        w: arrowSize,
        h: arrowSize,
        color: '#6B4226',
        text: '⬅',
        textSize: 24,
        action: 'moveLeft'
      });
      this.buttons.push({
        type: 'rect',
        x: centerX - arrowSize / 2,
        y: baseY + arrowSize + arrowGap / 2,
        w: arrowSize,
        h: arrowSize,
        color: '#6B4226',
        text: '⬇',
        textSize: 24,
        action: 'moveDown'
      });
      this.buttons.push({
        type: 'rect',
        x: centerX + arrowGap,
        y: baseY,
        w: arrowSize,
        h: arrowSize,
        color: '#6B4226',
        text: '➡',
        textSize: 24,
        action: 'moveRight'
      });
    } else if (this.state === 'GAME_OVER' || this.state === 'RESULT') {
      this.buttons.push({
        type: 'rect',
        x: this.width / 2 - 120,
        y: this.height - 100,
        w: 240,
        h: 60,
        color: '#7EC850',
        text: '🔄 Yeni Tur',
        textSize: 22,
        action: 'newRound'
      });
    }
  }

  countAdjacentBombs(row, col) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < this.gridRows && nc >= 0 && nc < this.gridCols) {
          if (this.grid[nr][nc].type === 'bomb') {
            count++;
          }
        }
      }
    }
    return count;
  }

  canMoveTo(row, col) {
    if (row < 0 || row >= this.gridRows || col < 0 || col >= this.gridCols) return false;
    if (this.grid[row][col].type === 'tree') return false;
    return true;
  }

  start() {
    this.resetGame();
    this.update();
  }

  onTouchStart(id, relX, relY) {
    const px = relX * this.width;
    const py = relY * this.height;

    if (this.state === 'MENU') {
      const btn = this.hitTest(px, py);
      if (btn && btn.action === 'startGame') {
        this.state = 'BOMB_PLACING';
        this.currentPlayer = 0;
        this.bombsPlacedByPlayer = new Array(this.totalPlayers).fill(false);
        this.defineButtons();
      }
      return;
    }

    if (this.state === 'BOMB_PLACING') {
      const btn = this.hitTest(px, py);
      if (btn && btn.action === 'bombPlaced') {
        // Bu oyuncu bombasını koydu olarak işaretle
        this.bombsPlacedByPlayer[this.currentPlayer] = true;
        
        // Sonraki oyuncuya geç
        this.currentPlayer++;
        
        // Tüm oyuncular bombasını koydu mu?
        const allPlaced = this.bombsPlacedByPlayer.every(p => p === true);
        
        if (allPlaced || this.currentPlayer >= this.totalPlayers) {
          // Hareket aşamasına geç
          this.state = 'MOVING';
          this.currentPlayer = 0;
          this.currentPos = { ...this.playerPositions[0] };
        }
        this.defineButtons();
        return;
      }

      // Grid üzerinde bomba yerleştirme
      const cell = this.getGridCell(px, py);
      if (cell && this.grid[cell.row][cell.col].type === 'empty') {
        // Başlangıç (col 0-1) ve bitiş (col gridCols-2, gridCols-1) bölgelerine bomba konulamaz
        if (cell.col <= 1 || cell.col >= this.gridCols - 2) return;
        
        // Bu oyuncu zaten bomba koyduysa tekrar koyamaz
        if (this.bombsPlacedByPlayer[this.currentPlayer]) return;
        
        // Önceki bombasını kaldır (eğer değiştirmek isterse)
        for (let r = 0; r < this.gridRows; r++) {
          for (let c = 0; c < this.gridCols; c++) {
            if (this.grid[r][c].type === 'bomb' && this.grid[r][c].owner === this.currentPlayer) {
              this.grid[r][c].type = 'empty';
              this.grid[r][c].owner = -1;
            }
          }
        }
        
        // Yeni bombayı yerleştir
        this.grid[cell.row][cell.col].type = 'bomb';
        this.grid[cell.row][cell.col].owner = this.currentPlayer;
      }
      return;
    }

    if (this.state === 'MOVING') {
      const btn = this.hitTest(px, py);
      if (btn) {
        let newRow = this.currentPos.row;
        let newCol = this.currentPos.col;
        if (btn.action === 'moveUp') newRow--;
        else if (btn.action === 'moveDown') newRow++;
        else if (btn.action === 'moveLeft') newCol--;
        else if (btn.action === 'moveRight') newCol++;

        if (this.canMoveTo(newRow, newCol)) {
          this.currentPos.row = newRow;
          this.currentPos.col = newCol;

          // Bombaya basıldı mı?
          if (this.grid[newRow][newCol].type === 'bomb') {
            const bombOwner = this.grid[newRow][newCol].owner;
            this.scores[bombOwner]++;
            this.grid[newRow][newCol].type = 'exploded';
            this.checkWinOrNext();
            return;
          }

          // Bitiş çizgisine ulaştı mı? (sağ kenar - col 9)
          if (newCol >= this.gridCols - 1) {
            this.scores[this.currentPlayer]++;
            this.checkWinOrNext();
            return;
          }
        }
      }
      return;
    }

    if (this.state === 'GAME_OVER' || this.state === 'RESULT') {
      const btn = this.hitTest(px, py);
      if (btn && btn.action === 'newRound') {
        this.initGrid();
        this.state = 'BOMB_PLACING';
        this.currentPlayer = 0;
        this.bombsPlacedByPlayer = new Array(this.totalPlayers).fill(false);
        this.scores = new Array(this.totalPlayers).fill(0);
        this.winner = -1;
        this.defineButtons();
      }
      return;
    }
  }

  onTouchMove(id, relX, relY) {}
  onTouchEnd(id, relX, relY) {}

  checkWinOrNext() {
    // Puan kontrolü
    for (let i = 0; i < this.totalPlayers; i++) {
      if (this.scores[i] >= 4) {
        this.winner = i;
        this.state = 'GAME_OVER';
        this.defineButtons();
        return;
      }
    }

    // Sonraki oyuncuya geç
    this.currentPlayer++;
    if (this.currentPlayer >= this.totalPlayers) {
      // Tur bitti, yeni tura geç
      this.state = 'RESULT';
      this.defineButtons();
    } else {
      this.currentPos = { ...this.playerPositions[this.currentPlayer] };
      this.defineButtons();
    }
  }

  getGridCell(px, py) {
    const col = Math.floor((px - this.gridOffsetX) / this.cellSize);
    const row = Math.floor((py - this.gridOffsetY) / this.cellSize);
    if (row >= 0 && row < this.gridRows && col >= 0 && col < this.gridCols) {
      return { row, col };
    }
    return null;
  }

  hitTest(x, y) {
    for (const btn of this.buttons) {
      if (x >= btn.x && x <= btn.x + btn.w &&
          y >= btn.y && y <= btn.y + btn.h) {
        return btn;
      }
    }
    return null;
  }

  drawGrid() {
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const x = this.gridOffsetX + c * this.cellSize;
        const y = this.gridOffsetY + r * this.cellSize;
        const cell = this.grid[r][c];

        // Zemin rengi
        if (c <= 1) {
          // Başlangıç bölgesi (sol 2 sütun)
          this.ctx.fillStyle = this.colors.startZone;
        } else if (c >= this.gridCols - 2) {
          // Bitiş bölgesi (sağ 2 sütun)
          this.ctx.fillStyle = this.colors.endZone;
        } else {
          // Orta bölge - çimen/toprak deseni
          this.ctx.fillStyle = ((r + c) % 2 === 0) ? this.colors.grass : this.colors.dirt;
        }
        this.ctx.fillRect(x, y, this.cellSize, this.cellSize);

        // Izgara çizgisi
        this.ctx.strokeStyle = this.colors.gridLine;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);

        // Ağaç çizimi
        if (cell.type === 'tree') {
          this.drawTree(x, y, cell.treeStyle);
        }

        // Patlamış bomba
        if (cell.type === 'exploded') {
          this.ctx.fillStyle = '#FF0000';
          this.ctx.fillRect(x + 4, y + 4, this.cellSize - 8, this.cellSize - 8);
          this.ctx.fillStyle = '#FF6600';
          this.ctx.font = `${this.cellSize * 0.6}px "Segoe UI"`;
          this.ctx.textAlign = 'center';
          this.ctx.fillText('💥', x + this.cellSize / 2, y + this.cellSize * 0.7);
        }

        // Bomba yerleştirme aşamasında bombaları göster
        if (this.state === 'BOMB_PLACING' && cell.type === 'bomb') {
          this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
          this.ctx.fillRect(x + 6, y + 6, this.cellSize - 12, this.cellSize - 12);
          this.ctx.fillStyle = '#FFF';
          this.ctx.font = `bold ${this.cellSize * 0.35}px "Segoe UI"`;
          this.ctx.textAlign = 'center';
          this.ctx.fillText(`P${cell.owner + 1}`, x + this.cellSize / 2, y + this.cellSize * 0.65);
        }

        // Hareket aşamasında sayaçları göster
        if (this.state === 'MOVING' && r === this.currentPos.row && c === this.currentPos.col) {
          const bombCount = this.countAdjacentBombs(r, c);
          if (bombCount > 0) {
            const textColor = bombCount >= 5 ? this.colors.dangerHigh :
                              bombCount >= 3 ? this.colors.dangerMed :
                              this.colors.dangerLow;
            this.ctx.fillStyle = textColor;
            this.ctx.font = `bold ${this.cellSize * 0.5}px "Segoe UI"`;
            this.ctx.textAlign = 'right';
            this.ctx.fillText(bombCount, x + this.cellSize - 6, y + this.cellSize * 0.45);
          }
        }
      }
    }
  }

  drawTree(x, y, style) {
    const s = this.cellSize;
    
    // Gövde
    this.ctx.fillStyle = this.colors.treeTrunk;
    this.ctx.fillRect(x + s * 0.4, y + s * 0.3, s * 0.2, s * 0.6);

    // Yapraklar (3 katman)
    const leafColor = style === 0 ? this.colors.treeLeaves : 
                      style === 1 ? '#5CB840' : '#3D8B26';
    
    this.ctx.fillStyle = leafColor;
    this.ctx.fillRect(x + s * 0.15, y + s * 0.05, s * 0.7, s * 0.35);
    this.ctx.fillRect(x + s * 0.1, y + s * 0.15, s * 0.8, s * 0.3);
    this.ctx.fillRect(x + s * 0.2, y + s * 0.0, s * 0.6, s * 0.2);

    // Yaprak detayı (gölge)
    this.ctx.fillStyle = style === 0 ? this.colors.treeLeavesDark : '#4AA52E';
    this.ctx.fillRect(x + s * 0.25, y + s * 0.1, s * 0.5, s * 0.12);
  }

  drawPlayer(x, y, playerIdx) {
    const s = this.cellSize;
    const color = this.playerColors[playerIdx];
    const cx = x + s / 2;
    const cy = y + s / 2;

    // Ayaklar
    this.ctx.fillStyle = '#3D2B1F';
    this.ctx.fillRect(cx - s * 0.18, cy + s * 0.25, s * 0.12, s * 0.15);
    this.ctx.fillRect(cx + s * 0.06, cy + s * 0.25, s * 0.12, s * 0.15);

    // Beden (oyuncu rengi)
    this.ctx.fillStyle = color;
    this.ctx.fillRect(cx - s * 0.2, cy - s * 0.1, s * 0.4, s * 0.4);

    // Kol
    this.ctx.fillStyle = color;
    this.ctx.fillRect(cx - s * 0.3, cy - s * 0.05, s * 0.1, s * 0.25);
    this.ctx.fillRect(cx + s * 0.2, cy - s * 0.05, s * 0.1, s * 0.25);

    // Kafa
    this.ctx.fillStyle = '#FFDDBB';
    this.ctx.fillRect(cx - s * 0.15, cy - s * 0.35, s * 0.3, s * 0.3);

    // Saç
    this.ctx.fillStyle = '#3D2B1F';
    this.ctx.fillRect(cx - s * 0.15, cy - s * 0.35, s * 0.3, s * 0.1);

    // Gözler
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(cx - s * 0.08, cy - s * 0.25, s * 0.05, s * 0.06);
    this.ctx.fillRect(cx + s * 0.03, cy - s * 0.25, s * 0.05, s * 0.06);

    // Ağız
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(cx - s * 0.04, cy - s * 0.12, s * 0.08, s * 0.02);
  }

  drawButtons() {
    for (const btn of this.buttons) {
      // Gölge
      this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
      this.ctx.fillRect(btn.x + 3, btn.y + 3, btn.w, btn.h);

      // Ana buton
      this.ctx.fillStyle = btn.color;
      this.ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

      // Kenar (Minecraft tarzı)
      this.ctx.strokeStyle = '#3D2B1F';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

      // Üst highlight
      this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
      this.ctx.fillRect(btn.x + 3, btn.y + 3, btn.w - 6, btn.h / 2 - 3);

      // Metin
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.font = `bold ${btn.textSize}px "Segoe UI"`;
      this.ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
    }
  }

  update() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Arka plan
    this.ctx.fillStyle = this.colors.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Izgara
    this.drawGrid();

    // Oyuncu
    if (this.state === 'MOVING') {
      const px = this.gridOffsetX + this.currentPos.col * this.cellSize;
      const py = this.gridOffsetY + this.currentPos.row * this.cellSize;
      this.drawPlayer(px, py, this.currentPlayer);
    }

    // Üst bilgi çubuğu
    this.ctx.fillStyle = 'rgba(0,0,0,0.75)';
    this.ctx.fillRect(0, 0, this.width, 72);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 15px "Segoe UI"';
    this.ctx.textAlign = 'center';

    let infoText = '';
    if (this.state === 'MENU') {
      infoText = '⛏️ BlockMine - Minecraft Mayın Tarlası';
    } else if (this.state === 'BOMB_PLACING') {
      if (this.bombsPlacedByPlayer[this.currentPlayer]) {
        infoText = `Oyuncu ${this.currentPlayer + 1} - Bomban hazır! "Bomba Yerleştirildi"ye bas`;
      } else {
        infoText = `Oyuncu ${this.currentPlayer + 1} - Bombanı yerleştir (yeşil/sarı bölge dışı)`;
      }
    } else if (this.state === 'MOVING') {
      infoText = `Oyuncu ${this.currentPlayer + 1} hareket ediyor - Sağ tarafa ulaş!`;
    } else if (this.state === 'GAME_OVER') {
      infoText = `🏆 Oyuncu ${this.winner + 1} KAZANDI! (4 puana ulaştı)`;
    } else if (this.state === 'RESULT') {
      infoText = '✅ Tur bitti! "Yeni Tur" ile devam et';
    }
    this.ctx.fillText(infoText, this.width / 2, 30);

    // Puan tablosu
    let scoreText = '⭐ ';
    for (let i = 0; i < this.totalPlayers; i++) {
      scoreText += `P${i + 1}: ${this.scores[i]}/4`;
      if (i < this.totalPlayers - 1) scoreText += '  |  ';
    }
    this.ctx.fillText(scoreText, this.width / 2, 55);

    // Butonlar
    this.drawButtons();

    requestAnimationFrame(() => this.update());
  }
}