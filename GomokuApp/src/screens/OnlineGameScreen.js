import React, { useEffect, useContext, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { GameContext } from '../context/GameContext';
import { BACKEND_URL } from '../config';

const OnlineGameScreen = ({ route, navigation }) => {
    const { code, playerColor, playerId } = route.params;
    const { state, dispatch } = useContext(GameContext);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('waiting'); // waiting, playing, finished
    const pollingRef = useRef(null);

    // Initial setup
    useEffect(() => {
        dispatch({ type: 'SET_GAME_MODE', payload: 'online' });
        // Start polling
        startPolling();

        return () => {
            stopPolling();
        };
    }, []);

    const startPolling = () => {
        pollingRef.current = setInterval(fetchGameState, 1000); // Poll every 1s
    };

    const stopPolling = () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
    };

    const fetchGameState = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/game/${code}`);
            if (response.ok) {
                const data = await response.json();

                setStatus(data.status);

                // Sync State
                dispatch({
                    type: 'SYNC_GAME',
                    payload: {
                        board: data.board,
                        currentPlayer: data.turn,
                        winner: data.winner
                    }
                });

                if (data.status === 'finished' || data.winner) {
                     stopPolling();
                     if (data.winner === playerColor) {
                         Alert.alert("Game Over", "You Won!");
                     } else {
                         Alert.alert("Game Over", "You Lost.");
                     }
                }
            } else {
                console.log("Failed to fetch game state");
            }
        } catch (error) {
            console.error("Polling error", error);
        }
    };

    const handleCellPress = async (row, col) => {
        if (status !== 'playing') return;
        if (state.currentPlayer !== playerColor) return; // Not my turn
        if (state.board[row][col] !== null) return;

        // Optimistic update?
        // Let's wait for server to ensure consistency, but show loading?
        // Or just allow it. The backend validates.

        try {
            const response = await fetch(`${BACKEND_URL}/game/${code}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: playerId,
                    row,
                    col
                })
            });

            if (response.ok) {
                const data = await response.json();
                // Update immediately
                 dispatch({
                    type: 'SYNC_GAME',
                    payload: {
                        board: data.board,
                        currentPlayer: data.turn,
                        winner: data.winner
                    }
                });
            } else {
                const err = await response.json();
                Alert.alert("Error", err.error || "Move failed");
            }
        } catch (e) {
            Alert.alert("Error", "Network error");
        }
    };

    // Render Board (Copied/Adapted from GameScreen or componentized)
    // Since GameScreen logic is embedded, I'll replicate the render part.
    // Ideally, we should extract Board component.

    const windowWidth = Dimensions.get('window').width;
    const boardSize = state.boardSize || 15;
    const cellSize = Math.floor((windowWidth - 40) / boardSize);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.infoText}>Game Code: <Text style={styles.code}>{code}</Text></Text>
                <Text style={styles.infoText}>You are: <Text style={{fontWeight:'bold', color: playerColor}}>{playerColor.toUpperCase()}</Text></Text>
                <Text style={styles.statusText}>
                    {status === 'waiting' ? 'Waiting for opponent...' :
                     status === 'finished' ? `Winner: ${state.winner}` :
                     state.currentPlayer === playerColor ? "YOUR TURN" : "OPPONENT'S TURN"}
                </Text>
            </View>

            <View style={styles.boardContainer}>
                 <View style={[styles.board, { width: cellSize * boardSize, height: cellSize * boardSize }]}>
                    {/* Grid Lines */}
                    {Array.from({ length: boardSize }).map((_, i) => (
                        <View key={`v-${i}`} style={[styles.line, styles.verticalLine, { top: cellSize / 2, left: i * cellSize + cellSize / 2, height: cellSize * (boardSize - 1) }]} />
                    ))}
                    {Array.from({ length: boardSize }).map((_, i) => (
                        <View key={`h-${i}`} style={[styles.line, styles.horizontalLine, { left: cellSize / 2, top: i * cellSize + cellSize / 2, width: cellSize * (boardSize - 1) }]} />
                    ))}

                    {/* Cells */}
                    {state.board.map((row, r) => (
                        row.map((cell, c) => (
                            <TouchableOpacity
                                key={`${r}-${c}`}
                                style={[styles.cell, { left: c * cellSize, top: r * cellSize, width: cellSize, height: cellSize }]}
                                onPress={() => handleCellPress(r, c)}
                                activeOpacity={1}
                            >
                                {cell && (
                                    <View style={[
                                        styles.piece,
                                        {
                                            backgroundColor: cell === 'black' ? '#000' : '#fff',
                                            borderColor: cell === 'black' ? '#000' : '#ccc',
                                            width: cellSize * 0.8,
                                            height: cellSize * 0.8,
                                            borderRadius: cellSize * 0.4
                                        }
                                    ]} />
                                )}
                            </TouchableOpacity>
                        ))
                    ))}
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity onPress={() => navigation.navigate('Start')} style={{backgroundColor: 'red', padding: 10, borderRadius: 5}}>
                    <Text style={{color: 'white'}}>Exit Game</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    header: {
        marginBottom: 20,
        alignItems: 'center',
    },
    infoText: {
        fontSize: 16,
        marginBottom: 5,
    },
    code: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    statusText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        color: '#333',
    },
    boardContainer: {
        padding: 20,
        backgroundColor: '#dcb35c', // Wood color
        borderRadius: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    board: {
        position: 'relative',
    },
    line: {
        position: 'absolute',
        backgroundColor: '#000',
    },
    verticalLine: {
        width: 1,
        top: 0, // Adjusted in render to not stick out?
        // Actually grid lines usually start from center of first cell to center of last cell
        // My math above: left: i*cellSize + cellSize/2. Height: cellSize * (boardSize-1).
        // top needs to be cellSize/2.
        top: 15, // Approx half cell if 30?
        // Wait, cellSize is dynamic.
        // Let's use style override in the loop.
    },
    horizontalLine: {
        height: 1,
        left: 0,
        // left needs to be cellSize/2
    },
    cell: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        // borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' // Debug grid
    },
    piece: {
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 1,
        elevation: 2,
    },
    footer: {
        marginTop: 30,
    }
});

// Fix for dynamic line positioning
// In the render loop:
// Vertical: top = cellSize/2
// Horizontal: left = cellSize/2
// Width/Height = cellSize * (boardSize - 1)

export default OnlineGameScreen;
