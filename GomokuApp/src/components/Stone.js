import React from 'react';
import { View, StyleSheet } from 'react-native';

const Stone = ({ color, size = 20 }) => {
    if (!color) return <View style={[styles.empty, { width: size, height: size }]} />;

    return (
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
    );
};

const styles = StyleSheet.create({
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
    empty: {
        backgroundColor: 'transparent',
    }
});

export default Stone;
