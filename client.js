class RPSGame {
    constructor() {
        this.ws = null;
        this.playerId = null;
        this.username = null;
        this.gameActive = false;
        this.choiceMade = false;
        this.players = {};
        this.scores = { player1: 0, player2: 0 };
        
        this.elements = {
            usernameArea: document.getElementById('username-area'),
            usernameInput: document.getElementById('username-input'),
            joinGameBtn: document.getElementById('join-game-btn'),
            scoreboard: document.getElementById('scoreboard'),
            player1Name: document.getElementById('player1-name'),
            player1Score: document.getElementById('player1-score'),
            player2Name: document.getElementById('player2-name'),
            player2Score: document.getElementById('player2-score'),
            status: document.getElementById('status'),
            playerId: document.getElementById('player-id'),
            gameArea: document.getElementById('game-area'),
            waitingArea: document.getElementById('waiting-area'),
            gameResult: document.getElementById('game-result'),
            yourChoice: document.getElementById('your-choice'),
            opponentChoice: document.getElementById('opponent-choice'),
            winnerText: document.getElementById('winner-text'),
            yourNameLabel: document.getElementById('your-name-label'),
            opponentNameLabel: document.getElementById('opponent-name-label'),
            choiceButtons: document.querySelectorAll('.choice-btn'),
            chatSection: document.getElementById('chat-section'),
            chatMessages: document.getElementById('chat-messages'),
            chatInput: document.getElementById('chat-input'),
            sendChatBtn: document.getElementById('send-chat-btn'),
            countdownArea: document.getElementById('countdown-area'),
            countdownText: document.getElementById('countdown-text'),
            countdownProgress: document.getElementById('countdown-progress'),
            confetti: document.getElementById('confetti'),
            particles: document.getElementById('particles')
        };
        
        this.countdownTimer = null;
        this.countdownTime = 10;
        this.soundEnabled = true;
        this.achievements = {
            firstWin: false,
            winStreak3: false,
            winStreak5: false,
            perfectGame: false
        };
        this.stats = {
            gamesPlayed: 0,
            roundsWon: 0,
            currentStreak: 0,
            maxStreak: 0
        };
        
        this.choiceEmojis = {
            rock: '🪨',
            paper: '📄',
            scissors: '✂️'
        };
        
        this.init();
        this.createParticleSystem();
        this.loadStats();
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
        this.updateStatus('Connected! Please enter your username.');
    }
    
    onWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('Received message:', data);
            
            switch (data.type) {
                case 'requestUsername':
                    this.handleRequestUsername(data);
                    break;
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
                case 'newGame':
                    this.handleNewGame(data);
                    break;
                case 'gameEnded':
                    this.handleGameEnded(data);
                    break;
                case 'playerDisconnected':
                    this.handlePlayerDisconnected(data);
                    break;
                case 'chatMessage':
                    this.handleChatMessage(data);
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
    
    handleRequestUsername(data) {
        this.updateStatus(data.message);
        this.showUsernameArea();
    }
    
    handlePlayerAssignment(data) {
        this.playerId = data.playerId;
        this.username = data.username;
        this.elements.playerId.textContent = `You are ${data.username} (${data.playerId})`;
        this.hideUsernameArea();
    }
    
    handleGameReady(data) {
        this.gameActive = true;
        this.players = data.players;
        this.scores = data.scores;
        this.updateStatus(data.message);
        this.updateScoreboard();
        this.showGameArea();
        this.showScoreboard();
        this.showChat();
        this.resetChoices();
        this.startCountdown();
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
        if (data.scores) {
            this.scores = data.scores;
            this.updateScoreboard();
        }
        this.resetChoices();
        this.hideGameResult();
        this.enableChoiceButtons();
        this.startCountdown();
    }
    
    handleNewGame(data) {
        this.updateStatus(data.message);
        this.scores = data.scores;
        this.updateScoreboard();
        this.resetChoices();
        this.hideGameResult();
        this.enableChoiceButtons();
        this.clearChat();
    }
    
    handleGameEnded(data) {
        const { winner, finalScores, players } = data;
        
        let gameWinnerText = '';
        if (winner === this.playerId) {
            gameWinnerText = `🎉 Congratulations! You won the game! 🎉`;
        } else {
            gameWinnerText = `${players[winner].username} won the game! Better luck next time.`;
        }
        
        this.updateStatus(gameWinnerText);
        this.scores = finalScores;
        this.updateScoreboard();
    }
    
    handleChatMessage(data) {
        this.addChatMessage(data.username, data.message, data.timestamp);
    }
    
    handlePlayerDisconnected(data) {
        this.updateStatus(data.message);
        this.showWaitingArea();
        this.gameActive = false;
    }
    
    setupEventListeners() {
        this.elements.joinGameBtn.addEventListener('click', () => {
            this.joinGame();
        });
        
        this.elements.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinGame();
            }
        });
        
        this.elements.choiceButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                if (this.gameActive && !this.choiceMade) {
                    const choice = e.currentTarget.dataset.choice;
                    this.makeChoice(choice);
                }
            });
        });
        
        this.elements.sendChatBtn.addEventListener('click', () => {
            this.sendChatMessage();
        });
        
        this.elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
    }
    
    makeChoice(choice) {
        if (!this.gameActive || this.choiceMade) return;
        
        this.choiceMade = true;
        this.highlightChoice(choice);
        this.stopCountdown();
        this.playSound('click');
        
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
        
        // Reset animation classes
        const yourContainer = document.getElementById('your-choice-container');
        const opponentContainer = document.getElementById('opponent-choice-container');
        if (yourContainer) yourContainer.classList.remove('animate-choice');
        if (opponentContainer) opponentContainer.classList.remove('animate-choice');
        
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
        const { choices, winner, scores, players } = data;
        
        this.scores = scores;
        this.players = players;
        
        const yourChoice = choices[this.playerId];
        const opponentId = this.playerId === 'player1' ? 'player2' : 'player1';
        const opponentChoice = choices[opponentId];
        
        // Add animation classes
        const yourContainer = document.getElementById('your-choice-container');
        const opponentContainer = document.getElementById('opponent-choice-container');
        
        setTimeout(() => {
            this.elements.yourChoice.textContent = this.choiceEmojis[yourChoice];
            yourContainer.classList.add('animate-choice');
        }, 200);
        
        setTimeout(() => {
            this.elements.opponentChoice.textContent = this.choiceEmojis[opponentChoice];
            opponentContainer.classList.add('animate-choice');
        }, 600);
        
        // Update player names in result display
        this.elements.yourNameLabel.textContent = this.username;
        this.elements.opponentNameLabel.textContent = players[opponentId].username;
        
        let winnerText = '';
        let winnerClass = '';
        
        if (winner === 'tie') {
            winnerText = "It's a tie!";
            winnerClass = 'tie';
        } else if (winner === this.playerId) {
            winnerText = 'You win the round!';
            winnerClass = 'win';
            this.createConfetti();
        } else {
            winnerText = 'You lose the round!';
            winnerClass = 'lose';
        }
        
        setTimeout(() => {
            this.elements.winnerText.textContent = winnerText;
            this.elements.winnerText.className = `winner ${winnerClass}`;
            
            // Trigger battle effect
            const battleEffect = document.getElementById('battle-effect');
            battleEffect.style.animation = 'battleFlash 0.5s ease-in-out';
            
            // Update stats and play sounds
            if (winner === this.playerId) {
                this.updateStats(true);
                this.playSound('win');
            } else if (winner !== 'tie') {
                this.updateStats(false);
                this.playSound('lose');
            }
        }, 1000);
        
        this.updateScoreboard();
        this.elements.gameResult.style.display = 'block';
        this.updateStatus('Round complete! Next round starting soon...');
    }
    
    hideGameResult() {
        this.elements.gameResult.style.display = 'none';
        // Clear confetti
        this.elements.confetti.innerHTML = '';
    }
    
    joinGame() {
        const username = this.elements.usernameInput.value.trim();
        if (username && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'setUsername',
                username: username
            }));
        } else if (!username) {
            alert('Please enter a username!');
        }
    }
    
    sendChatMessage() {
        const message = this.elements.chatInput.value.trim();
        if (message && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'chat',
                message: message
            }));
            this.elements.chatInput.value = '';
        }
    }
    
    addChatMessage(username, message, timestamp) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        messageDiv.innerHTML = `<span class="chat-username">${username}:</span> ${message}`;
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        // Keep only last 20 messages
        while (this.elements.chatMessages.children.length > 20) {
            this.elements.chatMessages.removeChild(this.elements.chatMessages.firstChild);
        }
    }
    
    clearChat() {
        this.elements.chatMessages.innerHTML = '';
    }
    
    showUsernameArea() {
        this.elements.usernameArea.style.display = 'block';
        this.elements.waitingArea.style.display = 'none';
        this.elements.gameArea.style.display = 'none';
        this.elements.scoreboard.style.display = 'none';
        this.elements.usernameInput.focus();
    }
    
    hideUsernameArea() {
        this.elements.usernameArea.style.display = 'none';
    }
    
    showScoreboard() {
        this.elements.scoreboard.style.display = 'flex';
    }
    
    showChat() {
        this.elements.chatSection.style.display = 'block';
    }
    
    updateScoreboard() {
        if (this.players.player1) {
            this.elements.player1Name.textContent = this.players.player1.username;
            this.elements.player1Score.textContent = this.scores.player1;
        }
        if (this.players.player2) {
            this.elements.player2Name.textContent = this.players.player2.username;
            this.elements.player2Score.textContent = this.scores.player2;
        }
    }
    
    startCountdown() {
        this.countdownTime = 10;
        this.elements.countdownArea.style.display = 'flex';
        this.updateCountdownDisplay();
        
        this.countdownTimer = setInterval(() => {
            this.countdownTime--;
            this.updateCountdownDisplay();
            
            if (this.countdownTime <= 0) {
                this.stopCountdown();
                if (!this.choiceMade) {
                    // Auto-select random choice
                    const choices = ['rock', 'paper', 'scissors'];
                    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
                    this.makeChoice(randomChoice);
                }
            }
        }, 1000);
    }
    
    stopCountdown() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        this.elements.countdownArea.style.display = 'none';
    }
    
    updateCountdownDisplay() {
        this.elements.countdownText.textContent = this.countdownTime;
        const progress = (10 - this.countdownTime) / 10;
        const circumference = 2 * Math.PI * 50;
        const offset = circumference * progress;
        this.elements.countdownProgress.style.strokeDashoffset = offset;
        
        // Change color as time runs out
        if (this.countdownTime <= 3) {
            this.elements.countdownProgress.style.stroke = '#ef4444';
            this.elements.countdownText.style.color = '#ef4444';
            if (this.countdownTime <= 3 && this.countdownTime > 0) {
                this.playSound('countdown');
            }
        } else if (this.countdownTime <= 5) {
            this.elements.countdownProgress.style.stroke = '#f59e0b';
            this.elements.countdownText.style.color = '#f59e0b';
        } else {
            this.elements.countdownProgress.style.stroke = '#10b981';
            this.elements.countdownText.style.color = '#10b981';
        }
    }
    
    createConfetti() {
        const colors = ['#ffd700', '#ff6b35', '#f7931e', '#c2185b', '#8e24aa', '#1976d2'];
        
        for (let i = 0; i < 50; i++) {
            const confettiPiece = document.createElement('div');
            confettiPiece.className = 'confetti-piece';
            confettiPiece.style.left = Math.random() * 100 + '%';
            confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confettiPiece.style.animationDelay = Math.random() * 3 + 's';
            confettiPiece.style.animationDuration = (Math.random() * 2 + 2) + 's';
            
            this.elements.confetti.appendChild(confettiPiece);
            
            setTimeout(() => {
                if (confettiPiece.parentNode) {
                    confettiPiece.parentNode.removeChild(confettiPiece);
                }
            }, 5000);
        }
    }
    
    createParticleSystem() {
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 8 + 's';
            particle.style.animationDuration = (Math.random() * 4 + 6) + 's';
            
            this.elements.particles.appendChild(particle);
        }
    }
    
    playSound(type) {
        if (!this.soundEnabled) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch (type) {
            case 'click':
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
            case 'win':
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
            case 'lose':
                oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(247, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
                break;
            case 'countdown':
                oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
        }
    }
    
    updateStats(won, gameEnded = false) {
        if (gameEnded) {
            this.stats.gamesPlayed++;
        }
        
        if (won) {
            this.stats.roundsWon++;
            this.stats.currentStreak++;
            this.stats.maxStreak = Math.max(this.stats.maxStreak, this.stats.currentStreak);
            
            // Check achievements
            if (!this.achievements.firstWin && this.stats.roundsWon === 1) {
                this.achievements.firstWin = true;
                this.showAchievement('First Victory!', '🏆');
            }
            
            if (!this.achievements.winStreak3 && this.stats.currentStreak === 3) {
                this.achievements.winStreak3 = true;
                this.showAchievement('Hat Trick!', '🔥');
            }
            
            if (!this.achievements.winStreak5 && this.stats.currentStreak === 5) {
                this.achievements.winStreak5 = true;
                this.showAchievement('Unstoppable!', '⚡');
            }
        } else {
            this.stats.currentStreak = 0;
        }
        
        this.saveStats();
    }
    
    showAchievement(title, emoji) {
        const achievement = document.createElement('div');
        achievement.className = 'achievement-popup';
        achievement.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-emoji">${emoji}</div>
                <div class="achievement-title">${title}</div>
            </div>
        `;
        
        document.body.appendChild(achievement);
        
        setTimeout(() => {
            achievement.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            achievement.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(achievement);
            }, 300);
        }, 3000);
        
        this.playSound('win');
    }
    
    loadStats() {
        const savedStats = localStorage.getItem('rps-stats');
        const savedAchievements = localStorage.getItem('rps-achievements');
        
        if (savedStats) {
            this.stats = { ...this.stats, ...JSON.parse(savedStats) };
        }
        
        if (savedAchievements) {
            this.achievements = { ...this.achievements, ...JSON.parse(savedAchievements) };
        }
    }
    
    saveStats() {
        localStorage.setItem('rps-stats', JSON.stringify(this.stats));
        localStorage.setItem('rps-achievements', JSON.stringify(this.achievements));
    }
    
    updateStatus(message) {
        this.elements.status.textContent = message;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RPSGame();
});