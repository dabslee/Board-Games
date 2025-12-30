import { createBoard, checkWin } from '../game/GomokuLogic.js';

export const initialState = {
    boardSize: 15,
    board: createBoard(15),
    history: [], // Array of moves {row, col, color}
    currentTurn: 0, // Points to the index in history for the current displayed state
    currentPlayer: 'black',
    winner: null,
    gameMode: 'PvP', // 'PvP' or 'PvC'
    aiConfig: { level: 'easy', color: 'white' }, // AI usually goes second (white) by default unless specified
    winningLine: null, // Array of coordinates
};

export const gameReducer = (state, action) => {
    switch (action.type) {
        case 'START_GAME':
            const size = action.payload.boardSize || 15;
            return {
                ...initialState,
                boardSize: size,
                board: createBoard(size),
                gameMode: action.payload.mode, // 'PvP' or 'PvC'
                aiConfig: action.payload.aiConfig || initialState.aiConfig,
                currentPlayer: action.payload.startColor || 'black',
            };
        case 'LOAD_GAME':
            return {
                ...action.payload,
            };
        case 'MAKE_MOVE': {
            const { row, col } = action.payload;
            const { board, currentPlayer, history, currentTurn } = state;
            const size = board.length;

            // If we are looking at past history, making a move creates a new branch
            // We discard all history AFTER currentTurn
            const newHistory = history.slice(0, currentTurn);

            const newBoard = createBoard(size);
            // Reconstruct board from newHistory to ensure clean state
            newHistory.forEach(move => {
                newBoard[move.row][move.col] = move.color;
            });

            // Apply new move
            newBoard[row][col] = currentPlayer;
            const move = { row, col, color: currentPlayer };

            const isWin = checkWin(newBoard, row, col, currentPlayer);
            const nextPlayer = currentPlayer === 'black' ? 'white' : 'black';

            return {
                ...state,
                board: newBoard,
                history: [...newHistory, move],
                currentTurn: currentTurn + 1,
                currentPlayer: isWin ? currentPlayer : nextPlayer,
                winner: isWin ? currentPlayer : null,
            };
        }
        case 'JUMP_TO_TURN': {
            const turnIndex = action.payload;
            const { board, history } = state;
            const size = board.length;
            const newBoard = createBoard(size);

            for (let i = 0; i < turnIndex; i++) {
                const move = history[i];
                newBoard[move.row][move.col] = move.color;
            }

            // Re-evaluate win condition at this state
            let winner = null;
            let nextPlayer = 'black'; // Default start

            if (turnIndex > 0) {
                 const lastMove = history[turnIndex - 1];
                 const isWin = checkWin(newBoard, lastMove.row, lastMove.col, lastMove.color);
                 if (isWin) {
                     winner = lastMove.color;
                     nextPlayer = lastMove.color;
                 } else {
                     nextPlayer = lastMove.color === 'black' ? 'white' : 'black';
                 }
            } else {
                 winner = null;
                 nextPlayer = 'black';
            }

            return {
                ...state,
                board: newBoard,
                currentTurn: turnIndex,
                currentPlayer: nextPlayer,
                winner: winner,
            };
        }
        case 'UNDO':
            if (state.currentTurn > 0) {
                 // Delegates to JUMP_TO_TURN logic
                 return gameReducer(state, { type: 'JUMP_TO_TURN', payload: state.currentTurn - 1 });
            }
            return state;
        case 'REDO':
            if (state.currentTurn < state.history.length) {
                 return gameReducer(state, { type: 'JUMP_TO_TURN', payload: state.currentTurn + 1 });
            }
            return state;
        default:
            return state;
    }
};
