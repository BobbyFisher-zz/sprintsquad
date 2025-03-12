import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';
import { Logger } from './Logger.js';

export class BuggyController extends PlayerController {
    constructor(type, scene) {
        super(type, scene);
        this.mesh.material.color.set(0x32CD32);
        this.abilityCooldown = 9;
        this.abilityTimer = 0;
        this.isAbilityActive = false;
        this.jumpBoost = 5;
        this.abilityEnabled = false;
        console.log('BuggyController initialized:', this);
    }

    useAbility(scene) {
        if (this.abilityEnabled) {
            this.logger.log(`Attempting to use Flip Flow. Timer: ${this.abilityTimer}`);
            if (this.abilityTimer <= 0 && !this.isAbilityActive && !this.isGrounded) {
                this.logger.log('Flip Flow activated!');
                this.isAbilityActive = true;
                this.abilityTimer = this.abilityCooldown;
                this.velocity.y += this.jumpBoost;
                setTimeout(() => {
                    this.isAbilityActive = false;
                    this.abilityEnabled = false;
                    tokenCount = 0;
                    progressBar.style.width = '0%';
                    this.logger.log('Flip Flow ended.');
                }, 1000);
            } else {
                this.logger.log(`Flip Flow on cooldown: ${this.abilityTimer}`);
            }
        } else {
            this.logger.log(`Flip Flow not enabled (need 5 tokens).`);
        }
    }

    update(camera, actions, obstacles, barriers, scene, gameState, delta, logger) {
        super.update(camera, actions, obstacles, barriers, scene, gameState, delta, logger);
        if (this.abilityTimer > 0) this.abilityTimer -= delta;
    }

    setLevelManager(levelManager) {
        super.setLevelManager(levelManager);
    }
}