import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { GameContext } from '../context/GameContext';

const HistorySlider = () => {
    const { state, dispatch } = useContext(GameContext);
    const { history, currentTurn } = state;

    if (history.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text>Turn: {currentTurn} / {history.length}</Text>
            <Slider
                style={{width: '100%', height: 40}}
                minimumValue={0}
                maximumValue={history.length}
                step={1}
                value={currentTurn}
                onValueChange={(value) => {
                    if (value !== currentTurn) {
                        dispatch({ type: 'JUMP_TO_TURN', payload: value });
                    }
                }}
                minimumTrackTintColor="#000000"
                maximumTrackTintColor="#000000"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '90%',
        alignItems: 'center',
        marginVertical: 10,
    }
});

export default HistorySlider;
