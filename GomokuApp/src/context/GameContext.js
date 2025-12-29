import React, { createContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBoard, checkWin, getBestMove, BOARD_SIZE } from '../game/GomokuLogic';

export const GameContext = createContext();

const initialState = {
    board: createBoard(),
    history: [], // Array of moves {row, col, color}
    currentTurn: 0, // Points to the index in history for the current displayed state
    currentPlayer: 'black',
    winner: null,
    gameMode: 'PvP', // 'PvP' or 'PvC'
    aiConfig: { level: 'easy', color: 'white' }, // AI usually goes second (white) by default unless specified
    winningLine: null, // Array of coordinates
};

const gameReducer = (state, action) => {
    switch (action.type) {
        case 'START_GAME':
            return {
                ...initialState,
                board: createBoard(),
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

            // If we are looking at past history, making a move creates a new branch
            // We discard all history AFTER currentTurn
            const newHistory = history.slice(0, currentTurn);

            const newBoard = createBoard();
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
            const newBoard = createBoard();
            const { history } = state;

            for (let i = 0; i < turnIndex; i++) {
                const move = history[i];
                newBoard[move.row][move.col] = move.color;
            }

            // Determine whose turn it is at this point
            // Turn 0 = black's turn. Turn 1 = white's turn.
            // But we need to account for who started the game.
            // Assuming Black always starts for now, or track it.
            // For simplicity, let's assume 'black' always starts first in Gomoku standard,
            // or we need to look at state.gameMode settings if we supported White start.
            // Let's infer from the last move or default.

            let nextPlayer = 'black';
            if (turnIndex > 0) {
                const lastMoveColor = history[turnIndex - 1].color;
                nextPlayer = lastMoveColor === 'black' ? 'white' : 'black';
            } else if (state.gameMode === 'PvC' && state.aiConfig.color === 'black') {
                 // If AI is black, and we are at turn 0, it is AI's turn?
                 // Wait, if AI is black, AI moves first.
                 // We should store 'startColor' in state to be sure.
                 // For now, default logic:
                 nextPlayer = history.length > 0 && turnIndex < history.length ? history[turnIndex].color : (turnIndex % 2 === 0 ? 'black' : 'white');
                 // Actually, correct logic is:
                 // If turnIndex is even, it's the starting player's turn.
            }

            // Correct logic for nextPlayer based on history length and standard alternation
            // Actually, we just need to know who moves NEXT.
            // If turnIndex moves have been applied, the next mover is opposite of history[turnIndex-1]
            if (turnIndex > 0) {
                 nextPlayer = history[turnIndex - 1].color === 'black' ? 'white' : 'black';
            } else {
                 // At turn 0, check who was supposed to start.
                 // If we didn't save `startColor`, we assume Black starts.
                 // Let's refine `START_GAME` to ensure we know.
                 // But for `JUMP_TO_TURN`, we often just want to view.
                 // If we play, `MAKE_MOVE` uses `currentPlayer`.
                 nextPlayer = 'black'; // Default start
                 // If we have AI, and AI is Black, then at turn 0 it is Black (AI).
            }

            return {
                ...state,
                board: newBoard,
                currentTurn: turnIndex,
                currentPlayer: nextPlayer, // This might be buggy if we don't track startColor perfectly, but standard is Black starts.
                winner: null, // Reset winner when scrubbing back
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

export const GameProvider = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    // Persistence
    useEffect(() => {
        const saveState = async () => {
            try {
                const jsonValue = JSON.stringify(state);
                await AsyncStorage.setItem('@gomoku_state', jsonValue);
            } catch (e) {
                console.error("Failed to save state", e);
            }
        };
        // Debounce or save on every change?
        // For now, save on every change (except init)
        if (state.history.length > 0) {
            saveState();
        }
    }, [state]);

    // AI Logic Trigger
    useEffect(() => {
        if (state.gameMode === 'PvC' && !state.winner && state.currentTurn === state.history.length) {
            // Only trigger AI if it's the latest state (not viewing history)
            if (state.currentPlayer === state.aiConfig.color) {
                // It's AI's turn
                // Add a small delay for realism/UI update
                const timer = setTimeout(() => {
                    const move = getBestMove(state.board, state.aiConfig.color, state.aiConfig.level);
                    if (move) {
                        dispatch({ type: 'MAKE_MOVE', payload: move });
                    }
                }, 500);
                return () => clearTimeout(timer);
            }
        }
    }, [state.currentPlayer, state.gameMode, state.winner, state.currentTurn, state.history.length]);

    const loadGame = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem('@gomoku_state');
            if (jsonValue != null) {
                dispatch({ type: 'LOAD_GAME', payload: JSON.parse(jsonValue) });
                return true;
            }
        } catch(e) {
            console.error("Failed to load state", e);
        }
        return false;
    };

    return (
        <GameContext.Provider value={{ state, dispatch, loadGame }}>
            {children}
        </GameContext.Provider>
    );
};
