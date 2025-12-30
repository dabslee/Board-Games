import React from 'react';
import { View, StyleSheet } from 'react-native';

const Stone = ({ color, size = 20, isLastMove = false }) => {
    if (!color) return <View style={[styles.empty, { width: size, height: size }]} />;

    return (
        <View
            style={[
                styles.wrapper,
                { width: size, height: size, borderRadius: size / 2 },
                isLastMove && styles.lastMoveGlow
            ]}
        >
            <View style={[
                styles.stone,
                {
                    backgroundColor: color,
                    width: size - 2,
                    height: size - 2,
                    borderRadius: size / 2,
                    borderColor: color === 'black' ? '#333' : '#ccc',
                    borderWidth: 1
                }
            ]} />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    stone: {
        margin: 1,
        shadowColor: "#000",
        shadowOffset: {
            width: 1,
            height: 1,
        },
        shadowOpacity: 0.5,
        shadowRadius: 1,
        elevation: 2,
    },
    lastMoveGlow: {
        borderWidth: 2,
        borderColor: 'rgba(0, 115, 255, 0.75)',
        shadowColor: 'rgba(0, 115, 255, 0.75)',
        shadowOpacity: 1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
    },
    empty: {
        backgroundColor: 'transparent',
    }
});

export default Stone;
