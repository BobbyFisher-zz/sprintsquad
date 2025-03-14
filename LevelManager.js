import * as THREE from 'three';
import { Logger } from './Logger.js';

export class LevelManager {
    constructor(scene, player, gameState, textureManager) {
        this.logger = new Logger();
        this.scene = scene;
        this.player = player;
        this.gameState = gameState;
        this.textureManager = textureManager;
        this.obstacles = [];
        this.barriers = [];
        this.collectibles = [];
        this.platforms = [];
        this.lastObstacleTime = 0;
        this.lastCollectibleTime = 0;
        this.lastPlatformTime = 0;
        this.obstacleInterval = 0.5;
        this.collectibleInterval = 2;
        this.platformInterval = 5;
        this.obstacleSpeed = 0;
        this.isPlayerReady = false; // New flag
        this.showBoundingBoxes = false; // Hide bounding box visualization
        this.boundingBoxHelpers = []; // Store bounding box helpers
        console.log('LevelManager initialized:', this);
    }

    setPlayerReady() {
        this.isPlayerReady = true;
    }

    update(delta) {
        if (!this.isPlayerReady) return; // Wait for player to be ready
        this.obstacleSpeed = this.player.speed;
        this.logger.log(`LevelManager updating, delta: ${delta}, obstacleSpeed: ${this.obstacleSpeed}`);

        // Update all bounding box helpers
        if (this.showBoundingBoxes) {
            this.boundingBoxHelpers = this.boundingBoxHelpers.filter(item => {
                if (this.obstacles.includes(item.object) || 
                    this.collectibles.includes(item.object) || 
                    this.platforms.includes(item.object)) {
                    const box = new THREE.Box3().setFromObject(item.object);
                    item.helper.box.copy(box);
                    return true;
                } else {
                    this.scene.remove(item.helper);
                    return false;
                }
            });
        }

        this.lastObstacleTime += delta;
        if (this.lastObstacleTime >= this.obstacleInterval) {
            this.spawnObstacle();
            this.lastObstacleTime -= this.obstacleInterval;
        }

        this.lastCollectibleTime += delta;
        if (this.lastCollectibleTime >= this.collectibleInterval) {
            this.spawnCollectible();
            this.lastCollectibleTime -= this.collectibleInterval;
        }

        this.obstacles.forEach(obstacle => {
            obstacle.position.z += this.obstacleSpeed * delta;
            if (obstacle.position.z > this.player.mesh.position.z + 15) {
                this.scene.remove(obstacle);
                this.obstacles = this.obstacles.filter(obj => obj !== obstacle);
            }
        });

        this.barriers.forEach(barrier => {
            barrier.position.z += this.obstacleSpeed * delta;
            if (barrier.position.z > this.player.mesh.position.z + 15) {
                this.scene.remove(barrier);
                this.barriers = this.barriers.filter(obj => obj !== barrier);
            }
        });

        this.collectibles.forEach(collectible => {
            collectible.position.z += this.obstacleSpeed * delta;
            
            // Add rotation animation for coins
            if (collectible.userData && collectible.userData.type === 'coin') {
                collectible.rotation.y += collectible.userData.rotationSpeed * delta;
                collectible.rotation.x += collectible.userData.rotationSpeed * delta * 0.5;
            }
            
            if (collectible.position.z > this.player.mesh.position.z + 15) {
                this.scene.remove(collectible);
                this.collectibles = this.collectibles.filter(obj => obj !== collectible);
            }
        });

        this.platforms.forEach(platform => {
            platform.position.z += this.obstacleSpeed * delta;
            if (platform.position.z > this.player.mesh.position.z + 15) {
                this.scene.remove(platform);
                this.platforms = this.platforms.filter(obj => obj !== platform);
            }
        });
    }

