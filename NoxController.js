import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';
import { Logger } from './Logger.js';

export class NoxController extends PlayerController {
    constructor(type, scene) {
        super(type, scene);
        this.logger.log('NoxController initializing...');

        const loader = new window.GLTFLoad();
        loader.load(
            'models/nox.gltf',
            (gltf) => {
                if (this.mesh) this.scene.remove(this.mesh);
                this.mesh = gltf.scene;
                this.mesh.scale.set(1, 1, 1);
                this.mesh.position.set(this.mesh.position.x, 0.5, this.mesh.position.z);
                this.mesh.traverse(child => {
                    if (child.isMesh) child.material.color.set(0xA52A2A);
                });
                this.scene.add(this.mesh);
                this.logger.log('Nox model loaded');
            },
            undefined,
            (error) => console.error('Error loading Nox model:', error)
        );

        this.abilityCooldown = 8;
        this.abilityTimer = 0;
        this.isAbilityActive = false;
        this.speedBoost = 2;
        this.canBreakObstacles = false;
        this.abilityEnabled = false;
        console.log('NoxController initialized:', this);
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
                    progressBar.style.width = '0%';
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
        if (this.canBreakObstacles && object.material.color.getHex() === 0xff0000) {
            this.logger.log('Obstacle broken by Beast Burst!');
            return false;
        }
        const pBox = new THREE.Box3().setFromObject(this.mesh);
        const oBox = new THREE.Box3().setFromObject(object);
        return pBox.intersectsBox(oBox);
    }

    update(camera, actions, obstacles, barriers, scene, gameState, delta, logger) {
        super.update(camera, actions, obstacles, barriers, scene, gameState, delta, logger);
        if (this.abilityTimer > 0) this.abilityTimer -= delta;
    }

    setLevelManager(levelManager) {
        super.setLevelManager(levelManager);
    }
}