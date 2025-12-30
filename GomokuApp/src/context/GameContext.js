import React, { createContext, useReducer, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBestMove } from '../game/GomokuLogic';
import { gameReducer, initialState } from './GameReducer';

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const [isThinking, setIsThinking] = useState(false);
    const aiAbortController = useRef(null);

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
        if (state.history.length > 0) {
            saveState();
        }
    }, [state]);

    // AI Logic Trigger
    useEffect(() => {
        // Cancel any existing AI task if state changes (e.g. undo, or new turn)
        // Actually, if state changes to a state where it is NOT AI turn, we should cancel.
        // If it IS AI turn, we might be starting a new task.

        if (state.gameMode === 'PvC' && !state.winner && state.currentTurn === state.history.length) {
            if (state.currentPlayer === state.aiConfig.color) {
                // It's AI's turn

                // Cancel previous if any (though usually previous effect cleanup handles it?)
                // Effect cleanup runs before this effect body.

                if (aiAbortController.current) {
                    aiAbortController.current.abort();
                }
                aiAbortController.current = new AbortController();
                const signal = aiAbortController.current.signal;

                const runAI = async () => {
                    setIsThinking(true);
                    // Add a small initial delay for realism so it doesn't feel instant even if easy
                    await new Promise(resolve => setTimeout(resolve, 500));

                    if (signal.aborted) {
                        setIsThinking(false);
                        return;
                    }

                    try {
                        const move = await getBestMove(state.board, state.aiConfig.color, state.aiConfig.level, signal);
                        if (!signal.aborted && move) {
                            dispatch({ type: 'MAKE_MOVE', payload: move });
                        }
                    } catch (error) {
                         if (error.message !== 'Aborted') {
                             console.error("AI Error:", error);
                         }
                    } finally {
                        if (!signal.aborted) {
                            setIsThinking(false);
                        }
                    }
                };

                runAI();
            } else {
                // Player's turn
                setIsThinking(false);
            }
        } else {
             // Not AI turn (PvP, GameOver, or Viewing History)
             setIsThinking(false);
        }

        // Cleanup: Abort if component unmounts or deps change (meaning state updated)
        return () => {
            if (aiAbortController.current) {
                aiAbortController.current.abort();
            }
        };
    }, [state.currentPlayer, state.gameMode, state.winner, state.currentTurn, state.history.length, state.board]);
    // Added state.board to deps to ensure we react to moves.
    // Actually state.currentPlayer changes when board changes (move made), so it's redundant but safe.

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

    const cancelAI = () => {
        if (aiAbortController.current) {
            aiAbortController.current.abort();
            setIsThinking(false);
        }
    };

    // We wrap dispatch to handle cancellation on Undo?
    // Or just expose cancelAI.
    // Actually, when dispatch('UNDO') happens, the state changes.
    // The useEffect above depends on state.currentTurn.
    // It will re-run. The "cleanup" function of the PREVIOUS effect run (where AI was thinking) will fire.
    // So the abort happens automatically via useEffect cleanup!

    // BUT: "If the user presses undo or back while the computer is thinking, abort the thinking."
    // If I press undo, state changes -> cleanup fires -> aborts.
    // If I press back (navigation), component unmounts? No, context might stay alive if wrapped high up.
    // But GameScreen unmounts? The context is likely wrapped around App.
    // If GameScreen unmounts, we should probably pause game or something?
    // If the user navigates back to StartScreen, the game mode might change or reset.
    // If we just go "Back", we are effectively pausing.
    // The user said: "Next time it's the computer's turn, resume the thinking."
    // This implies if I go back to the game, it should resume.

    // If I navigate "Back" to home, the Context usually persists.
    // If I start a "New Game", state is reset.
    // If I "Continue", state remains.

    // If I press "Back", I am leaving the screen. The AI should stop burning CPU.
    // We can expose `cancelAI` and call it on GameScreen unmount?
    // Or simpler: The useEffect cleanup handles state changes.
    // Does it handle navigation? Only if GameContext is inside the Screen or we explicitly stop it.
    // Usually GameContext is global.
    // We should probably add a "pause" or explicit cancel when leaving screen.

    return (
        <GameContext.Provider value={{ state, dispatch, loadGame, isThinking, cancelAI }}>
            {children}
        </GameContext.Provider>
    );
};
