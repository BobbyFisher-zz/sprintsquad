import * as THREE from 'three';
import { Logger } from './Logger.js';

export class PlayerController {
    constructor(type, scene) {
        this.logger = new Logger();
        this.type = type;
        this.scene = scene;
        this.mesh = null;
        this.isModelLoaded = false;
        this.lastMoveDirection = 'forward'; // Initialize movement direction
        this.boundingBoxHelper = null; // Add bounding box helper
        this.showBoundingBox = false; // Hide bounding box visualization
        console.log(`PlayerController initializing for ${type} with scene:`, scene);
        
        this.loadPromise = new Promise((resolve) => {
            console.log('Creating GLTFLoader for generic model');
            const loader = new window.GLTFLoader();
            
            console.log('Loading generic model from path: models/generic_character.gltf');
            loader.load(
                'models/generic_character.gltf',
                (gltf) => {
                    console.log('Generic model loaded successfully:', gltf);
                    this.mesh = gltf.scene;
                    
                    // Make sure the model is visible
                    this.mesh.traverse(child => {
                        if (child.isMesh) {
                            console.log('Setting up generic mesh materials:', child);
                            child.material.side = THREE.DoubleSide;
                            // Keep original material colors
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    // Standardized size for all models
                    this.mesh.scale.set(0.02, 0.02, 0.02);
                    this.mesh.position.y = 0.02;
                    
                    // Rotate to face forward (negative z direction)
                    this.mesh.rotation.y = Math.PI; // Rotate 180 degrees to face forward
                    
                    // Initialize animation properties
                    this.runningCycle = 0;
                    this.runningSpeed = 15; // Speed of running animation
                    
                    this.isModelLoaded = true;
                    this.logger.log(`Loaded generic model for ${this.type}`);
                    console.log(`Generic model loaded for ${this.type} at position:`, this.mesh.position);
                    resolve();
                },
                (progress) => {
                    console.log('Generic model loading progress:', progress);
                },
                (error) => {
                    console.error(`Error loading generic model for ${this.type}:`, error);
                    // Fallback to a cube if model fails to load
                    console.log(`Creating fallback cube for ${this.type}`);
                    this.mesh = new THREE.Mesh(
                        new THREE.BoxGeometry(0.04, 0.04, 0.04),
                        new THREE.MeshBasicMaterial({ color: 0x8B4513 })
                    );
                    this.mesh.position.y = 0.02;
                    
                    // Initialize animation properties
                    this.runningCycle = 0;
                    this.runningSpeed = 15; // Speed of running animation
                    
                    this.isModelLoaded = true;
                    this.logger.log(`Fallback to cube for ${this.type} due to model loading error`);
                    console.log(`Fallback cube created for ${this.type} at position:`, this.mesh.position);
                    resolve();
                }
            );
        });

        this.speed = 13.125;
        this.acceleration = 0.1;
        this.velocity = new THREE.Vector3();
        this.strafeSpeed = 7.5;
        this.loggingEnabled = true;
        this.timeElapsed = 0;
        this.levelManager = null;
        console.log('PlayerController initialized with type:', this.type);
    }

    isReady() {
        return this.isModelLoaded;
    }

    // Add a method to update the rotation based on movement direction
    updateRotation(delta) {
        if (!this.mesh) return;
        
        // If strafing left, rotate slightly left
        if (this.lastMoveDirection === 'left') {
            const targetRotation = Math.PI + Math.PI/6; // Slightly left
            this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetRotation, 5 * delta);
        } 
        // If strafing right, rotate slightly right
        else if (this.lastMoveDirection === 'right') {
            const targetRotation = Math.PI - Math.PI/6; // Slightly right
            this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetRotation, 5 * delta);
        } 
        // If moving forward, rotate back to center
        else {
            const targetRotation = Math.PI; // Forward
            this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetRotation, 5 * delta);
        }
    }

