import * as THREE from 'three';
import { Logger } from './Logger.js';

export class PlayerController {
    constructor(type, scene) {
        this.logger = new Logger();
        this.type = type;
        this.scene = scene;
        this.mesh = null;
        this.isModelLoaded = false;
        this.loadPromise = new Promise((resolve) => {
            const loader = new window.GLTFLoad();
            loader.load(
                'models/generic_character.gltf',
                (gltf) => {
                    this.mesh = gltf.scene;
                    this.mesh.scale.set(1, 1, 1);
                    this.mesh.position.y = 0.5;
                    this.isModelLoaded = true;
                    this.logger.log(`Loaded generic model for ${this.type}`);
                    resolve();
                },
                undefined,
                (error) => {
                    console.error(`Error loading generic model for ${this.type}:`, error);
                    resolve(); // Resolve even on error to avoid hanging
                }
            );
        });

        this.speed = 7;
        this.acceleration = 0.1;
        this.jumpForce = 10;
        this.velocity = new THREE.Vector3();
        this.isGrounded = true;
        this.strafeSpeed = 5;
        this.abilityCooldown = 10;
        this.abilityTimer = 0;
        this.isAbilityActive = false;
        this.abilityEnabled = false;
        this.tokenCount = 0;
        this.loggingEnabled = true;
        this.isSliding = false;
        this.hasBoosted = false;
        this.timeElapsed = 0;
        this.levelManager = null;
        console.log('PlayerController initialized with type:', this.type);
    }

    // Check if model is loaded
    isReady() {
        return this.isModelLoaded;
    }

    jump() {
        if (!this.mesh) return;
        if (this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            this.hasBoosted = false;
            this.logger.log(`Jumped! Velocity Y: ${this.velocity.y}, Position Y: ${this.mesh.position.y}, Is Grounded: ${this.isGrounded}`);
        } else if (this.velocity.y > 0 && !this.isSliding && !this.hasBoosted) {
            this.velocity.y += this.jumpForce * 0.02;
            this.velocity.y = Math.min(this.velocity.y, this.jumpForce * 1.5);
            this.hasBoosted = true;
            this.logger.log(`Jump boosted! Velocity Y: ${this.velocity.y}, Position Y: ${this.mesh.position.y}`);
        } else {
            this.logger.log(`Cannot jump - not grounded or sliding. Position Y: ${this.mesh.position.y}, Is Grounded: ${this.isGrounded}, Is Sliding: ${this.isSliding}`);
        }
    }

