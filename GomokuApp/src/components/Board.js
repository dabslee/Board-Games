import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Stone from './Stone';
import { GameContext } from '../context/GameContext';

const STAR_POINTS = {
    9: [[2, 2], [2, 6], [4, 4], [6, 2], [6, 6]],
    13: [[3, 3], [3, 9], [6, 6], [9, 3], [9, 9]],
    15: [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]],
    19: [[3, 3], [3, 9], [3, 15], [9, 3], [9, 9], [9, 15], [15, 3], [15, 9], [15, 15]]
};
const STAR_POINT_SIZE = 6;

const Board = () => {
    const { state, dispatch } = useContext(GameContext);
    const { board, winner, currentPlayer, gameMode, aiConfig, history, currentTurn } = state;
    const boardSize = board.length;

    const { width, height } = useWindowDimensions();

    // Calculate max available size allowing for padding and UI elements
    const maxBoardSize = Math.min(width - 40, height - 300);
    const cellSize = Math.floor(maxBoardSize / boardSize);

    // Calculate grid dimensions to ensure lines stop at the center of the first/last cells
    const gridSize = (boardSize - 1) * cellSize;
    const gridOffset = cellSize / 2;

    const handlePress = (row, col) => {
        if (winner || board[row][col]) return;
        if (gameMode === 'PvC' && currentPlayer === aiConfig.color) return;
        dispatch({ type: 'MAKE_MOVE', payload: { row, col } });
    };

    const starPoints = STAR_POINTS[boardSize] || [];
    const starPointLookup = new Set(starPoints.map(([r, c]) => `${r}-${c}`));
    const lastMove = history[currentTurn - 1];
    const lastMoveKey = lastMove ? `${lastMove.row}-${lastMove.col}` : null;

    return (
        <View style={styles.container}>
            <View style={[styles.board, { width: cellSize * boardSize, height: cellSize * boardSize }]}>
                {/* Grid Lines */}
                {/* Horizontal Lines */}
                {Array.from({ length: boardSize }).map((_, i) => (
                    <View
                        key={`h-${i}`}
                        style={[
                            styles.lineH,
                            {
                                top: i * cellSize + cellSize / 2,
                                width: gridSize,
                                left: gridOffset
                            }
                        ]}
                    />
                ))}
                {/* Vertical Lines */}
                {Array.from({ length: boardSize }).map((_, i) => (
                    <View
                        key={`v-${i}`}
                        style={[
                            styles.lineV,
                            {
                                left: i * cellSize + cellSize / 2,
                                height: gridSize,
                                top: gridOffset
                            }
                        ]}
                    />
                ))}

                {/* Cells */}
                {board.map((row, rIndex) => (
                    <View key={rIndex} style={styles.row}>
                        {row.map((cell, cIndex) => {
                            const isLastMove = lastMoveKey === `${rIndex}-${cIndex}`;
                            return (
                            <TouchableOpacity
                                key={`${rIndex}-${cIndex}`}
                                style={[styles.cell, { width: cellSize, height: cellSize }]}
                                onPress={() => handlePress(rIndex, cIndex)}
                                activeOpacity={1}
                            >
                                {starPointLookup.has(`${rIndex}-${cIndex}`) && (
                                    <View
                                        pointerEvents="none"
                                        style={[
                                            styles.starPoint,
                                            {
                                                width: STAR_POINT_SIZE,
                                                height: STAR_POINT_SIZE,
                                                borderRadius: STAR_POINT_SIZE / 2,
                                                top: (cellSize - STAR_POINT_SIZE) / 2,
                                                left: (cellSize - STAR_POINT_SIZE) / 2,
                                            }
                                        ]}
                                    />
                                )}
                                <Stone color={cell} size={cellSize * 0.8} isLastMove={isLastMove} />
                            </TouchableOpacity>
                            );
                        })}
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
        position: 'relative',
        zIndex: 2,
    },
    lineH: {
        position: 'absolute',
        height: 1,
        backgroundColor: '#5d4037',
    },
    lineV: {
        position: 'absolute',
        width: 1,
        backgroundColor: '#5d4037',
    },
    starPoint: {
        position: 'absolute',
        backgroundColor: '#5d4037',
        zIndex: 0,
    }
});

export default Board;
