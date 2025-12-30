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

// Simple heuristic AI
export const getBestMove = (board, aiColor, level) => {
    const size = board.length;
    const validMoves = getValidMoves(board);
    if (validMoves.length === 0) return null;

    // Easy: Random move
    if (level === 'easy') {
        const randomIndex = Math.floor(Math.random() * validMoves.length);
        return validMoves[randomIndex];
    }

    const opponentColor = aiColor === 'black' ? 'white' : 'black';

    // Medium: Block immediate threats (4 in a row, open 3) or win if possible
    let bestScore = -Infinity;
    let bestMoves = [];

    // Optimization: Only check moves around existing stones
    const relevantMoves = validMoves.filter(move => {
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                const r = move.row + dr;
                const c = move.col + dc;
                if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] !== null) {
                    return true;
                }
            }
        }
        // If board is empty, center is relevant
        const center = Math.floor(size / 2);
        if (validMoves.length === size * size) return move.row === center && move.col === center;
        return false;
    });

    // If no relevant moves found (shouldn't happen unless empty), pick random from all valid
    const candidates = relevantMoves.length > 0 ? relevantMoves : validMoves;

    for (const move of candidates) {
        // Temporarily make the move
        board[move.row][move.col] = aiColor;

        let score = evaluateBoard(board, aiColor, opponentColor);

        // Also check if this move blocks an opponent win
        board[move.row][move.col] = opponentColor;

        // If we can win, that's top priority
        if (checkWin(board, move.row, move.col, aiColor)) {
            score = 100000;
        }

        // If opponent can win, we MUST block.
        else if (checkWin(board, move.row, move.col, opponentColor)) {
             score += 50000;
        }

        board[move.row][move.col] = null; // Undo

        if (score > bestScore) {
            bestScore = score;
            bestMoves = [move];
        } else if (score === bestScore) {
            bestMoves.push(move);
        }
    }

    const randomBestIndex = Math.floor(Math.random() * bestMoves.length);
    return bestMoves[randomBestIndex];
};

// Evaluate board for a specific player
const evaluateBoard = (board, myColor, oppColor) => {
    return Math.random(); // Add some noise for tie-breaking
};
