import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Stone from './Stone';
import { BOARD_SIZE } from '../game/GomokuLogic';
import { GameContext } from '../context/GameContext';

const Board = () => {
    const { state, dispatch } = useContext(GameContext);
    const { board, winner, currentPlayer, gameMode, aiConfig } = state;

    const { width, height } = useWindowDimensions();

    // Calculate max available size allowing for padding and UI elements
    // Increased buffer to 300px to ensure HistorySlider and controls are visible.
    const maxBoardSize = Math.min(width - 40, height - 300);
    const cellSize = Math.floor(maxBoardSize / BOARD_SIZE);

    const handlePress = (row, col) => {
        // Prevent moves if game over or cell occupied
        if (winner || board[row][col]) return;

        // Prevent moves during AI turn in PvC
        if (gameMode === 'PvC' && currentPlayer === aiConfig.color) return;

        dispatch({ type: 'MAKE_MOVE', payload: { row, col } });
    };

    return (
        <View style={styles.container}>
            <View style={[styles.board, { width: cellSize * BOARD_SIZE, height: cellSize * BOARD_SIZE }]}>
                {/* Grid Lines */}
                {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                    <View key={`h-${i}`} style={[styles.lineH, { top: i * cellSize + cellSize / 2, width: cellSize * BOARD_SIZE }]} />
                ))}
                {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                    <View key={`v-${i}`} style={[styles.lineV, { left: i * cellSize + cellSize / 2, height: cellSize * BOARD_SIZE }]} />
                ))}

                {/* Cells */}
                {board.map((row, rIndex) => (
                    <View key={rIndex} style={styles.row}>
                        {row.map((cell, cIndex) => (
                            <TouchableOpacity
                                key={`${rIndex}-${cIndex}`}
                                style={[styles.cell, { width: cellSize, height: cellSize }]}
                                onPress={() => handlePress(rIndex, cIndex)}
                                activeOpacity={1}
                            >
                                <Stone color={cell} size={cellSize * 0.8} />
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: '#f0d9b5', // Wood color
        borderRadius: 5,
    },
    board: {
        position: 'relative',
    },
    row: {
        flexDirection: 'row',
    },
    cell: {
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    lineH: {
        position: 'absolute',
        height: 1,
        backgroundColor: '#5d4037',
        left: 0,
    },
    lineV: {
        position: 'absolute',
        width: 1,
        backgroundColor: '#5d4037',
        top: 0,
    }
});

export default Board;
