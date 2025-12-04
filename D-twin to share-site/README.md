# WebXR AR Model Placement — Quick Start

This folder contains a minimal, shareable site demonstrating WebXR AR placement of a 3D model (GLB) with a shadow catcher.

## Contents
- `android-digital-twin.html` — the main page with AR + desktop fallback
- `sample.glb` — example 3D model (replace with your own)
- `lib/` — Three.js ES modules used by the page
  - `three.module.js`
  - `examples/jsm/loaders/GLTFLoader.js`
  - `examples/jsm/controls/OrbitControls.js`
  - `examples/jsm/environments/RoomEnvironment.js`

## Run Locally
WebXR camera access requires HTTPS or `http://localhost`. Use a local server and open the HTML page from this folder.

PowerShell examples:

```powershell
# Option 1: Node.js (requires Node installed)
Set-Location "C:\Users\jordan77\Documents\GitHub\Class repo\Game-551-fall-2025-MJ\D-twin to share-site"
npx serve . -p 8080

# Option 2: Python
Set-Location "C:\Users\jordan77\Documents\GitHub\Class repo\Game-551-fall-2025-MJ\D-twin to share-site"
python -m http.server 8080
```

Open the site in a supported mobile browser (Chrome or Samsung Internet) and grant camera permission when prompted.

## Replace the Model
- Swap `sample.glb` with your own GLB model.
- Keep the filename or update the loader path inside `android-digital-twin.html`:
  ```js
  new GLTFLoader().load('./sample.glb', ...)
  ```
- The code scales the longest model side to `TARGET_SIZE_M` meters (default `0.4`). Adjust as needed.

## How It Works (Overview)
- Desktop fallback viewer (OrbitControls) runs if AR isn’t available.
- In AR, the app requests an `immersive-ar` session with `hit-test`:
  - Performs plane detection and shows a reticle where the model can be placed.
  - Places a cloned version of the model aligned to the detected surface.
  - Adds a transparent shadow-catcher plane so the model casts realistic shadows.
- Optional anchors improve placement stability when supported.

## Customize Visuals & Behavior
- `TARGET_SIZE_M`: final model size in meters after uniform scaling.
- `AR_MATERIAL`: set to `basic` (fast, unlit) or `lambert` (lit, slower) in `android-digital-twin.html`.
- Light intensities in `enterAR()` can be tuned per device.

## Common Pitfalls
- Not using HTTPS or `localhost` → camera blocked → AR fails.
- Wrong file paths or missing `lib/` modules → script errors or blank page.
- In-app browsers (Instagram, TikTok, Facebook) often break WebXR.

## Files to Share
Share only this folder; it contains all required assets. Recipients just need to run a local server and open `android-digital-twin.html`.
