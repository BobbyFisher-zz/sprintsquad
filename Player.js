import * as THREE from 'three';
import { Logger } from './Logger.js';

export class Player {
    constructor(scene, camera, gameState) {
        this.logger = new Logger();
        this.scene = scene;
        this.camera = camera;
        this.gameState = gameState;
        
        // Player properties
        this.speed = 10;
        this.jumpForce = 15;
        this.gravity = 30;
        this.isGrounded = true;
        this.canJump = true;
        this.isSliding = false;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.position = new THREE.Vector3(0, 0, 0);
        
        // Create player mesh
        this.createMesh();
        
        // Bounding box for collision detection
        this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
        this.showBoundingBox = true;
        this.boundingBoxHelper = null;
        
        if (this.showBoundingBox) {
            this.boundingBoxHelper = new THREE.Box3Helper(this.boundingBox, 0xff0000);
            this.scene.add(this.boundingBoxHelper);
        }
        
        this.logger.log('Player initialized');
    }
    
    createMesh() {
        // Create a simple cube for the player
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 0.5, 0);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        
        this.logger.log('Player mesh created');
    }
    
    update(delta) {
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y -= this.gravity * delta;
        }
        
        // Update position
        this.mesh.position.x += this.velocity.x * delta;
        this.mesh.position.y += this.velocity.y * delta;
        this.mesh.position.z -= this.speed * delta; // Move forward
        
        // Check if player is on the ground
        if (this.mesh.position.y <= 0.5) {
            this.mesh.position.y = 0.5;
            this.velocity.y = 0;
            this.isGrounded = true;
            this.canJump = true;
        }
        
        // Update bounding box
        this.boundingBox.setFromObject(this.mesh);
        
        // Update bounding box helper if visible
        if (this.showBoundingBox && this.boundingBoxHelper) {
            this.boundingBoxHelper.box.copy(this.boundingBox);
        }
        
        // Update camera position
        this.camera.position.x = this.mesh.position.x;
        this.camera.position.z = this.mesh.position.z + 10;
        this.camera.position.y = this.mesh.position.y + 5;
        this.camera.lookAt(this.mesh.position);
    }
    
    jump() {
        if (this.isGrounded && this.canJump) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            this.canJump = false;
            this.logger.log('Player jumped');
        }
    }
    
    moveLeft(delta) {
        const moveSpeed = 10;
        this.velocity.x = -moveSpeed;
        this.logger.log('Player moving left');
    }
    
    moveRight(delta) {
        const moveSpeed = 10;
        this.velocity.x = moveSpeed;
        this.logger.log('Player moving right');
    }
    
    stopMoving() {
        this.velocity.x = 0;
    }
    
    slide() {
        if (this.isGrounded && !this.isSliding) {
            this.isSliding = true;
            
            // Shrink player height during slide
            this.mesh.scale.y = 0.5;
            this.mesh.position.y = 0.25;
            
            // Slide for 1 second
            setTimeout(() => {
                this.isSliding = false;
                this.mesh.scale.y = 1;
                this.mesh.position.y = 0.5;
            }, 1000);
            
            this.logger.log('Player sliding');
        }
    }
    
    checkCollision(obstacles) {
        for (const obstacle of obstacles) {
            const obstacleBox = obstacle.userData.collisionBox || new THREE.Box3().setFromObject(obstacle);
            
            if (this.boundingBox.intersectsBox(obstacleBox)) {
                this.logger.log('Player collided with obstacle');
                return true;
            }
        }
        
        return false;
    }
    
    checkCollectibles(collectibles) {
        const collectiblesHit = [];
        
        for (const collectible of collectibles) {
            const collectibleBox = new THREE.Box3().setFromObject(collectible);
            
            if (this.boundingBox.intersectsBox(collectibleBox)) {
                collectiblesHit.push(collectible);
                this.logger.log(`Player collected ${collectible.userData.type}`);
            }
        }
        
        return collectiblesHit;
    }
    
    isReady() {
        return true;
    }
} 