    checkCollision(object) {
        if (!this.mesh) return false;
        
        // Skip collision check with scene or camera
        if (!object.isMesh || object === this.scene || object === this.mesh) {
            return false;
        }
        
        // Calculate distance between centers
        const distance = this.mesh.position.distanceTo(object.position);
        
        // Skip collision check if objects are too far apart (optimization)
        if (distance > 5) {
            return false;
        }
        
        // For collectibles, use a more generous collision detection
        if (object.userData && (object.userData.type === 'coin')) {
            // Use distance-based collision for collectibles
            // Use the collision radius from userData if available, otherwise use default
            const collisionRadius = object.userData.collisionRadius || 2.0;
            const distance2D = new THREE.Vector2(this.mesh.position.x, this.mesh.position.z)
                .distanceTo(new THREE.Vector2(object.position.x, object.position.z));
            
            // Use 2D distance (ignore Y axis) for more reliable collision
            const isColliding = distance2D < collisionRadius;
            
            // Log collision checks
            console.log(`Coin collision check: 2D distance=${distance2D.toFixed(2)}, 3D distance=${distance.toFixed(2)}, threshold=${collisionRadius}, result=${isColliding}`);
            console.log(`Player position: x=${this.mesh.position.x.toFixed(2)}, y=${this.mesh.position.y.toFixed(2)}, z=${this.mesh.position.z.toFixed(2)}`);
            console.log(`Coin position: x=${object.position.x.toFixed(2)}, y=${object.position.y.toFixed(2)}, z=${object.position.z.toFixed(2)}`);
            
            return isColliding;
        }
        
        // For obstacles, use a more precise but forgiving collision detection
        // Create a smaller bounding box for the player to prevent false collisions
        const pBox = new THREE.Box3().setFromObject(this.mesh);
        
        // Shrink the player's bounding box significantly to prevent false positives
        const shrinkFactor = 0.5; // Increased from 0.2 to 0.5
        pBox.min.x += shrinkFactor;
        pBox.min.z += shrinkFactor;
        pBox.max.x -= shrinkFactor;
        pBox.max.z -= shrinkFactor;
        
        // Update the bounding box helper if it exists
        if (this.boundingBoxHelper) {
            this.scene.remove(this.boundingBoxHelper);
        }
        
        if (this.showBoundingBox) {
            this.boundingBoxHelper = new THREE.Box3Helper(pBox, 0xff0000);
            this.scene.add(this.boundingBoxHelper);
        }
        
        // Use custom collision box if available, otherwise create one from the object
        let oBox;
        if (object.userData && object.userData.collisionBox) {
            oBox = object.userData.collisionBox;
        } else {
            oBox = new THREE.Box3().setFromObject(object);
        }
        
        const intersects = pBox.intersectsBox(oBox);
        
        // Only log if objects are relatively close to avoid spam
        if (distance < 3) {
            this.logger.log(`Collision check: ${this.type} vs ${object.userData?.type || 'object'}`);
            this.logger.log(`Player position: ${JSON.stringify(this.mesh.position)}`);
            this.logger.log(`Object position: ${JSON.stringify(object.position)}`);
            this.logger.log(`Distance between objects: ${distance}`);
            this.logger.log(`Player box: min(${JSON.stringify(pBox.min)}), max(${JSON.stringify(pBox.max)})`);
            this.logger.log(`Object box: min(${JSON.stringify(oBox.min)}), max(${JSON.stringify(oBox.max)})`);
            this.logger.log(`Intersection result: ${intersects}`);
        }
        
        return intersects;
    }

