import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator } from 'react-native';
import { GameContext } from '../context/GameContext';
import Board from '../components/Board';
import HistorySlider from '../components/HistorySlider';

const GameScreen = ({ navigation }) => {
    const { state, dispatch, isThinking, cancelAI } = useContext(GameContext);
    const { currentPlayer, winner, gameMode, history, currentTurn } = state;

    useEffect(() => {
        if (winner) {
            Alert.alert(
                "Game Over",
                `Winner is ${winner.toUpperCase()}!`,
                [{ text: "OK" }]
            );
        }
    }, [winner]);

    // Handle back navigation to abort AI
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
             // If AI is thinking, we should cancel it.
             // The context might stay alive, so explicit cancel is good practice.
             cancelAI();
        });
        return unsubscribe;
    }, [navigation, cancelAI]);

    const handleUndo = () => dispatch({ type: 'UNDO' });
    const handleRedo = () => dispatch({ type: 'REDO' });

    // Determine if actions are possible
    // Allow undo even if thinking (to abort)
    const canUndo = currentTurn > 0;
    const canRedo = currentTurn < history.length && !isThinking; // Don't redo while thinking?

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Button title="Back" onPress={() => navigation.goBack()} />
                <View style={styles.turnContainer}>
                     <Text style={styles.turnText}>
                        {winner ? `Winner: ${winner}` : `Turn: ${currentPlayer}`}
                    </Text>
                    {isThinking && <ActivityIndicator size="small" color="#000" style={styles.loader} />}
                </View>
                <View style={{width: 50}} />
            </View>

            <Board />

            <View style={styles.controls}>
                <Button title="Undo" onPress={handleUndo} disabled={!canUndo} />
                <Button title="Redo" onPress={handleRedo} disabled={!canRedo} />
            </View>

            <HistorySlider />
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
    turnContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    turnText: {
        fontSize: 20,
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
