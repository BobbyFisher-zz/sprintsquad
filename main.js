import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';
import { InputManager } from './InputManager.js';
import { LevelManager } from './LevelManager.js';
import { Logger } from './Logger.js';
import { NoxController } from './NoxController.js';
import { BuggyController } from './BuggyController.js';
import { TeagController } from './TeagController.js';
import { DaxController } from './DaxController.js';
import { TextureManager } from './TextureManager.js';
import { AudioManager } from './AudioManager.js';
import { Game } from './Game.js';
import { Debug } from './debug.js';

console.log('Starting main.js');

// Initialize texture and audio managers
const textureManager = new TextureManager();
const audioManager = new AudioManager();

// Make audioManager globally available
window.audioManager = audioManager;

// Load textures and sounds
Promise.all([
    textureManager.loadAllTextures(),
    audioManager.loadAllSounds()
]).then(() => {
    console.log('All assets loaded successfully');
}).catch(error => {
    console.error('Error loading assets:', error);
});

const scene = new THREE.Scene();
console.log('Scene created:', scene);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
console.log('Camera created:', camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
console.log('Renderer created and appended:', renderer);

// Add lights to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
console.log('Ambient light added to scene');

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);
console.log('Directional light added to scene');

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

const planeGeometry = new THREE.PlaneGeometry(20, 200);
const planeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x808080, 
    side: THREE.DoubleSide,
    roughness: 0.8,
    metalness: 0.2
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
plane.position.y = -0.5;
plane.position.z = 0;
plane.receiveShadow = true;
scene.add(plane);
console.log('Plane added to scene at:', plane.position);

let player;
let levelManager;
let inputManager;
let logger;
let gameState = { gameOver: false };
let survivalTime = 0;
let selectedCharacter = null;

// Define score in the global scope and make it accessible to window
window.score = 0;
let score = window.score;

// Create score display
const scoreContainer = document.createElement('div');
scoreContainer.style.position = 'absolute';
scoreContainer.style.top = '10px';
scoreContainer.style.left = '10px';
scoreContainer.style.color = 'white';
scoreContainer.style.fontSize = '24px';
scoreContainer.style.fontFamily = 'Arial';
scoreContainer.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
scoreContainer.style.zIndex = '100';

const scoreDisplay = document.createElement('div');
scoreDisplay.innerText = 'Score: 0';
scoreDisplay.id = 'scoreDisplay';
scoreContainer.appendChild(scoreDisplay);
document.body.appendChild(scoreContainer);
console.log('Score display added');

// Remove duplicate UI elements that are now handled by UI.js
// The following UI elements are now created by the UI class:
// - progressBarContainer and progressBar (removed as tokens are no longer spawned)
// - gameOverContainer, gameOverDisplay, finalScoreDisplay, and restartButton

// Keep the character selection menu
const menuContainer = document.createElement('div');
menuContainer.style.position = 'absolute';
menuContainer.style.top = '0';
menuContainer.style.left = '0';
menuContainer.style.width = '100%';
menuContainer.style.height = '100%';
menuContainer.style.display = 'flex';
menuContainer.style.flexDirection = 'column';
menuContainer.style.justifyContent = 'center';
menuContainer.style.alignItems = 'center';
menuContainer.style.background = 'linear-gradient(to bottom, #1a2a6c, #b21f1f, #fdbb2d)';
menuContainer.style.zIndex = '1000';

