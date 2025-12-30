import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { BACKEND_URL } from '../config';

const OnlineMenuScreen = ({ navigation }) => {
    const [gameCode, setGameCode] = useState('');
    const [loading, setLoading] = useState(false);

    const createGame = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/game`, {
                method: 'POST',
            });
            const data = await response.json();
            if (response.ok) {
                navigation.navigate('OnlineGame', {
                    code: data.game_code,
                    playerColor: data.color, // 'black'
                    playerId: data.player_id, // 'host'
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
    };

    const joinGame = async () => {
        if (!gameCode) {
            Alert.alert("Error", "Please enter a game code");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/game/${gameCode.toUpperCase()}/join`, {
                method: 'POST',
            });
            const data = await response.json();
            if (response.ok) {
                navigation.navigate('OnlineGame', {
                    code: gameCode.toUpperCase(),
                    playerColor: data.color, // 'white'
                    playerId: data.player_id, // 'guest'
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
            <Text style={styles.title}>Online Multiplayer</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <>
                    <View style={styles.section}>
                        <Button title="Create New Game" onPress={createGame} />
                    </View>

                    <Text style={styles.orText}>- OR -</Text>

                    <View style={styles.section}>
                        <Text style={styles.label}>Enter Game Code:</Text>
                        <TextInput
                            style={styles.input}
                            value={gameCode}
                            onChangeText={setGameCode}
                            placeholder="ABCDE"
                            autoCapitalize="characters"
                            maxLength={5}
                        />
                        <Button title="Join Game" onPress={joinGame} />
                    </View>
                </>
            )}

            <View style={styles.backBtn}>
                <Button title="Back to Menu" onPress={() => navigation.goBack()} color="gray" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 40,
    },
    section: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    orText: {
        fontSize: 18,
        color: '#666',
        marginVertical: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        width: 150,
        textAlign: 'center',
        fontSize: 24,
        marginBottom: 10,
        letterSpacing: 2,
    },
    backBtn: {
        marginTop: 40,
    }
});

export default OnlineMenuScreen;