    spawnObstacle() {
        // Define a wider variety of obstacle types with different shapes and sizes
        const obstacleTypes = [
            { size: [1, 1, 1], textureKey: 'obstacle1', color: 0xff0000 },
            { size: [2, 2, 1], textureKey: 'obstacle2', color: 0xFF4500 },
            { size: [1, 2, 1], textureKey: 'obstacle3', color: 0x8B0000 },
            { size: [3, 1, 1], textureKey: 'obstacle1', color: 0xff0000 }, // Wide but short
            { size: [0.8, 3, 0.8], textureKey: 'obstacle2', color: 0xFF4500 }, // Tall and thin
            { size: [1.5, 1.5, 1.5], textureKey: 'obstacle3', color: 0x8B0000 } // Cube-like
        ];
        
        // Track width is 20 units (-10 to +10), but player is restricted to -9 to +9
        const trackWidth = 18; // Effective track width
        const laneCount = 3; // Divide track into 3 lanes
        const laneWidth = trackWidth / laneCount;
        
        // Randomly decide how many obstacles to spawn (2-3)
        const obstacleCount = 2 + Math.floor(Math.random() * 2);
        
        // Randomly select which lanes will have obstacles (ensuring at least one lane is clear)
        const lanes = [0, 1, 2]; // Left, center, right lanes
        const blockedLanes = [];
        
        // Randomly select which lanes to block (leaving at least one lane open)
        while (blockedLanes.length < obstacleCount && lanes.length > 0) {
            const randomIndex = Math.floor(Math.random() * lanes.length);
            const lane = lanes[randomIndex];
            
            blockedLanes.push(lane);
            lanes.splice(randomIndex, 1);
        }
        
        // Spawn obstacles in the selected lanes
        for (const lane of blockedLanes) {
            const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            
            // Calculate lane center position
            const laneCenter = -trackWidth/2 + (lane * laneWidth) + (laneWidth/2);
            
            // Create material with texture if available
            let material;
            if (this.textureManager && this.textureManager.getTexture(type.textureKey)) {
                material = new THREE.MeshStandardMaterial({ 
                    map: this.textureManager.getTexture(type.textureKey),
                    color: 0xffffff, // Use white to not tint the texture
                    roughness: 0.7,
                    metalness: 0.2
                });
            } else {
                material = new THREE.MeshBasicMaterial({ color: type.color });
            }
            
            // Create the obstacle
            const obstacle = new THREE.Mesh(
                new THREE.BoxGeometry(...type.size),
                material
            );
            
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            
            // Position the obstacle in the selected lane with minimal random variation
            // to ensure it stays on the track
            const xVariation = (Math.random() - 0.5) * (laneWidth * 0.3); // Reduced variation to keep on track
            obstacle.position.set(
                laneCenter + xVariation,
                type.size[1] / 2,
                this.player.mesh.position.z - 30 - Math.random() * 10 // Varied distance
            );
            
            // Add the obstacle to the scene
            this.scene.add(obstacle);
            this.obstacles.push(obstacle);
            
            // Add bounding box helper for the obstacle (if enabled)
            if (this.showBoundingBoxes) {
                // Create a slightly smaller bounding box for visual representation
                const box = new THREE.Box3().setFromObject(obstacle);
                // Shrink the box slightly to be more forgiving
                const shrinkFactor = 0.1;
                box.min.x += shrinkFactor;
                box.min.z += shrinkFactor;
                box.max.x -= shrinkFactor;
                box.max.z -= shrinkFactor;
                
                const helper = new THREE.Box3Helper(box, 0x00ff00);
                this.scene.add(helper);
                this.boundingBoxHelpers.push({ helper, object: obstacle });
                
                // Store the custom collision box with the obstacle
                obstacle.userData.collisionBox = box;
            }
            
            this.logger.log(`Spawned obstacle at: ${JSON.stringify(obstacle.position)} with texture ${type.textureKey}`);
        }
    }

    spawnCollectible() {
        // Only spawn coins, no tokens
        const collectibleTypes = [
            { type: 'coin', color: 0xFFFF00, value: 10 }
        ];
        const type = collectibleTypes[0]; // Always use the coin type
        
        // Create a simple yellow box for the coin
        const coin = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshBasicMaterial({ color: type.color })
        );
        
        // Add rotation animation and collision data
        coin.userData = { 
            value: type.value, 
            type: type.type,
            rotationSpeed: 2 + Math.random() * 2, // Random rotation speed
            collisionRadius: 2.0 // Store collision radius directly in userData
        };
        
        // Track width is 20 units (-10 to +10), but player is restricted to -9 to +9
        const trackWidth = 18; // Effective track width
        
        let validPosition = false;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!validPosition && attempts < maxAttempts) {
            // Position coin within the track boundaries
            coin.position.set(
                Math.random() * 16 - 8, // Range from -8 to 8 to stay on track
                0.5, // Position at player's height
                this.player.mesh.position.z - 20 - Math.random() * 10 // Varied distance
            );
            
            const collectibleBox = new THREE.Box3().setFromObject(coin).expandByScalar(0.2);
            validPosition = ![...this.obstacles, ...this.platforms].some(obj => {
                const objBox = new THREE.Box3().setFromObject(obj);
                return objBox.intersectsBox(collectibleBox);
            }) && !this.collectibles.some(col => {
                const colBox = new THREE.Box3().setFromObject(col);
                return colBox.intersectsBox(collectibleBox);
            });
            attempts++;
        }
        
        if (validPosition) {
            this.scene.add(coin);
            this.collectibles.push(coin);
            this.logger.log(`Spawned ${type.type} at: ${JSON.stringify(coin.position)}`);
        } else {
            this.logger.log('Failed to find valid collectible position after max attempts');
        }
    }

    spawnPlatform() {
        const platform = new THREE.Mesh(
            new THREE.BoxGeometry(5, 0.5, 10),
            new THREE.MeshBasicMaterial({ color: 0xA9A9A9 })
        );
        platform.position.set(
            0,
            1.5,
            this.player.mesh.position.z - 25
        );
        this.scene.add(platform);
        this.platforms.push(platform);
        this.logger.log(`Spawned platform at: ${JSON.stringify(platform.position)}`);
    }

    getObstacles() { return this.obstacles; }
    getBarriers() { return this.barriers; }
    getCollectibles() { return this.collectibles; }
    getPlatforms() { return this.platforms; }
}