// Add a subtle ground texture
const groundTexture = document.createElement('div');
groundTexture.style.position = 'absolute';
groundTexture.style.bottom = '0';
groundTexture.style.width = '100%';
groundTexture.style.height = '30%';
groundTexture.style.background = 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%), repeating-linear-gradient(45deg, #444 0px, #333 10px, #444 10px, #333 20px)';
groundTexture.style.opacity = '0.5';
menuContainer.appendChild(groundTexture);

const menuTitle = document.createElement('div');
menuTitle.style.color = 'white';
menuTitle.style.fontSize = '48px';
menuTitle.style.fontFamily = 'Arial, sans-serif';
menuTitle.style.fontWeight = 'bold';
menuTitle.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
menuTitle.style.marginBottom = '40px';
menuTitle.innerText = 'SELECT YOUR CHARACTER';
menuContainer.appendChild(menuTitle);

// Create a grid container for the character panels
const gridContainer = document.createElement('div');
gridContainer.style.display = 'grid';
gridContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
gridContainer.style.gridTemplateRows = 'repeat(2, 1fr)';
gridContainer.style.gap = '20px';
gridContainer.style.width = '80%';
gridContainer.style.maxWidth = '800px';
menuContainer.appendChild(gridContainer);

const characterData = [
    { name: 'Dax', color: '#8B4513' },
    { name: 'Nox', color: '#A52A2A' },
    { name: 'Buggy', color: '#32CD32' },
    { name: 'Teag', color: '#FFD700' }
];

characterData.forEach((char, index) => {
    // Create panel container
    const panel = document.createElement('div');
    panel.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    panel.style.borderRadius = '10px';
    panel.style.padding = '20px';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.alignItems = 'center';
    panel.style.justifyContent = 'center';
    panel.style.cursor = 'pointer';
    panel.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    panel.style.transition = 'transform 0.2s, box-shadow 0.2s';
    panel.style.height = '150px';
    
    // Hover effects
    panel.addEventListener('mouseenter', () => {
        panel.style.transform = 'scale(1.05)';
        panel.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)';
        panel.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    });
    
    panel.addEventListener('mouseleave', () => {
        panel.style.transform = 'scale(1)';
        panel.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        panel.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    });
    
    // Create character name
    const nameElement = document.createElement('div');
    nameElement.style.color = char.color;
    nameElement.style.fontSize = '36px';
    nameElement.style.fontWeight = 'bold';
    nameElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    nameElement.style.marginBottom = '10px';
    nameElement.innerText = char.name;
    panel.appendChild(nameElement);
    
    // Add click event to select character
    panel.addEventListener('click', () => {
        selectedCharacter = char.name.toLowerCase();
        menuContainer.style.display = 'none';
        startGame();
    });
    
    gridContainer.appendChild(panel);
});

console.log('Character selection grid added with names only');

// Set initial camera position
camera.position.z = 5;  // Closer to origin
camera.position.y = 2;  // Lower height
camera.position.x = 0;  // Centered horizontally
camera.lookAt(0, 0, -10); // Look ahead at the path
console.log('Camera positioned:', camera.position);

function animate(time) {
    requestAnimationFrame(animate);
    const delta = Math.min(0.1, (time - lastTime) / 1000);
    lastTime = time;

    if (!gameState.gameOver && !gameState.paused && player && player.isReady()) {
        survivalTime += delta;
        
        // Score is now only updated when coins are collected, not based on survival time
        
        player.update(camera, inputManager.getActions(), levelManager.getObstacles(), levelManager.getBarriers(), scene, gameState, delta, logger);
        levelManager.update(delta);
        
        // Update track position to create an endless track effect
        const trackSegments = scene.children.filter(child => 
            child.userData && child.userData.isTrackSegment
        );
        
        trackSegments.forEach(trackSegment => {
            // If player has moved past this track segment
            if (player.mesh.position.z < trackSegment.position.z + trackSegment.geometry.parameters.height / 2) {
                // Find the furthest track segment
                const furthestZ = Math.min(...trackSegments.map(segment => segment.position.z));
                // Move this segment to be the new furthest one
                trackSegment.position.z = furthestZ - trackSegment.geometry.parameters.height;
            }
        });
        
        // Position camera behind and slightly above player with fixed offset
        camera.position.z = player.mesh.position.z + 5; // Reduced distance to keep player more visible
        camera.position.x = player.mesh.position.x * 0.8; // Follow player horizontally but dampen movement
        camera.position.y = 2; // Lower camera height for better view
        
        // Make camera look at a point slightly ahead of the player
        const lookAtPoint = new THREE.Vector3(
            player.mesh.position.x * 0.5, // Look slightly toward player's horizontal position
            player.mesh.position.y, // Same height as player
            player.mesh.position.z - 10 // Look ahead of player
        );
        camera.lookAt(lookAtPoint);
        
        // Log camera and player positions occasionally for debugging
        if (Math.random() < 0.01) {
            console.log('Player position:', player.mesh.position);
            console.log('Camera position:', camera.position);
            console.log('Camera looking at:', lookAtPoint);
        }
    } else if (gameState.gameOver) {
        // Show game over modal
        showGameOverModal();
    }

    renderer.render(scene, camera);
    if (Math.random() < 0.01) {
        console.log('Frame rendered, player position:', player ? player.mesh.position : 'No player', 'score:', window.score);
    }
}

