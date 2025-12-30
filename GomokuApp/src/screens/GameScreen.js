import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { GameContext } from '../context/GameContext';
import Board from '../components/Board';
import HistorySlider from '../components/HistorySlider';
import { BACKEND_URL } from '../config';

const GameScreen = ({ route, navigation }) => {
    const { state, dispatch, isThinking, cancelAI } = useContext(GameContext);
    const { currentPlayer, winner, gameMode, history, currentTurn } = state;

    // Online Params
    const onlineParams = route.params || {};
    const isOnline = onlineParams.mode === 'Online';
    const { code, playerColor, playerId } = onlineParams;

    const [status, setStatus] = useState('waiting'); // waiting, playing, finished
    const pollingRef = useRef(null);

    // Online Polling
    useEffect(() => {
        if (isOnline) {
             // Ensure mode is set in Reducer
             dispatch({ type: 'SET_GAME_MODE', payload: 'Online' });
             startPolling();
        }
        return () => stopPolling();
    }, [isOnline]);

    const startPolling = () => {
        pollingRef.current = setInterval(fetchGameState, 1000);
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
                }
            }
        } catch (error) {
            console.error("Polling error", error);
        }
    };

    useEffect(() => {
        if (winner) {
            let message = `Winner is ${winner.toUpperCase()}!`;
            if (isOnline) {
                message = winner === playerColor ? "You Won!" : "You Lost.";
            }

            Alert.alert(
                "Game Over",
                message,
                [{ text: "OK" }]
            );
        }
    }, [winner, isOnline, playerColor]);

    // Handle back navigation to abort AI or exit online game
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
             cancelAI();
             stopPolling();
        });
        return unsubscribe;
    }, [navigation, cancelAI]);

    const handleUndo = () => dispatch({ type: 'UNDO' });
    const handleRedo = () => dispatch({ type: 'REDO' });

    // Intercept Board Clicks (Board component calls dispatch directly usually)
    // We need to modify Board component? Or wrap dispatch?
    // Board component likely imports GameContext too.
    // Let's check Board component.
    // If Board calls dispatch, we can't intercept easily unless we modify Board.
    // Or we pass a custom `onMove` prop to Board?
    // Let's check Board.js content.

    const canUndo = !isOnline && currentTurn > 0;
    const canRedo = !isOnline && currentTurn < history.length && !isThinking;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Button title="Back" onPress={() => navigation.goBack()} />

                {isOnline ? (
                     <View style={styles.onlineInfo}>
                        <Text style={styles.infoText}>Code: <Text style={{fontWeight:'bold'}}>{code}</Text></Text>
                        <Text style={styles.infoText}>You: <Text style={{fontWeight:'bold', color: playerColor === 'white' ? '#999' : playerColor}}>{playerColor}</Text></Text>
                     </View>
                ) : null}

                <View style={styles.turnContainer}>
                     <Text style={styles.turnText}>
                        {isOnline && status === 'waiting' ? 'Waiting...' :
                         (winner ? `Winner: ${winner}` : `Turn: ${currentPlayer}`)}
                    </Text>
                    {isThinking && <ActivityIndicator size="small" color="#000" style={styles.loader} />}
                </View>
            </View>

            <Board
                isOnline={isOnline}
                onlineParams={{ code, playerColor, playerId, status }}
                backendUrl={BACKEND_URL}
            />

            {!isOnline && (
                <View style={styles.controls}>
                    <Button title="Undo" onPress={handleUndo} disabled={!canUndo} />
                    <Button title="Redo" onPress={handleRedo} disabled={!canRedo} />
                </View>
            )}

            {!isOnline && <HistorySlider />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 50,
        backgroundColor: '#fafafa',
    },
    header: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    onlineInfo: {
        alignItems: 'center',
    },
    infoText: {
        fontSize: 12,
    },
    turnContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    turnText: {
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'capitalize'
    },
    loader: {
        marginLeft: 10,
    },
    controls: {
        flexDirection: 'row',
        width: '60%',
        justifyContent: 'space-around',
        marginVertical: 20,
    }
});

export default GameScreen;
