# Game Design Document  
**Title:** *Sprint Squad*  
**Version:** 1.2  
**Date:** March 11, 2025  
**Authors:** Garby and Grok

---

## Concept  
**Genre:** 3D Single-Player Platform Runner  
**Platform:** Web (Browser-based via Three.js/WebGL)  
**Target Audience:** Casual gamers, platformer fans, ages 10-30 (and proud parents!)  
**Core Idea:**  
*Sprint Squad* is a fast-paced, single-player 3D platform runner starring four unique characters—Dax, Nox, Buggy (Leighton), and Teag—inspired by the designer’s own kids. Each brings their real-life traits to the game, offering distinct abilities and playstyles to race through urban-rural levels against the clock. Built in Three.js with custom physics, it’s lightweight, accessible, and a love letter to family creativity.  

**Setting:**  
Urban outskirts fused with rural landscapes—rooftops beside barns, alleys meeting fields, all in a low-poly world.  

**Characters (Inspired by the Designer’s Kids):**  
1. **Dax** - Farmer-strategist. Quick, thoughtful, farm-obsessed.  
2. **Nox** - Athletic speedster. Fast, sporty, animal lover.  
3. **Buggy (Leighton)** - Tumbling trickster. Flexible, acrobatic, playful.  
4. **Teag** - Tiny genius. Fast, small, observant.  

**Unique Selling Points:**  
- Four kid-inspired characters with tailored abilities.  
- Urban-rural low-poly runner world.  
- Browser-based fun, no downloads needed.  

---

## Gameplay Mechanics  
**Objective:**  
Reach the level end before the timer expires. Beat target times to unlock stages or cosmetics.  

**Core Gameplay Loop:**  
- **Run:** Auto-forward through 3D levels.  
- **Navigate:** Dodge obstacles, leap gaps, use abilities to optimize runs.  
- **Collect:** Grab tokens for ability boosts or rewards.  
- **Finish:** Hit the goal, check time, retry for better scores.  

**Character Abilities:**  
1. **Dax - Pathfinder**  
   - Highlights shortcuts (glowing trails, 3-5s). Cooldown: 10s.  
   - Playstyle: Strategic, balanced.  
2. **Nox - Beast Burst**  
   - Speed boost (2s) breaks small obstacles. Cooldown: 8s (shortens with tokens).  
   - Playstyle: Speed, momentum.  
3. **Buggy - Flip Flow**  
   - Chain flips for height/distance (2s boost). Cooldown: 9s.  
   - Playstyle: Acrobatic, vertical.  
4. **Teag - Spotter’s Edge**  
   - Slows game speed (2-3s) for dodging. Cooldown: 12s.  
   - Playstyle: Nimble, precise.  

**Level Design:**  
- **Structure:** Semi-infinite runner—scrolling levels with procedural obstacles/platforms.  
- **Elements:** Platforms (rooftops, barns), obstacles (fences, crates), shortcuts.  
- **Progression:** Beat target times to unlock next level.  

**Collectibles:**  
- **Coins:** Points for cosmetics.  
- **Tokens:** Crops (Dax), paws (Nox), ribbons (Buggy), gears (Teag)—reduce cooldowns.  

**Scoring:**  
- Time-based + bonuses for collectibles/ability use.  

---

## Controls  
**Platform:** Web (Browser-based)  
**Target Devices:** PC (Keyboard) + Tablets (Touch)  

### PC Controls (Keyboard)  
- **Up Arrow / W:** Jump  
- **Left Arrow / A:** Strafe left  
- **Right Arrow / D:** Strafe right  
- **Down Arrow / S:** Slide  
- **Space:** Activate ability (when off cooldown)  
- **Auto-Run:** Constant forward movement  

### Tablet Controls (Touch)  
- **Tap (Center Screen):** Jump  
- **Swipe Left (Left Half):** Strafe left  
- **Swipe Right (Right Half):** Strafe right  
- **Swipe Down (Anywhere):** Slide  
- **Tap (Ability Button):** Activate ability (UI button, bottom-right)  
- **Auto-Run:** Constant forward movement  

**Notes:**  
- Dual-input support for accessibility across devices.  
- Touch zones: center for jump, sides for strafing, swipe down for slide.  
- Ability button on-screen for tablets (optional overlay for PC).  

---

## Technical Requirements  
**Engine:** Three.js (WebGL)  
**Physics:** Custom lightweight system:  
- **Gravity:** `velocity.y -= 0.5 * deltaTime`  
- **Collision:** AABB checks (player vs. obstacles/collectibles)  
- **No External Frameworks:** Pure Three.js for V1  

**Minimum Specs:**  
- **Browser:** Chrome, Firefox, Edge (latest)  
- **OS:** Any with WebGL support  
- **Hardware:** Basic GPU, 4GB RAM, dual-core CPU  
- **Internet:** Stable for load, then local  

**Core Systems:**  
- **Rendering:** Low-poly models, basic shaders  
- **Physics:** Custom gravity/collisions  
- **Level Gen:** Procedural asset placement, infinite scroll  
- **Input Handling:** Keyboard (WASD + Arrows) + Touch (taps/swipes)  
- **UI:** HTML/CSS overlay (timer, score, ability meter/button)  

**File Size Goal:** <10MB  

---

## Art and Sound  
**Art Style:**  
- **Visuals:** Low-poly, vibrant colors  
- **Setting:** Urban-rural—grays/rust vs. greens/browns  
- **Characters:**  
  - **Dax:** Overalls, cowboy hat, boots  
  - **Nox:** Jersey, shorts, wild hair  
  - **Buggy:** Leggings, tank, ponytail  
  - **Teag:** Sun glasses, backpack, messy blonde hair 
- **Assets:** Barns, rooftops, hay bales, crates, coins, tokens  

**Sound Design:**  
- **Music:** Electronic-folk (banjo + synth)  
- **SFX:** Jump (thud), ability (unique per character), collect (ding), hit (creak)  

---
##Implementation Plan
[Implementation Plan](./ImplementationPlan/IMPLEMENTATION.md)