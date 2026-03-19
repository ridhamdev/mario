document.getElementById("howBtn").onclick = () => {
    document.getElementById("howToPlay").classList.remove("hidden");
};

document.getElementById("closeHow").onclick = () => {
    document.getElementById("howToPlay").classList.add("hidden");
};
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== GAME STATE =====
let gameStarted = false;

document.getElementById("startBtn").onclick = () => {
    gameStarted = true;
    document.getElementById("menu").style.display = "none";
    document.getElementById("hud").style.display = "block";
};

// Sound
const jumpSound = new Audio("jump.mp3");

// Camera
let cameraX = 0;

// Player
const player = {
    x: 100,
    y: canvas.height - 200,
    width: 50,
    height: 50,
    speed: 5,
    vx: 0,
    vy: 0,
    jumpForce: -15,
    onGround: false
};

// ===== LEVEL DESIGN (RAGE CONTROLLED) =====

// Pipe (goal)
const pipe = {
    x: 1700,
    y: canvas.height - 150,
    width: 60,
    height: 50
};

// Minimal platforms (intentional design)
const platforms = [
    { x: 0, y: canvas.height - 50, width: 500, height: 50 },
    { x: 550, y: canvas.height - 140, width: 100, height: 20 },
    { x: 1150, y: canvas.height - 160, width: 120, height: 20 },
    { x: 1450, y: canvas.height - 120, width: 200, height: 20 }
];

// DOUBLE disappearing trap (core rage mechanic)
const disappearingPlatforms = [
    {
        x: 750,
        y: canvas.height - 220,
        width: 100,
        height: 20,
        visible: true,
        timer: 0,
        stepped: false
    },
    {
        x: 950,
        y: canvas.height - 180,
        width: 100,
        height: 20,
        visible: true,
        timer: 0,
        stepped: false
    }
];

// Panic enemy near landing
const enemies = [
    {
        x: 1200,
        y: canvas.height - 210,
        width: 50,
        height: 50,
        vx: 2,
        minX: 1150,
        maxX: 1400
    }
];

// Physics
const gravity = 0.8;

// Keys
const keys = { left: false, right: false };

// Controls
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") keys.left = true;
    if (e.key === "ArrowRight") keys.right = true;

    if (e.key === " " && player.onGround) {
        player.vy = player.jumpForce;
        player.onGround = false;

        jumpSound.currentTime = 0;
        jumpSound.play();
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") keys.left = false;
    if (e.key === "ArrowRight") keys.right = false;
});

// ===== COLLISIONS =====

function checkPlatformCollision(player, platform) {
    return (
        player.x < platform.x + platform.width &&
        player.x + player.width > platform.x &&
        player.y + player.height >= platform.y &&
        player.y + player.height <= platform.y + 20 &&
        player.vy >= 0
    );
}

function checkHeadCollision(player, platform) {
    return (
        player.x < platform.x + platform.width &&
        player.x + player.width > platform.x &&
        player.y <= platform.y + platform.height &&
        player.y >= platform.y &&
        player.vy < 0
    );
}

function checkPlayerEnemyCollision(player, enemy) {
    return (
        player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y
    );
}

function checkPipeCollision(player, pipe) {
    return (
        player.x < pipe.x + pipe.width &&
        player.x + player.width > pipe.x &&
        player.y < pipe.y + pipe.height &&
        player.y + player.height > pipe.y
    );
}

// ===== GAME LOOP =====

function gameLoop() {

    if (!gameStarted) {
        requestAnimationFrame(gameLoop);
        return;
    }

    // Background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Movement
    if (keys.left) player.vx = -player.speed;
    else if (keys.right) player.vx = player.speed;
    else player.vx = 0;

    // Slight air control reduction (rage factor)
    if (!player.onGround) {
        player.vx *= 0.98;
    }

    // Gravity
    player.vy += gravity;

    // Update position
    player.x += player.vx;
    player.y += player.vy;

    player.onGround = false;

    // ===== DISAPPEARING LOGIC =====
    for (let p of disappearingPlatforms) {

        if (p.stepped && p.visible) {
            p.timer++;

            if (p.timer > 40) { // tight but fair
                p.visible = false;
                p.timer = 0;
            }
        }

        if (!p.visible) {
            p.timer++;

            if (p.timer > 180) {
                p.visible = true;
                p.timer = 0;
                p.stepped = false;
            }
        }
    }

    // Combine platforms
    const allPlatforms = [
        ...platforms,
        ...disappearingPlatforms.filter(p => p.visible)
    ];

    // Collisions
    for (let platform of allPlatforms) {

        if (checkPlatformCollision(player, platform)) {
            player.y = platform.y - player.height;
            player.vy = 0;
            player.onGround = true;

            if (disappearingPlatforms.includes(platform)) {
                platform.stepped = true;
            }
        }

        else if (checkHeadCollision(player, platform)) {
            player.y = platform.y + platform.height;
            player.vy = 0;
        }
    }

    // Enemy
    for (let enemy of enemies) {
        enemy.x += enemy.vx;

        if (enemy.x < enemy.minX || enemy.x + enemy.width > enemy.maxX) {
            enemy.vx *= -1;
        }

        if (checkPlayerEnemyCollision(player, enemy)) {
            alert("Game Over!");
            location.reload();
        }
    }

    // Fall death
    if (player.y > canvas.height) {
        alert("Too Slow 😈");
        location.reload();
    }

    // Win
    if (checkPipeCollision(player, pipe)) {
        alert("You Win!");
        location.reload();
    }

    // Camera
    if (player.x > canvas.width * 0.7) {
        cameraX = player.x - canvas.width * 0.7;
    }
    cameraX = Math.max(0, cameraX);

    // ===== DRAW =====

    // Platforms
    ctx.fillStyle = "green";
    for (let p of platforms) {
        ctx.fillRect(p.x - cameraX, p.y, p.width, p.height);
    }

    // Disappearing
    ctx.fillStyle = "purple";
    for (let p of disappearingPlatforms) {
        if (p.visible) {
            ctx.fillRect(p.x - cameraX, p.y, p.width, p.height);
        }
    }

    // Enemies
    ctx.fillStyle = "brown";
    for (let e of enemies) {
        ctx.fillRect(e.x - cameraX, e.y, e.width, e.height);
    }

    // Pipe
    ctx.fillStyle = "darkgreen";
    ctx.fillRect(pipe.x - cameraX, pipe.y, pipe.width, pipe.height);

    // Player
    ctx.fillStyle = "red";
    ctx.fillRect(player.x - cameraX, player.y, player.width, player.height);

    requestAnimationFrame(gameLoop);
}

gameLoop();