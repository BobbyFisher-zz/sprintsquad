import { Logger } from './Logger.js';

export class UI {
    constructor(gameState) {
        this.logger = new Logger();
        this.gameState = gameState;
        
        // Create UI elements
        this.createScoreDisplay();
        this.createGameOverScreen();
        
        this.logger.log('UI initialized');
    }
    
    createScoreDisplay() {
        // Create score container
        this.scoreContainer = document.createElement('div');
        this.scoreContainer.style.position = 'absolute';
        this.scoreContainer.style.top = '10px';
        this.scoreContainer.style.left = '10px';
        this.scoreContainer.style.color = 'white';
        this.scoreContainer.style.fontSize = '24px';
        this.scoreContainer.style.fontFamily = 'Arial, sans-serif';
        this.scoreContainer.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
        
        // Create score display
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.id = 'scoreDisplay';
        this.scoreDisplay.innerText = 'Score: 0';
        
        this.scoreContainer.appendChild(this.scoreDisplay);
        document.body.appendChild(this.scoreContainer);
        
        this.logger.log('Score display created');
    }
    
    createGameOverScreen() {
        // Create game over container
        this.gameOverContainer = document.createElement('div');
        this.gameOverContainer.style.position = 'absolute';
        this.gameOverContainer.style.top = '50%';
        this.gameOverContainer.style.left = '50%';
        this.gameOverContainer.style.transform = 'translate(-50%, -50%)';
        this.gameOverContainer.style.display = 'none';
        this.gameOverContainer.style.textAlign = 'center';
        this.gameOverContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.gameOverContainer.style.padding = '20px';
        this.gameOverContainer.style.borderRadius = '10px';
        this.gameOverContainer.style.zIndex = '100';
        
        // Create game over text
        this.gameOverText = document.createElement('div');
        this.gameOverText.style.color = 'red';
        this.gameOverText.style.fontSize = '48px';
        this.gameOverText.style.fontFamily = 'Arial, sans-serif';
        this.gameOverText.style.marginBottom = '20px';
        this.gameOverText.innerText = 'Game Over';
        
        // Create final score display
        this.finalScoreDisplay = document.createElement('div');
        this.finalScoreDisplay.style.color = 'white';
        this.finalScoreDisplay.style.fontSize = '24px';
        this.finalScoreDisplay.style.fontFamily = 'Arial, sans-serif';
        this.finalScoreDisplay.style.marginBottom = '30px';
        this.finalScoreDisplay.innerText = 'Final Score: 0';
        
        // Create restart button
        this.restartButton = document.createElement('button');
        this.restartButton.innerText = 'Restart';
        this.restartButton.style.padding = '15px 30px';
        this.restartButton.style.fontSize = '24px';
        this.restartButton.style.backgroundColor = '#4CAF50';
        this.restartButton.style.color = 'white';
        this.restartButton.style.border = 'none';
        this.restartButton.style.borderRadius = '5px';
        this.restartButton.style.cursor = 'pointer';
        this.restartButton.style.transition = 'background-color 0.3s';
        
        this.restartButton.addEventListener('mouseover', () => {
            this.restartButton.style.backgroundColor = '#45a049';
        });
        
        this.restartButton.addEventListener('mouseout', () => {
            this.restartButton.style.backgroundColor = '#4CAF50';
        });
        
        this.restartButton.addEventListener('click', () => {
            this.hideGameOver();
            // Dispatch a custom event for game restart
            const event = new CustomEvent('restartGame');
            window.dispatchEvent(event);
        });
        
        this.gameOverContainer.appendChild(this.gameOverText);
        this.gameOverContainer.appendChild(this.finalScoreDisplay);
        this.gameOverContainer.appendChild(this.restartButton);
        document.body.appendChild(this.gameOverContainer);
        
        this.logger.log('Game over screen created');
    }
    
    updateScore(score) {
        if (this.scoreDisplay) {
            this.scoreDisplay.innerText = `Score: ${score}`;
        }
    }
    
    showGameOver(finalScore) {
        if (this.gameOverContainer && this.finalScoreDisplay) {
            this.finalScoreDisplay.innerText = `Final Score: ${finalScore}`;
            this.gameOverContainer.style.display = 'block';
        }
    }
    
    hideGameOver() {
        if (this.gameOverContainer) {
            this.gameOverContainer.style.display = 'none';
        }
    }
    
    updateUI() {
        // Update UI based on game state
        const state = this.gameState.getState();
        
        if (state === 'playing') {
            // Update score
            this.updateScore(this.gameState.getScore());
        } else if (state === 'gameOver') {
            // Show game over screen
            this.showGameOver(this.gameState.getScore());
        }
    }
} 