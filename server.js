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
  gameActive: false,
  scores: { player1: 0, player2: 0 },
  roundsToWin: 3,
  currentRound: 0,
  gameWinner: null
};

let chatMessages = [];

function resetRound() {
  gameState.choices = {};
  gameState.gameActive = true;
}

function resetGame() {
  gameState.choices = {};
  gameState.gameActive = false;
  gameState.scores = { player1: 0, player2: 0 };
  gameState.currentRound = 0;
  gameState.gameWinner = null;
  chatMessages = [];
}

function checkGameWinner() {
  if (gameState.scores.player1 >= gameState.roundsToWin) {
    gameState.gameWinner = 'player1';
    return true;
  }
  if (gameState.scores.player2 >= gameState.roundsToWin) {
    gameState.gameWinner = 'player2';
    return true;
  }
  return false;
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
  
  ws.send(JSON.stringify({
    type: 'requestUsername',
    message: 'Please enter your username to join the game.'
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'setUsername') {
        if (players.length < 2) {
          const playerId = players.length === 0 ? 'player1' : 'player2';
          players.push({id: playerId, ws: ws, username: data.username});
          gameState[playerId] = ws;

          ws.send(JSON.stringify({
            type: 'playerAssignment',
            playerId: playerId,
            username: data.username
          }));

          if (players.length === 2) {
            const gameData = {
              type: 'gameReady',
              message: 'Both players connected! Best of ' + gameState.roundsToWin + ' rounds.',
              players: {
                player1: { username: players[0].username },
                player2: { username: players[1].username }
              },
              scores: gameState.scores,
              roundsToWin: gameState.roundsToWin
            };
            
            players.forEach(player => {
              player.ws.send(JSON.stringify(gameData));
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
      }
      
      else if (data.type === 'choice' && gameState.gameActive) {
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
            
            gameState.currentRound++;
            if (winner !== 'tie') {
              gameState.scores[winner]++;
            }

            const result = {
              type: 'gameResult',
              choices: gameState.choices,
              winner: winner,
              scores: gameState.scores,
              round: gameState.currentRound,
              players: {
                player1: { username: players[0].username },
                player2: { username: players[1].username }
              }
            };

            players.forEach(p => {
              p.ws.send(JSON.stringify(result));
            });
            
            const gameEnded = checkGameWinner();
            
            setTimeout(() => {
              if (gameEnded) {
                players.forEach(p => {
                  p.ws.send(JSON.stringify({
                    type: 'gameEnded',
                    winner: gameState.gameWinner,
                    finalScores: gameState.scores,
                    players: {
                      player1: { username: players[0].username },
                      player2: { username: players[1].username }
                    }
                  }));
                });
                
                setTimeout(() => {
                  resetGame();
                  players.forEach(p => {
                    p.ws.send(JSON.stringify({
                      type: 'newGame',
                      message: 'New game starting! Best of ' + gameState.roundsToWin + ' rounds.',
                      scores: gameState.scores,
                      roundsToWin: gameState.roundsToWin
                    }));
                  });
                }, 5000);
              } else {
                resetRound();
                players.forEach(p => {
                  p.ws.send(JSON.stringify({
                    type: 'newRound',
                    message: 'Next round! Make your choice.',
                    scores: gameState.scores,
                    round: gameState.currentRound + 1
                  }));
                });
              }
            }, 3000);
          }
        }
      }
      
      else if (data.type === 'chat') {
        const player = players.find(p => p.ws === ws);
        if (player && data.message.trim()) {
          const chatMessage = {
            username: player.username,
            message: data.message.trim(),
            timestamp: Date.now()
          };
          
          chatMessages.push(chatMessage);
          if (chatMessages.length > 50) {
            chatMessages.shift();
          }
          
          players.forEach(p => {
            p.ws.send(JSON.stringify({
              type: 'chatMessage',
              ...chatMessage
            }));
          });
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    const disconnectedPlayer = players.find(p => p.ws === ws);
    players = players.filter(p => p.ws !== ws);
    
    if (gameState.player1 === ws) gameState.player1 = null;
    if (gameState.player2 === ws) gameState.player2 = null;
    
    resetGame();
    
    players.forEach(p => {
      p.ws.send(JSON.stringify({
        type: 'playerDisconnected',
        message: disconnectedPlayer ? 
          `${disconnectedPlayer.username} disconnected. Waiting for new player...` :
          'Other player disconnected. Waiting for new player...'
      }));
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});