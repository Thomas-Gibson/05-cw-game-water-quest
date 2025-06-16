"use strict";

(function () {
  // === DOM Elements ===
  const game = document.getElementById("game");
  const jerry = document.getElementById("jerry");
  const timerElement = document.getElementById("timer");

  // === Game State ===
  let jerryX = window.innerWidth / 2 - 40;
  const keyStates = { left: false, right: false };
  const moveSpeed = 5;
  let timeLeft = 30; // seconds

  // === Overlay Elements ===
  const startOverlay = document.getElementById('start-overlay');
  const loseOverlay = document.getElementById('lose-overlay');
  const winOverlay = document.getElementById('win-overlay');
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const playAgainBtn = document.getElementById('playagain-btn');

  let gameActive = false;
  let raindropInterval = null;
  let countdown = null;

  // === Input Handling ===
  document.addEventListener("keydown", (e) => {
    if (!gameActive) return;
    if (e.key === "ArrowLeft") keyStates.left = true;
    if (e.key === "ArrowRight") keyStates.right = true;
  });

  document.addEventListener("keyup", (e) => {
    if (!gameActive) return;
    if (e.key === "ArrowLeft") keyStates.left = false;
    if (e.key === "ArrowRight") keyStates.right = false;
  });

  // === Movement ===
  function updateJerryPosition() {
    if (keyStates.left) jerryX -= moveSpeed;
    if (keyStates.right) jerryX += moveSpeed;

    // Clamp Jerry inside the 800px game region (width of Jerry is 80px)
    jerryX = Math.max(80, Math.min(800 - 80, jerryX));
    jerry.style.left = `${jerryX}px`;
  }

  function gameLoop() {
    if (gameActive) updateJerryPosition();
    requestAnimationFrame(gameLoop);
  }

  function addFiveSecondsToTimer() {
    timeLeft += 5;
  }

  // === Floating Time Notification ===
  const timeFloaters = document.getElementById("time-floaters");
  function showTimeFloater(text, color = '#2ecc40') {
    const floater = document.createElement('div');
    floater.className = 'time-floater';
    floater.textContent = text;
    floater.style.color = color;
    timeFloaters.appendChild(floater);
    setTimeout(() => {
      floater.style.opacity = '0';
      floater.style.transform = 'translateY(-40px)';
    }, 50);
    setTimeout(() => {
      floater.remove();
    }, 1200);
  }

  // === Raindrop Logic ===
  function createRaindrop() {
    if (!gameActive) return;
    const drop = document.createElement("div");
    const isDirty = Math.random() < 0.25;
    drop.classList.add("raindrop");
    if (isDirty) drop.classList.add("dirty");
    // Set random horizontal position within game area (800px), minus drop width (15px)
    drop.style.left = Math.random() * (800 - 15) + "px";
    drop.style.position = "absolute";
    drop.style.top = "0px";
    game.appendChild(drop);
    let dropY = 0;
    // Random fall speed between 5 and 10 px per frame
    const fallSpeed = 5 + Math.random() * 5;
    const fallInterval = setInterval(() => {
      dropY += fallSpeed;
      drop.style.top = `${dropY}px`;
      const dropRect = drop.getBoundingClientRect();
      const jerryRect = jerry.getBoundingClientRect();
      // Improved collision: only count as caught if drop's bottom is above Jerry's bottom and overlaps horizontally
      const verticallyAligned = dropRect.bottom >= jerryRect.top && dropRect.bottom <= jerryRect.bottom;
      const horizontallyAligned = dropRect.right > jerryRect.left && dropRect.left < jerryRect.right;
      const caught = verticallyAligned && horizontallyAligned;
      const missed = dropY > 600;
      if (caught || missed) {
        game.removeChild(drop);
        clearInterval(fallInterval);
        if (caught) {
          if (isDirty) {
            timeLeft = Math.max(0, timeLeft - 20);
            showTimeFloater('-20', '#e74c3c');
            penaltySound.currentTime = 0; penaltySound.play();
          } else {
            timeLeft += 5;
            showTimeFloater('+5', '#2ecc40');
            rewardSound.currentTime = 0; rewardSound.play();
          }
        }
      }
    }, 30);
  }

  // === Timer Logic ===
  function updateTimerDisplay() {
    timerElement.textContent = `Time: ${timeLeft}`;
    if (timeLeft >= 300) {
      endGame(true);
    }
  }

  function startTimer() {
    updateTimerDisplay();
    const countdown = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();

      if (timeLeft <= 0) {
        clearInterval(countdown);
        endGame(false);
      }
    }, 1000);
  }

  // === Sound Effects ===
  const rewardSound = new Audio('sounds/reward.mp3');
  const penaltySound = new Audio('sounds/penalty.mp3');

  // === Overlay Logic ===
  function showOverlay(overlay) {
    startOverlay.hidden = true;
    loseOverlay.hidden = true;
    winOverlay.hidden = true;
    if (overlay) overlay.hidden = false;
  }

  function startGame() {
    timeLeft = 30;
    updateTimerDisplay();
    jerryX = 800 / 2 - 40;
    jerry.style.left = `${jerryX}px`;
    // Reset key states to prevent stuck movement
    keyStates.left = false;
    keyStates.right = false;
    gameActive = true;
    showOverlay();
    if (countdown) clearInterval(countdown);
    countdown = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        endGame(false);
      }
    }, 1000);
    if (raindropInterval) clearInterval(raindropInterval);
    raindropInterval = setInterval(createRaindrop, 700);
  }

  function endGame(win) {
    gameActive = false;
    if (countdown) clearInterval(countdown);
    if (raindropInterval) clearInterval(raindropInterval);
    showOverlay(win ? winOverlay : loseOverlay);
  }

  // Button events
  startBtn.onclick = startGame;
  restartBtn.onclick = startGame;
  playAgainBtn.onclick = startGame;

  // Show start overlay on load
  showOverlay(startOverlay);

  // Start the game loop
  gameLoop();
})();
