import { MiniGame2D } from './games/mini-game-2d.js';
import { MiniGame3D } from './games/mini-game-3d.js';

const menuDiv = document.getElementById('menu');
const playerSelectDiv = document.getElementById('player-select');
const gameSelectDiv = document.getElementById('game-select');
const gameContainer = document.getElementById('game-container');

let selectedPlayers = 0;
let selectedGame = '';
const gameInstances = []; // { instance, element, canvas, index }

// ---------- MENÜ ADIMLARI ----------
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

  // Oyuncu sayısına göre alanları belirle (CSS yüzde veya piksel)
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

    // İlgili oyun sınıfını örnekle
    let instance;
    if (gameName === 'mini-game-2d') {
      instance = new MiniGame2D(canvas, i);
    } else if (gameName === 'mini-game-3d') {
      instance = new MiniGame3D(canvas, i);
    } else {
      console.error('Bilinmeyen oyun:', gameName);
      return;
    }

    gameInstances.push({
      instance,
      element: playerDiv,
      canvas,
      index: i
    });
  }

  setupTouchListeners();

  // Bütün oyunları başlat
  gameInstances.forEach(g => g.instance.start());

  // Tek bir requestAnimationFrame zinciri
  function gameLoop() {
    gameInstances.forEach(g => {
      if (g.instance.update) g.instance.update();
    });
    requestAnimationFrame(gameLoop);
  }
  gameLoop();
}

// Oyuncu alanlarının CSS değerlerini üretir
function getPlayerAreas(count) {
  if (count === 1) {
    return [{ top: '0', left: '0', width: '100%', height: '100%' }];
  }
  if (count === 2) {
    return [
      { top: '0', left: '0', width: '50%', height: '100%' },
      { top: '0', left: '50%', width: '50%', height: '100%' }
    ];
  }
  if (count === 3) {
    // Üç eşit dikey sütun
    return [
      { top: '0', left: '0', width: '33.333%', height: '100%' },
      { top: '0', left: '33.333%', width: '33.333%', height: '100%' },
      { top: '0', left: '66.666%', width: '33.333%', height: '100%' }
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
    // 0-1 aralığında normalize koordinatlar
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