function startGame() {
    console.log(`Starting game with character: ${selectedCharacter}`);
    
    // Show loading screen
    showLoadingScreen();
    
    // Reset game state
    gameState.gameOver = false;
    gameState.paused = false;
    window.score = 0;
    score = 0;
    
    // Initialize logger
    logger = new Logger();
    
    // Clear any existing game elements
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Create track
    createTrack();
    
    // Create player based on selected character
    switch(selectedCharacter) {
        case 'dax':
            player = new DaxController(selectedCharacter, scene);
            break;
        case 'nox':
            player = new NoxController(selectedCharacter, scene);
            break;
        case 'buggy':
            player = new BuggyController(selectedCharacter, scene);
            break;
        case 'teag':
            player = new TeagController(selectedCharacter, scene);
            break;
        default:
            player = new DaxController('dax', scene);
    }
    
    // Wait for player model to load
    player.loadPromise.then(() => {
        scene.add(player.mesh);
        
        // Create level manager
        levelManager = new LevelManager(scene, player, gameState, textureManager);
        player.setLevelManager(levelManager);
        levelManager.setPlayerReady();
        
        // Create input manager
        inputManager = new InputManager();
        
        // Reset player state with 20% increased speed
        player.speed = 13.125 * 1.2; // Increased by 20%
        player.acceleration = 0.1 * 1.2; // Increased by 20%
        player.strafeSpeed = 7.5 * 1.2; // Increased by 20%
        player.velocity = new THREE.Vector3();
        
        // Hide loading screen
        hideLoadingScreen();
        
        // Start animation loop
        lastTime = performance.now();
        animate(lastTime);
    }).catch(error => {
        console.error('Error loading player model:', error);
        hideLoadingScreen();
        
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.style.position = 'absolute';
        errorMessage.style.top = '50%';
        errorMessage.style.left = '50%';
        errorMessage.style.transform = 'translate(-50%, -50%)';
        errorMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        errorMessage.style.color = 'red';
        errorMessage.style.padding = '20px';
        errorMessage.style.borderRadius = '10px';
        errorMessage.style.textAlign = 'center';
        errorMessage.style.zIndex = '1000';
        errorMessage.innerHTML = `
            <h2>Error Loading Game</h2>
            <p>${error.message || 'Failed to load character model'}</p>
            <button id="retry-btn" style="padding: 10px; margin-top: 20px; cursor: pointer;">Try Again</button>
        `;
        document.body.appendChild(errorMessage);
        
        document.getElementById('retry-btn').addEventListener('click', () => {
            document.body.removeChild(errorMessage);
            menuContainer.style.display = 'flex';
        });
    });
}

// Function to create the track
function createTrack() {
    // Create multiple track segments for endless track effect
    const trackLength = 100; // Length of each track segment
    const numSegments = 4; // Number of track segments to create
    
    for (let i = 0; i < numSegments; i++) {
        const planeGeometry = new THREE.PlaneGeometry(20, trackLength);
        const planeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080, 
            side: THREE.DoubleSide,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = Math.PI / 2;
        plane.position.y = -0.5;
        plane.position.z = -i * trackLength; // Position segments one after another
        plane.receiveShadow = true;
        plane.userData.isTrackSegment = true; // Mark as track segment for easy identification
        scene.add(plane);
    }
    
    console.log('Track created with multiple segments');
}

let lastTime = performance.now();
document.body.style.backgroundColor = 'black';
console.log('Animation loop setup, waiting for character selection');

