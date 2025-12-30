import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameProvider } from './src/context/GameContext';
import StartScreen from './src/screens/StartScreen';
import GameScreen from './src/screens/GameScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GameProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Start" component={StartScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GameProvider>
  );
}
