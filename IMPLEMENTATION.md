# Implementation Plan for *Sprint Squad*  
**Goal:** Build a 3D single-player platform runner with four kid-inspired characters (Dax, Nox, Buggy, Teag) in Three.js, starting simple and scaling up.  
**Approach:** Iterative MVPs—each adds a key feature, builds on the last, and stays playable/testable.  

---

## MVP 1: Core Runner Skeleton  
**Objective:** Get a basic 3D runner working with one character and simple movement.  
**Duration Estimate:** 1-2 days  

### Features  
- **Scene Setup:** Basic Three.js scene, camera, renderer.  
- **Player:** Single character (Dax) as a cube, auto-running forward.  
- **Floor:** Infinite scrolling plane.  
- **Controls:** PC only—W/Up to jump, A/Left & D/Right to strafe (keyboard input).  
- **Physics:** Custom gravity and jump (velocity-based).  

### Tasks  
- Set up project: `index.html`, `main.js`, Three.js import via CDN or npm.  
- Create scene, camera, renderer; append to DOM.  
- Add Dax as a cube with auto-run (`position.z -= speed`).  
- Implement floor as a long plane (`PlaneGeometry`).  
- Add keyboard input (WASD + Arrows) for jump/strafe.  
- Code custom gravity (`velocity.y -= 0.5 * delta`) and jump (`velocity.y = jumpForce`).  

### Deliverable  
- Dax cube auto-runs on a flat plane, can jump and strafe with keyboard.  

---

## MVP 2: Obstacles & Collision  
**Objective:** Add basic obstacles and collision detection to make it a game.  
**Duration Estimate:** 2-3 days  
**Builds On:** MVP 1  

### Features  
- **Obstacles:** Static cubes (e.g., crates) spawning ahead of Dax.  
- **Collision:** AABB checks to stop Dax on hit.  
- **Timer:** Simple game timer (counts up, resets on collision).  
- **UI:** HTML overlay for timer display.  

### Tasks  
- Add obstacle generation (random `z` positions, fixed `x/y`).  
- Implement AABB collision (`Box3.intersectsBox`).  
- Stop Dax on collision (`speed = 0` or reset position).  
- Create timer in `main.js` (`gameTime += delta`).  
- Add HTML/CSS overlay for timer (absolute positioned `<div>`).  

### Deliverable  
- Dax runs, jumps, strafes, hits obstacles, and sees a timer—basic runner loop.  

---

## MVP 3: Character Abilities (Dax Focus)  
**Objective:** Add Dax’s *Pathfinder* ability and refine controls.  
**Duration Estimate:** 2-3 days  
**Builds On:** MVP 2  

### Features  
- **Ability:** *Pathfinder*—highlight a “shortcut” (glowing cube) for 3-5s.  
- **Cooldown:** 10s timer, resets after use.  
- **Input Manager:** Unified keyboard controls (WASD + Arrows).  
- **Polish:** Slide mechanic (S/Down shrinks hitbox).  

### Tasks  
- Add *Pathfinder* logic: spawn glowing cube, toggle visibility on Space key.  
- Implement cooldown (`abilityTimer`, UI meter optional).  
- Build `InputManager.js` for keyboard (WASD + Arrows).  
- Add slide: scale `mesh.y` to 0.5 on S/Down, reset after.  

### Deliverable  
- Dax runs, dodges, slides, and uses *Pathfinder* to spot shortcuts (placeholder).  

---

## MVP 4: Touch Controls & Tablet Support  
**Objective:** Extend to tablets with touch input.  
**Duration Estimate:** 2-3 days  
**Builds On:** MVP 3  

### Features  
- **Touch Input:** Tap (jump), swipe left/right (strafe), swipe down (slide).  
- **Ability Button:** On-screen touch button for *Pathfinder*.  
- **Responsive:** Adjust touch zones for screen size.  

### Tasks  
- Update `InputManager.js`: Add `touchstart/move/end` listeners.  
- Map touch: Tap center = jump, swipe sides = strafe, swipe down = slide.  
- Add HTML button for ability (CSS: bottom-right).  
- Test on tablet (or browser dev tools’ mobile emulator).  

### Deliverable  
- Dax playable on PC (keyboard) and tablets (touch)—full dual-input support.  

---

## MVP 5: Full Squad & Abilities  
**Objective:** Add Nox, Buggy, Teag with their abilities.  
**Duration Estimate:** 3-4 days  
**Builds On:** MVP 4  

### Features  
- **Characters:** Add Nox, Buggy, Teag as subclasses of `PlayerController`.  
- **Abilities:**  
  - Nox: *Beast Burst* (speed boost, breaks obstacles, 8s cooldown).  
  - Buggy: *Flip Flow* (extra jump height, 9s cooldown).  
  - Teag: *Spotter’s Edge* (slow game speed, 12s cooldown).  
- **Selection:** Basic menu to pick character (HTML buttons).  

### Tasks  
- Create `NoxController.js`, `BuggyController.js`, `TeagController.js`.  
- Implement abilities:  
  - Nox: Increase `speed`, flag obstacles as breakable.  
  - Buggy: Boost `jumpForce` mid-air.  
  - Teag: Reduce game speed (`delta *= 0.5`).  
- Add HTML menu: Four buttons to `init()` with different characters.  

### Deliverable  
- All four kids (Dax, Nox, Buggy, Teag) playable with unique abilities.  

---

## MVP 6: Level Design & Collectibles  
**Objective:** Flesh out levels and add collectibles for depth.  
**Duration Estimate:** 3-4 days  
**Builds On:** MVP 5  

### Features  
- **Level Elements:** Platforms (rooftops/barns), gaps, varied obstacles.  
- **Collectibles:** Coins + character tokens (crops, paws, ribbons, gears).  
- **Scoring:** Time-based score + collectible bonuses.  

### Tasks  
- Update `LevelManager.js`: Add platforms (`BoxGeometry`), gaps (empty zones).  
- Spawn collectibles: Coins (random), tokens (character-specific).  
- Add collision for collectibles (remove on hit, update score).  
- Implement scoring: `score = baseTime - gameTime + collectibles`.  

### Deliverable  
- Dynamic level with platforms, gaps, and collectibles—feels like a real runner.  

---

## MVP 7: Art & Sound Polish  
**Objective:** Swap placeholders for low-poly art and add sound.  
**Duration Estimate:** 4-5 days  
**Builds On:** MVP 6  

### Features  
- **Art:** Low-poly models for characters, obstacles, collectibles.  
- **Setting:** Urban-rural textures (grays/greens).  
- **Sound:** Background music (electronic-folk), SFX (jump, ability, collect).  

### Tasks  
- Replace cubes with low-poly models (e.g., Blender exports or Three.js primitives).  
- Texture floor/obstacles (basic materials: gray/rust, green/brown).  
- Add audio: Load royalty-free `.mp3` files via `THREE.AudioLoader`.  
- Play SFX on events (jump, ability, collectible).  

### Deliverable  
- *Sprint Squad* looks and sounds like the GDD vision—playable polish! 