const downloadButton = document.createElement('button');
downloadButton.textContent = 'Download Log';
downloadButton.style.position = 'absolute';
downloadButton.style.top = '10px';
downloadButton.style.right = '10px';
downloadButton.onclick = () => {
    if (player && inputManager && levelManager && logger) {
        player.downloadLog();
        inputManager.downloadLog();
        levelManager.logger.downloadLog();
    }
};
document.body.appendChild(downloadButton);
console.log('Download button added');

function resetGame() {
    console.log('Resetting game...');
    
    gameState.gameOver = false;
    survivalTime = 0;
    
    // Reset score properly
    window.score = 0;
    score = 0;

    // No need to update UI elements directly as they're now handled by the UI class
    
    // Check if GLTFLoader is available before resetting the player
    if (!window.GLTFLoader) {
        console.error('GLTFLoader not available during reset! Attempting to reload it...');
        
        // Try to import GLTFLoader again
        import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
            window.GLTFLoader = GLTFLoader;
            window.GLTFLoad = GLTFLoader; // For backward compatibility
            console.log('GLTFLoader reloaded successfully during reset');
            
            // Now continue with the reset
            continueReset();
        }).catch(error => {
            console.error('Failed to reload GLTFLoader during reset:', error);
            const debugInfo = document.getElementById('debug-info');
            if (debugInfo) {
                debugInfo.style.display = 'block';
                debugInfo.innerHTML += `<div>ERROR: Failed to load GLTFLoader during reset: ${error.message}</div>`;
            }
        });
    } else {
        // GLTFLoader is available, continue with reset
        continueReset();
    }
    
    function continueReset() {
        player.mesh.position.set(0, 0.01, 0); // Updated position for crouched model (changed from 0.02 to 0.01)
        player.speed = 13.125; // Updated to match the new starting speed (25% increase)
        player.velocity.set(0, 0, 0);
        player.isGrounded = true;
        player.timeElapsed = 0;
        player.abilityTimer = 0;
        player.isAbilityActive = false;
        player.abilityEnabled = false;
        player.tokenCount = 0;
        
        levelManager.obstacles.forEach(obstacle => scene.remove(obstacle));
        levelManager.obstacles = [];
        levelManager.barriers.forEach(barrier => scene.remove(barrier));
        levelManager.barriers = [];
        levelManager.collectibles.forEach(collectible => scene.remove(collectible));
        levelManager.collectibles = [];
        levelManager.platforms.forEach(platform => scene.remove(platform));
        levelManager.platforms = [];
        levelManager.lastObstacleTime = 0;
        levelManager.lastCollectibleTime = 0;
        levelManager.lastPlatformTime = 0;
        
        // Restart background music
        if (audioManager) {
            audioManager.playMusic();
        }
        
        console.log('Game reset completed');
    }
}

// Function to show loading screen
function showLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    loadingScreen.style.position = 'fixed';
    loadingScreen.style.top = '0';
    loadingScreen.style.left = '0';
    loadingScreen.style.width = '100%';
    loadingScreen.style.height = '100%';
    loadingScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    loadingScreen.style.display = 'flex';
    loadingScreen.style.flexDirection = 'column';
    loadingScreen.style.justifyContent = 'center';
    loadingScreen.style.alignItems = 'center';
    loadingScreen.style.zIndex = '1000';
    
    const loadingText = document.createElement('h1');
    loadingText.textContent = 'Loading Game...';
    loadingText.style.color = 'white';
    loadingText.style.fontFamily = 'Arial, sans-serif';
    loadingText.style.marginBottom = '20px';
    
    const progressContainer = document.createElement('div');
    progressContainer.style.width = '300px';
    progressContainer.style.height = '20px';
    progressContainer.style.backgroundColor = '#333';
    progressContainer.style.borderRadius = '10px';
    progressContainer.style.overflow = 'hidden';
    
    const progressBar = document.createElement('div');
    progressBar.id = 'loading-progress';
    progressBar.style.width = '0%';
    progressBar.style.height = '100%';
    progressBar.style.backgroundColor = '#4CAF50';
    progressBar.style.transition = 'width 0.3s ease-in-out';
    
    progressContainer.appendChild(progressBar);
    loadingScreen.appendChild(loadingText);
    loadingScreen.appendChild(progressContainer);
    document.body.appendChild(loadingScreen);
    
    // Simulate loading progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 100);
}

