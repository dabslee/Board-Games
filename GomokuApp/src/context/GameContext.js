import React, { createContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBestMove } from '../game/GomokuLogic';
import { gameReducer, initialState } from './GameReducer';

export const GameContext = createContext();

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
