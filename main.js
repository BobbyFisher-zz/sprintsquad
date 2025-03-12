import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';
import { InputManager } from './InputManager.js';
import { LevelManager } from './LevelManager.js';
import { Logger } from './Logger.js';
import { NoxController } from './NoxController.js';
import { BuggyController } from './BuggyController.js';
import { TeagController } from './TeagController.js';
import { DaxController } from './DaxController.js';

console.log('Starting main.js');

const scene = new THREE.Scene();
console.log('Scene created:', scene);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
console.log('Camera created:', camera);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
console.log('Renderer created and appended:', renderer);

// Make canvas responsive
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Add a plane for the track extending into the distance
const planeGeometry = new THREE.PlaneGeometry(20, 200);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
plane.position.y = -0.5;
plane.position.z = 0;
scene.add(plane);
console.log('Plane added to scene at:', plane.position);

// Initialize game state variables
let player;
let levelManager;
let inputManager;
let logger;
let gameState = { gameOver: false };
let survivalTime = 0;
let score = 0;
let tokenCount = 0;

// Make score and tokenCount globally accessible
window.score = score;
window.tokenCount = tokenCount;

// Add score UI
const scoreContainer = document.createElement('div');
scoreContainer.style.position = 'absolute';
scoreContainer.style.top = '10px';
scoreContainer.style.left = '10px';
scoreContainer.style.color = 'white';
scoreContainer.style.fontSize = '24px';
scoreContainer.style.fontFamily = 'Arial';

const scoreDisplay = document.createElement('div');
scoreDisplay.innerText = 'Score: 0';
scoreContainer.appendChild(scoreDisplay);

document.body.appendChild(scoreContainer);
console.log('Score display added');

// Add token progress bar
const progressBarContainer = document.createElement('div');
progressBarContainer.style.position = 'absolute';
progressBarContainer.style.bottom = '10px';
progressBarContainer.style.left = '10px';
progressBarContainer.style.right = '10px';
progressBarContainer.style.height = '20px';
progressBarContainer.style.backgroundColor = '#333';
progressBarContainer.style.border = '1px solid white';
document.body.appendChild(progressBarContainer);
console.log('Progress bar container added');

const progressBar = document.createElement('div');
progressBar.style.height = '100%';
progressBar.style.backgroundColor = '#4CAF50';
progressBar.style.width = '0%';
progressBarContainer.appendChild(progressBar);
console.log('Token progress bar added');

// Make progressBar accessible globally
window.progressBar = progressBar;

// Add Game Over UI with Restart button
const gameOverContainer = document.createElement('div');
gameOverContainer.style.position = 'absolute';
gameOverContainer.style.top = '50%';
gameOverContainer.style.left = '50%';
gameOverContainer.style.transform = 'translate(-50%, -50%)';
gameOverContainer.style.display = 'none';
gameOverContainer.style.textAlign = 'center';
gameOverContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
gameOverContainer.style.padding = '20px';
gameOverContainer.style.borderRadius = '10px';

const gameOverDisplay = document.createElement('div');
gameOverDisplay.style.color = 'red';
gameOverDisplay.style.fontSize = '48px';
gameOverDisplay.style.fontFamily = 'Arial';
gameOverDisplay.innerText = 'Game Over';
gameOverContainer.appendChild(gameOverDisplay);

const finalScoreDisplay = document.createElement('div');
finalScoreDisplay.style.color = 'white';
finalScoreDisplay.style.fontSize = '24px';
finalScoreDisplay.style.marginTop = '10px';
finalScoreDisplay.style.fontFamily = 'Arial';
finalScoreDisplay.innerText = 'Final Score: 0';
gameOverContainer.appendChild(finalScoreDisplay);

const restartButton = document.createElement('button');
restartButton.innerText = 'Restart';
restartButton.style.marginTop = '20px';
restartButton.style.fontSize = '24px';
restartButton.style.padding = '15px 30px';
restartButton.style.cursor = 'pointer';
restartButton.style.borderRadius = '5px';
restartButton.style.backgroundColor = '#4CAF50';
restartButton.style.color = 'white';
restartButton.style.border = 'none';
restartButton.style.outline = 'none';

restartButton.onclick = resetGame;
restartButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    resetGame();
    logger.log('Restart touch started');
});
restartButton.addEventListener('touchend', () => {
    logger.log('Restart touch ended');
});

gameOverContainer.appendChild(restartButton);
document.body.appendChild(gameOverContainer);
console.log('Game Over display with Restart button added');

// Add character selection menu
const menuContainer = document.createElement('div');
menuContainer.style.position = 'absolute';
menuContainer.style.top = '50%';
menuContainer.style.left = '50%';
menuContainer.style.transform = 'translate(-50%, -50%)';
menuContainer.style.display = 'block';
menuContainer.style.textAlign = 'center';
menuContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
menuContainer.style.padding = '20px';
menuContainer.style.borderRadius = '10px';