// Function to hide loading screen
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        document.body.removeChild(loadingScreen);
    }
}

// Create a game over modal
function showGameOverModal() {
    // Check if modal already exists
    if (document.getElementById('gameOverModal')) {
        return;
    }
    
    const gameOverModal = document.createElement('div');
    gameOverModal.id = 'gameOverModal';
    gameOverModal.style.position = 'absolute';
    gameOverModal.style.top = '50%';
    gameOverModal.style.left = '50%';
    gameOverModal.style.transform = 'translate(-50%, -50%)';
    gameOverModal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    gameOverModal.style.padding = '20px';
    gameOverModal.style.borderRadius = '10px';
    gameOverModal.style.textAlign = 'center';
    gameOverModal.style.zIndex = '1000';
    
    const gameOverTitle = document.createElement('h1');
    gameOverTitle.textContent = 'Game Over';
    gameOverTitle.style.color = 'red';
    gameOverTitle.style.fontSize = '36px';
    gameOverTitle.style.marginBottom = '20px';
    
    const finalScoreText = document.createElement('p');
    finalScoreText.textContent = `Final Score: ${window.score}`;
    finalScoreText.style.color = 'white';
    finalScoreText.style.fontSize = '24px';
    finalScoreText.style.marginBottom = '30px';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-around';
    buttonContainer.style.marginTop = '20px';
    
    const tryAgainButton = document.createElement('button');
    tryAgainButton.textContent = 'Try Again';
    tryAgainButton.style.padding = '10px 20px';
    tryAgainButton.style.fontSize = '18px';
    tryAgainButton.style.backgroundColor = '#4CAF50';
    tryAgainButton.style.color = 'white';
    tryAgainButton.style.border = 'none';
    tryAgainButton.style.borderRadius = '5px';
    tryAgainButton.style.cursor = 'pointer';
    tryAgainButton.style.marginRight = '10px';
    
    tryAgainButton.addEventListener('click', () => {
        document.body.removeChild(gameOverModal);
        restartGame();
    });
    
    const newCharacterButton = document.createElement('button');
    newCharacterButton.textContent = 'New Character';
    newCharacterButton.style.padding = '10px 20px';
    newCharacterButton.style.fontSize = '18px';
    newCharacterButton.style.backgroundColor = '#2196F3';
    newCharacterButton.style.color = 'white';
    newCharacterButton.style.border = 'none';
    newCharacterButton.style.borderRadius = '5px';
    newCharacterButton.style.cursor = 'pointer';
    
    newCharacterButton.addEventListener('click', () => {
        document.body.removeChild(gameOverModal);
        
        // Reset game state completely
        gameState.gameOver = false;
        survivalTime = 0;
        window.score = 0;
        score = 0;
        
        // Remove all game objects
        if (player) {
            scene.remove(player.mesh);
            player = null;
        }
        
        if (levelManager) {
            // Clear all obstacles, collectibles, etc.
            levelManager.obstacles.forEach(obstacle => scene.remove(obstacle));
            levelManager.obstacles = [];
            levelManager.barriers.forEach(barrier => scene.remove(barrier));
            levelManager.barriers = [];
            levelManager.collectibles.forEach(collectible => scene.remove(collectible));
            levelManager.collectibles = [];
            levelManager.platforms.forEach(platform => scene.remove(platform));
            levelManager.platforms = [];
        }
        
        // Show character selection menu
        menuContainer.style.display = 'flex';
    });
    
    buttonContainer.appendChild(tryAgainButton);
    buttonContainer.appendChild(newCharacterButton);
    
    gameOverModal.appendChild(gameOverTitle);
    gameOverModal.appendChild(finalScoreText);
    gameOverModal.appendChild(buttonContainer);
    
    document.body.appendChild(gameOverModal);
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    
    // Initialize debug mode
    Debug.init();
    Debug.log('Debug initialized');
    
    try {
        // Create game instance
        Debug.log('Creating game instance');
        const game = new Game();
        
        // Skip the start screen and directly show character selection
        // The character selection menu is already created in the main code
        
        // Add debug toggle button
        const debugButton = document.createElement('button');
        debugButton.textContent = 'Debug';
        debugButton.style.position = 'absolute';
        debugButton.style.bottom = '10px';
        debugButton.style.left = '10px';
        debugButton.style.padding = '5px 10px';
        debugButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        debugButton.style.color = 'white';
        debugButton.style.border = 'none';
        debugButton.style.borderRadius = '5px';
        debugButton.style.zIndex = '1000';
        
        debugButton.addEventListener('click', () => {
            const panel = document.getElementById('debug-panel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        });
        
        document.body.appendChild(debugButton);
        
        Debug.log('Game initialized and character selection displayed');
    } catch (error) {
        Debug.error('Error during initialization', error);
        
        // Show error message to user
        const errorMessage = document.createElement('div');
        errorMessage.style.position = 'fixed';
        errorMessage.style.top = '50%';
        errorMessage.style.left = '50%';
        errorMessage.style.transform = 'translate(-50%, -50%)';
        errorMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        errorMessage.style.color = 'red';
        errorMessage.style.padding = '20px';
        errorMessage.style.borderRadius = '10px';
        errorMessage.style.fontFamily = 'Arial, sans-serif';
        errorMessage.style.textAlign = 'center';
        errorMessage.style.zIndex = '1000';
        
        errorMessage.innerHTML = `
            <h2>Error Loading Game</h2>
            <p>${error.message || 'Unknown error'}</p>
            <p>Check the console for more details.</p>
            <button id="reload-btn" style="padding: 10px; margin-top: 20px; cursor: pointer;">Reload Page</button>
        `;
        
        document.body.appendChild(errorMessage);
        
        document.getElementById('reload-btn').addEventListener('click', () => {
            window.location.reload();
        });
    }
});

// Add the menu container to the document body
document.body.appendChild(menuContainer);

// Add a key handler just for pause and restart
document.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'p':
            togglePause();
            break;
        case 'r':
            if (gameState.gameOver) {
                restartGame();
            }
            break;
    }
});

