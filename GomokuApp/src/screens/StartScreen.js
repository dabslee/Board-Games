import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { GameContext } from '../context/GameContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StartScreen = ({ navigation }) => {
    const { state, dispatch, loadGame } = useContext(GameContext);
    const [hasSavedGame, setHasSavedGame] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // New Game Settings
    const [mode, setMode] = useState('PvP'); // PvP or PvC
    const [boardSize, setBoardSize] = useState(15);
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
                boardSize,
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
                        <ScrollView contentContainerStyle={styles.scrollContent}>
                            <Text style={styles.modalText}>New Game Settings</Text>

                            <View style={styles.optionRow}>
                                <Text style={styles.label}>Mode: </Text>
                                <View style={styles.options}>
                                    <TouchableOpacity onPress={() => setMode('PvP')} style={[styles.optionBtn, mode === 'PvP' && styles.selected]}>
                                        <Text>2 Player</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setMode('PvC')} style={[styles.optionBtn, mode === 'PvC' && styles.selected]}>
                                        <Text>vs CPU</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.optionRow}>
                                <Text style={styles.label}>Board Size: </Text>
                                <View style={styles.options}>
                                    {[9, 13, 15, 19].map(size => (
                                        <TouchableOpacity
                                            key={size}
                                            onPress={() => setBoardSize(size)}
                                            style={[styles.optionBtn, boardSize === size && styles.selected]}
                                        >
                                            <Text>{size}x{size}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {mode === 'PvC' && (
                                <>
                                    <View style={styles.optionRow}>
                                        <Text style={styles.label}>Difficulty: </Text>
                                        <View style={styles.options}>
                                            <TouchableOpacity onPress={() => setAiLevel('easy')} style={[styles.optionBtn, aiLevel === 'easy' && styles.selected]}>
                                                <Text>Easy</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setAiLevel('medium')} style={[styles.optionBtn, aiLevel === 'medium' && styles.selected]}>
                                                <Text>Med</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setAiLevel('hard')} style={[styles.optionBtn, aiLevel === 'hard' && styles.selected]}>
                                                <Text>Hard</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setAiLevel('extreme')} style={[styles.optionBtn, aiLevel === 'extreme' && styles.selected]}>
                                                <Text>Extreme</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={styles.optionRow}>
                                        <Text style={styles.label}>CPU Color (Black goes first): </Text>
                                        <View style={styles.options}>
                                            <TouchableOpacity onPress={() => setAiColor('white')} style={[styles.optionBtn, aiColor === 'white' && styles.selected]}>
                                                <Text>White</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setAiColor('black')} style={[styles.optionBtn, aiColor === 'black' && styles.selected]}>
                                                <Text>Black</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </>
                            )}

                            <View style={styles.actionButtons}>
                                <Button title="Start" onPress={startGame} />
                                <View style={{ width: 10 }} />
                                <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
                            </View>
                        </ScrollView>
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
        width: '90%',
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        maxHeight: '80%',
    },
    scrollContent: {
        alignItems: 'center',
    },
    modalText: {
        marginBottom: 20,
        textAlign: "center",
        fontSize: 24,
        fontWeight: 'bold'
    },
    optionRow: {
        width: '100%',
        marginBottom: 20,
        alignItems: 'center'
    },
    label: {
        fontSize: 16,
        marginBottom: 10,
        fontWeight: '600'
    },
    options: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center'
    },
    optionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        margin: 4,
    },
    selected: {
        backgroundColor: '#e0e0e0',
        borderColor: '#333'
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: 20,
    }
});

export default StartScreen;
