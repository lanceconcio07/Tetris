const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let lines = 0;
let level = 0;
let gameInterval;
let ctx;
let nextCtx;

const TETROMINOS = {
    'I': [
        [1, 1, 1, 1]
    ],
    'O': [
        [1, 1],
        [1, 1]
    ],
    'T': [
        [0, 1, 0],
        [1, 1, 1]
    ],
    'L': [
        [1, 0],
        [1, 0],
        [1, 1]
    ]
};

const COLORS = {
    'I': '#00f0f0',
    'O': '#f0f000',
    'T': '#a000f0',
    'L': '#f0a000'
};

function initCanvas() {
    const canvas = document.getElementById('board');
    const nextCanvas = document.getElementById('next');
    
    canvas.width = BLOCK_SIZE * BOARD_WIDTH;
    canvas.height = BLOCK_SIZE * BOARD_HEIGHT;
    nextCanvas.width = BLOCK_SIZE * 4;
    nextCanvas.height = BLOCK_SIZE * 4;
    
    ctx = canvas.getContext('2d');
    nextCtx = nextCanvas.getContext('2d');
    
    // Scale for crisp rendering
    ctx.scale(1, 1);
    nextCtx.scale(1, 1);
}

function initBoard() {
    board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
}

function createPiece() {
    const types = Object.keys(TETROMINOS);
    const type = types[Math.floor(Math.random() * types.length)];
    const piece = TETROMINOS[type];
    
    return {
        shape: piece,
        type: type,
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(piece[0].length / 2),
        y: 0,
        color: COLORS[type]
    };
}

function draw() {
    // Clear main canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw board
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(ctx, x, y, '#808080');
            }
        });
    });
    
    // Draw current piece
    if (currentPiece) {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawBlock(ctx, currentPiece.x + x, currentPiece.y + y, currentPiece.color);
                }
            });
        });
    }

    // Draw grid
    drawGrid();

    // Draw next piece preview
    drawNextPiece();
}

function drawNextPiece() {
    if (!nextPiece) return;

    // Clear next piece canvas
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCtx.canvas.width, nextCtx.canvas.height);

    // Calculate center position for the next piece
    const centerX = Math.floor((4 - nextPiece.shape[0].length) / 2);
    const centerY = Math.floor((4 - nextPiece.shape.length) / 2);

    // Draw next piece
    nextPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(nextCtx, centerX + x, centerY + y, nextPiece.color);
            }
        });
    });

    // Draw grid for next piece
    nextCtx.strokeStyle = '#333';
    nextCtx.lineWidth = 0.5;
    for (let x = 0; x <= 4; x++) {
        nextCtx.beginPath();
        nextCtx.moveTo(x * BLOCK_SIZE, 0);
        nextCtx.lineTo(x * BLOCK_SIZE, nextCtx.canvas.height);
        nextCtx.stroke();
    }
    for (let y = 0; y <= 4; y++) {
        nextCtx.beginPath();
        nextCtx.moveTo(0, y * BLOCK_SIZE);
        nextCtx.lineTo(nextCtx.canvas.width, y * BLOCK_SIZE);
        nextCtx.stroke();
    }
}

function drawBlock(context, x, y, color) {
    context.fillStyle = color;
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
    
    // Add 3D effect
    context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, 2); // top
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, 2, BLOCK_SIZE - 1); // left
    
    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.fillRect(x * BLOCK_SIZE + BLOCK_SIZE - 3, y * BLOCK_SIZE, 2, BLOCK_SIZE - 1); // right
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + BLOCK_SIZE - 3, BLOCK_SIZE - 1, 2); // bottom
}

function drawGrid() {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = 0; x <= BOARD_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, ctx.canvas.height);
        ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(ctx.canvas.width, y * BLOCK_SIZE);
        ctx.stroke();
    }
}

function moveDown() {
    currentPiece.y++;
    if (checkCollision()) {
        currentPiece.y--;
        mergePiece();
        clearLines();
        currentPiece = nextPiece;
        nextPiece = createPiece();
        if (checkCollision()) {
            gameOver();
            return;
        }
    }
    draw();
}

function checkCollision() {
    return currentPiece.shape.some((row, y) => {
        return row.some((value, x) => {
            if (!value) return false;
            const newX = currentPiece.x + x;
            const newY = currentPiece.y + y;
            return newX < 0 || newX >= BOARD_WIDTH || 
                   newY >= BOARD_HEIGHT ||
                   (newY >= 0 && board[newY][newX]);
        });
    });
}

function mergePiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const boardY = currentPiece.y + y;
                if (boardY >= 0) {
                    board[boardY][currentPiece.x + x] = value;
                }
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (board[y].every(cell => cell)) {
            board.splice(y, 1);
            board.unshift(Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++;
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * (level + 1);
        level = Math.floor(lines / 10);
        
        document.getElementById('score').textContent = score;
        document.getElementById('lines').textContent = lines;
        document.getElementById('level').textContent = level;
        
        // Increase game speed with level
        clearInterval(gameInterval);
        gameInterval = setInterval(moveDown, Math.max(100, 1000 - (level * 100)));
    }
}

function gameOver() {
    clearInterval(gameInterval);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.fillText(`Score: ${score}`, ctx.canvas.width / 2, ctx.canvas.height / 2 + 40);
}

function play() {
    initCanvas();
    initBoard();
    score = 0;
    lines = 0;
    level = 0;
    document.getElementById('score').textContent = score;
    document.getElementById('lines').textContent = lines;
    document.getElementById('level').textContent = level;
    
    nextPiece = createPiece();
    currentPiece = createPiece();
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(moveDown, 1000);
    draw();
}

function rotatePiece() {
    const rotated = [];
    const N = currentPiece.shape[0].length;
    const M = currentPiece.shape.length;

    for (let i = 0; i < N; i++) {
        rotated[i] = [];
        for (let j = 0; j < M; j++) {
            rotated[i][j] = currentPiece.shape[M - 1 - j][i];
        }
    }

    const originalShape = currentPiece.shape;
    currentPiece.shape = rotated;

    if (checkCollision()) {
        currentPiece.shape = originalShape;
    }
    draw();
}

function hardDrop() {
    while (!checkCollision()) {
        currentPiece.y++;
    }
    currentPiece.y--;
    mergePiece();
    clearLines();
    currentPiece = nextPiece;
    nextPiece = createPiece();
    if (checkCollision()) {
        gameOver();
        return;
    }
    draw();
}

document.addEventListener('keydown', event => {
    if (!currentPiece) return;
    
    if (event.key.startsWith('Arrow') || event.key === ' ') {
        event.preventDefault();
    }
    
    switch (event.key) {
        case 'ArrowLeft':
            currentPiece.x--;
            if (checkCollision()) currentPiece.x++;
            break;
        case 'ArrowRight':
            currentPiece.x++;
            if (checkCollision()) currentPiece.x--;
            break;
        case 'ArrowDown':
            moveDown();
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case ' ':
            hardDrop();
            break;
    }
    draw();
}); 