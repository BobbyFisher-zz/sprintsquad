import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';
import { Logger } from './Logger.js';

export class DaxController extends PlayerController {
    constructor(type, scene) {
        super(type, scene);
        this.logger.log('DaxController initializing...');

        // Override the generic model with Dax's specific model
        const loader = new window.GLTFLoad();
        loader.load(
            'models/dax/dax.gltf',
            (gltf) => {
                if (this.mesh) this.scene.remove(this.mesh); // Remove generic mesh if it loaded
                this.mesh = gltf.scene;
                this.mesh.scale.set(1, 1, 1);
                this.mesh.position.y = 0.5;
                this.logger.log('Dax model loaded');
            },
            undefined,
            (error) => console.error('Error loading Dax model:', error)
        );

        this.abilityCooldown = 10;
        this.abilityTimer = 0;
        this.isAbilityActive = false;
        this.abilityEnabled = false;
        console.log('DaxController initialized:', this);
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
                    progressBar.style.width = '0%';
                    this.logger.log('Pathfinder ended.');
                }, 5000);
            } else {
                this.logger.log(`Pathfinder on cooldown: ${this.abilityTimer}`);
            }
        } else {
            this.logger.log(`Pathfinder not enabled (need 5 tokens).`);
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