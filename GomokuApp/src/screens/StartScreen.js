import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Modal, TouchableOpacity, Switch } from 'react-native';
import { GameContext } from '../context/GameContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StartScreen = ({ navigation }) => {
    const { state, dispatch, loadGame } = useContext(GameContext);
    const [hasSavedGame, setHasSavedGame] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // New Game Settings
    const [mode, setMode] = useState('PvP'); // PvP or PvC
    const [aiLevel, setAiLevel] = useState('easy');
    const [aiColor, setAiColor] = useState('white'); // AI plays White (2nd) by default

    useEffect(() => {
        // Check if saved game exists
        AsyncStorage.getItem('@gomoku_state').then(value => {
            if (value) setHasSavedGame(true);
        });
    }, [state]); // Re-check when state changes (e.g. after a game)

    const handleContinue = async () => {
        const loaded = await loadGame();
        if (loaded) {
            navigation.navigate('Game');
        }
    };

    const handleNewGame = () => {
        setModalVisible(true);
    };

    const startGame = () => {
        setModalVisible(false);
        dispatch({
            type: 'START_GAME',
            payload: {
                mode,
                aiConfig: { level: aiLevel, color: aiColor },
                startColor: 'black' // Standard Gomoku start
            }
        });
        navigation.navigate('Game');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Gomoku</Text>

            <View style={styles.buttonContainer}>
                <Button title="New Game" onPress={handleNewGame} />
                <View style={{ height: 20 }} />
                <Button
                    title="Continue"
                    onPress={handleContinue}
                    disabled={!hasSavedGame}
                />
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>New Game Settings</Text>

                        <View style={styles.optionRow}>
                            <Text>Mode: </Text>
                            <TouchableOpacity onPress={() => setMode('PvP')} style={[styles.optionBtn, mode === 'PvP' && styles.selected]}>
                                <Text>2 Player</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setMode('PvC')} style={[styles.optionBtn, mode === 'PvC' && styles.selected]}>
                                <Text>vs Computer</Text>
                            </TouchableOpacity>
                        </View>

                        {mode === 'PvC' && (
                            <>
                                <View style={styles.optionRow}>
                                    <Text>Difficulty: </Text>
                                    <TouchableOpacity onPress={() => setAiLevel('easy')} style={[styles.optionBtn, aiLevel === 'easy' && styles.selected]}>
                                        <Text>Easy</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setAiLevel('medium')} style={[styles.optionBtn, aiLevel === 'medium' && styles.selected]}>
                                        <Text>Med</Text>
                                    </TouchableOpacity>
                                    {/* <TouchableOpacity onPress={() => setAiLevel('hard')} style={[styles.optionBtn, aiLevel === 'hard' && styles.selected]}>
                                        <Text>Hard</Text>
                                    </TouchableOpacity> */}
                                </View>
                                <View style={styles.optionRow}>
                                    <Text>Computer plays: </Text>
                                    <TouchableOpacity onPress={() => setAiColor('white')} style={[styles.optionBtn, aiColor === 'white' && styles.selected]}>
                                        <Text>White (2nd)</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setAiColor('black')} style={[styles.optionBtn, aiColor === 'black' && styles.selected]}>
                                        <Text>Black (1st)</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        <Button title="Start" onPress={startGame} />
                        <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        marginBottom: 50,
    },
    buttonContainer: {
        width: 200,
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22,
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center",
        fontSize: 20,
        fontWeight: 'bold'
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        flexWrap: 'wrap',
        justifyContent: 'center'
    },
    optionBtn: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        marginHorizontal: 5,
    },
    selected: {
        backgroundColor: '#ddd',
        borderColor: '#333'
    }
});

export default StartScreen;
