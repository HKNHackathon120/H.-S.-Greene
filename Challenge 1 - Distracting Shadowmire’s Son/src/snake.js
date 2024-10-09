/**
 * @param {Array<Array<Number>>} board
 */
function checkSnake(board, vb, ny, nx) {
    nx = propMod(nx, BOARD_SIZE);
    ny = propMod(ny, BOARD_SIZE);

    if(vb !== null) return board[ny][nx] > SNAKE && !vb[ny][nx];

    return board[ny][nx] > SNAKE;
}

function propMod(a, b) {
    return (a % b + b) % b;
}

/**
 * @param {Array<Array<Number>>} board
 * @param {{x:number, y:number}} snakePos
 * @param {{x:number, y:number}} newPos
 * @param {string} dir
 *
 * @returns {boolean} Possible to update the position of the snake
 */
function updateSnakePosition(board, snakePos, newPos, dir) {
    switch(board[newPos.y][newPos.x]) {
        case EMPTY:
            let queue = [];
            const vb = Array(BOARD_SIZE).fill(0).map(_ => Array(BOARD_SIZE).fill(false));
            const curDir = board[snakePos.y][snakePos.x];
            queue.push({...snakePos, dir: curDir});
            while(queue.length > 0) {
                const {x, y, dir} = queue.shift();
                vb[y][x] = true;
                const dp = DIRECTIONS[dir];
                if(dp) {
                    const nx = propMod(x+dp.x, BOARD_SIZE);
                    const ny = propMod(y+dp.y, BOARD_SIZE);
                    if(checkSnake(board, vb, ny, nx)) {
                        const ndir = board[ny][nx];
                        queue.push({x:nx, y:ny, dir: ndir});
                    } else if(queue.length == 0) {
                        board[y][x] = EMPTY;
                    }
                } else {
                    board[y][x] = EMPTY;
                }
            }
            //board[snakePos.y][snakePos.x] = EMPTY;
            board[newPos.y][newPos.x] = dir;
            break;
        case APPLE:
            board[newPos.y][newPos.x] = dir;

            const applePos = getRandomPos(board);
            board[applePos.y][applePos.x] = APPLE;
            score++;
            break;
        default:
            return false;
    }
    return true;
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {Array<string>} msgs
 */
function renderFirstScene(ctx, w, h, msgs = []) {
    const fontSize = 35;
    const padding = 10;
    const strList = [
        `Highest Score: ${highestScore}`,
        `Press Space to start`,
    ];
    let y = (h - (strList.length*fontSize + padding))/2;
    ctx.font = `${fontSize}px bold`;
    ctx.fillStyle = 'white';
    for(let str of msgs) {
        const x = (w - ctx.measureText(str).width)/2;
        ctx.fillText(str, x + padding, y + padding);
        y += fontSize;
    }
    for(let str of strList) {
        const x = (w - ctx.measureText(str).width)/2;
        ctx.fillText(str, x + padding, y + padding);
        y += fontSize;
    }
    ctx.stroke();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 */
function renderScore(ctx, x, y) {
    const fontSize = 28;
    const padding = 10;
    ctx.font = `${fontSize}px bold`;
    ctx.fillStyle = 'white';
    ctx.fillText(`Score: ${score}`, x + padding, y + padding);
    ctx.stroke();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
function renderBoard(ctx, board) {
    for(let row = 0; row < BOARD_SIZE; row++) {
        for(let col = 0; col < BOARD_SIZE; col++) {
            let color = 'black';
            switch(board[row][col]) {
                case EMPTY:
                    break;
                case APPLE:
                    color = 'red';
                    break;
                default:
                    color = 'green';
                    break;
            }
            ctx.fillStyle = color;
            ctx.fillRect(col * BOARD_CELL_WIDTH + PADDING, row*BOARD_CELL_HEIGHT, BOARD_CELL_WIDTH, BOARD_CELL_HEIGHT)
            //ctx.fillStyle = 'white';
            //ctx.strokeRect(col * BOARD_CELL_WIDTH + PADDING, row*BOARD_CELL_HEIGHT, BOARD_CELL_WIDTH, BOARD_CELL_HEIGHT)
        }
    }
    ctx.stroke();
}

(() => {
    const canvas = document.getElementById('game');
    canvas.width = 800;
    canvas.height = 800;

    let snakePos, snakeDir, snakeODir;

    let board = Array(BOARD_SIZE).fill(0).map(_ => Array(BOARD_SIZE).fill(EMPTY));
    const ctx = canvas.getContext("2d");

    let otherMsgs = [];

    window.addEventListener('keydown', (e) => {
        let newDir = undefined;
        let newODir = undefined;
        switch(e.code) {
            case 'ArrowLeft':
                newDir = SNAKE_LEFT;
                newODir = SNAKE_RIGHT;
                break;
            case 'ArrowRight':
                newDir = SNAKE_RIGHT;
                newODir = SNAKE_LEFT;
                break;
            case 'ArrowUp':
                newDir = SNAKE_UP;
                newODir = SNAKE_DOWN;
                break;
            case 'ArrowDown':
                newDir = SNAKE_DOWN;
                newODir = SNAKE_UP;
                break;
            case 'KeyA':
                newDir = SNAKE_LEFT;
                newODir = SNAKE_RIGHT;
                break;
            case 'KeyD':
                newDir = SNAKE_RIGHT;
                newODir = SNAKE_LEFT;
                break;
            case 'KeyW':
                newDir = SNAKE_UP;
                newODir = SNAKE_DOWN;
                break;
            case 'KeyS':
                newDir = SNAKE_DOWN;
                newODir = SNAKE_UP;
                break;
            case 'Space':
                if(!playingState) {
                    playingState = true;
                    // Reset board
                    otherMsgs = [];
                    board.forEach(r => r.fill(EMPTY));

                    snakePos = getRandomPos(board);
                    snakeDir = SNAKE_RIGHT;
                    snakeODir = SNAKE_LEFT;

                    board[snakePos.y][snakePos.x] = snakeODir;

                    const applePos = getRandomPos(board);
                    board[applePos.y][applePos.x] = APPLE;
                    score = 0;
                }
                break;
        }
        const dir = DIRECTIONS[newDir];
        if(newDir && !checkSnake(board, null, snakePos.y + dir.y, snakePos.x + dir.x)) {
            snakeDir = newDir;
            snakeODir = newODir;
        }

    });
    let prevTimestamp = 0;
    let frameCount = 0;
    const frame = (timestamp) => {
        //const dt = (timestamp - prevTimestamp) / 1000;
        prevTimestamp = timestamp;
        if(playingState) {
            frameCount += 1;
            if(frameCount >= FPS/4) {
                const dir = DIRECTIONS[snakeDir];
                const x = propMod(snakePos.x + dir.x, BOARD_SIZE);
                const y = propMod(snakePos.y + dir.y, BOARD_SIZE);


                if(!updateSnakePosition(board, snakePos, {x, y}, snakeODir)) {
                    if(score > highestScore) highestScore = score;

                    otherMsgs.push(`Current score: ${score}`);
                    playingState = false;
                } else {
                    snakePos.x = x;
                    snakePos.y = y;
                    frameCount = 0;
                    renderBoard(ctx, board);
                    renderScore(ctx, 20, 20);
                }
            }
        } else {
            renderBoard(ctx, board);
            renderFirstScene(ctx, WIDTH, HEIGHT, otherMsgs);
        }
        window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame((timestamp) => {
        prevTimestamp = timestamp;
        window.requestAnimationFrame(frame);
    });
})()
