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
*Sprint Squad* is a fast-paced, single-player 3D platform runner game where I was learning how to create a game from scratch. 

**Setting:**  
Middle of freaking nowhere.

**Characters (Inspired by the Designer’s Kids):**  
1. **Dax**
2. **Nox**
3. **Buggy**
4. **Teag**
---

## Controls  
**Platform:** Web (Browser-based)  
**Target Devices:** PC (Keyboard) + Tablets (Touch)  

### PC Controls (Keyboard)  
- **Left Arrow / A:** Strafe left  
- **Right Arrow / D:** Strafe right   
- **Auto-Run:** Constant forward movement  

### Tablet Controls (Touch)  
- **Tap (Center Screen):** Jump  
- **Swipe Left (Left Half):** Strafe left  
- **Swipe Right (Right Half):** Strafe right  
- **Swipe Down (Anywhere):** Slide  
- **Auto-Run:** Constant forward movement  

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
[Implementation Plan](./IMPLEMENTATION.md)