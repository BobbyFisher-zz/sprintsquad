import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Player } from './Player.js';
import { LevelManager } from './LevelManager.js';
import { GameState } from './GameState.js';
import { UI } from './UI.js';
import { TextureManager } from './TextureManager.js';
import { Logger } from './Logger.js';
import { Debug } from './debug.js';

export class Game {
    constructor() {
        this.logger = new Logger();
        this.logger.log('Game constructor called');
        Debug.log('Game constructor called');
        
        try {
            // Create scene
            this.scene = new THREE.Scene();
            
            // Create camera
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.body.appendChild(this.renderer.domElement);
            
            // Create clock
            this.clock = new THREE.Clock();
            
            // Create game state
            this.gameState = new GameState();
            
            // Create texture manager
            this.textureManager = new TextureManager();
            
            // Set up lighting
            this.setupLighting();
            
            // Create UI
            this.ui = new UI(this.gameState);
            
            // Set up window resize handler
            window.addEventListener('resize', this.onWindowResize.bind(this));
            
            Debug.log('Game basic initialization complete');
            this.logger.log('Game basic initialization complete');
        } catch (error) {
            Debug.error('Error in Game constructor', error);
            this.logger.log(`Error in Game constructor: ${error.message}`);
            throw error;
        }
    }
    
    async init() {
        this.logger.log('Game init called');
        Debug.log('Game init called');
        
        try {
            // Load all textures
            Debug.log('Loading textures...');
            await this.textureManager.loadTextures();
            Debug.log('Textures loaded successfully');
            
            // Now that textures are loaded, create the environment
            Debug.log('Setting up environment...');
            this.setupEnvironment();
            
            // Set up controls
            Debug.log('Setting up controls...');
            this.setupControls();
            
            // Create player and level manager
            Debug.log('Creating player...');
            this.player = new Player(this.scene, this.camera, this.gameState);
            
            Debug.log('Creating level manager...');
            this.levelManager = new LevelManager(this.scene, this.player, this.gameState, this.textureManager);
            
            // Set up event listeners
            Debug.log('Setting up event listeners...');
            this.setupEventListeners();
            
            // Start animation loop
            Debug.log('Starting animation loop...');
            this.animate();
            
            Debug.log('Game initialization complete');
            this.logger.log('Game initialization complete');
            return true;
        } catch (error) {
            Debug.error('Game initialization failed', error);
            this.logger.log(`Game initialization failed: ${error.message}`);
            console.error('Game initialization failed:', error);
            return false;
        }
    }
    
    setupLighting() {
        try {
            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);
            
            // Add directional light (sun)
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(5, 10, 7.5);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 1024;
            directionalLight.shadow.mapSize.height = 1024;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 50;
            this.scene.add(directionalLight);
            
            Debug.log('Lighting setup complete');
            this.logger.log('Lighting setup complete');
        } catch (error) {
            Debug.error('Error setting up lighting', error);
            this.logger.log(`Error setting up lighting: ${error.message}`);
            throw error;
        }
    }
    
    setupEnvironment() {
        try {
            // Create floor
            const floorGeometry = new THREE.PlaneGeometry(10, 1000);
            
            let floorMaterial;
            if (this.textureManager && this.textureManager.getTexture('floor')) {
                const floorTexture = this.textureManager.getTexture('floor');
                floorTexture.wrapS = THREE.RepeatWrapping;
                floorTexture.wrapT = THREE.RepeatWrapping;
                floorTexture.repeat.set(5, 500);
                
                floorMaterial = new THREE.MeshStandardMaterial({
                    map: floorTexture,
                    roughness: 0.8,
                    metalness: 0.2
                });
                Debug.log('Using textured floor material');
            } else {
                floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
                Debug.warn('Using fallback floor material (no texture)');
            }
            
            const floor = new THREE.Mesh(floorGeometry, floorMaterial);
            floor.rotation.x = -Math.PI / 2;
            floor.position.y = -0.5;
            floor.receiveShadow = true;
            this.scene.add(floor);
            
            // Add fog to the scene
            this.scene.fog = new THREE.Fog(0x000000, 10, 50);
            
            // Set background color
            this.scene.background = new THREE.Color(0x87CEEB);
            
            Debug.log('Environment setup complete');
            this.logger.log('Environment setup complete');
        } catch (error) {
            Debug.error('Error setting up environment', error);
            this.logger.log(`Error setting up environment: ${error.message}`);
            throw error;
        }
    }
    
    setupControls() {
        try {
            // Set up orbit controls for development/debugging
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.screenSpacePanning = false;
            this.controls.minDistance = 1;
            this.controls.maxDistance = 50;
            this.controls.maxPolarAngle = Math.PI / 2;
            this.controls.enabled = false; // Disable by default
            
            Debug.log('Controls setup complete');
            this.logger.log('Controls setup complete');
        } catch (error) {
            Debug.error('Error setting up controls', error);
            this.logger.log(`Error setting up controls: ${error.message}`);
            throw error;
        }
    }
    
    setupEventListeners() {
        try {
            // Add any game-specific event listeners here
            document.addEventListener('keydown', (event) => {
                // Toggle orbit controls with 'C' key (for debugging)
                if (event.key === 'c' || event.key === 'C') {
                    this.controls.enabled = !this.controls.enabled;
                    Debug.log(`Orbit controls ${this.controls.enabled ? 'enabled' : 'disabled'}`);
                    this.logger.log(`Orbit controls ${this.controls.enabled ? 'enabled' : 'disabled'}`);
                }
                
                // Toggle bounding boxes with 'B' key
                if (event.key === 'b' || event.key === 'B') {
                    const event = new CustomEvent('toggleBoundingBoxes');
                    window.dispatchEvent(event);
                    Debug.log('Toggled bounding boxes');
                }
            });
            
            Debug.log('Event listeners setup complete');
            this.logger.log('Event listeners setup complete');
        } catch (error) {
            Debug.error('Error setting up event listeners', error);
            this.logger.log(`Error setting up event listeners: ${error.message}`);
            throw error;
        }
    }
    
    onWindowResize() {
        try {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            Debug.log('Window resized');
        } catch (error) {
            Debug.error('Error handling window resize', error);
            this.logger.log(`Error handling window resize: ${error.message}`);
        }
    }
    
    animate() {
        try {
            requestAnimationFrame(this.animate.bind(this));
            
            const delta = this.clock.getDelta();
            
            // Update controls
            if (this.controls && this.controls.enabled) {
                this.controls.update();
            }
            
            // Update game state
            if (this.gameState.getState() === 'playing' && this.player && this.levelManager) {
                this.player.update(delta);
                this.levelManager.update(delta);
                
                // Update UI
                this.ui.updateUI();
            }
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            Debug.error('Error in animation loop', error);
            this.logger.log(`Error in animation loop: ${error.message}`);
            // Don't rethrow to avoid breaking the animation loop
        }
    }
    
    async start() {
        this.logger.log('Game start called');
        Debug.log('Game start called');
        
        try {
            const success = await this.init();
            
            if (success) {
                this.gameState.setState('playing');
                this.ui.updateUI();
                Debug.log('Game started successfully');
                this.logger.log('Game started');
                return true;
            } else {
                Debug.error('Game failed to start', new Error('Initialization returned false'));
                this.logger.log('Game failed to start');
                alert('Failed to start the game. Check console for details.');
                return false;
            }
        } catch (error) {
            Debug.error('Error starting game', error);
            this.logger.log(`Error starting game: ${error.message}`);
            alert(`Failed to start the game: ${error.message}`);
            throw error;
        }
    }
} 