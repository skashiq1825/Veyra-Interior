(function (V) {
  'use strict';

  /**
   * Textures for the procedural room.
   * By default every surface gets a small canvas-generated texture (0 KB download).
   * To use your own images, set paths in CONFIG.textures, e.g.  textures: { wood: 'img/wood.webp' }
   * Keys: plaster, floor, wood, stone, rug, painting, leaf.   Use small WebP/JPG (512–1024 px, seamless for tiling ones).
   */
  const SIZE = 512;
  const canvasOk = () => typeof document !== 'undefined' && typeof document.createElement === 'function';
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const make = (draw, alpha) => {
    const c = document.createElement('canvas'); c.width = c.height = SIZE;
    const g = c.getContext('2d'); draw(g, SIZE); return c;
  };

  const GEN = {
    plaster(g, s) {
      g.fillStyle = '#d8ccb9'; g.fillRect(0, 0, s, s);
      for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(' + (rnd() > .5 ? '255,250,240' : '140,120,95') + ',' + (0.03 + rnd() * 0.05) + ')'; g.beginPath(); g.arc(rnd() * s, rnd() * s, 20 + rnd() * 70, 0, 7); g.fill(); }
      for (let i = 0; i < 2500; i++) { g.fillStyle = 'rgba(90,75,55,' + rnd() * 0.07 + ')'; g.fillRect(rnd() * s, rnd() * s, 1.5, 1.5); }
    },
    floor(g, s) {
      g.fillStyle = '#d9d1c4'; g.fillRect(0, 0, s, s);
      for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(150,135,115,' + (0.05 + rnd() * 0.07) + ')'; g.lineWidth = 1 + rnd() * 2; g.beginPath(); let x = rnd() * s, y = rnd() * s; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (rnd() - .5) * 140; y += (rnd() - .5) * 140; g.lineTo(x, y); } g.stroke(); }
      g.strokeStyle = 'rgba(120,105,85,.35)'; g.lineWidth = 2; g.strokeRect(0, 0, s, s);   // tile joint
    },
    wood(g, s) {                       // 8 vertical slats per tile, each with its own tone + grain + groove
      const n = 8, w = s / n;
      for (let i = 0; i < n; i++) {
        const t = 0.9 + rnd() * 0.2; g.fillStyle = 'rgb(' + (176 * t | 0) + ',' + (132 * t | 0) + ',' + (92 * t | 0) + ')'; g.fillRect(i * w, 0, w, s);
        for (let k = 0; k < 26; k++) { g.strokeStyle = 'rgba(90,58,32,' + (0.06 + rnd() * 0.1) + ')'; g.lineWidth = 0.6 + rnd(); const x = i * w + rnd() * w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (rnd() - .5) * 8, s * .3, x + (rnd() - .5) * 8, s * .6, x + (rnd() - .5) * 6, s); g.stroke(); }
        g.fillStyle = 'rgba(40,24,12,.55)'; g.fillRect(i * w, 0, 2.5, s);
      }
    },
    stone(g, s) {                      // irregular flagstone
      g.fillStyle = '#7d6f58'; g.fillRect(0, 0, s, s);
      const rows = 5; let y = 0;
      for (let r = 0; r < rows; r++) {
        const h = s / rows; let x = -rnd() * 60;
        while (x < s) {
          const w = 70 + rnd() * 90, t = 0.8 + rnd() * 0.4;
          g.fillStyle = 'rgb(' + (190 * t | 0) + ',' + (165 * t | 0) + ',' + (120 * t | 0) + ')';
          g.beginPath(); g.roundRect ? g.roundRect(x + 3, y + 3, w - 6, h - 6, 10) : g.rect(x + 3, y + 3, w - 6, h - 6); g.fill();
          x += w;
        }
        y += h;
      }
      for (let i = 0; i < 1800; i++) { g.fillStyle = 'rgba(60,45,30,' + rnd() * 0.12 + ')'; g.fillRect(rnd() * s, rnd() * s, 2, 2); }
    },
    rug(g, s) {
      g.fillStyle = '#e4dccd'; g.fillRect(0, 0, s, s);
      g.lineCap = 'round';
      for (let i = 0; i < 9; i++) { g.strokeStyle = 'rgba(120,108,90,' + (0.35 + rnd() * 0.3) + ')'; g.lineWidth = 3 + rnd() * 5; g.beginPath(); const y = (i + .5) * s / 9; g.moveTo(-10, y); g.bezierCurveTo(s * .25, y + 70 * (rnd() - .5), s * .7, y - 90 * (rnd() - .5), s + 10, y + 40 * (rnd() - .5)); g.stroke(); }
      for (let i = 0; i < 5000; i++) { g.fillStyle = 'rgba(255,255,255,' + rnd() * 0.12 + ')'; g.fillRect(rnd() * s, rnd() * s, 1, 3); }
    },
    painting(g, s) {
      g.fillStyle = '#d9cdb6'; g.fillRect(0, 0, s, s);
      const cols = ['#8a8f6a', '#5f6b4a', '#b99a6e', '#7b5b3b', '#e8e0cf', '#3f4a38', '#c9b48a'];
      for (let i = 0; i < 28; i++) { g.globalAlpha = 0.35 + rnd() * 0.5; g.fillStyle = cols[(rnd() * cols.length) | 0]; const w = 60 + rnd() * 200, h = 40 + rnd() * 200; g.fillRect(rnd() * s - 40, rnd() * s - 40, w * .6, h); }
      g.globalAlpha = 1;
    },
    leaf(g, s) {                       // transparent canvas, green leaf blade
      g.clearRect(0, 0, s, s);
      const grd = g.createLinearGradient(0, 0, s, 0); grd.addColorStop(0, '#2f6a2a'); grd.addColorStop(.5, '#4f8f3a'); grd.addColorStop(1, '#2f6a2a');
      g.fillStyle = grd; g.beginPath(); g.moveTo(s / 2, 0); g.bezierCurveTo(s * 1.05, s * .25, s * 1.0, s * .8, s / 2, s); g.bezierCurveTo(0, s * .8, -s * .05, s * .25, s / 2, 0); g.fill();
      g.strokeStyle = 'rgba(210,235,160,.8)'; g.lineWidth = 5; g.beginPath(); g.moveTo(s / 2, 4); g.lineTo(s / 2, s - 4); g.stroke();
      g.strokeStyle = 'rgba(20,60,20,.35)'; g.lineWidth = 2; for (let y = 20; y < s; y += 22) { g.beginPath(); g.moveTo(s / 2, y); g.lineTo(s * .95, y - 40); g.moveTo(s / 2, y); g.lineTo(s * .05, y - 40); g.stroke(); }
    }
  };

  const cache = {};
  V.textures = {
    /** @returns THREE.Texture (or null when no canvas exists, e.g. in a Node test). repeat = tiles across u / v */
    get(kind, repeatU, repeatV) {
      const override = V.CONFIG && V.CONFIG.textures && V.CONFIG.textures[kind];
      let tex;
      if (override) {
        tex = new THREE.TextureLoader().load(override);
      } else {
        if (!canvasOk()) return null;
        if (!cache[kind]) cache[kind] = make(GEN[kind]);
        tex = new THREE.CanvasTexture(cache[kind]);
      }
      tex.encoding = THREE.sRGBEncoding;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatU || 1, repeatV || 1);
      return tex;
    }
  };
})((window.VEYRA = window.VEYRA || {}));