const menuTitle = document.createElement('div');
menuTitle.style.color = 'white';
menuTitle.style.fontSize = '32px';
menuTitle.style.fontFamily = 'Arial';
menuTitle.innerText = 'Select Character';
menuContainer.appendChild(menuTitle);

const characterButtons = [
    { name: 'Dax', color: 0x8B4513 },
    { name: 'Nox', color: 0xA52A2A },
    { name: 'Buggy', color: 0x32CD32 },
    { name: 'Teag', color: 0xFFD700 }
];

characterButtons.forEach(char => {
    const button = document.createElement('button');
    button.innerText = char.name;
    button.style.margin = '10px';
    button.style.fontSize = '20px';
    button.style.padding = '10px 20px';
    button.style.cursor = 'pointer';
    button.style.borderRadius = '5px';
    button.style.backgroundColor = `#${char.color.toString(16)}`;
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.outline = 'none';

    button.onclick = () => {
        menuContainer.style.display = 'none';
        initializeGame(char.name, char.color);
    };
    button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        menuContainer.style.display = 'none';
        initializeGame(char.name, char.color);
        logger.log(`${char.name} touch selected`);
    });

    menuContainer.appendChild(button);
});

document.body.appendChild(menuContainer);
console.log('Character selection menu added');

// Set initial camera position to look down the track
camera.position.z = 10;
camera.position.y = 5;
camera.lookAt(0, 0, 0);
console.log('Camera positioned:', camera.position);

// Animation loop
function animate(time) {
    requestAnimationFrame(animate);
    const delta = Math.min(0.1, (time - lastTime) / 1000);
    lastTime = time;

    if (!gameState.gameOver && player) {
        survivalTime += delta;
        
        // Update score and token count from global variables
        score = window.score;
        tokenCount = window.tokenCount;
        
        // Update UI elements every frame
        scoreDisplay.innerText = `Score: ${score}`;
        const progress = (tokenCount / 5) * 100;
        progressBar.style.width = `${progress}%`;

        player.update(camera, inputManager.getActions(), levelManager.getObstacles(), levelManager.getBarriers(), scene, gameState, delta, logger);
        levelManager.update(delta);
        plane.position.z = player.mesh.position.z;
        camera.position.z = player.mesh.position.z + 10;
        camera.position.x = player.mesh.position.x;
        camera.lookAt(player.mesh.position);
    } else if (gameState.gameOver) {
        finalScoreDisplay.innerText = `Final Score: ${score}`;
        gameOverContainer.style.display = 'block';
    }

    renderer.render(scene, camera);
    console.log('Frame rendered, player position:', player ? player.mesh.position : 'No player', 'plane position:', plane.position, 'score:', score, 'token count:', tokenCount);
}

function initializeGame(characterName, color) {
    gameState.gameOver = false;
    survivalTime = 0;
    score = 0;
    tokenCount = 0;
    
    // Reset global variables
    window.score = 0;
    window.tokenCount = 0;
    
    scoreDisplay.innerText = 'Score: 0';
    progressBar.style.width = '0%';

    if (player) {
        scene.remove(player.mesh);
        player = null;
    }

    switch (characterName) {
        case 'Dax':
            player = new DaxController('Dax', scene);
            player.mesh.material.color.set(color);
            break;
        case 'Nox':
            player = new NoxController('Nox', scene);
            player.mesh.material.color.set(color);
            break;
        case 'Buggy':
            player = new BuggyController('Buggy', scene);
            player.mesh.material.color.set(color);
            break;
        case 'Teag':
            player = new TeagController('Teag', scene);
            player.mesh.material.color.set(color);
            break;
        default:
            player = new DaxController('Dax', scene);
            player.mesh.material.color.set(0x8B4513);
    }

    player.mesh.position.set(0, 0.75, 0);
    scene.add(player.mesh);
    console.log('Player added to scene:', player.mesh.position);

    inputManager = new InputManager();
    levelManager = new LevelManager(scene, player, gameState);
    player.setLevelManager(levelManager);
    logger = new Logger();
    console.log(`${characterName} game initialized`);

    lastTime = performance.now();
    animate(lastTime);
}

let lastTime = performance.now();
document.body.style.backgroundColor = 'black';
console.log('Animation loop setup, waiting for character selection');

// Add download log button
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

// Reset game function
function resetGame() {
    gameState.gameOver = false;
    survivalTime = 0;
    score = 0;
    tokenCount = 0;
    
    // Reset global variables
    window.score = 0;
    window.tokenCount = 0;
    
    scoreDisplay.innerText = 'Score: 0';
    progressBar.style.width = '0%';
    gameOverContainer.style.display = 'none';
    player.mesh.position.set(0, 0.75, 0);
    player.speed = 7;
    player.velocity.set(0, 0, 0);
    player.isGrounded = true;
    player.timeElapsed = 0;
    player.abilityTimer = 0;
    player.isAbilityActive = false;
    player.abilityEnabled = false;
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
    console.log('Game reset');
}