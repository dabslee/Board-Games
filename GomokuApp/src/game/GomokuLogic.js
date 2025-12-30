// GomokuLogic.js

export const createBoard = (size = 15) => {
    const board = [];
    for (let i = 0; i < size; i++) {
        board[i] = Array(size).fill(null);
    }
    return board;
};

// Check for win starting from (row, col) in direction (dr, dc)
const checkDirection = (board, row, col, dr, dc, color) => {
    const size = board.length;
    let count = 0;

    // Check forward
    let r = row;
    let c = col;
    while (
        r >= 0 && r < size &&
        c >= 0 && c < size &&
        board[r][c] === color
    ) {
        count++;
        r += dr;
        c += dc;
    }

    // Check backward
    r = row - dr;
    c = col - dc;
    while (
        r >= 0 && r < size &&
        c >= 0 && c < size &&
        board[r][c] === color
    ) {
        count++;
        r -= dr;
        c -= dc;
    }

    // Forward loop counts (row, col).
    // Backward loop starts at (row-dr, col-dc).
    // So (row, col) is counted ONCE.
    return count >= 5;
};

export const checkWin = (board, row, col, color) => {
    if (!board || row === null || col === null) return false;
    if (checkDirection(board, row, col, 0, 1, color)) return true;
    if (checkDirection(board, row, col, 1, 0, color)) return true;
    if (checkDirection(board, row, col, 1, 1, color)) return true;
    if (checkDirection(board, row, col, 1, -1, color)) return true;
    return false;
};

export const getValidMoves = (board) => {
    const size = board.length;
    const moves = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (board[i][j] === null) {
                moves.push({ row: i, col: j });
            }
        }
    }
    return moves;
};

// --- Heuristics & Evaluation ---

// Patterns
const PATTERNS = {
    WIN: /(?=(XXXXX))/g,
    LIVE_4: /(?=(\.XXXX\.))/g,
    DEAD_4: [
        /(?=(\.XXXXO))/g, /(?=(OXXXX\.))/g,
        /(?=(\.X\.XXX\.))/g, /(?=(\.XXX\.X\.))/g, /(?=(\.XX\.XX\.))/g
    ],
    LIVE_3: [
        /(?=(\.XXX\.))/g,
        /(?=(\.X\.XX\.))/g,
        /(?=(\.XX\.X\.))/g
    ],
    DEAD_3: [
        /(?=(\.XXXO))/g, /(?=(OXXX\.))/g
    ],
    LIVE_2: /(?=(\.XX\.))/g
};

const SCORES = {
    WIN: 1000000,
    LIVE_4: 100000,
    DEAD_4: 5000,
    LIVE_3: 5000,
    DEAD_3: 1000,
    LIVE_2: 200,
};

// Cache for line scores? Not easily possible with just regex unless we cache string->score.
const STRING_SCORE_CACHE = new Map();

const getLineScore = (lineStr) => {
    if (STRING_SCORE_CACHE.has(lineStr)) return STRING_SCORE_CACHE.get(lineStr);

    let score = 0;
    if (PATTERNS.WIN.test(lineStr)) {
        STRING_SCORE_CACHE.set(lineStr, SCORES.WIN);
        return SCORES.WIN;
    }

    const live4 = lineStr.match(PATTERNS.LIVE_4);
    if (live4) score += live4.length * SCORES.LIVE_4;

    for (let p of PATTERNS.DEAD_4) {
        const m = lineStr.match(p);
        if (m) score += m.length * SCORES.DEAD_4;
    }

    for (let p of PATTERNS.LIVE_3) {
        const m = lineStr.match(p);
        if (m) score += m.length * SCORES.LIVE_3;
    }

    for (let p of PATTERNS.DEAD_3) {
        const m = lineStr.match(p);
        if (m) score += m.length * SCORES.DEAD_3;
    }

    const live2 = lineStr.match(PATTERNS.LIVE_2);
    if (live2) score += live2.length * SCORES.LIVE_2;

    // Limit cache size?
    if (STRING_SCORE_CACHE.size > 10000) STRING_SCORE_CACHE.clear();
    STRING_SCORE_CACHE.set(lineStr, score);
    return score;
};

