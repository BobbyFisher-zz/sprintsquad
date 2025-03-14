import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';
import { Logger } from './Logger.js';

export class TeagController extends PlayerController {
    constructor(type, scene) {
        super(type, scene);
        this.logger.log('TeagController initializing...');
        console.log('TeagController initializing with scene:', scene);

        // Override the generic model with Teag's specific model
        this.isModelLoaded = false;
        this.loadPromise = new Promise((resolve) => {
            console.log('Creating GLTFLoader for Teag model');
            const loader = new window.GLTFLoader();
            
            console.log('Loading Teag model from path: models/teag/teag.gltf');
            loader.load(
                'models/teag/teag.gltf',
                (gltf) => {
                    console.log('Teag model loaded successfully:', gltf);
                    if (this.mesh) {
                        console.log('Removing existing mesh from scene');
                        this.scene.remove(this.mesh);
                    }
                    this.mesh = gltf.scene;
                    
                    // Make sure the model is visible
                    this.mesh.traverse(child => {
                        if (child.isMesh) {
                            console.log('Setting up mesh materials:', child);
                            child.material.side = THREE.DoubleSide;
                            // Keep original material colors
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    // Standardized size for all models - much smaller and crouched
                    this.mesh.scale.set(0.002, 0.001, 0.002); // Changed y scale to half (0.001) to match crouched height
                    this.mesh.position.y = 0.01; // Changed from 0.02 to 0.01 to match crouched position
                    
                    // Rotate 45 degrees towards the obstacles
                    this.mesh.rotation.y = Math.PI / 4; // 45 degrees towards obstacles
                    
                    // Initialize animation properties
                    this.runningCycle = 0;
                    this.runningSpeed = 15; // Speed of running animation
                    
                    console.log('Adding Teag mesh to scene at position:', this.mesh.position);
                    this.scene.add(this.mesh);
                    this.isModelLoaded = true;
                    this.logger.log('Teag model loaded successfully');
                    if (this.levelManager) {
                        this.levelManager.setPlayerReady();
                    }
                    resolve();
                },
                (progress) => {
                    console.log('Teag model loading progress:', progress);
                },
                (error) => {
                    console.error('Error loading Teag model:', error);
                    // Fallback to a cube if model fails to load
                    if (this.mesh) this.scene.remove(this.mesh);
                    console.log('Creating fallback cube for Teag');
                    this.mesh = new THREE.Mesh(
                        new THREE.BoxGeometry(0.04, 0.02, 0.04), // Changed height from 0.04 to 0.02 to match crouched height
                        new THREE.MeshBasicMaterial({ color: 0xFFD700 })
                    );
                    this.mesh.position.y = 0.01; // Changed from 0.02 to 0.01 to match crouched position
                    this.mesh.rotation.y = Math.PI / 4; // 45 degrees towards obstacles
                    console.log('Adding fallback cube to scene');
                    
                    // Initialize animation properties
                    this.runningCycle = 0;
                    this.runningSpeed = 15; // Speed of running animation
                    
                    this.isModelLoaded = true;
                    this.logger.log('Fallback to cube for Teag due to model loading error');
                    if (this.levelManager) {
                        this.levelManager.setPlayerReady();
                    }
                    resolve();
                }
            );
        });

        // Teag's unique abilities
        this.abilityCooldown = 12;
        this.abilityTimer = 0;
        this.isAbilityActive = false;
        this.slowFactor = 1.0; // Normal speed by default
        this.abilityEnabled = false;
        console.log('TeagController initialized:', this);
    }

    // Add a method to update the rotation based on movement direction
    updateRotation(delta) {
        if (!this.mesh) return;
        
        // Base rotation - 45 degrees towards obstacles
        const baseRotation = Math.PI / 4; // 45 degrees towards obstacles
        
        // If strafing left, rotate slightly left
        if (this.lastMoveDirection === 'left') {
            const targetRotation = baseRotation - Math.PI/6; // Slightly left
            this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetRotation, 5 * delta);
        } 
        // If strafing right, rotate slightly right
        else if (this.lastMoveDirection === 'right') {
            const targetRotation = baseRotation + Math.PI/6; // Slightly right
            this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetRotation, 5 * delta);
        } 
        // If moving forward, rotate back to center
        else {
            this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, baseRotation, 5 * delta);
        }
        
        // Log rotation occasionally for debugging
        if (Math.random() < 0.01) {
            console.log(`Teag rotation: ${this.mesh.rotation.y.toFixed(2)}, direction: ${this.lastMoveDirection}`);
        }
    }

