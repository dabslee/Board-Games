import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import { GameContext } from '../context/GameContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../config';

const logo = require('../../assets/icon.png');

const StartScreen = ({ navigation }) => {
    const { state, dispatch, loadGame } = useContext(GameContext);
    const [hasSavedGame, setHasSavedGame] = useState(false);

    // Modal State
    const [modalMode, setModalMode] = useState('none'); // 'none', 'new', 'join'

    // New Game Settings
    const [mode, setMode] = useState('PvP'); // PvP, PvC, Online
    const [boardSize, setBoardSize] = useState(15);
    const [aiLevel, setAiLevel] = useState('easy');
    const [aiColor, setAiColor] = useState('white'); // AI plays White (2nd) by default

    // Join Game Settings
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);

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
        setModalMode('new');
    };

    const handleJoinGame = () => {
        setModalMode('join');
    };

    const startNewGame = async () => {
        if (mode === 'Online') {
            setLoading(true);
            try {
                const response = await fetch(`${BACKEND_URL}/game`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ size: boardSize, color: aiColor })
                });
                const data = await response.json();
                if (response.ok) {
                    setModalMode('none');
                    navigation.navigate('Game', {
                        mode: 'Online',
                        code: data.game_code,
                        playerColor: data.color,
                        playerId: data.player_id,
                    });
                } else {
                    Alert.alert("Error", "Failed to create game");
                }
            } catch (error) {
                Alert.alert("Error", "Could not connect to server");
                console.error(error);
            } finally {
                setLoading(false);
            }
        } else {
            setModalMode('none');
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
        }
    };

    const joinGame = async () => {
        if (!joinCode) {
            Alert.alert("Error", "Please enter a game code");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/game/${joinCode.toUpperCase()}/join`, {
                method: 'POST',
            });
            const data = await response.json();
            if (response.ok) {
                setModalMode('none');
                navigation.navigate('Game', {
                    mode: 'Online',
                    code: joinCode.toUpperCase(),
                    playerColor: data.color,
                    playerId: data.player_id,
                });
            } else {
                Alert.alert("Error", data.error || "Failed to join game");
            }
        } catch (error) {
            Alert.alert("Error", "Could not connect to server");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Image source={logo} style={styles.logo} />
            <Text style={styles.title}>OpenGomoku</Text>

            <View style={styles.buttonContainer}>
                <Button title="New Game" onPress={handleNewGame} />
                <View style={{ height: 20 }} />
                <Button
                    title="Continue"
                    onPress={handleContinue}
                    disabled={!hasSavedGame}
                />
                <View style={{ height: 20 }} />
                <Button title="Join Game" onPress={handleJoinGame} />
            </View>

            {/* New Game Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalMode === 'new'}
                onRequestClose={() => setModalMode('none')}
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
                                    <TouchableOpacity onPress={() => setMode('Online')} style={[styles.optionBtn, mode === 'Online' && styles.selected]}>
                                        <Text>Online</Text>
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

                            {mode === 'Online' && (
                                <>
                                    <View style={styles.optionRow}>
                                        <Text style={styles.label}>Your Color: </Text>
                                        <View style={styles.options}>
                                            <TouchableOpacity onPress={() => setAiColor('black')} style={[styles.optionBtn, aiColor === 'black' && styles.selected]}>
                                                <Text>Black</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => setAiColor('white')} style={[styles.optionBtn, aiColor === 'white' && styles.selected]}>
                                                <Text>White</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <Text style={{marginBottom: 10, color: '#666'}}>
                                        You will create a game and receive a code to share.
                                    </Text>
                                </>
                            )}

                            <View style={styles.actionButtons}>
                                {loading ? <ActivityIndicator color="#0000ff" /> : <Button title="Start" onPress={startNewGame} />}
                                <View style={{ width: 10 }} />
                                <Button title="Cancel" onPress={() => setModalMode('none')} color="red" />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Join Game Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalMode === 'join'}
                onRequestClose={() => setModalMode('none')}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                         <Text style={styles.modalText}>Join Online Game</Text>

                         <Text style={styles.label}>Enter Game Code:</Text>
                         <TextInput
                            style={styles.input}
                            value={joinCode}
                            onChangeText={setJoinCode}
                            placeholder="ABCDE"
                            autoCapitalize="characters"
                            maxLength={5}
                        />

                        <View style={styles.actionButtons}>
                            {loading ? <ActivityIndicator color="#0000ff" /> : <Button title="Join" onPress={joinGame} />}
                            <View style={{ width: 10 }} />
                            <Button title="Cancel" onPress={() => setModalMode('none')} color="red" />
                        </View>
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
    logo: {
        width: 100,
        height: 100,
        marginBottom: 16,
        resizeMode: 'contain',
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
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        width: 150,
        textAlign: 'center',
        fontSize: 24,
        marginBottom: 20,
        letterSpacing: 2,
    },
});

export default StartScreen;
