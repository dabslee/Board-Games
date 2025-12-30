// test_logic.mjs
import { createBoard, checkWin, getBestMove } from './src/game/GomokuLogic.js';

const runTests = () => {
    console.log("Running Gomoku Logic Tests...");
    let passed = 0;
    let failed = 0;

    const assert = (condition, message) => {
        if (condition) {
            console.log(`PASS: ${message}`);
            passed++;
        } else {
            console.error(`FAIL: ${message}`);
            failed++;
        }
    };

    // Test 1: Board Creation (Default 15x15)
    const board = createBoard();
    assert(board.length === 15 && board[0].length === 15, "Default Board created with correct size.");

    // Test 2: Board Creation (Custom 9x9)
    const board9 = createBoard(9);
    assert(board9.length === 9 && board9[0].length === 9, "9x9 Board created with correct size.");

    // Test 3: Horizontal Win
    const boardWinH = createBoard(15);
    for (let i = 0; i < 5; i++) boardWinH[7][i + 5] = 'black';
    assert(checkWin(boardWinH, 7, 9, 'black'), "Horizontal win detected.");

    // Test 4: Vertical Win
    const boardWinV = createBoard(15);
    for (let i = 0; i < 5; i++) boardWinV[i + 5][7] = 'white';
    assert(checkWin(boardWinV, 9, 7, 'white'), "Vertical win detected.");

    // Test 5: Diagonal Win
    const boardWinD = createBoard(15);
    for (let i = 0; i < 5; i++) boardWinD[i][i] = 'black';
    assert(checkWin(boardWinD, 4, 4, 'black'), "Diagonal win detected.");

    // Test 6: AI Block Immediate Threat (4 in a row)
    const boardBlock = createBoard(15);
    // Opponent has 4 in a row: .XXXX. -> Threat is XXXXX
    // 7,5 to 7,8 are black.
    for (let i = 0; i < 4; i++) boardBlock[7][i + 5] = 'black';
    // AI (white) should block at 7,9 or 7,4.
    const moveBlock = getBestMove(boardBlock, 'white', 'medium');
    assert(
        (moveBlock.row === 7 && moveBlock.col === 9) || (moveBlock.row === 7 && moveBlock.col === 4),
        `AI Blocked immediate threat (4-in-row). Move: ${JSON.stringify(moveBlock)}`
    );

    // Test 7: AI Block Open 3 (Medium Mode)
    // Opponent has .XXX. at 7,6 to 7,8
    // If ignored, becomes .XXXX. (Live 4) which is a guaranteed win.
    // AI MUST block at 7,5 or 7,9.
    const boardOpen3 = createBoard(15);
    for(let i=0; i<3; i++) boardOpen3[7][i+6] = 'black'; // 7,6; 7,7; 7,8

    // We run this multiple times because medium might be probabilistic if scores are close,
    // but here the threat is high so it should be deterministic if logic is correct.
    const moveOpen3 = getBestMove(boardOpen3, 'white', 'medium');

    const isBlocked = (moveOpen3.row === 7 && (moveOpen3.col === 5 || moveOpen3.col === 9));
    assert(isBlocked, `AI Blocked Open 3. Move: ${JSON.stringify(moveOpen3)}`);

    // Test 8: AI Finds Winning Move (Live 4)
    // AI has .WWW. -> should play to make it 5? Or if it has .WWW. it needs one more to win.
    // If AI has .WWWW. it wins.
    // If AI has .WWW. it should play to make .WWWW. (Live 4) if safe?
    // Actually, check simple win: AI has WWWW -> plays to make 5.
    const boardWin = createBoard(15);
    for(let i=0; i<4; i++) boardWin[7][i+5] = 'white';
    const moveWin = getBestMove(boardWin, 'white', 'medium');
    // Win is at 7,4 or 7,9
    assert(
        (moveWin.row === 7 && (moveWin.col === 4 || moveWin.col === 9)),
        `AI Takes Winning Move. Move: ${JSON.stringify(moveWin)}`
    );

    console.log(`Tests completed. Passed: ${passed}, Failed: ${failed}`);
};

runTests();
