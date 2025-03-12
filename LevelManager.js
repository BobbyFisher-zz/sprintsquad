import * as THREE from 'three';
import { Logger } from './Logger.js';

export class LevelManager {
    constructor(scene, player, gameState) {
        this.logger = new Logger();
        this.scene = scene;
        this.player = player;
        this.gameState = gameState;
        this.obstacles = [];
        this.barriers = [];
        this.collectibles = [];
        this.platforms = [];
        this.lastObstacleTime = 0;
        this.lastCollectibleTime = 0;
        this.lastPlatformTime = 0;
        this.obstacleInterval = 2;
        this.collectibleInterval = 3;
        this.platformInterval = 5;
        this.obstacleSpeed = 0;
        console.log('LevelManager initialized:', this);
    }

    update(delta) {
        this.obstacleSpeed = this.player.speed;
        this.logger.log(`LevelManager updating, delta: ${delta}, obstacleSpeed: ${this.obstacleSpeed}`);

        // Spawn obstacles
        this.lastObstacleTime += delta;
        if (this.lastObstacleTime >= this.obstacleInterval) {
            this.spawnObstacle();
            this.lastObstacleTime -= this.obstacleInterval; // Subtract interval to prevent drift
        }

        // Spawn collectibles
        this.lastCollectibleTime += delta;
        if (this.lastCollectibleTime >= this.collectibleInterval) {
            this.spawnCollectible();
            this.lastCollectibleTime -= this.collectibleInterval;
        }

        // Spawn platforms
        this.lastPlatformTime += delta;
        if (this.lastPlatformTime >= this.platformInterval) {
            this.spawnPlatform();
            this.lastPlatformTime -= this.platformInterval;
        }

        // Move and clean up obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.position.z += this.obstacleSpeed * delta;
            if (obstacle.position.z > this.player.mesh.position.z + 15) {
                this.scene.remove(obstacle);
                this.obstacles = this.obstacles.filter(obj => obj !== obstacle);
            }
        });

        // Move and clean up barriers
        this.barriers.forEach(barrier => {
            barrier.position.z += this.obstacleSpeed * delta;
            if (barrier.position.z > this.player.mesh.position.z + 15) {
                this.scene.remove(barrier);
                this.barriers = this.barriers.filter(obj => obj !== barrier);
            }
        });

        // Move and clean up collectibles
        this.collectibles.forEach(collectible => {
            collectible.position.z += this.obstacleSpeed * delta;
            if (collectible.position.z > this.player.mesh.position.z + 15) {
                this.scene.remove(collectible);
                this.collectibles = this.collectibles.filter(obj => obj !== collectible);
            }
        });

        // Move and clean up platforms
        this.platforms.forEach(platform => {
            platform.position.z += this.obstacleSpeed * delta;
            if (platform.position.z > this.player.mesh.position.z + 15) {
                this.scene.remove(platform);
                this.platforms = this.platforms.filter(obj => obj !== platform);
            }
        });
    }

    spawnObstacle() {
        const obstacleTypes = [
            { size: [1, 1, 1], color: 0xff0000 },
            { size: [2, 2, 1], color: 0xFF4500 },
            { size: [1, 2, 1], color: 0x8B0000 }
        ];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        let obstacle;
        let validPosition = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!validPosition && attempts < maxAttempts) {
            obstacle = new THREE.Mesh(
                new THREE.BoxGeometry(...type.size),
                new THREE.MeshBasicMaterial({ color: type.color })
            );
            obstacle.position.set(
                Math.random() * 5 - 2.5,
                type.size[1] / 2,
                this.player.mesh.position.z - 20
            );
            const obstacleBox = new THREE.Box3().setFromObject(obstacle);
            validPosition = !this.obstacles.some(obs => {
                const obsBox = new THREE.Box3().setFromObject(obs);
                return obsBox.intersectsBox(obstacleBox);
            }) && !this.collectibles.some(col => {
                const colBox = new THREE.Box3().setFromObject(col);
                return colBox.intersectsBox(obstacleBox);
            });
            attempts++;
        }

        if (validPosition) {
            this.scene.add(obstacle);
            this.obstacles.push(obstacle);
            this.logger.log(`Spawned obstacle at: ${JSON.stringify(obstacle.position)} with color ${type.color.toString(16)}`);
        } else {
            this.logger.log('Failed to find valid obstacle position after max attempts');
        }
    }

    spawnCollectible() {
        const collectibleTypes = [
            { type: 'coin', color: 0xFFFF00, value: 10 },
            { type: 'token', color: 0xFFA500, value: 0, character: 'Dax' },
            { type: 'token', color: 0xA52A2A, value: 0, character: 'Nox' },
            { type: 'token', color: 0x32CD32, value: 0, character: 'Buggy' },
            { type: 'token', color: 0xFFD700, value: 0, character: 'Teag' }
        ];
        const type = collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)];
        let collectible;
        let validPosition = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!validPosition && attempts < maxAttempts) {
            collectible = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.5),
                new THREE.MeshBasicMaterial({ color: type.color })
            );
            collectible.position.set(
                Math.random() * 5 - 2.5,
                1,
                this.player.mesh.position.z - 20
            );
            const collectibleBox = new THREE.Box3().setFromObject(collectible);
            validPosition = !this.obstacles.some(obs => {
                const obsBox = new THREE.Box3().setFromObject(obs);
                return obsBox.intersectsBox(collectibleBox);
            }) && !this.collectibles.some(col => {
                const colBox = new THREE.Box3().setFromObject(col);
                return colBox.intersectsBox(collectibleBox);
            });
            attempts++;
        }

        if (validPosition) {
            collectible.userData = { value: type.value, type: type.type, character: type.character };
            this.scene.add(collectible);
            this.collectibles.push(collectible);
            this.logger.log(`Spawned ${type.type} at: ${JSON.stringify(collectible.position)} with color ${type.color.toString(16)}`);
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

    getObstacles() {
        return this.obstacles;
    }

    getBarriers() {
        return this.barriers;
    }

    getCollectibles() {
        return this.collectibles;
    }

    getPlatforms() {
        return this.platforms;
    }
}