export class BlockMine {
  constructor(canvas, playerIndex, totalPlayers) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.totalPlayers = totalPlayers;
    this.playerIndex = playerIndex;

    this.state = 'MENU';
    this.currentRunner = 0; // Karşıya geçmeye çalışan oyuncu
    this.currentPlacer = 0; // Bomba koyma sırası
    this.scores = [];
    this.winner = -1;
    this.grid = [];
    this.gridRows = 12;
    this.gridCols = 10;
    this.cellSize = 0;
    this.gridOffsetX = 0;
    this.gridOffsetY = 0;
    this.currentPos = { row: 0, col: 0 };
    this.bombsPlacedCount = 0; // Bu turda kaç bomba kondu
    this.maxBombsPerPlayer = 2; // Her oyuncu 2 bomba koyar
    this.bombsNeeded = 0; // Toplam konması gereken bomba
    this.placers = []; // Bomba koyacak oyuncular (koşucu hariç)

    this.colors = {
      grass: '#7EC850',
      dirt: '#B8763A',
      treeTrunk: '#6B4226',
      treeLeaves: '#4AA52E',
      treeLeavesDark: '#3D8B26',
      gridLine: '#8B6914',
      bg: '#5C4033',
      startZone: '#55AA33',
      endZone: '#FFD700',
      dangerHigh: '#FF0000',
      dangerMed: '#FF8800',
      dangerLow: '#FFCC00'
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
    this.currentRunner = 0;
    this.currentPlacer = 0;
    this.bombsPlacedCount = 0;
    this.initGrid();
    this.defineButtons();
  }

  // Yeni tur başlat (harita yenilenir, puanlar kalır)
  newRound() {
    this.initGrid();
    this.state = 'BOMB_PLACING';
    this.currentPlacer = 0;
    this.bombsPlacedCount = 0;
    this.setupPlacers();
    this.defineButtons();
  }

