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

  // === Difficulty Settings ===
  const DIFFICULTY_SETTINGS = {
    easy: {
      spawnRate: 1200, // ms between drops
      minSpeed: 3,
      maxSpeed: 6,
      toxicChance: 0.10, // 10% toxic
      toxicPenalty: 5,
      cleanReward: 7
    },
    normal: {
      spawnRate: 700,
      minSpeed: 5,
      maxSpeed: 10,
      toxicChance: 0.25,
      toxicPenalty: 10,
      cleanReward: 5
    },
    hard: {
      spawnRate: 400,
      minSpeed: 8,
      maxSpeed: 16,
      toxicChance: 0.40,
      toxicPenalty: 20,
      cleanReward: 3
    }
  };
  let currentDifficulty = 'normal';
  let settings = DIFFICULTY_SETTINGS[currentDifficulty];
  const difficultySelect = document.getElementById('difficulty-select');
  if (difficultySelect) {
    difficultySelect.addEventListener('change', (e) => {
      currentDifficulty = e.target.value;
      settings = DIFFICULTY_SETTINGS[currentDifficulty];
    });
  }

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
    if (freezeActive) return; // Prevent Jerry from moving when frozen
    let move = moveSpeed;
    if (reverseActive) move = -moveSpeed;
    if (keyStates.left) jerryX -= move;
    if (keyStates.right) jerryX += move;

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

  // === Special Drop Types ===
  const SPECIAL_DROP_TYPES = [
    {
      name: 'golden',
      color: '#FFD700',
      effect: function() {
        timeLeft += 20;
        showTimeFloater('+20', '#FFD700');
        rewardSound.currentTime = 0; rewardSound.play();
      }
    },
    {
      name: 'slowmo',
      color: '#00e6e6',
      effect: function() {
        showTimeFloater('Slow-mo!', '#00e6e6');
        slowMoActive = true;
        setTimeout(() => { slowMoActive = false; }, 4000);
      }
    },
    {
      name: 'shield',
      color: '#aaff00',
      effect: function() {
        showTimeFloater('Shield!', '#aaff00');
        shieldActive = true;
        jerry.classList.add('shielded');
        setTimeout(() => {
          shieldActive = false;
          jerry.classList.remove('shielded');
        }, 6000);
      }
    },
    {
      name: 'double',
      color: '#b266ff',
      effect: function() {
        showTimeFloater('Double!', '#b266ff');
        doublePointsActive = true;
        setTimeout(() => { doublePointsActive = false; }, 6000);
      }
    },
    {
      name: 'speedup',
      color: '#ff6600',
      effect: function() {
        showTimeFloater('Speed Up!', '#ff6600');
        speedUpActive = true;
        setTimeout(() => { speedUpActive = false; }, 4000);
      }
    },
    {
      name: 'reverse',
      color: '#ff00aa',
      effect: function() {
        showTimeFloater('Reverse!', '#ff00aa');
        reverseActive = true;
        setTimeout(() => { reverseActive = false; }, 4000);
      }
    },
    {
      name: 'blind',
      color: '#222',
      effect: function() {
        showTimeFloater('Blinded!', '#222');
        document.body.classList.add('blind');
        setTimeout(() => { document.body.classList.remove('blind'); }, 2000);
      }
    }
  ];
  let slowMoActive = false;
  let shieldActive = false;
  let doublePointsActive = false;
  let freezeActive = false;
  let speedUpActive = false;
  let reverseActive = false;

  // === Raindrop Logic ===
  function createRaindrop() {
    if (!gameActive) return;
    // 5% chance for a special drop (rare)
    const specialChance = 0.05;
    let dropType = 'normal';
    let specialDrop = null;
    if (Math.random() < specialChance) {
      specialDrop = SPECIAL_DROP_TYPES[Math.floor(Math.random() * SPECIAL_DROP_TYPES.length)];
      dropType = specialDrop.name;
    }
    const drop = document.createElement("div");
    if (dropType === 'normal') {
      const isDirty = Math.random() < settings.toxicChance;
      drop.classList.add("raindrop");
      if (isDirty) drop.classList.add("dirty");
    } else {
      drop.classList.add("raindrop", dropType);
      drop.style.background = specialDrop.color;
    }
    drop.style.left = Math.random() * (800 - 15) + "px";
    drop.style.position = "absolute";
    drop.style.top = "0px";
    game.appendChild(drop);
    let dropY = 0;
    let speedMod = 1;
    if (slowMoActive) speedMod = 0.5;
    if (speedUpActive) speedMod = 2;
    const fallSpeed = (settings.minSpeed + Math.random() * (settings.maxSpeed - settings.minSpeed)) * speedMod;
    const fallInterval = setInterval(() => {
      dropY += fallSpeed;
      drop.style.top = `${dropY}px`;
      const dropRect = drop.getBoundingClientRect();
      const jerryRect = jerry.getBoundingClientRect();
      const verticallyAligned = dropRect.bottom >= jerryRect.top && dropRect.bottom <= jerryRect.bottom;
      const horizontallyAligned = dropRect.right > jerryRect.left && dropRect.left < jerryRect.right;
      const caught = verticallyAligned && horizontallyAligned;
      const missed = dropY > 600;
      if (caught || missed) {
        game.removeChild(drop);
        clearInterval(fallInterval);
        if (caught) {
          if (dropType === 'normal') {
            const isDirty = drop.classList.contains('dirty');
            if (isDirty && !shieldActive) {
              timeLeft = Math.max(0, timeLeft - settings.toxicPenalty);
              showTimeFloater(`-${settings.toxicPenalty}`, '#e74c3c');
              penaltySound.currentTime = 0; penaltySound.play();
            } else {
              let reward = settings.cleanReward;
              if (doublePointsActive) reward *= 2;
              timeLeft += reward;
              showTimeFloater(`+${reward}`, '#2ecc40');
              rewardSound.currentTime = 0; rewardSound.play();
            }
          } else if (specialDrop) {
            specialDrop.effect();
          }
        }
      }
    }, 30);
  }

  // === Timer Logic ===
  function updateTimerDisplay() {
    timerElement.textContent = `Time: ${timeLeft}`;
    // Show milestone messages
    for (const milestone of MILESTONES) {
      if (timeLeft >= milestone.time && !shownMilestones[milestone.time]) {
        showTimeFloater(milestone.message, '#0a75bc');
        shownMilestones[milestone.time] = true;
      }
    }
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

  // === Milestone Messages ===
  const MILESTONES = [
    { time: 60, message: "Nice! 1 minute!" },
    { time: 120, message: "Great! 2 minutes!" },
    { time: 150, message: "Halfway there!" },
    { time: 200, message: "Keep going!" },
    { time: 240, message: "Almost there!" },
    { time: 270, message: "Final push!" }
  ];
  let shownMilestones = {};

  function startGame() {
    timeLeft = 30;
    updateTimerDisplay();
    jerryX = 800 / 2 - 40;
    jerry.style.left = `${jerryX}px`;
    keyStates.left = false;
    keyStates.right = false;
    gameActive = true;
    shownMilestones = {}; // Reset milestones
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
    raindropInterval = setInterval(createRaindrop, settings.spawnRate);
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
