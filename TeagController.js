import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';
import { Logger } from './Logger.js';

export class TeagController extends PlayerController {
    constructor(type, scene) {
        super(type, scene);
        this.mesh.material.color.set(0xFFD700);
        this.abilityCooldown = 12;
        this.abilityTimer = 0;
        this.isAbilityActive = false;
        this.slowFactor = 0.5;
        this.abilityEnabled = false;
        console.log('TeagController initialized:', this);
    }

    useAbility(scene) {
        if (this.abilityEnabled) {
            this.logger.log(`Attempting to use Spotter's Edge. Timer: ${this.abilityTimer}`);
            if (this.abilityTimer <= 0 && !this.isAbilityActive) {
                this.logger.log('Spotter\'s Edge activated!');
                this.isAbilityActive = true;
                this.abilityTimer = this.abilityCooldown;
                this.slowFactor = 0.5;
                setTimeout(() => {
                    this.slowFactor = 1;
                    this.isAbilityActive = false;
                    this.abilityEnabled = false;
                    tokenCount = 0;
                    progressBar.style.width = '0%';
                    this.logger.log('Spotter\'s Edge ended.');
                }, 5000);
            } else {
                this.logger.log(`Spotter's Edge on cooldown: ${this.abilityTimer}`);
            }
        } else {
            this.logger.log(`Spotter's Edge not enabled (need 5 tokens).`);
        }
    }

    update(camera, actions, obstacles, barriers, scene, gameState, delta, logger) {
        const adjustedDelta = delta * this.slowFactor;
        super.update(camera, actions, obstacles, barriers, scene, gameState, adjustedDelta, logger);
        if (this.abilityTimer > 0) this.abilityTimer -= adjustedDelta;
    }

    setLevelManager(levelManager) {
        super.setLevelManager(levelManager);
    }
}