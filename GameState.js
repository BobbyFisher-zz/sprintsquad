import { Logger } from './Logger.js';

export class GameState {
    constructor() {
        this.logger = new Logger();
        this.state = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.progress = 0;
        this.tokenCount = 0;
        this.maxTokens = 4;
        this.characterName = '';
        this.logger.log('GameState initialized');
    }
    
    setState(state) {
        if (['menu', 'playing', 'paused', 'gameOver'].includes(state)) {
            this.state = state;
            this.logger.log(`Game state changed to: ${state}`);
            
            // If game over, check for high score
            if (state === 'gameOver') {
                this.checkHighScore();
            }
        } else {
            this.logger.log(`Invalid game state: ${state}`);
        }
    }
    
    getState() {
        return this.state;
    }
    
    addScore(points) {
        this.score += points;
        this.logger.log(`Score increased by ${points}, new score: ${this.score}`);
    }
    
    getScore() {
        return this.score;
    }
    
    resetScore() {
        this.score = 0;
        this.logger.log('Score reset to 0');
    }
    
    addToken() {
        this.tokenCount++;
        this.progress = (this.tokenCount / this.maxTokens) * 100;
        this.logger.log(`Token collected, count: ${this.tokenCount}, progress: ${this.progress}%`);
        
        return this.tokenCount >= this.maxTokens;
    }
    
    getTokenCount() {
        return this.tokenCount;
    }
    
    getProgress() {
        return this.progress;
    }
    
    resetTokens() {
        this.tokenCount = 0;
        this.progress = 0;
        this.logger.log('Tokens reset to 0');
    }
    
    setCharacter(name) {
        this.characterName = name;
        this.logger.log(`Character set to: ${name}`);
    }
    
    getCharacter() {
        return this.characterName;
    }
    
    checkHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            this.logger.log(`New high score: ${this.highScore}`);
            return true;
        }
        return false;
    }
    
    getHighScore() {
        return this.highScore;
    }
    
    saveHighScore() {
        try {
            localStorage.setItem('sprintSquadHighScore', this.highScore.toString());
            this.logger.log(`High score saved: ${this.highScore}`);
        } catch (error) {
            this.logger.log(`Error saving high score: ${error.message}`);
        }
    }
    
    loadHighScore() {
        try {
            const savedScore = localStorage.getItem('sprintSquadHighScore');
            if (savedScore) {
                const score = parseInt(savedScore, 10);
                this.logger.log(`High score loaded: ${score}`);
                return score;
            }
        } catch (error) {
            this.logger.log(`Error loading high score: ${error.message}`);
        }
        return 0;
    }
    
    reset() {
        this.state = 'menu';
        this.score = 0;
        this.tokenCount = 0;
        this.progress = 0;
        this.logger.log('GameState reset');
    }
} 