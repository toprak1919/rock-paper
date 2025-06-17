class RPSGame {
    constructor() {
        this.ws = null;
        this.playerId = null;
        this.gameActive = false;
        this.choiceMade = false;
        
        this.elements = {
            status: document.getElementById('status'),
            playerId: document.getElementById('player-id'),
            gameArea: document.getElementById('game-area'),
            waitingArea: document.getElementById('waiting-area'),
            gameResult: document.getElementById('game-result'),
            yourChoice: document.getElementById('your-choice'),
            opponentChoice: document.getElementById('opponent-choice'),
            winnerText: document.getElementById('winner-text'),
            choiceButtons: document.querySelectorAll('.choice-btn')
        };
        
        this.choiceEmojis = {
            rock: '🪨',
            paper: '📄',
            scissors: '✂️'
        };
        
        this.init();
    }
    
    init() {
        this.connectWebSocket();
        this.setupEventListeners();
    }
    
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host || 'localhost:3000';
        const wsUrl = `${protocol}//${host}`;
        
        this.ws = new WebSocket(wsUrl);
        this.ws.onopen = () => this.onWebSocketOpen();
        this.ws.onmessage = (event) => this.onWebSocketMessage(event);
        this.ws.onclose = () => this.onWebSocketClose();
        this.ws.onerror = (error) => this.onWebSocketError(error);
    }
    
    onWebSocketOpen() {
        console.log('Connected to server');
        this.updateStatus('Connected! Waiting for game assignment...');
    }
    
    onWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('Received message:', data);
            
            switch (data.type) {
                case 'playerAssignment':
                    this.handlePlayerAssignment(data);
                    break;
                case 'gameReady':
                    this.handleGameReady(data);
                    break;
                case 'waiting':
                    this.handleWaiting(data);
                    break;
                case 'gameFull':
                    this.handleGameFull(data);
                    break;
                case 'choiceMade':
                    this.handleChoiceMade(data);
                    break;
                case 'gameResult':
                    this.handleGameResult(data);
                    break;
                case 'newRound':
                    this.handleNewRound(data);
                    break;
                case 'playerDisconnected':
                    this.handlePlayerDisconnected(data);
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }
    
    onWebSocketClose() {
        console.log('Disconnected from server');
        this.updateStatus('Disconnected from server. Attempting to reconnect...');
        this.showWaitingArea();
        
        setTimeout(() => {
            this.connectWebSocket();
        }, 3000);
    }
    
    onWebSocketError(error) {
        console.error('WebSocket error:', error);
        this.updateStatus('Connection error. Please refresh the page.');
    }
    
    handlePlayerAssignment(data) {
        this.playerId = data.playerId;
        this.elements.playerId.textContent = `You are ${data.playerId}`;
    }
    
    handleGameReady(data) {
        this.gameActive = true;
        this.updateStatus(data.message);
        this.showGameArea();
        this.resetChoices();
    }
    
    handleWaiting(data) {
        this.updateStatus(data.message);
        this.showWaitingArea();
    }
    
    handleGameFull(data) {
        this.updateStatus(data.message);
        this.showWaitingArea();
    }
    
    handleChoiceMade(data) {
        if (data.waiting) {
            this.updateStatus('Waiting for opponent\'s choice...');
            this.disableChoiceButtons();
        }
    }
    
    handleGameResult(data) {
        this.showGameResult(data);
    }
    
    handleNewRound(data) {
        this.updateStatus(data.message);
        this.resetChoices();
        this.hideGameResult();
        this.enableChoiceButtons();
    }
    
    handlePlayerDisconnected(data) {
        this.updateStatus(data.message);
        this.showWaitingArea();
        this.gameActive = false;
    }
    
    setupEventListeners() {
        this.elements.choiceButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                if (this.gameActive && !this.choiceMade) {
                    const choice = e.currentTarget.dataset.choice;
                    this.makeChoice(choice);
                }
            });
        });
    }
    
    makeChoice(choice) {
        if (!this.gameActive || this.choiceMade) return;
        
        this.choiceMade = true;
        this.highlightChoice(choice);
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'choice',
                choice: choice
            }));
        }
        
        this.updateStatus('Choice made! Waiting for opponent...');
    }
    
    highlightChoice(choice) {
        this.elements.choiceButtons.forEach(button => {
            button.classList.remove('selected');
            if (button.dataset.choice === choice) {
                button.classList.add('selected');
            }
        });
    }
    
    disableChoiceButtons() {
        this.elements.choiceButtons.forEach(button => {
            button.classList.add('disabled');
        });
    }
    
    enableChoiceButtons() {
        this.elements.choiceButtons.forEach(button => {
            button.classList.remove('disabled');
        });
    }
    
    resetChoices() {
        this.choiceMade = false;
        this.elements.choiceButtons.forEach(button => {
            button.classList.remove('selected');
        });
        this.enableChoiceButtons();
    }
    
    showGameArea() {
        this.elements.gameArea.style.display = 'block';
        this.elements.waitingArea.style.display = 'none';
    }
    
    showWaitingArea() {
        this.elements.gameArea.style.display = 'none';
        this.elements.waitingArea.style.display = 'block';
    }
    
    showGameResult(data) {
        const { choices, winner } = data;
        
        const yourChoice = choices[this.playerId];
        const opponentId = this.playerId === 'player1' ? 'player2' : 'player1';
        const opponentChoice = choices[opponentId];
        
        this.elements.yourChoice.textContent = this.choiceEmojis[yourChoice];
        this.elements.opponentChoice.textContent = this.choiceEmojis[opponentChoice];
        
        let winnerText = '';
        let winnerClass = '';
        
        if (winner === 'tie') {
            winnerText = "It's a tie!";
            winnerClass = 'tie';
        } else if (winner === this.playerId) {
            winnerText = 'You win!';
            winnerClass = 'win';
        } else {
            winnerText = 'You lose!';
            winnerClass = 'lose';
        }
        
        this.elements.winnerText.textContent = winnerText;
        this.elements.winnerText.className = `winner ${winnerClass}`;
        
        this.elements.gameResult.style.display = 'block';
        this.updateStatus('Round complete! Next round starting soon...');
    }
    
    hideGameResult() {
        this.elements.gameResult.style.display = 'none';
    }
    
    updateStatus(message) {
        this.elements.status.textContent = message;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RPSGame();
});