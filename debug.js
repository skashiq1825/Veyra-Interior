(function (V) {
  'use strict';

  /**
   * DEBUGGING THE MODEL  (open the browser console)
   *   VEYRA.debug.dump()      – scene hierarchy + a table of every mesh with its world bounding box
   *   VEYRA.debug.find('sofa')– list nodes / materials whose name contains "sofa"
   *   VEYRA.debug.camera()    – prints the current camera as a config.js "view" you can paste
   * Add  ?debug  to the URL for a live tuning panel.
   */
  const D = (V.debug = { ctx: null });

  D.dump = function dump(maxDepth) {
    const { root } = D.ctx, max = maxDepth == null ? 4 : maxDepth, rows = [], box = new THREE.Box3();
    const walk = (o, d) => {
      if (d <= max) console.log('  '.repeat(d) + (o.name || '(unnamed)') + (o.isMesh ? '  [mesh]' : '') + (o.children.length ? '  ×' + o.children.length : ''));
      if (o.isMesh) {
        U_box(o, box);
        const mats = (Array.isArray(o.material) ? o.material : [o.material]).map((m) => m.name).join(', ');
        rows.push({ node: o.name, material: mats, visible: o.visible,
          min: box.min.toArray().map((n) => +n.toFixed(2)).join(' '), max: box.max.toArray().map((n) => +n.toFixed(2)).join(' ') });
      }
      o.children.forEach((c) => walk(c, d + 1));
    };
    console.groupCollapsed('VEYRA hierarchy'); walk(root, 0); console.groupEnd();
    console.table(rows);
    return rows.length + ' meshes';
  };
  function U_box(o, box) { o.updateWorldMatrix(true, false); V.utils.meshBox(o, box); }

  D.find = function find(text) {
    const t = String(text).toLowerCase(), out = [];
    D.ctx.root.traverse((o) => {
      const mats = o.isMesh ? (Array.isArray(o.material) ? o.material : [o.material]).map((m) => m.name) : [];
      if ((o.name || '').toLowerCase().includes(t) || mats.some((n) => (n || '').toLowerCase().includes(t)))
        out.push({ node: o.name, mesh: !!o.isMesh, materials: mats.join(', ') });
    });
    console.table(out); return out.length + ' matches';
  };

  D.camera = function camera() {
    const { camera, controls } = D.ctx, r = (v) => v.toArray().map((n) => +n.toFixed(2));
    const s = '{ position: [' + r(camera.position) + '], target: [' + r(controls.target) + '], fov: ' + Math.round(camera.fov) + ' }';
    console.log(s); return s;
  };

  D.panel = function panel() {
    const { lighting, curtains, renderer, config } = D.ctx;
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:12px;top:70px;z-index:99;width:230px;padding:12px;font:12px/1.3 system-ui;color:#f9f4ee;background:rgba(30,26,22,.82);border-radius:10px;backdrop-filter:blur(8px)';
    const rows = [
      ['exposure', 0.4, 2, 0.01, () => renderer.toneMappingExposure, (v) => { config.lighting.exposure.day = v; lighting.apply(); }],
      ['sun', 0, 8, 0.05, () => config.lighting.sun.intensity, (v) => { config.lighting.sun.intensity = v; lighting.apply(); }],
      ['sky', 0, 2, 0.05, () => config.lighting.sky.intensity, (v) => { config.lighting.sky.intensity = v; lighting.apply(); }],
      ['ambient (env)', 0, 2, 0.02, () => config.lighting.env.day, (v) => { config.lighting.env.day = v; lighting.apply(); }],
      ['artificial ×', 0, 4, 0.05, () => lighting.state.artMul, (v) => { lighting.state.artMul = v; lighting.apply(); }],
      ['curtain amp (m)', 0, 0.15, 0.005, () => config.curtain.amplitude, (v) => curtains.setAmplitude(v)],
      ['curtain speed', 0, 3, 0.05, () => config.curtain.speed, (v) => curtains.setSpeed(v)]
    ];
    el.innerHTML = '<b>VEYRA debug</b>';
    rows.forEach(([label, min, max, step, get, set]) => {
      const row = document.createElement('label'); row.style.cssText = 'display:block;margin-top:8px';
      const val = document.createElement('span'); val.style.float = 'right';
      const input = Object.assign(document.createElement('input'), { type: 'range', min, max, step, value: get() });
      input.style.cssText = 'width:100%'; val.textContent = (+get()).toFixed(2);
      input.oninput = () => { set(+input.value); val.textContent = (+input.value).toFixed(2); };
      row.append(label, val, input); el.append(row);
    });
    const btn = (t, fn) => { const b = document.createElement('button'); b.textContent = t; b.onclick = fn; b.style.cssText = 'margin:8px 6px 0 0;padding:4px 8px'; el.append(b); };
    btn('dump scene', () => D.dump()); btn('camera → console', () => D.camera());
    document.body.append(el);
  };
})((window.VEYRA = window.VEYRA || {}));