// Setup basic UI toggles
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
const H = canvas.height;

// ===== USER AUTHENTICATION & STORAGE =====
let currentUser = null;
let maxLevel = 10;
let userState = { level: 1, lives: 3 };

function saveProgress() {
    if (currentUser) {
        localStorage.setItem(`mario_user_${currentUser}`, JSON.stringify(userState));
    }
    updateHUD();
}

function loadProgress(username) {
    let saved = localStorage.getItem(`mario_user_${username}`);
    if (saved) {
        userState = JSON.parse(saved);
        if (userState.lives <= 0) {
            userState.lives = 3;
        }
    } else {
        userState = { level: 1, lives: 3 };
    }
}

document.getElementById("loginBtn").onclick = () => {
    let username = document.getElementById("usernameInput").value.trim();
    if (username) {
        currentUser = username;
        loadProgress(username);
        
        document.getElementById("playerNameDisplay").innerText = username;
        document.getElementById("playerLevelDisplay").innerText = userState.level;
        document.getElementById("playerLivesDisplay").innerText = userState.lives;
        
        document.getElementById("auth-section").classList.add("hidden");
        document.getElementById("user-section").classList.remove("hidden");
        document.getElementById("startBtn").classList.remove("hidden");
    }
};

document.getElementById("logoutBtn").onclick = () => {
    currentUser = null;
    document.getElementById("usernameInput").value = "";
    document.getElementById("auth-section").classList.remove("hidden");
    document.getElementById("user-section").classList.add("hidden");
    document.getElementById("startBtn").classList.add("hidden");
};

// ===== GAME STATE & VARIABLES =====
let gameActive = false;
let currentLevelData = null;
let animationFrameId;

let cameraX = 0;
const gravity = 0.8;

const player = {
    x: 100,
    y: H - 200,
    w: 50,
    h: 50,
    speed: 7,
    vx: 0,
    vy: 0,
    jumpForce: -16,
    onGround: false
};

const keys = { left: false, right: false };

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" ||e.key ==="a") keys.left = true;
    if (e.key === "ArrowRight"||e.key ==="d") keys.right = true;
    
    if (e.key === " " && player.onGround) {
        player.vy = player.jumpForce;
        player.onGround = false;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft"|| e.key ==="a") keys.left = false;
    if (e.key === "ArrowRight"|| e.key ==="d") keys.right = false;
});

// HUD & UI Event Listeners
document.getElementById("startBtn").onclick = () => startGame(userState.level);
document.getElementById("restartBtn").onclick = () => forceRestartLevel();

function updateHUD() {
    document.getElementById("hudLevel").innerText = userState.level;
    document.getElementById("hudLives").innerText = userState.lives;
}

// ===== MODAL OVERLAYS =====
function showOverlay(title, message, btnText, callback, btn2Text = null, btn2Cb = null) {
    gameActive = false;
    document.getElementById("overlay").classList.remove("hidden");
    document.getElementById("overlayTitle").innerText = title;
    document.getElementById("overlayMessage").innerText = message;
    
    let btn = document.getElementById("overlayBtn");
    btn.innerText = btnText;
    btn.onclick = () => {
        document.getElementById("overlay").classList.add("hidden");
        callback();
    };
    
    let btn2 = document.getElementById("overlayHomeBtn");
    if (btn2Text) {
        btn2.innerText = btn2Text;
        btn2.classList.remove("hidden");
        btn2.onclick = () => {
            document.getElementById("overlay").classList.add("hidden");
            btn2Cb();
        };
    } else {
        if(btn2) btn2.classList.add("hidden");
    }
}