    useAbility(scene) {
        if (!this.mesh) return;
        if (this.abilityEnabled) {
            this.logger.log(`Attempting to use ability for ${this.type}. Timer: ${this.abilityTimer}`);
            if (this.abilityTimer <= 0) {
                this.logger.log(`${this.type} ability activated!`);
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
                    progressBar.style.width = '0%';
                    this.logger.log(`${this.type} ability ended.`);
                }, 5000);
            } else {
                this.logger.log(`${this.type} ability on cooldown: ${this.abilityTimer}`);
            }
        } else {
            this.logger.log(`Ability for ${this.type} not enabled (need 5 tokens).`);
        }
    }

    checkCollision(object) {
        if (!this.mesh) return false;
        const pBox = new THREE.Box3().setFromObject(this.mesh);
        const oBox = new THREE.Box3().setFromObject(object);
        this.logger.log(`Checking collision - Player Box: ${JSON.stringify(pBox)}, Object Box: ${JSON.stringify(oBox)}, Player Pos: ${JSON.stringify(this.mesh.position)}, Object Pos: ${JSON.stringify(object.position)}`);
        return pBox.intersectsBox(oBox);
    }

    update(camera, actions, obstacles, barriers, scene, gameState, delta, logger) {
        if (!this.mesh) return;

        const prevX = this.mesh.position.x;
        const prevZ = this.mesh.position.z;

        this.timeElapsed += delta;
        this.speed += this.acceleration * delta;
        logger.log(`Speed updated: ${this.speed.toFixed(2)} at time ${this.timeElapsed.toFixed(2)}s`);

        logger.log(`Delta: ${delta}`);
        this.velocity.y -= 15 * delta;
        this.mesh.position.y += this.velocity.y * delta;
        logger.log(`Position update - Velocity Y: ${this.velocity.y.toFixed(3)}, Position Y: ${this.mesh.position.y.toFixed(3)}, Mesh Y: ${this.mesh.position.y.toFixed(3)}`);

        let isOnPlatform = false;
        if (this.mesh.position.y <= 0.51 && this.velocity.y <= 0 && !this.isSliding) {
            this.mesh.position.y = 0.5;
            this.isGrounded = true;
            this.velocity.y = 0;
            this.hasBoosted = false;
            logger.log(`Grounded! Position Y: ${this.mesh.position.y}, Is Grounded: ${this.isGrounded}`);
        }
        const platforms = this.getPlatforms();
        platforms.forEach(function(platform) {
            const pBox = new THREE.Box3().setFromObject(platform);
            const playerBox = new THREE.Box3().setFromObject(this.mesh);
            if (this.velocity.y <= 0 && playerBox.min.y <= platform.position.y + 0.5 && playerBox.max.y >= platform.position.y + 0.5 && pBox.intersectsBox(playerBox)) {
                this.mesh.position.y = platform.position.y + 0.75;
                this.isGrounded = true;
                this.velocity.y = 0;
                this.hasBoosted = false;
                isOnPlatform = true;
                logger.log(`Landed on platform at: ${JSON.stringify(platform.position)}`);
            }
        }.bind(this));

        this.mesh.position.z -= this.speed * delta;

        if (actions.jump && (this.isGrounded || isOnPlatform)) {
            logger.log(`Jump action triggered, Is Grounded: ${this.isGrounded}, Is On Platform: ${isOnPlatform}`);
            this.jump();
        }

        if (actions.strafeLeft) {
            this.logger.log(`Strafing left, Position X: ${this.mesh.position.x}`);
            this.mesh.position.x -= this.strafeSpeed * delta;
        }
        if (actions.strafeRight) {
            this.logger.log(`Strafing right, Position X: ${this.mesh.position.x}`);
            this.mesh.position.x += this.strafeSpeed * delta;
        }

        if (actions.slide) {
            this.isSliding = true;
            this.logger.log(`Slide triggered, Is Sliding: ${this.isSliding}`);
            this.mesh.scale.y = 0.5;
            this.mesh.position.y = 0.25;
        } else {
            this.isSliding = false;
            this.mesh.scale.y = 1;
        }

        if (actions.useAbility && !this.isAbilityActive) {
            logger.log('Use ability triggered in PlayerController');
            this.useAbility(scene);
        }

        if (this.abilityTimer > 0) {
            this.abilityTimer -= delta;
        }

        barriers.forEach(barrier => {
            if (this.checkCollision(barrier)) {
                this.mesh.position.x = prevX;
            }
        });

        obstacles.forEach(obstacle => {
            if (this.checkCollision(obstacle)) {
                this.mesh.position.z = prevZ;
                if (!this.canBreakObstacles || obstacle.material.color.getHex() !== 0xff0000) {
                    this.speed = 0;
                    logger.log('Hit obstacle! Game Over.');
                    this.loggingEnabled = false;
                    logger.setLoggingEnabled(false);
                    gameState.gameOver = true;
                }
            }
        });

        const collectibles = this.getCollectibles();
        this.logger.log(`Checking collectibles, count: ${collectibles.length}, contents: ${JSON.stringify(collectibles.map(c => ({ pos: c.position, type: c.userData.type })))}`);
        collectibles.forEach(function(collectible) {
            if (this.checkCollision(collectible)) {
                const value = collectible.userData.value;
                const type = collectible.userData.type;
                const character = collectible.userData.character;
                this.logger.log(`Collision detected with ${type} at ${JSON.stringify(collectible.position)}, player at ${JSON.stringify(this.mesh.position)}`);
                this.logger.log(`Collectible type: ${type}, character: ${character}, player type: ${this.type}`);
                this.scene.remove(collectible);
                this.levelManager.collectibles = this.levelManager.collectibles.filter(c => c !== collectible);
                if (type === 'coin') {
                    score += value;
                    this.logger.log(`Collected coin worth ${value} points, new score: ${score}`);
                } else if (type === 'token' && character.toLowerCase() === this.type.toLowerCase()) {
                    this.tokenCount += 1;
                    progressBar.style.width = `${(this.tokenCount / 5) * 100}%`;
                    this.logger.log(`Token collected for ${this.type}, count: ${this.tokenCount}`);
                    if (this.tokenCount >= 5) {
                        this.abilityEnabled = true;
                        this.logger.log(`Ability enabled for ${this.type} with 5 tokens!`);
                    }
                } else {
                    this.logger.log(`Token not collected: character ${character} does not match player type ${this.type}`);
                }
            }
        }.bind(this));
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
}