/**
 * VEYRA INTERIOR — hero configuration
 * ---------------------------------------------------------------------------
 * Everything you are likely to tweak lives here. Units are METRES, Y is up
 * (measured from HEROSEC-MODEL.glb: room interior ≈ x 0.23–5.85, z 0.23–5.95,
 * ceiling 2.84 m, window wall at z ≈ 6.0, courtyard behind it).
 */
(function (V) {
  'use strict';

  V.CONFIG = {
    /** 'procedural' = room built from code (room.js) + your furniture GLBs.   'glb' = the full SketchUp export below. */
    source: 'procedural',

    /**
     * Your optimised furniture files (put them next to index.html). Leave url empty to keep the grey placeholder blocks.
     * rotationY (radians) turns the model if it faces the wrong way; fill < 1 makes it a bit smaller than the placeholder.
     */
    furniture: {
      sofa:     { url: '', placeholder: 'placeholder-sofa',     rotationY: 0 },
      armchair: { url: '', placeholder: 'placeholder-armchair', rotationY: 0 },
      table:    { url: '', placeholder: 'placeholder-table',    rotationY: 0 }
    },

    /** Optional image textures (small WebP/JPG). Empty = generated in code. Keys: plaster, floor, wood, stone, rug, painting, leaf */
    textures: {},

    model: {
      url: 'models/veyra-room.glb',     // optimised copy of your GLB (see README)
      embeddedId: 'veyra-glb-b64',      // only used by the single-file preview build
      approxBytes: 8.8e6                // used for the progress bar when the server sends no length
    },

    room: {
      // The SketchUp export contains the front wall (z ≈ 0–0.23). The reference render
      // was taken from OUTSIDE it (camera at z ≈ -2.85), so that wall is hidden at runtime.
      frontWallMaxZ: 0.245,
      // Inside views are kept in this box so visitors can never orbit through a wall.
      bounds: { min: [0.42, 0.30, 0.42], max: [5.60, 2.60, 5.70] }
    },

    /**
     * Camera views. `position` / `target` were derived from the model:
     *  - wide : fitted to your reference render (SketchUp "Scene 1" camera, 40° vertical FOV)
     *  - sofa : looks at the L-shaped sofa  (bbox centre ≈ 4.67, 0.40, 3.80)
     *  - close: looks at the coffee table, lamp and cushions (≈ 3.8, 0.40, 3.4)
     * `orbit` = how far the visitor may rotate away from the composition (radians).
     */
    views: {
      wide: {
        label: 'Wide view', caption: 'The complete living room',
        position: [2.95, 1.43, -2.85], target: [3.17, 1.30, 5.15], fov: 40,
        cutaway: true,
        orbit: { azimuth: 0.30, polar: 0.07 }
      },
      sofa: {
        label: 'Sofa view', caption: 'Sculpted seating, wrapped in linen tones',
        position: [2.30, 1.08, 1.50], target: [4.55, 0.50, 3.85], fov: 44,
        bounds: true,
        orbit: { azimuth: 0.45, polar: 0.20 }
      },
      close: {
        label: 'Close view', caption: 'Marble, glass and warm light — up close',
        position: [2.85, 0.92, 2.40], target: [3.78, 0.40, 3.55], fov: 36,
        bounds: true,
        orbit: { azimuth: 0.40, polar: 0.18 }
      }
    },

    intro: { position: [3.95, 2.15, -5.3], target: [3.17, 1.20, 5.15], fov: 47, duration: 3.6 },
    transitionSeconds: 2.2,

    /**
     * Lighting. Three.js runs with physicallyCorrectLights, so SpotLight / PointLight
     * values are candela, Directional / Hemisphere are lux-like. If the room is too
     * dark/bright, change `exposure` first, then the intensities. Use  ?debug  in the URL
     * for live sliders.
     */
    lighting: {
      exposure: { day: 0.95, night: 1.2 },
      background: { day: '#d8cdbf', night: '#14100d' },
      env: { day: 0.55, night: 0.07 },                 // image-based ambient light
      sun: {
        color: 0xfff0d6, intensity: 3.3,
        direction: [-0.15, 0.54, 0.83],                // from the room towards the sun (window is on +Z)
        target: [3.0, 0.3, 3.3], distance: 16, shadowBounds: 4.8
      },
      sky: { sky: 0xdfe8f5, ground: 0xcbb596, intensity: 0.35 },

      artificial: {
        color: 0xffc88c,
        // Ceiling downlights: positions are read from the model's "Spotlight*" meshes.
        spot:  { intensity: 14, angle: 0.9, penumbra: 0.65, drop: 0.03 },
        // Perimeter LED cove (glowing "Emissive WALL" strip at y ≈ 2.92)
        cove:  { intensity: 0.8, distance: 6, inset: 0.28, below: 0.2 },
        tableLamp:  { intensity: 0.35, distance: 3 },
        bubbleLamp: { intensity: 1.0,  distance: 4 },
        // Wall sconce above the painting ("IES Light" placeholder at 5.85, 2.45, 3.26)
        sconce: { position: [5.62, 2.5, 3.26], aim: [5.62, 1.1, 3.26], intensity: 7, angle: 0.55, penumbra: 0.9 },
        // Self-illumination of the glowing meshes (material name -> emissive strength)
        emissive: { cove: 1.6, spot: 2.4, tableLamp: 1.5, bubbleLamp: 1.9 }
      }
    },

    curtain: {
      amplitude: 0.045,   // metres the hem may sway
      speed: 1.0,         // 1 = default pace
      rows: 18            // vertical subdivisions added to each curtain panel
    },

    quality: {
      desktop: { maxPixelRatio: 2.0, shadowMap: 2048, maxSpots: 12, coves: 3, curtainRows: 18 },
      mobile:  { maxPixelRatio: 1.5, shadowMap: 1024, maxSpots: 4,  coves: 2, curtainRows: 10 }
    }
  };
})(window.VEYRA = window.VEYRA || {});