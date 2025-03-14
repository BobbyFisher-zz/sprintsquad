import { Logger } from './Logger.js';

export class InputManager {
    constructor() {
        this.logger = new Logger();
        this.actions = {
            jump: false,
            strafeLeft: false,
            strafeRight: false,
            slide: false,
            useAbility: false
        };
        this.keysPressed = {};
        this.setupKeyboard();
        this.setupTouchControls();
        this.logger.log('InputManager initialized');
    }

    setupKeyboard() {
        const handleKeydown = (e) => {
            this.keysPressed[e.key] = true;
            
            // Toggle bounding boxes with 'b' key
            if (e.key === 'b') {
                // Create a custom event to toggle bounding boxes
                const toggleEvent = new CustomEvent('toggleBoundingBoxes');
                window.dispatchEvent(toggleEvent);
                this.logger.log('Toggle bounding boxes event dispatched');
            }
            
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                    this.logger.log('Jump key pressed (W/Up)');
                    this.actions.jump = true;
                    break;
                case 'ArrowLeft':
                case 'a':
                    this.logger.log('Strafe left key pressed (A/Left)');
                    this.actions.strafeLeft = true;
                    break;
                case 'ArrowRight':
                case 'd':
                    this.logger.log('Strafe right key pressed (D/Right)');
                    this.actions.strafeRight = true;
                    break;
                case 'ArrowDown':
                case 's':
                    this.logger.log('Slide key pressed (S/Down)');
                    this.actions.slide = true;
                    break;
                case ' ':
                    this.logger.log('Spacebar pressed for ability');
                    this.actions.useAbility = true;
                    break;
            }
        };

        const handleKeyup = (e) => {
            this.keysPressed[e.key] = false;
            this.logger.log(`Keyup event: ${e.key}`);
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                    this.actions.jump = false;
                    break;
                case 'ArrowLeft':
                case 'a':
                    this.actions.strafeLeft = false;
                    break;
                case 'ArrowRight':
                case 'd':
                    this.actions.strafeRight = false;
                    break;
                case 'ArrowDown':
                case 's':
                    this.actions.slide = false;
                    break;
                case ' ':
                    this.actions.useAbility = false;
                    break;
            }
        };

        document.addEventListener('keydown', handleKeydown);
        document.addEventListener('keyup', handleKeyup);
    }

    setupTouchControls() {
        let touchStartTime = null;
        let touchStartX = null;

        const handleTouchStart = (e) => {
            e.preventDefault(); // Prevent default touch behaviors
            const touch = e.touches[0];
            touchStartTime = Date.now();
            touchStartX = touch.clientX;
            const screenWidth = window.innerWidth;
            const leftBoundary = screenWidth / 3;
            const rightBoundary = 2 * screenWidth / 3;

            if (touch.clientX < leftBoundary) {
                this.actions.strafeLeft = true;
                this.logger.log('Left touch started');
            } else if (touch.clientX > rightBoundary) {
                this.actions.strafeRight = true;
                this.logger.log('Right touch started');
            } else {
                this.actions.jump = true;
                this.logger.log('Middle touch started (jump)');
            }
        };

        const handleTouchEnd = (e) => {
            e.preventDefault();
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;
            const touchEndX = e.changedTouches[0].clientX;

            // Reset actions
            this.actions.strafeLeft = false;
            this.actions.strafeRight = false;
            this.actions.jump = false;

            // Check for long press in middle for Pathfinder (e.g., > 500ms)
            if (touchStartX && Math.abs(touchEndX - touchStartX) < 10 && touchDuration > 500) {
                this.actions.useAbility = true;
                this.logger.log('Middle long press detected (ability)');
                setTimeout(() => {
                    this.actions.useAbility = false;
                    this.logger.log('Ability touch ended');
                }, 100); // Brief activation
            } else {
                this.logger.log('Touch ended (short press)');
            }

            touchStartTime = null;
            touchStartX = null;
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: false });

        this.logger.log('Touch controls initialized (region-based)');
    }

    getActions() {
        this.logger.log(`Actions live state: ${JSON.stringify(this.actions)}`);
        return this.actions;
    }

    downloadLog() {
        this.logger.downloadLog();
    }
}