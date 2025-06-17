const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, {'Content-Type': contentType});
      res.end(content, 'utf-8');
    }
  });
});

const wss = new WebSocket.Server({server});

let players = [];
let gameState = {
  player1: null,
  player2: null,
  choices: {},
  gameActive: false
};

function resetGame() {
  gameState.choices = {};
  gameState.gameActive = false;
}

function determineWinner(choice1, choice2) {
  if (choice1 === choice2) return 'tie';
  if (
    (choice1 === 'rock' && choice2 === 'scissors') ||
    (choice1 === 'paper' && choice2 === 'rock') ||
    (choice1 === 'scissors' && choice2 === 'paper')
  ) {
    return 'player1';
  }
  return 'player2';
}

wss.on('connection', (ws) => {
  console.log('New client connected');

  if (players.length < 2) {
    const playerId = players.length === 0 ? 'player1' : 'player2';
    players.push({id: playerId, ws: ws});
    gameState[playerId] = ws;

    ws.send(JSON.stringify({
      type: 'playerAssignment',
      playerId: playerId
    }));

    if (players.length === 2) {
      players.forEach(player => {
        player.ws.send(JSON.stringify({
          type: 'gameReady',
          message: 'Both players connected! Make your choice.'
        }));
      });
      gameState.gameActive = true;
    } else {
      ws.send(JSON.stringify({
        type: 'waiting',
        message: 'Waiting for another player...'
      }));
    }
  } else {
    ws.send(JSON.stringify({
      type: 'gameFull',
      message: 'Game is full. Please try again later.'
    }));
    ws.close();
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'choice' && gameState.gameActive) {
        const player = players.find(p => p.ws === ws);
        if (player) {
          gameState.choices[player.id] = data.choice;
          
          players.forEach(p => {
            p.ws.send(JSON.stringify({
              type: 'choiceMade',
              player: player.id,
              waiting: Object.keys(gameState.choices).length < 2
            }));
          });

          if (Object.keys(gameState.choices).length === 2) {
            const winner = determineWinner(
              gameState.choices.player1,
              gameState.choices.player2
            );

            const result = {
              type: 'gameResult',
              choices: gameState.choices,
              winner: winner
            };

            players.forEach(p => {
              p.ws.send(JSON.stringify(result));
            });

            setTimeout(() => {
              resetGame();
              players.forEach(p => {
                p.ws.send(JSON.stringify({
                  type: 'newRound',
                  message: 'New round! Make your choice.'
                }));
              });
            }, 3000);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    players = players.filter(p => p.ws !== ws);
    
    if (gameState.player1 === ws) gameState.player1 = null;
    if (gameState.player2 === ws) gameState.player2 = null;
    
    resetGame();
    
    players.forEach(p => {
      p.ws.send(JSON.stringify({
        type: 'playerDisconnected',
        message: 'Other player disconnected. Waiting for new player...'
      }));
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});