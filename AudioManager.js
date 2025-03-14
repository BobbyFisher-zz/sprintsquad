export class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.isMuted = false;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        
        // Define sound URLs
        this.soundURLs = {
            coin: 'audio/coin.mp3',
            crash: 'audio/crash.mp3',
            gameOver: 'audio/game_over.mp3',
            music: 'audio/background_music.mp3'
        };
        
        // Create mute button
        this.createMuteButton();
        
        console.log('AudioManager initialized');
    }
    
    createMuteButton() {
        const muteButton = document.createElement('button');
        muteButton.textContent = '🔊';
        muteButton.style.position = 'absolute';
        muteButton.style.top = '10px';
        muteButton.style.right = '80px';
        muteButton.style.fontSize = '24px';
        muteButton.style.padding = '5px 10px';
        muteButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        muteButton.style.color = 'white';
        muteButton.style.border = 'none';
        muteButton.style.borderRadius = '5px';
        muteButton.style.cursor = 'pointer';
        muteButton.style.zIndex = '1000';
        
        muteButton.onclick = () => {
            this.toggleMute();
            muteButton.textContent = this.isMuted ? '🔇' : '🔊';
        };
        
        document.body.appendChild(muteButton);
    }
    
    // Load all sounds at once
    loadAllSounds() {
        const promises = [];
        
        for (const [key, url] of Object.entries(this.soundURLs)) {
            if (key === 'music') {
                // Handle background music separately
                const audio = new Audio(url);
                audio.loop = true;
                audio.volume = this.musicVolume;
                this.music = audio;
                
                // Add event listener to handle loading errors
                const promise = new Promise((resolve) => {
                    audio.addEventListener('canplaythrough', () => {
                        console.log('Background music loaded successfully');
                        resolve();
                    });
                    
                    audio.addEventListener('error', () => {
                        console.error('Error loading background music');
                        resolve(); // Resolve anyway to not block other sounds
                    });
                    
                    // Force load
                    audio.load();
                });
                
                promises.push(promise);
            } else {
                // Handle sound effects
                const audio = new Audio(url);
                audio.volume = this.sfxVolume;
                this.sounds[key] = audio;
                
                // Add event listener to handle loading errors
                const promise = new Promise((resolve) => {
                    audio.addEventListener('canplaythrough', () => {
                        console.log(`Sound ${key} loaded successfully`);
                        resolve();
                    });
                    
                    audio.addEventListener('error', () => {
                        console.error(`Error loading sound ${key}`);
                        resolve(); // Resolve anyway to not block other sounds
                    });
                    
                    // Force load
                    audio.load();
                });
                
                promises.push(promise);
            }
        }
        
        return Promise.all(promises);
    }
    
    // Play a sound effect
    playSound(soundName) {
        if (this.isMuted) return;
        
        // Map 'game_over' to 'gameOver' for consistency
        if (soundName === 'game_over') {
            soundName = 'gameOver';
        }
        
        if (this.sounds[soundName]) {
            // Clone the audio to allow multiple instances to play simultaneously
            const sound = this.sounds[soundName].cloneNode();
            sound.volume = this.sfxVolume;
            
            sound.play().catch(error => {
                console.error(`Error playing sound ${soundName}:`, error);
            });
            
            console.log(`Playing sound: ${soundName}`);
        } else {
            console.warn(`Sound ${soundName} not found`);
        }
    }
    
    // Play background music
    playMusic() {
        if (this.isMuted || !this.music) return;
        
        this.music.play().catch(error => {
            console.error('Error playing background music:', error);
        });
    }
    
    // Pause background music
    pauseMusic() {
        if (this.music) {
            this.music.pause();
        }
    }
    
    // Toggle mute state
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.pauseMusic();
        } else {
            this.playMusic();
        }
        
        console.log(`Audio ${this.isMuted ? 'muted' : 'unmuted'}`);
    }
    
    // Set music volume (0.0 to 1.0)
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.music) {
            this.music.volume = this.musicVolume;
        }
    }
    
    // Set sound effects volume (0.0 to 1.0)
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        
        // Update volume for all loaded sound effects
        for (const sound of Object.values(this.sounds)) {
            sound.volume = this.sfxVolume;
        }
    }
} 