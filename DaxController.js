import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';
import { Logger } from './Logger.js';

export class DaxController extends PlayerController {
    constructor(type, scene) {
        super(type, scene);
        this.logger.log('DaxController initializing...');
        console.log('DaxController initializing with scene:', scene);

        // Override the generic model with Dax's specific model
        this.isModelLoaded = false;
        this.loadPromise = new Promise((resolve) => {
            console.log('Creating GLTFLoader for Dax model');
            const loader = new window.GLTFLoader();
            
            console.log('Loading Dax model from path: models/dax/dax.gltf');
            loader.load(
                'models/dax/dax.gltf',
                (gltf) => {
                    console.log('Dax model loaded successfully:', gltf);
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
                    this.mesh.scale.set(0.005, 0.0025, 0.005); // Y scale is already half (0.0025) for crouched height
                    this.mesh.position.y = 0.01; // Already at crouched position
                    
                    // Rotate to face forward (negative z direction)
                    // This ensures the model faces the oncoming obstacles
                    this.mesh.rotation.y = 0; // Face forward (negative z direction)
                    
                    // Initialize animation properties
                    this.runningCycle = 0;
                    this.runningSpeed = 15; // Speed of running animation
                    
                    console.log('Adding Dax mesh to scene at position:', this.mesh.position);
                    this.scene.add(this.mesh);
                    this.isModelLoaded = true;
                    this.logger.log('Dax model loaded successfully');
                    if (this.levelManager) {
                        this.levelManager.setPlayerReady();
                    }
                    resolve();
                },
                (progress) => {
                    console.log('Dax model loading progress:', progress);
                },
                (error) => {
                    console.error('Error loading Dax model:', error);
                    // Fallback to a cube if model fails to load
                    if (this.mesh) this.scene.remove(this.mesh);
                    console.log('Creating fallback cube for Dax');
                    this.mesh = new THREE.Mesh(
                        new THREE.BoxGeometry(0.04, 0.02, 0.04), // Changed height from 0.04 to 0.02 to match crouched height
                        new THREE.MeshBasicMaterial({ color: 0x8B4513 })
                    );
                    this.mesh.position.y = 0.01; // Changed from default to 0.01 to match crouched position
                    console.log('Adding fallback cube to scene');
                    this.scene.add(this.mesh);
                    
                    // Initialize animation properties
                    this.runningCycle = 0;
                    this.runningSpeed = 15; // Speed of running animation
                    
                    this.isModelLoaded = true;
                    this.logger.log('Fallback to cube for Dax due to model loading error');
                    if (this.levelManager) {
                        this.levelManager.setPlayerReady();
                    }
                    resolve();
                }
            );
        });

        this.abilityCooldown = 10;
        this.abilityTimer = 0;
        this.isAbilityActive = false;
        this.abilityEnabled = false;
        console.log('DaxController initialized:', this);
    }

    // Add a method to update the rotation based on movement direction
    updateRotation(delta) {
        if (!this.mesh) return;
        
        // Base rotation - face forward (negative z direction)
        const baseRotation = 0; // Face forward (negative z direction)
        
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
            console.log(`Dax rotation: ${this.mesh.rotation.y.toFixed(2)}, direction: ${this.lastMoveDirection}`);
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
            const verticalOffset = Math.sin(this.runningCycle) * 0.0025;
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
        
        // Call the parent update method
        super.update(camera, actions, obstacles, barriers, scene, gameState, delta, logger);
        
        if (this.abilityTimer > 0) this.abilityTimer -= delta;
    }

    useAbility(scene) {
        if (!this.mesh) return;
        if (this.abilityEnabled) {
            this.logger.log(`Attempting to use Pathfinder. Timer: ${this.abilityTimer}`);
            if (this.abilityTimer <= 0) {
                this.logger.log('Pathfinder activated!');
                this.isAbilityActive = true;
                this.abilityTimer = this.abilityCooldown;

                const shortcut = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshPhongMaterial({ color: 0xFFFF00, emissive: 0xFFFF00 })
                );
                shortcut.position.set(this.mesh.position.x, 1, this.mesh.position.z - 20);
                this.scene.add(shortcut);
                this.logger.log(`Shortcut cube added at: ${JSON.stringify(shortcut.position)}`);

                setTimeout(() => {
                    this.scene.remove(shortcut);
                    this.isAbilityActive = false;
                    this.abilityEnabled = false;
                    this.tokenCount = 0;
                    
                    // Get progress bar element by ID
                    const progressBar = document.getElementById('progressBar');
                    if (progressBar) {
                        progressBar.style.width = '0%';
                    }
                    
                    this.logger.log('Pathfinder ended.');
                }, 5000);
            } else {
                this.logger.log(`Pathfinder on cooldown: ${this.abilityTimer}`);
            }
        } else {
            this.logger.log(`Pathfinder not enabled (need 5 tokens).`);
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