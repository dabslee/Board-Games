# Gomoku React Native App

A simple Gomoku (Five in a Row) game built with React Native and Expo.

## Features

*   **Game Modes**: Play against a computer (PvC) or another player (PvP) on the same device.
*   **AI Difficulty**: Choose between 'Easy' (Random) and 'Medium' (Heuristic) AI.
*   **Game Controls**: Undo, Redo, and a History Slider to review and resume from past moves.
*   **Persistence**: The game automatically saves your progress so you can continue later.

## Prerequisites

*   Node.js (v14 or later recommended)
*   npm or yarn
*   **Expo Go** app installed on your physical Android or iOS device, OR an Android Emulator/iOS Simulator set up on your computer.

## Installation

1.  Navigate to the project directory:
    ```bash
    cd GomokuApp
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Running the App

To start the development server:

```bash
npm start
```

Once the server is running:

*   **Physical Device**: Scan the QR code displayed in the terminal using the Expo Go app (Android) or the Camera app (iOS).
*   **Android Emulator**: Press `a` in the terminal.
*   **iOS Simulator**: Press `i` in the terminal (macOS only).
*   **Web**: Press `w` in the terminal.

## Testing Game Logic

The core game logic (win detection, AI, board management) is separated from the UI and can be tested using the included Node.js test script.

To run the logic tests:

```bash
node test_logic.mjs
```
