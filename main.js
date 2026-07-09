import { MiniGame2D } from './games/mini-game-2d.js';
import { MiniGame3D } from './games/mini-game-3d.js';
import { SecretCanvas } from './games/mini-game-2d-2.js';
import { BlockMine } from './games/mini-game-2d-3.js';

const menuDiv = document.getElementById('menu');
const playerSelectDiv = document.getElementById('player-select');
const gameSelectDiv = document.getElementById('game-select');
const gameContainer = document.getElementById('game-container');

let selectedPlayers = 0;
let selectedGame = '';
const gameInstances = [];

// ---------- MENÜ ----------
playerSelectDiv.addEventListener('click', (e) => {
  if (!e.target.classList.contains('player-btn')) return;
  selectedPlayers = parseInt(e.target.dataset.players, 10);
  playerSelectDiv.style.display = 'none';
  gameSelectDiv.style.display = 'block';
});

gameSelectDiv.addEventListener('click', (e) => {
  if (!e.target.classList.contains('game-btn')) return;
  selectedGame = e.target.dataset.game;
  startGame(selectedGame, selectedPlayers);
});

// ---------- OYUN BAŞLATMA ----------
function startGame(gameName, playerCount) {
  menuDiv.style.display = 'none';
  gameContainer.style.display = 'block';
  gameContainer.innerHTML = '';
  gameInstances.length = 0;

  // Tam ekran oyunlar (Secret Canvas, BlockMine)
  if (gameName === 'mini-game-2d-2' || gameName === 'mini-game-2d-3') {
    const playerDiv = document.createElement('div');
    playerDiv.className = 'player-area';
    playerDiv.style.top = '0';
    playerDiv.style.left = '0';
    playerDiv.style.width = '100%';
    playerDiv.style.height = '100%';
    playerDiv.dataset.playerIndex = 0;

    const canvas = document.createElement('canvas');
    canvas.id = 'player-0-canvas';
    playerDiv.appendChild(canvas);
    gameContainer.appendChild(playerDiv);

    let instance;
    if (gameName === 'mini-game-2d-2') {
      instance = new SecretCanvas(canvas, 0, playerCount);
    } else if (gameName === 'mini-game-2d-3') {
      instance = new BlockMine(canvas, 0, playerCount);
    }
    gameInstances.push({ instance, element: playerDiv, canvas, index: 0 });
  } else {
    // Normal çoklu alan bölme (2D ve 3D oyunlar için)
    const areas = getPlayerAreas(playerCount);

    for (let i = 0; i < playerCount; i++) {
      const area = areas[i];
      const playerDiv = document.createElement('div');
      playerDiv.className = 'player-area';
      playerDiv.style.top = area.top;
      playerDiv.style.left = area.left;
      playerDiv.style.width = area.width;
      playerDiv.style.height = area.height;
      playerDiv.dataset.playerIndex = i;

      const canvas = document.createElement('canvas');
      canvas.id = `player-${i}-canvas`;
      playerDiv.appendChild(canvas);
      gameContainer.appendChild(playerDiv);

      let instance;
      if (gameName === 'mini-game-2d') {
        instance = new MiniGame2D(canvas, i);
      } else if (gameName === 'mini-game-3d') {
        instance = new MiniGame3D(canvas, i);
      } else {
        console.error('Bilinmeyen oyun:', gameName);
        return;
      }

      gameInstances.push({ instance, element: playerDiv, canvas, index: i });
    }
  }

  setupTouchListeners();

  // Tüm oyunları başlat
  gameInstances.forEach(g => g.instance.start());

  function gameLoop() {
    gameInstances.forEach(g => {
      if (g.instance.update) g.instance.update();
    });
    requestAnimationFrame(gameLoop);
  }
  gameLoop();
}

// 2×2 IZGARA VE 3 KİŞİ DESTEĞİ
function getPlayerAreas(count) {
  if (count === 1) {
    return [{ top: '0', left: '0', width: '100%', height: '100%' }];
  }
  if (count === 2) {
    return [
      { top: '0', left: '0', width: '100%', height: '50%' },
      { top: '50%', left: '0', width: '100%', height: '50%' }
    ];
  }
  if (count === 3) {
    return [
      { top: '0', left: '50%', width: '50%', height: '50%' },
      { top: '50%', left: '0', width: '50%', height: '50%' },
      { top: '50%', left: '50%', width: '50%', height: '50%' }
    ];
  }
  if (count === 4) {
    return [
      { top: '0', left: '0', width: '50%', height: '50%' },
      { top: '0', left: '50%', width: '50%', height: '50%' },
      { top: '50%', left: '0', width: '50%', height: '50%' },
      { top: '50%', left: '50%', width: '50%', height: '50%' }
    ];
  }
  return [];
}

// ---------- MULTI-TOUCH YÖNLENDİRME ----------
function setupTouchListeners() {
  gameContainer.addEventListener('touchstart', (e) => handleTouch(e, 'start'), { passive: false });
  gameContainer.addEventListener('touchmove', (e) => handleTouch(e, 'move'), { passive: false });
  gameContainer.addEventListener('touchend', (e) => handleTouch(e, 'end'));
  gameContainer.addEventListener('touchcancel', (e) => handleTouch(e, 'end'));
}

function handleTouch(e, type) {
  e.preventDefault();
  const touches = e.changedTouches;
  for (const touch of touches) {
    const targetIdx = getPlayerIndexFromPoint(touch.clientX, touch.clientY);
    if (targetIdx === null || !gameInstances[targetIdx]) continue;

    const { instance, canvas } = gameInstances[targetIdx];
    const rect = canvas.getBoundingClientRect();
    const relX = (touch.clientX - rect.left) / rect.width;
    const relY = (touch.clientY - rect.top) / rect.height;

    if (type === 'start' && instance.onTouchStart) {
      instance.onTouchStart(touch.identifier, relX, relY);
    } else if (type === 'move' && instance.onTouchMove) {
      instance.onTouchMove(touch.identifier, relX, relY);
    } else if ((type === 'end' || type === 'cancel') && instance.onTouchEnd) {
      instance.onTouchEnd(touch.identifier, relX, relY);
    }
  }
}

function getPlayerIndexFromPoint(clientX, clientY) {
  for (let i = 0; i < gameInstances.length; i++) {
    const rect = gameInstances[i].element.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right &&
        clientY >= rect.top && clientY <= rect.bottom) {
      return i;
    }
  }
  return null;
}