// ===== LEVELS DATA GENERATOR =====
function getLevel(num) {
    let data = {
        pipe: { x: 2000, y: H - 150, w: 60, h: 50 },
        platforms: [],
        disappearingPlatforms: [],
        movingPlatforms: [],
        enemies: [],
        tips: []
    };
    
    let floorY = H - 50;
    
    if (num === 1) {
        data.pipe.x = 2400;
        data.platforms = [
            { x: 0, y: floorY, w: 500, h: 50 }, // Start area
            { x: 700, y: floorY, w: 500, h: 50 }, // After gap
            { x: 1900, y: floorY, w: 800, h: 50 }, // End area
            { x: 1400, y: H - 250, w: 200, h: 20 } // Raised platform
        ];
        data.movingPlatforms = [
            // Vertical elevator
            { x: 1250, y: H - 150, w: 80, h: 20, vx: 0, vy: -2, minY: H - 350, maxY: floorY }
        ];
        data.tips = [
            { x: 100, y: H - 150, text: "Welcome! Arrows to Move | SPACE to Jump" },
            { x: 500, y: H - 150, text: "Watch out for the cliff!" },
            { x: 1150, y: H - 200, text: "Wait for the moving elevator" }
        ];
    }
    else if (num === 2) {
        data.pipe.x = 2600;
        data.platforms = [
            { x: 0, y: floorY, w: 400, h: 50 },
            { x: 600, y: H - 120, w: 100, h: 20 },
            { x: 900, y: H - 170, w: 100, h: 20 },
            { x: 1200, y: floorY, w: 500, h: 50 },
            { x: 2000, y: floorY, w: 800, h: 50 }
        ];
        data.enemies = [
            { x: 1400, y: floorY - 50, w: 50, h: 50, vx: 2, minX: 1200, maxX: 1650 }
        ];
        data.tips = [
            { x: 1250, y: H - 200, text: "Avoid the red enemies! Jump over them." }
        ];
    }
    else if (num === 3) {
        data.pipe.x = 2200;
        data.platforms = [
            { x: 0, y: floorY, w: 300, h: 50 },
            { x: 1100, y: floorY, w: 150, h: 50 },
            { x: 2100, y: floorY, w: 600, h: 50 }
        ];
        data.movingPlatforms = [
            { x: 300, y: floorY - 50, w: 150, h: 20, vx: 3, vy: 0, minX: 300, maxX: 950 },
            { x: 1300, y: floorY - 50, w: 150, h: 20, vx: 3, vy: 0, minX: 1300, maxX: 1950 }
        ];
        data.tips = [
            { x: 100, y: H - 200, text: "Timing is everything here." }
        ];
    }
    else {
        // Procedurally generated levels 4-10
        data.pipe.x = 3000 + (num * 250);
        data.platforms = [ 
            { x: 0, y: floorY, w: 350, h: 50 }, 
            { x: data.pipe.x - 200, y: floorY, w: 600, h: 50 } 
        ];
        
        let seed = num * 1337;
        let pRandom = () => {
            let x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        let lastX = 350;
        for(let i = 0; i < num + 3; i++) {
            let gap = 60 + pRandom() * 80;
            let w = 150 + pRandom() * 200;
            let yOffset = pRandom() * 120;
            
            let r = pRandom();
            if (r < 0.45) {
                // Normal platform, maybe an enemy
                data.platforms.push({ x: lastX + gap, y: floorY - yOffset, w: w, h: 20 });
                if(pRandom() < 0.4) {
                    let e_speed = 1.5 + (num * 0.15);
                    data.enemies.push({ 
                        x: lastX + gap + w/2, 
                        y: floorY - yOffset - 50, 
                        w: 50, h: 50, 
                        vx: e_speed, 
                        minX: lastX + gap, 
                        maxX: lastX + gap + w - 50 
                    });
                }
            } else if (r < 0.65) {
                // Moving platform
                let isVertical = pRandom() < 0.5;
                if(isVertical) {
                    data.movingPlatforms.push({ 
                        x: lastX + gap, y: floorY - yOffset, w: 100, h: 20, 
                        vx: 0, vy: -2 - pRandom() * 2, 
                        minY: floorY - yOffset - 250, maxY: floorY 
                    });
                } else {
                    data.movingPlatforms.push({ 
                        x: lastX + gap, y: floorY - yOffset, w: 100, h: 20, 
                        vx: 2 + pRandom() * 3, vy: 0, 
                        minX: lastX + gap, maxX: lastX + gap + 250 
                    });
                    lastX += + 250;
                }
            } else {
                // Disappearing platform
                data.disappearingPlatforms.push({ 
                    x: lastX + gap, y: floorY - yOffset, w: 100, h: 20, 
                    visible: true, timer: 0, stepped: false 
                });
            }
            lastX += gap + w;
        }
        
        if (num === 4) {
            data.tips = [{ x: 100, y: H - 200, text: "Purple platforms vanish when touched!" }];
        }
        if (num === 10) {
            data.tips = [{ x: 100, y: H - 200, text: "Final Challenge! Give it your all!" }];
        }
    }
    
    return data;
}

// ===== GAME LOGIC =====

function startGame(level) {
    document.getElementById("menu").classList.add("hidden");
    document.getElementById("hud").classList.remove("hidden");
    
    currentLevelData = getLevel(level);
    
    player.x = 100;
    player.y = H - 250;
    player.vx = 0;
    player.vy = 0;
    
    cameraX = 0;
    keys.left = false;
    keys.right = false;
    
    updateHUD();
    gameActive = true;
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    gameLoop();
}

function forceRestartLevel() {
    // Treat as losing a life
    loseLife(true);
}

function loseLife(wasForceRestart = false) {
    gameActive = false;
    userState.lives--;
    saveProgress();
    
    let cause = wasForceRestart ? "You gave up!" : "Ouch!";
    
    if (userState.lives <= 0) {
        showOverlay("GAME OVER", "You lost all lives!\nYou must return to menu.", "Home", () => {
            userState.lives = 3;
            saveProgress();
            
            document.getElementById("menu").classList.remove("hidden");
            document.getElementById("hud").classList.add("hidden");
            document.getElementById("playerLevelDisplay").innerText = userState.level;
            document.getElementById("playerLivesDisplay").innerText = userState.lives;
        });
    } else {
        showOverlay("YOU DIED", `${cause}\nLives remaining: ${userState.lives}`, "Replay", () => {
            startGame(userState.level);
        }, "Home", () => {
            document.getElementById("menu").classList.remove("hidden");
            document.getElementById("hud").classList.add("hidden");
            document.getElementById("playerLevelDisplay").innerText = userState.level;
            document.getElementById("playerLivesDisplay").innerText = userState.lives;
        });
    }
}

function winLevel() {
    gameActive = false;
    
    if (userState.level >= maxLevel) {
        showOverlay("CONGRATULATIONS!", "You've beaten Pixel Quest and saved the digital princess!", "Return to Menu", () => {
            userState.level = 1;
            userState.lives = 3;
            saveProgress();
            
            document.getElementById("menu").classList.remove("hidden");
            document.getElementById("hud").classList.add("hidden");
            document.getElementById("playerLevelDisplay").innerText = userState.level;
            document.getElementById("playerLivesDisplay").innerText = userState.lives;
        });
    } else {
        userState.level++;
        userState.lives = 3; // Refill lives for next level
        saveProgress();
        
        showOverlay("LEVEL COMPLETE", `Great job! Get ready for Level ${userState.level}`, "Next Level", () => {
            startGame(userState.level);
        });
    }
}

// ===== COLLISIONS =====
function checkPlatformCollision(p, plat) {
    let margin = Math.max(25, p.vy + 15);
    return (
        p.x < plat.x + plat.w &&
        p.x + p.w > plat.x &&
        p.y + p.h >= plat.y &&
        p.y + p.h <= plat.y + margin &&
        p.vy >= -2
    );
}

function checkHeadCollision(p, plat) {
    return (
        p.x < plat.x + plat.w &&
        p.x + p.w > plat.x &&
        p.y <= plat.y + plat.h &&
        p.y >= plat.y + plat.h - 20 &&
        p.vy < 0
    );
}

function checkEntityCollision(p, entity) {
    return (
        p.x < entity.x + (entity.w || entity.width) &&
        p.x + p.w > entity.x &&
        p.y < entity.y + (entity.h || entity.height) &&
        p.y + p.h > entity.y
    );
}

// ===== MAIN GAME LOOP =====
function gameLoop() {
    if (!gameActive) return;
    
    // Clear & background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#5C94FC"; // Mario sky blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Player Movement (X)
    if (keys.left) player.vx = -player.speed;
    else if (keys.right) player.vx = player.speed;
    else player.vx = 0;
    
    if (!player.onGround) {
        player.vx *= 0.98; // Air resistance
    }
    
    // Player Gravity (Y)
    player.vy += gravity;
    
    player.x += player.vx;
    player.y += player.vy;
    player.onGround = false;

    // Moving platforms mechanic
    for (let p of currentLevelData.movingPlatforms) {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.vx !== 0 && (p.x < p.minX || p.x + p.w > p.maxX)) p.vx *= -1;
        if (p.vy !== 0 && (p.y < p.minY || p.y > p.maxY)) p.vy *= -1;
    }

    // Disappearing platforms mechanic
    for (let p of currentLevelData.disappearingPlatforms) {
        if (p.stepped && p.visible) {
            p.timer++;
            if (p.timer > 40) {
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

    // Platforms array aggregation
    let allPlatforms = [
        ...currentLevelData.platforms, 
        ...currentLevelData.movingPlatforms, 
        ...currentLevelData.disappearingPlatforms.filter(p => p.visible)
    ];

    // Collisions with platforms
    for (let plat of allPlatforms) {
        if (checkPlatformCollision(player, plat)) {
            player.y = plat.y - player.h;
            player.vy = plat.vy ? Math.max(0, plat.vy) : 0;
            player.onGround = true;
            
            // Stick to moving platforms horizontally
            if (plat.vx) {
                player.x += plat.vx;
            }
            
            // Mark stepped on disappearing platforms
            if (plat.stepped === false) {
                plat.stepped = true;
            }
        } else if (checkHeadCollision(player, plat)) {
            player.y = plat.y + plat.h;
            player.vy = 0;
        }
    }

    // Enemies mechanic
    for (let e of currentLevelData.enemies) {
        e.x += e.vx;
        if (e.x < e.minX || e.x + e.w > e.maxX) {
            e.vx *= -1;
        }
        
        if (checkEntityCollision(player, e)) {
            return loseLife();
        }
    }

    // Win condition (Pipe)
    if (checkEntityCollision(player, currentLevelData.pipe)) {
        return winLevel();
    }

    // Death by falling out of bounds
    if (player.y > H + 100) {
        return loseLife();
    }
    
    // Prevent going backwards out of map
    if (player.x < 0) {
        player.x = 0;
    }

    // Camera follow limits (pushes right, never left)
    if (player.x > canvas.width * 0.4 + cameraX) {
        cameraX = player.x - canvas.width * 0.4;
    }

    // ===== RENDERING =====
    let cX = cameraX;

    // Tips
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "14px 'Press Start 2P', monospace";
    for(let t of currentLevelData.tips) {
        ctx.fillText(t.text, t.x - cX, t.y);
    }

    // Standard platforms (Mario Brick)
    for (let p of currentLevelData.platforms) {
        ctx.fillStyle = "#C84C0C";
        ctx.fillRect(p.x - cX, p.y, p.w, p.h);
        ctx.fillStyle = "#F8D8A8"; // Highlight
        ctx.fillRect(p.x - cX, p.y, p.w, 4);
    }

    // Moving platforms (Green)
    ctx.fillStyle = "#00A800";
    for (let p of currentLevelData.movingPlatforms) {
        ctx.fillRect(p.x - cX, p.y, p.w, p.h);
    }

    // Disappearing platforms (Dark Red)
    ctx.fillStyle = "#A80000";
    for (let p of currentLevelData.disappearingPlatforms) {
        if (p.visible) {
            ctx.fillRect(p.x - cX, p.y, p.w, p.h);
        }
    }

    // Enemies (Orange Goomba)
    for (let e of currentLevelData.enemies) {
        ctx.fillStyle = "#E45C10";
        ctx.fillRect(e.x - cX, e.y, e.w, e.h);
        
        // Enemy eyes
        ctx.fillStyle = "white";
        let eyeDirectionOffset = e.vx > 0 ? 10 : 0;
        ctx.fillRect(e.x - cX + 15 + eyeDirectionOffset, e.y + 10, 8, 8);
        ctx.fillRect(e.x - cX + 30 + eyeDirectionOffset, e.y + 10, 8, 8);
    }

    // Pipe
    ctx.fillStyle = "#00A800";
    ctx.fillRect(currentLevelData.pipe.x - cX, currentLevelData.pipe.y, currentLevelData.pipe.w, currentLevelData.pipe.h);
    ctx.fillStyle = "#00F800"; // Pipe rim highlight
    ctx.fillRect(currentLevelData.pipe.x - cX - 5, currentLevelData.pipe.y, currentLevelData.pipe.w + 10, 20);

    // Player (Mario Red)
    ctx.fillStyle = "#F83800";
    ctx.fillRect(player.x - cX, player.y, player.w, player.h);

    animationFrameId = requestAnimationFrame(gameLoop);
}