// Zobrist Hashing (Simplified) - Use String representation for simplicity first, or simple hash
// A full Zobrist implementation requires initializing a 3D array of random numbers.
// Given JS speed, a simple string key might be "okay" for partial caching, but board.toString() is big.
// Let's use a weak hash: sum of (value * position_index).
// No, that collision rate is high.
// Let's rely on standard Alpha-Beta pruning first.
// Transposition Table with Map<String, val> where String is board representation.
const TRANSPOSITION_TABLE = new Map();

export const evaluateBoard = (board, color, opponentColor) => {
    // Generate Key?
    // Doing full key gen every time might be slow.
    // Let's profile.

    let score = 0;
    const size = board.length;
    const lines = [];

    // Rows
    for (let r = 0; r < size; r++) lines.push(board[r]);
    // Cols
    for (let c = 0; c < size; c++) {
        const line = [];
        for (let r = 0; r < size; r++) line.push(board[r][c]);
        lines.push(line);
    }
    // Diagonals
    for (let k = 0; k < size * 2; k++) {
        const line = [];
        for (let j = 0; j <= k; j++) {
            const i = k - j;
            if (i < size && j < size) line.push(board[i][j]);
        }
        if (line.length >= 5) lines.push(line);
    }
    for (let k = 0; k < size * 2; k++) {
        const line = [];
        for (let j = 0; j <= k; j++) {
            const i = k - j;
            const c = size - 1 - j;
            if (i < size && c >= 0) line.push(board[i][c]);
        }
        if (line.length >= 5) lines.push(line);
    }

    for (const line of lines) {
        // Optimization: Don't map if empty?
        // We need to check patterns.
        const myStr = 'O' + line.map(c => c === color ? 'X' : (c === null ? '.' : 'O')).join('') + 'O';
        const oppStr = 'O' + line.map(c => c === opponentColor ? 'X' : (c === null ? '.' : 'O')).join('') + 'O';

        const myScore = getLineScore(myStr);
        const oppScore = getLineScore(oppStr);

        if (myScore >= SCORES.WIN) return SCORES.WIN;
        if (oppScore >= SCORES.WIN) return -SCORES.WIN;

        score += myScore - oppScore * 1.2;
    }

    return score;
};


// --- Minimax with Optimizations ---

const getRelevantMoves = (board, validMoves) => {
     const size = board.length;
     // Filter first
     const moves = validMoves.filter(move => {
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                const r = move.row + dr;
                const c = move.col + dc;
                if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] !== null) {
                    return true;
                }
            }
        }
        const center = Math.floor(size / 2);
        if (validMoves.length === size * size) return move.row === center && move.col === center;
        return false;
    });

    // Sort Moves (Move Ordering) for Alpha-Beta
    // Heuristic: Proximity to center (simple) + Proximity to existing stones?
    // Better: Check if move creates a line? Expensive.
    // Let's use a "Gravity" or "Impact" score:
    // Count filled neighbors in 1-radius.
    moves.sort((a, b) => {
        const scoreA = getNeighborScore(board, a.row, a.col);
        const scoreB = getNeighborScore(board, b.row, b.col);
        return scoreB - scoreA; // Descending
    });

    return moves;
};

const getNeighborScore = (board, r, c) => {
    let score = 0;
    const size = board.length;
    // Check 1-radius
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr===0 && dc===0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] !== null) {
                score++;
            }
        }
    }
    // Bias towards center
    const center = Math.floor(size/2);
    const dist = Math.abs(r - center) + Math.abs(c - center);
    return score * 10 - dist;
};

const yieldToEventLoop = () => new Promise(resolve => setTimeout(resolve, 0));

