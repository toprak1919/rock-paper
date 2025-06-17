# 🎮 Multiplayer Rock Paper Scissors

A real-time multiplayer rock paper scissors game built with WebSockets.

## Features

- Real-time multiplayer gameplay for 2 players
- Clean, responsive UI with animations
- Automatic reconnection handling
- WebSocket-based communication
- Cross-platform compatibility

## How to Play

1. Two players connect to the game
2. Each player selects rock, paper, or scissors
3. Results are shown in real-time
4. Game automatically starts a new round

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open two browser windows to `http://localhost:3000`

## Deploy to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) and sign up
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Render will automatically detect the configuration from `render.yaml`
6. Deploy and get your public URL!

## Tech Stack

- **Backend**: Node.js with WebSocket (ws library)
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Deployment**: Render
- **Real-time**: WebSocket connections

## Game Rules

- Rock beats Scissors
- Paper beats Rock
- Scissors beats Paper
- Same choice = Tie

Enjoy the game! 🪨📄✂️