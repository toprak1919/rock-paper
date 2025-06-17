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
            particles: document.getElementById('particles'),
            battleArena: document.getElementById('battle-arena'),
            energyFieldLeft: document.getElementById('energy-field-left'),
            energyFieldRight: document.getElementById('energy-field-right'),
            collisionPoint: document.getElementById('collision-point'),
            energyBurst: document.getElementById('energy-burst'),
            battleText: document.getElementById('battle-text'),
            projectileLeft: document.getElementById('projectile-left'),
            projectileRight: document.getElementById('projectile-right'),
            shockwave: document.getElementById('shockwave'),
            screenFlash: document.getElementById('screen-flash'),
            screenRipple: document.getElementById('screen-ripple'),
            glitchOverlay: document.getElementById('glitch-overlay'),
            matrixCanvas: document.getElementById('matrix-canvas'),
            energyParticles: document.getElementById('energy-particles'),
            cursorTrail: document.getElementById('cursor-trail'),
            powerupSelection: document.getElementById('powerup-selection'),
            activePowerups: document.getElementById('active-powerups'),
            myActivePowerup: document.getElementById('my-active-powerup'),
            player1Powerups: document.getElementById('player1-powerups'),
            player2Powerups: document.getElementById('player2-powerups'),
            themeSelector: document.getElementById('theme-selector'),
            specialRound: document.getElementById('special-round'),
            specialRoundTitle: document.getElementById('special-round-title'),
            specialRoundDesc: document.getElementById('special-round-desc'),
            choiceHeader: document.getElementById('choice-header')
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
        this.powerups = {
            available: 0,
            active: null,
            earned: 0
        };
        this.theme = 'default';
        this.roundCount = 0;
        this.specialRoundActive = false;
        this.unlockedThemes = ['default'];
        
        this.choiceEmojis = {
            rock: '🪨',
            paper: '📄',
            scissors: '✂️'
        };
        
        this.init();
        this.createParticleSystem();
        this.createEnergyParticles();
        this.initMatrixBackground();
        this.initCursorTrail();
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
        this.roundCount++;
        this.updateStatus(data.message);
        if (data.scores) {
            this.scores = data.scores;
            this.updateScoreboard();
        }
        
        // Check for special round
        if (this.roundCount % 5 === 0) {
            this.startSpecialRound();
        } else {
            this.resetChoices();
            this.hideGameResult();
            this.enableChoiceButtons();
            this.startCountdown();
        }
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
        
        // Power-up selection
        document.querySelectorAll('.powerup-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const powerupType = e.currentTarget.dataset.powerup;
                this.selectPowerup(powerupType);
            });
        });
        
        // Theme selection
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.selectTheme(theme);
            });
        });
        
        // Interactive effects
        document.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.createClickEffect(e.clientX, e.clientY);
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.countdownTimer) {
                this.createEnergyBoost();
                e.preventDefault();
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
        
        // 🔥 EPIC BATTLE SEQUENCE 🔥
        this.startEpicBattleSequence(yourChoice, opponentChoice, winner, data);
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
            
            // Earn power-ups every 3 wins
            if (this.stats.currentStreak % 3 === 0) {
                this.powerups.available++;
                this.powerups.earned++;
                this.showPowerupEarned();
            }
            
            // Check achievements and unlocks
            this.checkUnlocks();
            
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
        this.updatePowerupDisplay();
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
        const savedPowerups = localStorage.getItem('rps-powerups');
        const savedTheme = localStorage.getItem('rps-theme');
        const savedUnlocks = localStorage.getItem('rps-unlocks');
        
        if (savedStats) {
            this.stats = { ...this.stats, ...JSON.parse(savedStats) };
        }
        
        if (savedAchievements) {
            this.achievements = { ...this.achievements, ...JSON.parse(savedAchievements) };
        }
        
        if (savedPowerups) {
            this.powerups = { ...this.powerups, ...JSON.parse(savedPowerups) };
        }
        
        if (savedTheme) {
            this.theme = savedTheme;
            this.selectTheme(this.theme);
        }
        
        if (savedUnlocks) {
            this.unlockedThemes = JSON.parse(savedUnlocks);
        }
    }
    
    saveStats() {
        localStorage.setItem('rps-stats', JSON.stringify(this.stats));
        localStorage.setItem('rps-achievements', JSON.stringify(this.achievements));
        localStorage.setItem('rps-powerups', JSON.stringify(this.powerups));
        localStorage.setItem('rps-theme', this.theme);
        localStorage.setItem('rps-unlocks', JSON.stringify(this.unlockedThemes));
    }
    
    // 🎭 EPIC BATTLE SEQUENCE 🎭
    startEpicBattleSequence(yourChoice, opponentChoice, winner, data) {
        this.updateStatus('🔥 BATTLE COMMENCING! 🔥');
        
        // Stage 1: Arena Setup (0.5s)
        this.elements.battleArena.style.display = 'block';
        this.playEpicSound('battleStart');
        this.triggerScreenEffect('darken');
        
        setTimeout(() => {
            // Stage 2: Show projectiles (0.5s)
            this.elements.projectileLeft.textContent = this.choiceEmojis[yourChoice];
            this.elements.projectileRight.textContent = this.choiceEmojis[opponentChoice];
            this.elements.projectileLeft.style.opacity = '1';
            this.elements.projectileRight.style.opacity = '1';
            this.playEpicSound('charge');
        }, 500);
        
        setTimeout(() => {
            // Stage 3: Launch projectiles (1s)
            this.elements.projectileLeft.style.animation = 'battleSequence 1s ease-in forwards';
            this.elements.projectileRight.style.animation = 'battleSequenceRight 1s ease-in forwards';
            this.playEpicSound('launch');
        }, 1000);
        
        setTimeout(() => {
            // Stage 4: COLLISION! (0.3s)
            this.elements.collisionPoint.style.opacity = '1';
            this.elements.energyBurst.style.animation = 'explosionBurst 0.8s ease-out forwards';
            this.elements.shockwave.style.animation = 'shockwaveExpand 1s ease-out forwards';
            this.triggerScreenEffect('flash');
            this.triggerScreenEffect('shake');
            this.playEpicSound('explosion');
        }, 2000);
        
        setTimeout(() => {
            // Stage 5: Battle text reveal (0.5s)
            let battleMsg = 'CLASH!';
            if (winner === 'tie') battleMsg = 'TIE!';
            else if (winner === this.playerId) battleMsg = 'VICTORY!';
            else battleMsg = 'DEFEAT!';
            
            this.elements.battleText.textContent = battleMsg;
            this.elements.battleText.style.animation = 'textReveal 0.8s ease-out forwards';
            this.playEpicSound(winner === this.playerId ? 'victory' : winner === 'tie' ? 'tie' : 'defeat');
        }, 2300);
        
        setTimeout(() => {
            // Stage 6: Show results (start normal result display)
            this.showNormalGameResult(data, yourChoice, opponentChoice, winner);
            
            // Clear battle arena
            setTimeout(() => {
                this.clearBattleArena();
            }, 2000);
        }, 3500);
    }
    
    showNormalGameResult(data, yourChoice, opponentChoice, winner) {
        const { scores, players } = data;
        const opponentId = this.playerId === 'player1' ? 'player2' : 'player1';
        
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
            winnerText = "Epic tie!";
            winnerClass = 'tie';
        } else if (winner === this.playerId) {
            winnerText = 'Legendary victory!';
            winnerClass = 'win';
            this.createConfetti();
        } else {
            winnerText = 'Valiant effort!';
            winnerClass = 'lose';
        }
        
        setTimeout(() => {
            this.elements.winnerText.textContent = winnerText;
            this.elements.winnerText.className = `winner ${winnerClass}`;
            
            // Update stats
            if (winner === this.playerId) {
                this.updateStats(true);
            } else if (winner !== 'tie') {
                this.updateStats(false);
            }
        }, 1000);
        
        this.updateScoreboard();
        this.elements.gameResult.style.display = 'block';
        this.updateStatus('Epic battle complete! Next round starting soon...');
    }
    
    clearBattleArena() {
        this.elements.battleArena.style.display = 'none';
        this.elements.projectileLeft.style.opacity = '0';
        this.elements.projectileRight.style.opacity = '0';
        this.elements.collisionPoint.style.opacity = '0';
        this.elements.battleText.style.opacity = '0';
        
        // Reset animations
        this.elements.projectileLeft.style.animation = '';
        this.elements.projectileRight.style.animation = '';
        this.elements.energyBurst.style.animation = '';
        this.elements.shockwave.style.animation = '';
        this.elements.battleText.style.animation = '';
    }
    
    triggerScreenEffect(type) {
        switch (type) {
            case 'flash':
                this.elements.screenFlash.style.animation = 'none';
                this.elements.screenFlash.offsetHeight; // Trigger reflow
                this.elements.screenFlash.style.animation = 'flash 0.3s ease-out';
                break;
            case 'shake':
                document.body.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    document.body.style.animation = '';
                }, 500);
                break;
            case 'darken':
                this.elements.glitchOverlay.style.opacity = '1';
                setTimeout(() => {
                    this.elements.glitchOverlay.style.opacity = '0';
                }, 1000);
                break;
        }
    }
    
    playEpicSound(type) {
        if (!this.soundEnabled) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch (type) {
            case 'battleStart':
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
            case 'charge':
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case 'launch':
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'explosion':
                oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;
            case 'victory':
                this.playSound('win'); // Use existing victory sound
                break;
            case 'defeat':
                this.playSound('lose'); // Use existing defeat sound
                break;
            case 'tie':
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
        }
    }
    
    createEnergyParticles() {
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'energy-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 4 + 's';
            particle.style.animationDuration = (Math.random() * 2 + 3) + 's';
            
            this.elements.energyParticles.appendChild(particle);
        }
    }
    
    initMatrixBackground() {
        const canvas = this.elements.matrixCanvas;
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const chars = '01';
        const charArray = chars.split('');
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = [];
        
        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }
        
        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#00ff41';
            ctx.font = fontSize + 'px monospace';
            
            for (let i = 0; i < drops.length; i++) {
                const text = charArray[Math.floor(Math.random() * charArray.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };
        
        setInterval(draw, 100);
    }
    
    initCursorTrail() {
        let mouseX = 0;
        let mouseY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            const dot = document.createElement('div');
            dot.className = 'cursor-dot';
            dot.style.left = mouseX + 'px';
            dot.style.top = mouseY + 'px';
            
            // Theme-based cursor colors
            if (this.theme === 'fire') {
                dot.style.background = '#ff6b35';
                dot.style.boxShadow = '0 0 10px #ff6b35';
            } else if (this.theme === 'ice') {
                dot.style.background = '#00d2ff';
                dot.style.boxShadow = '0 0 10px #00d2ff';
            } else if (this.theme === 'electric') {
                dot.style.background = '#ffd700';
                dot.style.boxShadow = '0 0 10px #ffd700';
            }
            
            this.elements.cursorTrail.appendChild(dot);
            
            setTimeout(() => {
                if (dot.parentNode) {
                    dot.parentNode.removeChild(dot);
                }
            }, 800);
        });
    }
    
    // 🎮 POWER-UP SYSTEM 🎮
    showPowerupEarned() {
        this.showAchievement('Power-up Earned!', '⚡');
        this.playEpicSound('victory');
        
        if (this.powerups.available === 1) {
            setTimeout(() => {
                this.elements.powerupSelection.style.display = 'block';
            }, 2000);
        }
    }
    
    selectPowerup(type) {
        if (this.powerups.available <= 0) return;
        
        this.powerups.active = type;
        this.powerups.available--;
        this.elements.powerupSelection.style.display = 'none';
        this.updatePowerupDisplay();
        this.applyPowerupVisuals(type);
        this.playEpicSound('charge');
        
        this.showAchievement(`Power-up Active!`, this.getPowerupIcon(type));
    }
    
    getPowerupIcon(type) {
        const icons = {
            shield: '🛡️',
            lightning: '⚡',
            double: '🔥',
            crystal: '🔮',
            time: '⏰'
        };
        return icons[type] || '⚡';
    }
    
    applyPowerupVisuals(type) {
        // Add aura to all choice buttons
        document.querySelectorAll('.powerup-aura').forEach(aura => {
            aura.className = `powerup-aura ${type}`;
            aura.style.opacity = '1';
        });
        
        // Show active power-up
        this.elements.activePowerups.style.display = 'block';
        this.elements.myActivePowerup.innerHTML = `
            <span>${this.getPowerupIcon(type)}</span>
            <span>${type.toUpperCase()} ACTIVE</span>
        `;
    }
    
    updatePowerupDisplay() {
        // Update power-up count display for current player
        const myDisplay = this.playerId === 'player1' ? 
            this.elements.player1Powerups : this.elements.player2Powerups;
        
        myDisplay.innerHTML = '';
        for (let i = 0; i < this.powerups.available; i++) {
            const icon = document.createElement('div');
            icon.className = 'powerup-icon-small';
            icon.textContent = '⚡';
            myDisplay.appendChild(icon);
        }
    }
    
    // 🎨 THEME SYSTEM 🎨
    selectTheme(theme) {
        if (!this.unlockedThemes.includes(theme)) {
            this.showAchievement('Theme Locked!', '🔒');
            return;
        }
        
        this.theme = theme;
        document.body.className = theme === 'default' ? '' : `${theme}-theme`;
        this.elements.themeSelector.style.display = 'none';
        
        // Update active theme button
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === theme) {
                btn.classList.add('active');
            }
        });
        
        this.playEpicSound('victory');
        this.showAchievement(`${theme.toUpperCase()} Theme Active!`, '🎨');
        this.saveStats();
    }
    
    checkUnlocks() {
        const unlocks = [];
        
        // Theme unlocks
        if (this.stats.gamesPlayed >= 10 && !this.unlockedThemes.includes('fire')) {
            this.unlockedThemes.push('fire');
            unlocks.push('Fire Theme');
        }
        if (this.stats.roundsWon >= 15 && !this.unlockedThemes.includes('ice')) {
            this.unlockedThemes.push('ice');
            unlocks.push('Ice Theme');
        }
        if (this.stats.currentStreak >= 5 && !this.unlockedThemes.includes('electric')) {
            this.unlockedThemes.push('electric');
            unlocks.push('Electric Theme');
        }
        
        // Show theme selector if new themes unlocked
        if (unlocks.length > 0) {
            unlocks.forEach(unlock => {
                this.showAchievement(`${unlock} Unlocked!`, '🎉');
            });
            
            setTimeout(() => {
                this.elements.themeSelector.style.display = 'block';
            }, 3000);
        }
    }
    
    // 🌪️ SPECIAL ROUNDS 🌪️
    startSpecialRound() {
        const rounds = [
            { title: '🌪️ CHAOS ROUND!', desc: 'All choices win against all!' },
            { title: '🎯 SUDDEN DEATH!', desc: 'Loser loses 2 points!' },
            { title: '💫 LUCKY ROUND!', desc: 'Winner gets a power-up!' },
            { title: '🔄 REVERSE ROUND!', desc: 'Everything is backwards!' },
            { title: '⚡ SPEED ROUND!', desc: 'Only 5 seconds to choose!' }
        ];
        
        const round = rounds[Math.floor(Math.random() * rounds.length)];
        this.specialRoundActive = round;
        
        this.elements.specialRoundTitle.textContent = round.title;
        this.elements.specialRoundDesc.textContent = round.desc;
        this.elements.specialRound.style.display = 'flex';
        
        this.playEpicSound('battleStart');
        
        setTimeout(() => {
            this.elements.specialRound.style.display = 'none';
            this.elements.choiceHeader.textContent = round.title;
            this.resetChoices();
            this.hideGameResult();
            this.enableChoiceButtons();
            
            if (round.title.includes('SPEED')) {
                this.countdownTime = 5;
            }
            this.startCountdown();
        }, 3000);
    }
    
    // 🎆 INTERACTIVE EFFECTS 🎆
    createClickEffect(x, y) {
        const effect = document.createElement('div');
        effect.style.position = 'fixed';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        effect.style.width = '20px';
        effect.style.height = '20px';
        effect.style.background = 'radial-gradient(circle, #ffd700, transparent)';
        effect.style.borderRadius = '50%';
        effect.style.pointerEvents = 'none';
        effect.style.animation = 'clickRipple 0.6s ease-out forwards';
        effect.style.zIndex = '9999';
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 600);
    }
    
    createEnergyBoost() {
        const boost = document.createElement('div');
        boost.style.position = 'fixed';
        boost.style.top = '50%';
        boost.style.left = '50%';
        boost.style.transform = 'translate(-50%, -50%)';
        boost.style.width = '100px';
        boost.style.height = '100px';
        boost.style.background = 'radial-gradient(circle, rgba(255, 215, 0, 0.8), transparent)';
        boost.style.borderRadius = '50%';
        boost.style.pointerEvents = 'none';
        boost.style.animation = 'energyBoost 0.8s ease-out forwards';
        boost.style.zIndex = '9998';
        
        document.body.appendChild(boost);
        this.playEpicSound('charge');
        
        setTimeout(() => {
            if (boost.parentNode) {
                boost.parentNode.removeChild(boost);
            }
        }, 800);
    }
    
    updateStatus(message) {
        this.elements.status.textContent = message;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RPSGame();
});