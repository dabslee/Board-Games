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

    // We counted the starting stone in the forward loop only.
    // So the total count is correct.
    return count >= 5;
};

export const checkWin = (board, row, col, color) => {
    if (!board || row === null || col === null) return false;

    // Horizontal
    if (checkDirection(board, row, col, 0, 1, color)) return true;
    // Vertical
    if (checkDirection(board, row, col, 1, 0, color)) return true;
    // Diagonal \
    if (checkDirection(board, row, col, 1, 1, color)) return true;
    // Diagonal /
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

// --- Evaluation Logic ---

// Patterns using Lookaheads to find overlapping matches
// X = Stone, . = Empty, O = Opponent/Wall
const PATTERNS = {
    // Win: 5 in a row
    WIN: /(?=(XXXXX))/g,

    // Live 4: .XXXX. (Guaranteed win)
    LIVE_4: /(?=(\.XXXX\.))/g,

    // Dead 4: Blocked one side or Gap (Forced response)
    DEAD_4: [
        /(?=(.XXXXO))/g, /(?=(OXXXX.))/g,
        /(?=(.X\.XXX.))/g, /(?=(.XXX\.X.))/g, /(?=(.XX\.XX.))/g
    ],

    // Live 3: .XXX. (Can become Live 4)
    LIVE_3: [
        /(?=(\.XXX\.))/g,
        /(?=(\.X\.XX\.))/g,
        /(?=(\.XX\.X\.))/g
    ],

    // Dead 3: Blocked one side
    DEAD_3: [
        /(?=(.XXXO))/g, /(?=(OXXX.))/g
    ],

    // Live 2: .XX.
    LIVE_2: /(?=(\.XX\.))/g
};

const SCORES = {
    WIN: 1000000,
    LIVE_4: 100000,
    DEAD_4: 5000,
    LIVE_3: 5000,
    DEAD_3: 1000,
    LIVE_2: 200,
    OTHER: 10
};

const getLineScore = (lineStr) => {
    let score = 0;

    // Check Win
    const wins = lineStr.match(PATTERNS.WIN);
    if (wins) return SCORES.WIN; // Return early if win found

    // Check Live 4
    const live4 = lineStr.match(PATTERNS.LIVE_4);
    if (live4) score += live4.length * SCORES.LIVE_4;

    // Check Dead 4
    for (let p of PATTERNS.DEAD_4) {
        const m = lineStr.match(p);
        if (m) score += m.length * SCORES.DEAD_4;
    }

    // Check Live 3
    for (let p of PATTERNS.LIVE_3) {
        const m = lineStr.match(p);
        if (m) score += m.length * SCORES.LIVE_3;
    }

    // Check Dead 3
    for (let p of PATTERNS.DEAD_3) {
        const m = lineStr.match(p);
        if (m) score += m.length * SCORES.DEAD_3;
    }

    const live2 = lineStr.match(PATTERNS.LIVE_2);
    if (live2) score += live2.length * SCORES.LIVE_2;

    return score;
};

export const evaluateBoard = (board, color, opponentColor) => {
    let score = 0;
    const size = board.length;
    const lines = [];

    // Rows
    for (let r = 0; r < size; r++) {
        lines.push(board[r]);
    }
    // Cols
    for (let c = 0; c < size; c++) {
        const line = [];
        for (let r = 0; r < size; r++) line.push(board[r][c]);
        lines.push(line);
    }
    // Diagonals (length >= 5)
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
        // Convert to strings. Pad with O to handle boundaries as walls.
        const myStr = 'O' + line.map(c => c === color ? 'X' : (c === null ? '.' : 'O')).join('') + 'O';
        const oppStr = 'O' + line.map(c => c === opponentColor ? 'X' : (c === null ? '.' : 'O')).join('') + 'O';

        const myScore = getLineScore(myStr);
        const oppScore = getLineScore(oppStr);

        if (myScore >= SCORES.WIN) return SCORES.WIN;
        if (oppScore >= SCORES.WIN) return -SCORES.WIN;

        score += myScore - oppScore * 1.2; // Aggressive defense
    }

    return score;
};


// --- Minimax with Alpha-Beta Pruning ---

const getRelevantMoves = (board, validMoves) => {
     const size = board.length;
     return validMoves.filter(move => {
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
};

const minimax = (board, depth, alpha, beta, isMaximizing, aiColor, opponentColor) => {
    if (depth === 0) {
        return evaluateBoard(board, aiColor, opponentColor);
    }

    const validMoves = getValidMoves(board);
    const moves = getRelevantMoves(board, validMoves);
    if (moves.length === 0) return 0;

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            board[move.row][move.col] = aiColor;
            if (checkWin(board, move.row, move.col, aiColor)) {
                 board[move.row][move.col] = null;
                 return SCORES.WIN - (4 - depth);
            }
            const evalScore = minimax(board, depth - 1, alpha, beta, false, aiColor, opponentColor);
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
                 return -SCORES.WIN + (4 - depth);
            }
            const evalScore = minimax(board, depth - 1, alpha, beta, true, aiColor, opponentColor);
            board[move.row][move.col] = null;
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};


export const getBestMove = (board, aiColor, level) => {
    const validMoves = getValidMoves(board);
    if (validMoves.length === 0) return null;

    if (level === 'easy') {
        const randomIndex = Math.floor(Math.random() * validMoves.length);
        return validMoves[randomIndex];
    }

    const opponentColor = aiColor === 'black' ? 'white' : 'black';
    const moves = getRelevantMoves(board, validMoves);
    const candidates = moves.length > 0 ? moves : validMoves;

    if (level === 'medium') {
        let bestScore = -Infinity;
        let bestMoves = [];

        for (const move of candidates) {
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

    // Hard / Extreme
    let depth = 2; // Hard
    if (level === 'extreme') depth = 3;

    let bestMove = null;
    let bestVal = -Infinity;

    for (const move of candidates) {
        board[move.row][move.col] = aiColor;
        if (checkWin(board, move.row, move.col, aiColor)) {
            board[move.row][move.col] = null;
            return move;
        }

        const moveVal = minimax(board, depth - 1, -Infinity, Infinity, false, aiColor, opponentColor);
        board[move.row][move.col] = null;

        if (moveVal > bestVal) {
            bestVal = moveVal;
            bestMove = move;
        }
    }

    return bestMove || candidates[0];
};