const minimax = async (board, depth, alpha, beta, isMaximizing, aiColor, opponentColor, signal, maxDepth = depth) => {
    if (signal?.aborted) throw new Error('Aborted');

    // Transposition Table Check?
    // Key generation cost vs Eval cost.
    // Let's skip for now, evaluateBoard is dominant.

    if (depth === 0) {
        return evaluateBoard(board, aiColor, opponentColor);
    }

    const validMoves = getValidMoves(board);
    const moves = getRelevantMoves(board, validMoves);
    if (moves.length === 0) return 0;

    if (depth >= 2) await yieldToEventLoop();

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            board[move.row][move.col] = aiColor;
            if (checkWin(board, move.row, move.col, aiColor)) {
                 board[move.row][move.col] = null;
                 return SCORES.WIN - (maxDepth - depth);
            }

            const evalScore = await minimax(board, depth - 1, alpha, beta, false, aiColor, opponentColor, signal, maxDepth);

            board[move.row][move.col] = null;
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            board[move.row][move.col] = opponentColor;
             if (checkWin(board, move.row, move.col, opponentColor)) {
                 board[move.row][move.col] = null;
                 return -SCORES.WIN + (maxDepth - depth);
            }

            const evalScore = await minimax(board, depth - 1, alpha, beta, true, aiColor, opponentColor, signal, maxDepth);

            board[move.row][move.col] = null;
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

// Opening Book
const getOpeningMove = (board, aiColor) => {
    const size = board.length;
    const center = Math.floor(size / 2);

    // Count stones
    let stones = 0;
    let lastMove = null;
    for(let r=0; r<size; r++) {
        for(let c=0; c<size; c++) {
            if(board[r][c] !== null) {
                stones++;
                lastMove = {row: r, col: c};
            }
        }
    }

    // If empty (AI starts black), play center
    if (stones === 0) return { row: center, col: center };

    // If 1 stone (Player starts black), play diagonal or direct block depending on preference.
    // Standard is usually diagonal for more complexity, or direct for defense.
    // Let's play diagonal close.
    if (stones === 1) {
        // If center is taken
        if (lastMove.row === center && lastMove.col === center) {
            return { row: center - 1, col: center - 1 };
        }
        // If center is free, take it
        return { row: center, col: center };
    }

    return null; // No book move
};

export const getBestMove = async (originalBoard, aiColor, level, signal) => {
    // 1. Opening Book Check
    const bookMove = getOpeningMove(originalBoard, aiColor);
    if (bookMove && !originalBoard[bookMove.row][bookMove.col]) {
        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));
        return bookMove;
    }

    const board = originalBoard.map(row => [...row]);
    const validMoves = getValidMoves(board);
    if (validMoves.length === 0) return null;

    const opponentColor = aiColor === 'black' ? 'white' : 'black';
    const moves = getRelevantMoves(board, validMoves);
    const candidates = moves.length > 0 ? moves : validMoves;

    if (level === 'easy') {
        // Heuristic search without full minimax
        let bestScore = -Infinity;
        let bestMoves = [];

        for (const move of candidates) {
            if (signal?.aborted) throw new Error('Aborted');
            await yieldToEventLoop();

            board[move.row][move.col] = aiColor;
            if (checkWin(board, move.row, move.col, aiColor)) {
                board[move.row][move.col] = null;
                return move;
            }
            let score = evaluateBoard(board, aiColor, opponentColor);
            board[move.row][move.col] = null;

            board[move.row][move.col] = opponentColor;
            if (checkWin(board, move.row, move.col, opponentColor)) {
                score += SCORES.DEAD_4 * 10;
            }
            board[move.row][move.col] = null;

            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (score === bestScore) {
                bestMoves.push(move);
            }
        }
        const randomBestIndex = Math.floor(Math.random() * bestMoves.length);
        return bestMoves[randomBestIndex];
    }

    // Medium / Hard / Extreme (minimax)
    let depth = 2; // medium by default
    if (level === 'hard') depth = 3;
    if (level === 'extreme') depth = 4;
    const searchDepth = depth - 1; // one ply is spent placing the candidate move

    let bestMove = null;
    let bestVal = -Infinity;

    for (const move of candidates) {
        if (signal?.aborted) throw new Error('Aborted');
        await yieldToEventLoop();

        board[move.row][move.col] = aiColor;
        if (checkWin(board, move.row, move.col, aiColor)) {
            board[move.row][move.col] = null;
            return move;
        }

        const moveVal = await minimax(board, searchDepth, -Infinity, Infinity, false, aiColor, opponentColor, signal, searchDepth);

        board[move.row][move.col] = null;

        if (moveVal > bestVal) {
            bestVal = moveVal;
            bestMove = move;
        }
    }

    return bestMove || candidates[0];
};