    update(camera, actions, obstacles, barriers, scene, gameState, delta, logger) {
        if (!this.mesh) return;

        const prevX = this.mesh.position.x;
        const prevZ = this.mesh.position.z;

        // Track movement direction for rotation
        if (actions.strafeLeft) {
            this.lastMoveDirection = 'left';
        } else if (actions.strafeRight) {
            this.lastMoveDirection = 'right';
        } else {
            this.lastMoveDirection = 'forward';
        }
        
        // Update rotation based on movement
        this.updateRotation(delta);

        // Animate running motion
        if (this.mesh && !gameState.gameOver) {
            // Update running cycle
            this.runningCycle += delta * this.runningSpeed;
            
            // Apply running animation - bob up and down slightly
            const verticalOffset = Math.sin(this.runningCycle) * 0.005;
            this.mesh.position.y = 0.02 + verticalOffset;
            
            // Add slight forward/backward tilt for running effect
            const tiltAmount = Math.sin(this.runningCycle) * 0.1;
            this.mesh.rotation.x = tiltAmount;
            
            // Add slight side-to-side sway
            if (!actions.strafeLeft && !actions.strafeRight) {
                const swayAmount = Math.sin(this.runningCycle / 2) * 0.05;
                this.mesh.rotation.z = swayAmount;
            }
        }

        this.timeElapsed += delta;
        this.speed += this.acceleration * delta;
        logger.log(`Speed updated: ${this.speed.toFixed(2)} at time ${this.timeElapsed.toFixed(2)}s`);

        this.mesh.position.z -= this.speed * delta;

        if (actions.strafeLeft) {
            this.logger.log(`Strafing left, Position X: ${this.mesh.position.x}`);
            this.mesh.position.x -= this.strafeSpeed * delta;
            // Restrict to track width (track is 20 units wide, centered at 0)
            this.mesh.position.x = Math.max(this.mesh.position.x, -9);
        }
        if (actions.strafeRight) {
            this.logger.log(`Strafing right, Position X: ${this.mesh.position.x}`);
            this.mesh.position.x += this.strafeSpeed * delta;
            // Restrict to track width (track is 20 units wide, centered at 0)
            this.mesh.position.x = Math.min(this.mesh.position.x, 9);
        }

        barriers.forEach(barrier => {
            if (this.checkCollision(barrier)) {
                this.mesh.position.x = prevX;
            }
        });

        obstacles.forEach(obstacle => {
            if (this.checkCollision(obstacle)) {
                // Always die when colliding with any obstacle
                this.speed = 0;
                logger.log('Hit obstacle! Game Over.');
                this.loggingEnabled = false;
                logger.setLoggingEnabled(false);
                gameState.gameOver = true;
                
                // Stop background music
                if (window.audioManager) {
                    window.audioManager.pauseMusic();
                }
                
                // Play game over sound
                if (window.audioManager) {
                    window.audioManager.playSound('game_over');
                }
            }
        });

        const collectibles = this.getCollectibles();
        this.logger.log(`Checking collectibles, count: ${collectibles.length}`);
        
        // Process collectibles
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const collectible = collectibles[i];
            
            // Skip if already processed
            if (!collectible || !collectible.parent) continue;
            
            if (this.checkCollision(collectible)) {
                const value = collectible.userData.value || 10;
                const type = collectible.userData.type || 'coin';
                
                console.log(`COLLISION DETECTED with ${type} at position:`, collectible.position);
                
                // Remove from scene
                this.scene.remove(collectible);
                
                // Remove from collectibles array
                if (this.levelManager) {
                    this.levelManager.collectibles = this.levelManager.collectibles.filter(c => c !== collectible);
                }
                
                // Update score
                if (typeof window.score !== 'undefined') {
                    window.score += value;
                    console.log(`Score updated: ${window.score}`);
                }
                
                // Play sound
                if (window.audioManager) {
                    window.audioManager.playSound('coin');
                    console.log('Playing coin sound via audioManager');
                } else {
                    try {
                        console.log('Playing coin sound directly');
                        const coinSound = new Audio('sounds/coin.mp3');
                        coinSound.volume = 0.5;
                        coinSound.play().catch(e => console.error('Error playing coin sound:', e));
                    } catch (error) {
                        console.error('Failed to play coin sound:', error);
                    }
                }
                
                // Update UI
                const scoreDisplay = document.getElementById('scoreDisplay');
                if (scoreDisplay) {
                    scoreDisplay.innerText = `Score: ${window.score}`;
                }
                
                // Visual effect
                this.createCoinCollectionEffect(collectible.position);
            }
        }
    }

    setLevelManager(levelManager) {
        this.levelManager = levelManager;
    }

    getCollectibles() {
        return this.levelManager ? this.levelManager.getCollectibles() : [];
    }

    getPlatforms() {
        return this.levelManager ? this.levelManager.getPlatforms() : [];
    }

    downloadLog() {
        this.logger.downloadLog();
    }

    // Add a new method for visual feedback when collecting coins
    createCoinCollectionEffect(position) {
        // Create a simple particle effect at the coin's position
        const particleCount = 10;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xFFD700 }) // Gold color
            );
            
            // Position at the coin's location
            particle.position.copy(position);
            
            // Add random velocity
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 3,
                (Math.random() - 0.5) * 2
            );
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        // Animate particles
        const animateParticles = () => {
            let allRemoved = true;
            
            particles.forEach((particle, index) => {
                if (particle) {
                    allRemoved = false;
                    
                    // Move particle
                    particle.position.x += particle.velocity.x * 0.1;
                    particle.position.y += particle.velocity.y * 0.1;
                    particle.position.z += particle.velocity.z * 0.1;
                    
                    // Apply gravity
                    particle.velocity.y -= 0.1;
                    
                    // Remove if too far
                    if (particle.position.y < 0) {
                        this.scene.remove(particle);
                        particles[index] = null;
                    }
                }
            });
            
            if (!allRemoved) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
    }
}