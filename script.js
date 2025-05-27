
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let width = canvas.width;
let height = canvas.height;

let keys = {};
let bullets = [];
let asteroids = [];
let explosions = [];
let score = 0;
let lives = 3;
let highScores = JSON.parse(localStorage.getItem("highScores") || "[]").slice(0, 5);
let paused = false;
let gameOver = false;
let showEnterName = false;
let playerName = "";

const ship = {
  x: width / 2,
  y: height / 2,
  angle: 0,
  radius: 15,
  rotation: 0,
  thrusting: false,
  thrust: { x: 0, y: 0 },
  canShoot: true,
  dead: false
};

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function createAsteroid(x, y, size) {
  return {
    x,
    y,
    dx: random(-2, 2),
    dy: random(-2, 2),
    size,
    radius: size === "large" ? 50 : size === "medium" ? 30 : 15
  };
}

function spawnAsteroids(count = 4) {
  for (let i = 0; i < count; i++) {
    asteroids.push(createAsteroid(random(0, width), random(0, height), "large"));
  }
}

function drawShip() {
  if (ship.dead) return;
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.strokeStyle = "#0ff";
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-10, -10);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function updateShip() {
  if (ship.dead) return;

  if (keys["ArrowLeft"]) ship.angle -= 0.07;
  if (keys["ArrowRight"]) ship.angle += 0.07;
  if (keys["ArrowUp"]) {
    ship.thrust.x += Math.cos(ship.angle) * 0.1;
    ship.thrust.y += Math.sin(ship.angle) * 0.1;
  }

  ship.x += ship.thrust.x;
  ship.y += ship.thrust.y;

  ship.thrust.x *= 0.99;
  ship.thrust.y *= 0.99;

  if (ship.x < 0) ship.x = width;
  if (ship.x > width) ship.x = 0;
  if (ship.y < 0) ship.y = height;
  if (ship.y > height) ship.y = 0;
}

function shootBullet() {
  if (ship.canShoot && !ship.dead) {
    bullets.push({
      x: ship.x + Math.cos(ship.angle) * 20,
      y: ship.y + Math.sin(ship.angle) * 20,
      dx: Math.cos(ship.angle) * 6,
      dy: Math.sin(ship.angle) * 6
    });
    ship.canShoot = false;
    setTimeout(() => ship.canShoot = true, 300);
  }
}

function drawBullets() {
  ctx.fillStyle = "#fff";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateBullets() {
  bullets.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;
  });
  bullets = bullets.filter(b => b.x > 0 && b.x < width && b.y > 0 && b.y < height);
}

function drawAsteroids() {
  ctx.strokeStyle = "#f0f";
  asteroids.forEach(a => {
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function updateAsteroids() {
  asteroids.forEach(a => {
    a.x += a.dx;
    a.y += a.dy;
    if (a.x < 0) a.x = width;
    if (a.x > width) a.x = 0;
    if (a.y < 0) a.y = height;
    if (a.y > height) a.y = 0;
  });
}

function checkCollisions() {
  bullets.forEach((b, bi) => {
    asteroids.forEach((a, ai) => {
      if (distance(b.x, b.y, a.x, a.y) < a.radius) {
        bullets.splice(bi, 1);
        asteroids.splice(ai, 1);
        score += 10;
        if (a.size === "large") {
          asteroids.push(createAsteroid(a.x, a.y, "medium"));
          asteroids.push(createAsteroid(a.x, a.y, "medium"));
        } else if (a.size === "medium") {
          asteroids.push(createAsteroid(a.x, a.y, "small"));
          asteroids.push(createAsteroid(a.x, a.y, "small"));
        }
      }
    });
  });

  if (!ship.dead) {
    asteroids.forEach((a) => {
      if (distance(ship.x, ship.y, a.x, a.y) < a.radius + ship.radius) {
        lives--;
        if (lives <= 0) {
          ship.dead = true;
          gameOver = true;
          handleHighScore();
        } else {
          resetShip();
        }
      }
    });
  }
}

function resetShip() {
  ship.x = width / 2;
  ship.y = height / 2;
  ship.thrust = { x: 0, y: 0 };
  ship.angle = 0;
}

function handleHighScore() {
  const entry = { name: prompt("Name für Highscore?") || "Player", score };
  highScores.push(entry);
  highScores.sort((a, b) => b.score - a.score);
  highScores = highScores.slice(0, 5);
  localStorage.setItem("highScores", JSON.stringify(highScores));
}

function drawScore() {
  ctx.fillStyle = "#0f0";
  ctx.font = "20px monospace";
  ctx.fillText("Score: " + score, 20, 30);
  ctx.fillText("Lives: " + lives, 20, 60);
}

function drawHighScores() {
  ctx.fillStyle = "#fff";
  ctx.font = "16px monospace";
  ctx.fillText("Highscores:", width - 160, 30);
  highScores.forEach((h, i) => {
    ctx.fillText(`${i + 1}. ${h.name} - ${h.score}`, width - 160, 50 + i * 20);
  });
}

function togglePause() {
  paused = !paused;
}

function updateGame() {
  if (paused || gameOver) return;

  ctx.clearRect(0, 0, width, height);
  updateShip();
  updateBullets();
  updateAsteroids();
  checkCollisions();
  drawShip();
  drawBullets();
  drawAsteroids();
  drawScore();
  drawHighScores();

  if (asteroids.length === 0) spawnAsteroids();
}

function gameLoop() {
  requestAnimationFrame(gameLoop);
  updateGame();
}

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === " ") shootBullet();
  if (e.key.toLowerCase() === "p") togglePause();
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

spawnAsteroids();
gameLoop();