function togglePause() {
    if (gameState) {
        gameState.paused = !gameState.paused;
        console.log(`Game ${gameState.paused ? 'paused' : 'resumed'}`);
        
        // If paused, show a pause message
        let pauseMessage = document.getElementById('pauseMessage');
        if (gameState.paused) {
            if (!pauseMessage) {
                pauseMessage = document.createElement('div');
                pauseMessage.id = 'pauseMessage';
                pauseMessage.style.position = 'absolute';
                pauseMessage.style.top = '50%';
                pauseMessage.style.left = '50%';
                pauseMessage.style.transform = 'translate(-50%, -50%)';
                pauseMessage.style.color = 'white';
                pauseMessage.style.fontSize = '36px';
                pauseMessage.style.fontWeight = 'bold';
                pauseMessage.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
                pauseMessage.style.zIndex = '1000';
                pauseMessage.innerText = 'PAUSED';
                document.body.appendChild(pauseMessage);
            }
        } else {
            if (pauseMessage) {
                document.body.removeChild(pauseMessage);
            }
        }
    }
}

function restartGame() {
    // Reset game state
    gameState.gameOver = false;
    gameState.paused = false;
    survivalTime = 0;
    window.score = 0;
    score = 0;
    
    // Update score display
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (scoreDisplay) {
        scoreDisplay.innerText = 'Score: 0';
    }
    
    // Reset player position and state
    if (player && player.mesh) {
        player.mesh.position.set(0, 0.02, 0);
        player.speed = 13.125;
        player.velocity = new THREE.Vector3();
    }
    
    // Clear existing obstacles and collectibles
    if (levelManager) {
        levelManager.obstacles.forEach(obstacle => scene.remove(obstacle));
        levelManager.obstacles = [];
        levelManager.collectibles.forEach(collectible => scene.remove(collectible));
        levelManager.collectibles = [];
        levelManager.lastObstacleTime = 0;
        levelManager.lastCollectibleTime = 0;
    }
    
    // Start playing background music again
    if (window.audioManager) {
        window.audioManager.playMusic();
    }
    
    console.log('Game restarted');
}