  // Bomba koyacakları ayarla (koşucu hariç)
  setupPlacers() {
    this.placers = [];
    for (let i = 0; i < this.totalPlayers; i++) {
      if (i !== this.currentRunner) {
        this.placers.push(i);
      }
    }
    this.bombsNeeded = this.placers.length * this.maxBombsPerPlayer;
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

    const totalCells = this.gridRows * this.gridCols;
    const targetTrees = Math.floor(totalCells * 0.10);
    let treesPlaced = 0;

    while (treesPlaced < targetTrees) {
      const r = Math.floor(Math.random() * this.gridRows);
      const c = Math.floor(Math.random() * this.gridCols);

      if (c <= 1 || c >= this.gridCols - 2) continue;
      if (this.grid[r][c].type === 'empty') {
        this.grid[r][c].type = 'tree';
        this.grid[r][c].treeStyle = Math.floor(Math.random() * 3);
        treesPlaced++;
      }
    }

    // Koşucunun başlangıç pozisyonu
    const row = Math.floor(Math.random() * this.gridRows);
    this.currentPos = { row, col: 0 };
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.width = parent.clientWidth;
    this.height = parent.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    const availableHeight = this.height - 220;
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
        x: this.width / 2 - 130,
        y: this.gridOffsetY + this.gridRows * this.cellSize + 15,
        w: 260,
        h: 55,
        color: '#B8763A',
        text: '💣 Bombayı Yerleştir',
        textSize: 19,
        action: 'bombPlaced'
      });
    } else if (this.state === 'MOVING') {
      const arrowSize = 48;
      const arrowGap = 8;
      const centerX = this.width / 2;
      const baseY = this.gridOffsetY + this.gridRows * this.cellSize + 25;

      this.buttons.push({
        type: 'rect',
        x: centerX - arrowSize / 2,
        y: baseY,
        w: arrowSize,
        h: arrowSize,
        color: '#6B4226',
        text: '⬆',
        textSize: 22,
        action: 'moveUp'
      });
      this.buttons.push({
        type: 'rect',
        x: centerX - arrowSize - arrowGap,
        y: baseY + arrowSize + arrowGap,
        w: arrowSize,
        h: arrowSize,
        color: '#6B4226',
        text: '⬅',
        textSize: 22,
        action: 'moveLeft'
      });
      this.buttons.push({
        type: 'rect',
        x: centerX - arrowSize / 2,
        y: baseY + (arrowSize + arrowGap) * 2,
        w: arrowSize,
        h: arrowSize,
        color: '#6B4226',
        text: '⬇',
        textSize: 22,
        action: 'moveDown'
      });
      this.buttons.push({
        type: 'rect',
        x: centerX + arrowGap,
        y: baseY + arrowSize + arrowGap,
        w: arrowSize,
        h: arrowSize,
        color: '#6B4226',
        text: '➡',
        textSize: 22,
        action: 'moveRight'
      });
    } else if (this.state === 'GAME_OVER') {
      this.buttons.push({
        type: 'rect',
        x: this.width / 2 - 120,
        y: this.height - 80,
        w: 240,
        h: 60,
        color: '#FFD700',
        text: '🔄 Yeniden Başlat',
        textSize: 20,
        action: 'restartGame'
      });
    }
  }

  // Koşucu hariç herkes bombasını koydu mu?
  allBombsPlaced() {
    let count = 0;
    for (const placer of this.placers) {
      for (let r = 0; r < this.gridRows; r++) {
        for (let c = 0; c < this.gridCols; c++) {
          if (this.grid[r][c].type === 'bomb' && this.grid[r][c].owner === placer) {
            count++;
          }
        }
      }
    }
    return count >= this.bombsNeeded;
  }

  // Bir oyuncunun kaç bombası var?
  countPlayerBombs(playerIdx) {
    let count = 0;
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (this.grid[r][c].type === 'bomb' && this.grid[r][c].owner === playerIdx) {
          count++;
        }
      }
    }
    return count;
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
        this.currentRunner = 0;
        this.currentPlacer = 0;
        this.bombsPlacedCount = 0;
        this.setupPlacers();
        this.defineButtons();
      }
      return;
    }

    if (this.state === 'BOMB_PLACING') {
      const btn = this.hitTest(px, py);
      if (btn && btn.action === 'bombPlaced') {
        // Sıradaki placer'a geç
        this.currentPlacer++;
        
        // Tüm placer'lar bombasını koydu mu?
        if (this.currentPlacer >= this.placers.length) {
          // Herkesin 2 bombası var mı kontrol et
          if (this.allBombsPlaced()) {
            // Hareket aşamasına geç
            this.state = 'MOVING';
          } else {
            // Başa dön, eksik bomba varsa tekrar
            this.currentPlacer = 0;
          }
        }
        this.defineButtons();
        return;
      }

      // Grid üzerinde bomba yerleştirme
      const cell = this.getGridCell(px, py);
      if (cell && this.grid[cell.row][cell.col].type === 'empty') {
        if (cell.col <= 1 || cell.col >= this.gridCols - 2) return;

        const placer = this.placers[this.currentPlacer];
        
        // Bu oyuncunun max bomba sayısını aştı mı?
        if (this.countPlayerBombs(placer) >= this.maxBombsPerPlayer) return;

        // Bombayı yerleştir
        this.grid[cell.row][cell.col].type = 'bomb';
        this.grid[cell.row][cell.col].owner = placer;
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
            
            if (this.checkWin()) return;
            
            // Sonraki koşucuya geç, harita yenilenir
            this.nextRunner();
            return;
          }

          // Bitiş çizgisine ulaştı mı?
          if (newCol >= this.gridCols - 1) {
            this.scores[this.currentRunner]++;
            
            if (this.checkWin()) return;
            
            // Sonraki koşucuya geç, harita yenilenir
            this.nextRunner();
            return;
          }
        }
      }
      return;
    }

    if (this.state === 'GAME_OVER') {
      const btn = this.hitTest(px, py);
      if (btn && btn.action === 'restartGame') {
        this.resetGame();
      }
      return;
    }
  }

  onTouchMove(id, relX, relY) {}
  onTouchEnd(id, relX, relY) {}

  checkWin() {
    for (let i = 0; i < this.totalPlayers; i++) {
      if (this.scores[i] >= 4) {
        this.winner = i;
        this.state = 'GAME_OVER';
        this.defineButtons();
        return true;
      }
    }
    return false;
  }

  nextRunner() {
    // Sonraki koşucu
    this.currentRunner++;
    if (this.currentRunner >= this.totalPlayers) {
      this.currentRunner = 0;
    }
    
    // Yeni tur: harita yenilenir, bombalar sıfırlanır
    this.newRound();
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

        if (c <= 1) {
          this.ctx.fillStyle = this.colors.startZone;
        } else if (c >= this.gridCols - 2) {
          this.ctx.fillStyle = this.colors.endZone;
        } else {
          this.ctx.fillStyle = ((r + c) % 2 === 0) ? this.colors.grass : this.colors.dirt;
        }
        this.ctx.fillRect(x, y, this.cellSize, this.cellSize);

        this.ctx.strokeStyle = this.colors.gridLine;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);

        if (cell.type === 'tree') {
          this.drawTree(x, y, cell.treeStyle);
        }

        if (cell.type === 'exploded') {
          this.ctx.fillStyle = '#FF0000';
          this.ctx.fillRect(x + 4, y + 4, this.cellSize - 8, this.cellSize - 8);
          this.ctx.fillStyle = '#FF6600';
          this.ctx.font = `${this.cellSize * 0.6}px "Segoe UI"`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('💥', x + this.cellSize / 2, y + this.cellSize / 2);
        }

        // Bomba yerleştirme aşamasında TÜM bombaları göster
        if (this.state === 'BOMB_PLACING' && cell.type === 'bomb') {
          this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
          this.ctx.fillRect(x + 4, y + 4, this.cellSize - 8, this.cellSize - 8);
          this.ctx.fillStyle = '#FFF';
          this.ctx.font = `bold ${this.cellSize * 0.3}px "Segoe UI"`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(`P${cell.owner + 1}`, x + this.cellSize / 2, y + this.cellSize / 2);
        }

        // Hareket aşamasında sayaç
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
    this.ctx.fillStyle = this.colors.treeTrunk;
    this.ctx.fillRect(x + s * 0.4, y + s * 0.3, s * 0.2, s * 0.6);

    const leafColor = style === 0 ? this.colors.treeLeaves : 
                      style === 1 ? '#5CB840' : '#3D8B26';
    
    this.ctx.fillStyle = leafColor;
    this.ctx.fillRect(x + s * 0.15, y + s * 0.05, s * 0.7, s * 0.35);
    this.ctx.fillRect(x + s * 0.1, y + s * 0.15, s * 0.8, s * 0.3);
    this.ctx.fillRect(x + s * 0.2, y + s * 0.0, s * 0.6, s * 0.2);

    this.ctx.fillStyle = style === 0 ? this.colors.treeLeavesDark : '#4AA52E';
    this.ctx.fillRect(x + s * 0.25, y + s * 0.1, s * 0.5, s * 0.12);
  }

  drawPlayer(x, y, playerIdx) {
    const s = this.cellSize;
    const color = this.playerColors[playerIdx];
    const cx = x + s / 2;
    const cy = y + s / 2;

    this.ctx.fillStyle = '#3D2B1F';
    this.ctx.fillRect(cx - s * 0.18, cy + s * 0.25, s * 0.12, s * 0.15);
    this.ctx.fillRect(cx + s * 0.06, cy + s * 0.25, s * 0.12, s * 0.15);

    this.ctx.fillStyle = color;
    this.ctx.fillRect(cx - s * 0.2, cy - s * 0.1, s * 0.4, s * 0.4);

    this.ctx.fillStyle = color;
    this.ctx.fillRect(cx - s * 0.3, cy - s * 0.05, s * 0.1, s * 0.25);
    this.ctx.fillRect(cx + s * 0.2, cy - s * 0.05, s * 0.1, s * 0.25);

    this.ctx.fillStyle = '#FFDDBB';
    this.ctx.fillRect(cx - s * 0.15, cy - s * 0.35, s * 0.3, s * 0.3);

    this.ctx.fillStyle = '#3D2B1F';
    this.ctx.fillRect(cx - s * 0.15, cy - s * 0.35, s * 0.3, s * 0.1);

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(cx - s * 0.08, cy - s * 0.25, s * 0.05, s * 0.06);
    this.ctx.fillRect(cx + s * 0.03, cy - s * 0.25, s * 0.05, s * 0.06);

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(cx - s * 0.04, cy - s * 0.12, s * 0.08, s * 0.02);
  }

  drawButtons() {
    for (const btn of this.buttons) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
      this.ctx.fillRect(btn.x + 3, btn.y + 3, btn.w, btn.h);

      this.ctx.fillStyle = btn.color;
      this.ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

      this.ctx.strokeStyle = '#3D2B1F';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

      this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
      this.ctx.fillRect(btn.x + 3, btn.y + 3, btn.w - 6, btn.h / 2 - 3);

      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.font = `bold ${btn.textSize}px "Segoe UI"`;
      this.ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
    }
  }

  update() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = this.colors.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawGrid();

    if (this.state === 'MOVING') {
      const px = this.gridOffsetX + this.currentPos.col * this.cellSize;
      const py = this.gridOffsetY + this.currentPos.row * this.cellSize;
      this.drawPlayer(px, py, this.currentRunner);
    }

    // Üst bilgi
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(0, 0, this.width, 72);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 14px "Segoe UI"';
    this.ctx.textAlign = 'center';

    let infoText = '';
    if (this.state === 'MENU') {
      infoText = '⛏️ BlockMine - Mayın Tarlası';
    } else if (this.state === 'BOMB_PLACING') {
      const placer = this.placers[this.currentPlacer];
      const bombCount = this.countPlayerBombs(placer);
      infoText = `Oyuncu ${placer + 1} bomba koyuyor (${bombCount}/${this.maxBombsPerPlayer}) - Koşucu: Oyuncu ${this.currentRunner + 1}`;
    } else if (this.state === 'MOVING') {
      infoText = `🏃 Oyuncu ${this.currentRunner + 1} karşıya geçiyor! Sarı bölgeye ulaş!`;
    } else if (this.state === 'GAME_OVER') {
      infoText = `🏆 Oyuncu ${this.winner + 1} KAZANDI!`;
    }
    this.ctx.fillText(infoText, this.width / 2, 30);

    // Puan
    let scoreText = '⭐ ';
    for (let i = 0; i < this.totalPlayers; i++) {
      scoreText += `P${i + 1}: ${this.scores[i]}/4`;
      if (i < this.totalPlayers - 1) scoreText += '  |  ';
    }
    this.ctx.fillText(scoreText, this.width / 2, 55);

    this.drawButtons();

    requestAnimationFrame(() => this.update());
  }
}