    update(camera, actions, obstacles, barriers, scene, gameState, delta, logger) {
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
        if (this.mesh && !gameState.gameOver && !this.isSliding) {
            // Update running cycle
            this.runningCycle += delta * this.runningSpeed;
            
            // Apply running animation - bob up and down slightly
            const verticalOffset = Math.sin(this.runningCycle) * 0.005;
            this.mesh.position.y = 0.01 + verticalOffset; // Changed from 0.02 to 0.01 to match crouched position
            
            // Add slight forward/backward tilt for running effect
            const tiltAmount = Math.sin(this.runningCycle) * 0.1;
            this.mesh.rotation.x = tiltAmount;
            
            // Add slight side-to-side sway
            if (!actions.strafeLeft && !actions.strafeRight) {
                const swayAmount = Math.sin(this.runningCycle / 2) * 0.05;
                this.mesh.rotation.z = swayAmount;
            }
        }
        
        // Apply Teag's unique slow time ability by adjusting delta
        const adjustedDelta = delta * this.slowFactor;
        
        // Call the parent update method with adjusted delta
        super.update(camera, actions, obstacles, barriers, scene, gameState, adjustedDelta, logger);
        
        // Update ability timer with adjusted delta to maintain consistency
        if (this.abilityTimer > 0) this.abilityTimer -= adjustedDelta;
    }

    useAbility(scene) {
        if (!this.mesh) return;
        if (this.abilityEnabled) {
            this.logger.log(`Attempting to use Spotter's Edge. Timer: ${this.abilityTimer}`);
            if (this.abilityTimer <= 0 && !this.isAbilityActive) {
                this.logger.log('Spotter\'s Edge activated!');
                this.isAbilityActive = true;
                this.abilityTimer = this.abilityCooldown;
                this.slowFactor = 0.5; // Slow down time
                
                setTimeout(() => {
                    this.slowFactor = 1.0; // Return to normal speed
                    this.isAbilityActive = false;
                    this.abilityEnabled = false;
                    this.tokenCount = 0;
                    
                    // Get progress bar element by ID
                    const progressBar = document.getElementById('progressBar');
                    if (progressBar) {
                        progressBar.style.width = '0%';
                    }
                    
                    this.logger.log('Spotter\'s Edge ended.');
                }, 5000);
            } else {
                this.logger.log(`Spotter's Edge on cooldown: ${this.abilityTimer}`);
            }
        } else {
            this.logger.log(`Spotter's Edge not enabled (need 5 tokens).`);
        }
    }

    setLevelManager(levelManager) {
        super.setLevelManager(levelManager);
        if (this.isModelLoaded && this.levelManager) {
            this.levelManager.setPlayerReady();
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
        if (object.userData && (object.userData.type === 'coin' || object.userData.type === 'token')) {
            // Use distance-based collision for collectibles
            return distance < 1.0; // More generous radius for collectibles
        }
        
        // Instead of using the model's bounding box, create a custom smaller one
        // Create a custom bounding box centered on the player's position
        const pBox = new THREE.Box3();
        const boxSize = 0.05; // Very small box size
        
        // Set the box min and max points manually
        pBox.min.set(
            this.mesh.position.x - boxSize,
            this.mesh.position.y,
            this.mesh.position.z - boxSize
        );
        
        pBox.max.set(
            this.mesh.position.x + boxSize,
            this.mesh.position.y + boxSize * 2,
            this.mesh.position.z + boxSize
        );
        
        // Update the bounding box helper if it exists
        if (this.boundingBoxHelper) {
            this.scene.remove(this.boundingBoxHelper);
        }
        
        if (this.showBoundingBox) {
            this.boundingBoxHelper = new THREE.Box3Helper(pBox, 0xff0000);
            this.scene.add(this.boundingBoxHelper);
        }
        
        const oBox = new THREE.Box3().setFromObject(object);
        
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
}