import * as THREE from 'three';
import { Logger } from './Logger.js';

export class TextureManager {
    constructor() {
        this.logger = new Logger();
        this.textures = {};
        this.loader = new THREE.TextureLoader();
        
        // Define texture URLs - use blob URLs from index.html if available
        this.textureURLs = window.textureURLs || {
            floor: 'textures/floor.jpg',
            obstacle1: 'textures/obstacle1.jpg',
            obstacle2: 'textures/obstacle2.jpg',
            obstacle3: 'textures/obstacle3.jpg',
            coin: 'textures/coin.jpg',
            token: 'textures/token.jpg'
        };
        
        this.logger.log('TextureManager initialized');
    }

    /**
     * Load multiple textures at once
     * @param {Object} textureMap - Object with key-value pairs of texture name and path
     * @returns {Promise} - Promise that resolves when all textures are loaded
     */
    async loadTextures(textureMap = null) {
        // If no textureMap is provided, use the default textureURLs
        const texturesToLoad = textureMap || this.textureURLs;
        this.logger.log(`Loading ${Object.keys(texturesToLoad).length} textures...`);
        
        const promises = [];
        
        for (const [name, path] of Object.entries(texturesToLoad)) {
            promises.push(this.loadTexture(name, path));
        }
        
        await Promise.all(promises);
        this.logger.log('All textures loaded successfully');
    }

    /**
     * Load a single texture
     * @param {string} name - Name to reference the texture by
     * @param {string} path - Path to the texture file
     * @returns {Promise} - Promise that resolves when the texture is loaded
     */
    loadTexture(name, path) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (texture) => {
                    // Configure texture properties
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(1, 1);
                    
                    this.textures[name] = texture;
                    this.logger.log(`Texture '${name}' loaded from ${path}`);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    this.logger.log(`Error loading texture '${name}' from ${path}: ${error.message}`);
                    // Create a fallback texture (checkerboard pattern)
                    const fallbackTexture = this.createFallbackTexture();
                    this.textures[name] = fallbackTexture;
                    resolve(fallbackTexture); // Resolve with fallback instead of rejecting
                }
            );
        });
    }

    /**
     * Get a loaded texture by name
     * @param {string} name - Name of the texture to retrieve
     * @returns {THREE.Texture|null} - The texture or null if not found
     */
    getTexture(name) {
        if (this.textures[name]) {
            return this.textures[name];
        }
        
        this.logger.log(`Texture '${name}' not found`);
        return null;
    }

    /**
     * Create a fallback texture (checkerboard pattern)
     * @returns {THREE.Texture} - A checkerboard texture
     */
    createFallbackTexture() {
        const size = 64;
        const data = new Uint8Array(size * size * 4);
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const index = (i * size + j) * 4;
                const isEven = (i + j) % 2 === 0;
                
                data[index] = isEven ? 255 : 0;     // R
                data[index + 1] = isEven ? 0 : 255; // G
                data[index + 2] = 255;              // B
                data[index + 3] = 255;              // A
            }
        }
        
        const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        
        return texture;
    }
    
    // Add compatibility method for the old code
    loadAllTextures() {
        return this.loadTextures();
    }
} 