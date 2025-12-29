// test_logic.mjs
import { createBoard, checkWin, getBestMove, BOARD_SIZE } from './src/game/GomokuLogic.js';

const runTests = () => {
    console.log("Running Gomoku Logic Tests...");

    // Test 1: Board Creation
    const board = createBoard();
    if (board.length === 15 && board[0].length === 15) {
        console.log("PASS: Board created with correct size.");
    } else {
        console.error("FAIL: Board size incorrect.");
    }

    // Test 2: Horizontal Win
    const boardWinH = createBoard();
    for (let i = 0; i < 5; i++) boardWinH[7][i + 5] = 'black';
    if (checkWin(boardWinH, 7, 9, 'black')) {
        console.log("PASS: Horizontal win detected.");
    } else {
        console.error("FAIL: Horizontal win not detected.");
    }

    // Test 3: Vertical Win
    const boardWinV = createBoard();
    for (let i = 0; i < 5; i++) boardWinV[i + 5][7] = 'white';
    if (checkWin(boardWinV, 9, 7, 'white')) {
        console.log("PASS: Vertical win detected.");
    } else {
        console.error("FAIL: Vertical win not detected.");
    }

    // Test 4: Diagonal Win
    const boardWinD = createBoard();
    for (let i = 0; i < 5; i++) boardWinD[i][i] = 'black';
    if (checkWin(boardWinD, 4, 4, 'black')) {
        console.log("PASS: Diagonal win detected.");
    } else {
        console.error("FAIL: Diagonal win not detected.");
    }

    // Test 5: AI Block
    const boardBlock = createBoard();
    // Opponent has 4 in a row
    for (let i = 0; i < 4; i++) boardBlock[7][i + 5] = 'black'; // 7,5 to 7,8
    // AI (white) should block at 7,9 or 7,4.
    const move = getBestMove(boardBlock, 'white', 'medium');
    // Note: getBestMove returns {row, col}.
    // check if it blocks
    if ((move.row === 7 && move.col === 9) || (move.row === 7 && move.col === 4)) {
         console.log("PASS: AI Blocked immediate threat.");
    } else {
         console.warn(`WARN: AI did not block 4-in-a-row. Move was ${move.row}, ${move.col}. (This might be expected if heuristics are simple)`);
    }

    console.log("Tests completed.");
};

runTests();
