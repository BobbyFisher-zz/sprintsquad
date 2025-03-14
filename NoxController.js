import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';
import { Logger } from './Logger.js';

export class NoxController extends PlayerController {
    constructor(type, scene) {
        super(type, scene);
        this.logger.log('NoxController initializing...');
        console.log('NoxController initializing with scene:', scene);

        this.isModelLoaded = false;
        this.loadPromise = new Promise((resolve) => {
            console.log('Creating GLTFLoader for Nox model');
            const loader = new window.GLTFLoader();
            
            console.log('Loading Nox model from path: models/nox/nox.gltf');
            loader.load(
                'models/nox/nox.gltf',
                (gltf) => {
                    console.log('Nox model loaded successfully:', gltf);
                    if (this.mesh) {
                        console.log('Removing existing mesh from scene');
                        this.scene.remove(this.mesh);
                    }
                    this.mesh = gltf.scene;
                    
                    this.mesh.traverse(child => {
                        if (child.isMesh) {
                            console.log('Setting up mesh materials:', child);
                            child.material.side = THREE.DoubleSide;
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    // Adjust scale to match Dax model size - scaled down 100% and crouched
                    this.mesh.scale.set(0.025, 0.0125, 0.025); // Changed y scale to half (0.0125) to match crouched height
                    
                    // Position the model correctly on the ground
                    this.mesh.position.set(
                        this.mesh.position.x,  // Keep X position
                        0.05,                  // Changed from 0.1 to 0.05 to match crouched position
                        this.mesh.position.z,   // Keep Z position
                    );
                    
                    // Rotate to face forward (negative z direction)
                    // Add 45 degrees (PI/4) to make it face more towards the track
                    this.mesh.rotation.y = Math.PI/2; // Face forward with 90 degree turn towards track
                    
                    this.runningCycle = 0;
                    this.runningSpeed = 15;
                    
                    console.log('Adding Nox mesh to scene at position:', this.mesh.position);
                    this.scene.add(this.mesh);
                    this.isModelLoaded = true;
                    this.logger.log('Nox model loaded successfully');
                    if (this.levelManager) {
                        this.levelManager.setPlayerReady();
                    }
                    resolve();
                },
                (progress) => {
                    console.log('Nox model loading progress:', progress);
                },
                (error) => {
                    console.error('Error loading Nox model:', error);
                    if (this.mesh) this.scene.remove(this.mesh);
                    console.log('Creating fallback cube for Nox');
                    this.mesh = new THREE.Mesh(
                        new THREE.BoxGeometry(0.04, 0.02, 0.04), // Changed height from 0.04 to 0.02 to match crouched height
                        new THREE.MeshBasicMaterial({ color: 0xA52A2A })
                    );
                    this.mesh.position.y = 0.05; // Changed from 0.1 to 0.05 to match crouched position
                    console.log('Adding fallback cube to scene');
                    this.scene.add(this.mesh);
                    
                    this.runningCycle = 0;
                    this.runningSpeed = 15;
                    
                    this.isModelLoaded = true;
                    this.logger.log('Fallback to cube for Nox due to model loading error');
                    if (this.levelManager) {
                        this.levelManager.setPlayerReady();
                    }
                    resolve();
                }
            );
        });

        this.abilityCooldown = 8;
        this.abilityTimer = 0;
        this.isAbilityActive = false;
        this.speedBoost = 2;
        this.canBreakObstacles = false;
        this.abilityEnabled = false;
        console.log('NoxController initialized:', this);
    }

    updateRotation(delta) {
        if (!this.mesh) return;
        
        // Base rotation - face forward with 90 degree turn towards track
        const baseRotation = Math.PI/2; // Face forward with 90 degree turn
        
        // If strafing left, rotate slightly right (inverting direction to fix the issue)
        if (this.lastMoveDirection === 'left') {
            const targetRotation = baseRotation + Math.PI/6; // Slightly right when moving left
            this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetRotation, 5 * delta);
        } 
        // If strafing right, rotate slightly left (inverting direction to fix the issue)
        else if (this.lastMoveDirection === 'right') {
            const targetRotation = baseRotation - Math.PI/6; // Slightly left when moving right
            this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetRotation, 5 * delta);
        } 
        // If moving forward, rotate back to center
        else {
            this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, baseRotation, 5 * delta);
        }
        
        // Log rotation occasionally for debugging
        if (Math.random() < 0.01) {
            console.log(`Nox rotation: ${this.mesh.rotation.y.toFixed(2)}, direction: ${this.lastMoveDirection}`);
        }
    }

    useAbility(scene) {
        if (this.abilityEnabled) {
            this.logger.log(`Attempting to use Beast Burst. Timer: ${this.abilityTimer}`);
            if (this.abilityTimer <= 0 && !this.isAbilityActive) {
                this.logger.log('Beast Burst activated!');
                this.isAbilityActive = true;
                this.abilityTimer = this.abilityCooldown;
                this.speed += this.speedBoost;
                this.canBreakObstacles = true;
                setTimeout(() => {
                    this.speed -= this.speedBoost;
                    this.canBreakObstacles = false;
                    this.isAbilityActive = false;
                    this.abilityEnabled = false;
                    this.tokenCount = 0;
                    
                    this.logger.log('Beast Burst ended.');
                }, 3000);
            } else {
                this.logger.log(`Beast Burst on cooldown: ${this.abilityTimer}`);
            }
        } else {
            this.logger.log(`Beast Burst not enabled (need 5 tokens).`);
        }
    }

    checkCollision(object) {
        if (!this.mesh) return false;
        // Remove ability to break obstacles
        return super.checkCollision(object);
    }

    update(camera, actions, obstacles, barriers, scene, gameState, delta, logger) {
        if (actions.strafeLeft) {
            this.lastMoveDirection = 'left';
        } else if (actions.strafeRight) {
            this.lastMoveDirection = 'right';
        } else {
            this.lastMoveDirection = 'forward';
        }
        
        this.updateRotation(delta);
        
        // Animate running motion
        if (this.mesh && !gameState.gameOver && !this.isSliding) {
            // Update running cycle
            this.runningCycle += delta * this.runningSpeed;
            
            // Apply running animation - bob up and down slightly
            const verticalOffset = Math.sin(this.runningCycle) * 0.005;
            this.mesh.position.y = 0.05 + verticalOffset; // Changed from 0.1 to 0.05 to match crouched position
            
            // Add slight forward/backward tilt for running effect
            const tiltAmount = Math.sin(this.runningCycle) * 0.1;
            this.mesh.rotation.x = tiltAmount;
            
            // Add slight side-to-side sway
            if (!actions.strafeLeft && !actions.strafeRight) {
                const swayAmount = Math.sin(this.runningCycle / 2) * 0.05;
                this.mesh.rotation.z = swayAmount;
            }
        }
        
        super.update(camera, actions, obstacles, barriers, scene, gameState, delta, logger);
        
        if (this.abilityTimer > 0) this.abilityTimer -= delta;
    }

    setLevelManager(levelManager) {
        super.setLevelManager(levelManager);
        if (this.isModelLoaded && this.levelManager) {
            this.levelManager.setPlayerReady();
        }
    }
}