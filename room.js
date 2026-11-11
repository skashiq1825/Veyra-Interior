(function (V) {
  'use strict';
  // ==========================================
  // LOUNGE CHAIR  (S-curve ribbon, puffy faces)
  // ==========================================

  // Centre-line of the ribbon, side view: [x = front->back, y = height]
  const CHAIR_PATH = [
    [0.14, 0.10],   // front foot (end)
    [0.14, 0.22],
    [0.18, 0.32],
    [0.30, 0.36],   // front curl (highest point of the front)
    [0.50, 0.32],   // seat starts going down
    [0.70, 0.26],
    [0.88, 0.22],   // lowest point of the seat
    [1.00, 0.30],   // backrest starts rising
    [1.08, 0.48],
    [1.17, 0.66],   // slanted backrest
    [1.26, 0.77],
    [1.37, 0.81],   // top of the backrest
    [1.48, 0.77],
    [1.534, 0.684], // top curl going down
    [1.54, 0.60],
    [1.54, 0.36],   // back slab
    [1.54, 0.10]    // back foot (end)
  ];

  const CHAIR = {
    width:     0.95,   // chair width (extrusion)
    thickness: 0.09,   // ribbon thickness (final ≈ thickness + 2*bevel)
    bevel:     0.03,   // soft edge size
    bulge:     0.03,   // puff amount (0 = flat)
    round:     0.6     // lower = fuller bubble
  };

  // ---------- helper 1: puffs the ribbon faces outward ----------
  function chairPuff(geometry, shape, depth, bulge, round, bevel) {
    if (bulge <= 0) return;

    const pts = shape.getPoints(1);
    if (pts.length > 1 && pts[0].distanceTo(pts[pts.length - 1]) < 1e-6) pts.pop();

    const n = pts.length;
    let area = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      area += a.x * b.y - b.x * a.y;
    }
    const sign = area > 0 ? 1 : -1;

    const segs = [];
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      const dx = b.x - a.x, dy = b.y - a.y;
      const l = Math.hypot(dx, dy) || 1e-9;
      segs.push({ ax: a.x, ay: a.y, dx, dy, l2: l * l, nx: sign * dy / l, ny: -sign * dx / l });
    }

    const pos = geometry.attributes.position;
    const total = depth + 2 * bevel;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);

      let best = null, bd = Infinity;
      for (const s of segs) {
        const t = Math.max(0, Math.min(1, ((x - s.ax) * s.dx + (y - s.ay) * s.dy) / s.l2));
        const ex = x - (s.ax + t * s.dx), ey = y - (s.ay + t * s.dy);
        const d = ex * ex + ey * ey;
        if (d < bd) { bd = d; best = s; }
      }

      const u = Math.max(0, Math.min(1, (z + bevel) / total));
      const w = Math.pow(Math.max(0, Math.sin(Math.PI * u)), round) * bulge;

      pos.setXY(i, x + best.nx * w, y + best.ny * w);
    }
    pos.needsUpdate = true;
  }

  // ---------- helper 2: smooth normals (removes uv) ----------
  function chairWeld(geo) {
    geo.deleteAttribute('normal');
    geo.deleteAttribute('uv');

    const p = geo.attributes.position;
    const map = new Map(), out = [], idx = [];

    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const k = Math.round(x * 1e4) + '_' + Math.round(y * 1e4) + '_' + Math.round(z * 1e4);
      let j = map.get(k);
      if (j === undefined) { j = out.length / 3; map.set(k, j); out.push(x, y, z); }
      idx.push(j);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
    geo.setIndex(idx);
  }

  // ---------- main: builds the chair ----------
  function createLoungeChair(options = {}) {

    const {
      name      = 'lounge-chair',
      material  = new THREE.MeshStandardMaterial({ color: 0x8a9b68, roughness: 0.92 }), // placeholder
      x = 0, y = 0, z = 0,
      rotationY = 0,
      scale     = 1,
      parent    = null          // e.g. pass `sofa` or `scene` to auto-add
    } = options;

    const T = CHAIR.thickness, BS = CHAIR.bevel, h = T / 2;

    // 1) centre-line -> smooth curve
    const curve = new THREE.CatmullRomCurve3(
      CHAIR_PATH.map(p => new THREE.Vector3(p[0], p[1], 0)),
      false, 'centripetal'
    );
    const c = curve.getPoints(220);
    const n = c.length;

    // 2) offset both sides to give the ribbon thickness
    const left = [], right = [];
    for (let i = 0; i < n; i++) {
      const a = c[Math.max(i - 1, 0)], b = c[Math.min(i + 1, n - 1)];
      const tx = b.x - a.x, ty = b.y - a.y;
      const l = Math.hypot(tx, ty) || 1e-9;
      const nx = -ty / l, ny = tx / l;
      left.push(new THREE.Vector2(c[i].x + nx * h, c[i].y + ny * h));
      right.push(new THREE.Vector2(c[i].x - nx * h, c[i].y - ny * h));
    }

    // 3) closed outline with rounded end caps (the two feet)
    const K = 12;
    const outline = [...left];

    const e0 = c[n - 2], e1 = c[n - 1];
    const th1 = Math.atan2(e1.y - e0.y, e1.x - e0.x);
    for (let k = 1; k < K; k++) {
      const a = th1 + Math.PI / 2 - Math.PI * k / K;
      outline.push(new THREE.Vector2(e1.x + Math.cos(a) * h, e1.y + Math.sin(a) * h));
    }

    for (let i = n - 1; i >= 0; i--) outline.push(right[i]);

    const s0 = c[0], s1 = c[1];
    const th0 = Math.atan2(s1.y - s0.y, s1.x - s0.x);
    for (let k = 1; k < K; k++) {
      const a = th0 - Math.PI / 2 - Math.PI * k / K;
      outline.push(new THREE.Vector2(s0.x + Math.cos(a) * h, s0.y + Math.sin(a) * h));
    }

    const shape = new THREE.Shape(outline);

    // 4) extrude across the chair width
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: CHAIR.width,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 16,
      bevelSize: BS,
      bevelThickness: BS
    });

    // 5) puffy faces + smooth shading
    chairPuff(geometry, shape, CHAIR.width, CHAIR.bulge, CHAIR.round, BS);
    chairWeld(geometry);

    // 6) centre on origin, feet on the floor
    geometry.computeBoundingBox();
    const bb = geometry.boundingBox;
    geometry.translate(
      -(bb.min.x + bb.max.x) / 2,
      -bb.min.y,
      -(bb.min.z + bb.max.z) / 2
    );
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;
    mesh.scale.setScalar(scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    if (parent) parent.add(mesh);
    return mesh;
  }

  // ==========================================
  // BUILD ROOM
  // ==========================================
  V.buildRoom = function buildRoom() {

    const T = V.textures;
    const root = new THREE.Group(); root.name = 'veyra-room';

    // ---- key dimensions (m) ----
    const H = 2.84, TOP = 3.05;           // ceiling underside (dropped panel) / top of walls
    const REC = 2.94;                     // underside of the higher, recessed ceiling (tray ceiling)
    const WIN_X0 = 0.38, WIN_X1 = 3.31;   // window opening along x (wall at z 5.95–6.21)

    // ---- materials ----
    const mats = {};
    const mat = (name, o) => (mats[name] = new THREE.MeshStandardMaterial(Object.assign({ name, roughness: 0.9, metalness: 0 }, o)));
    const plaster = (rx, ry) => T.get('plaster', rx, ry);
    mats.plaster = mat('wall lime', { map: plaster(3, 1.3) });
    mat('wood', { map: T.get('wood', 1, 1) });
    mat('Beauford Flagstone Natural Stone Flooring', { map: T.get('stone', 5, 3) });
    mat('painting', { map: T.get('painting', 1, 1), roughness: 0.8 });
    mat('Glass_Basic_1', { color: 0xfffafa, transparent: true, opacity: 0.25, roughness: 0, side: THREE.DoubleSide });
    mat('[Color_009]', { color: 0x151515, roughness: 0.5, metalness: 0.4 });
    mat('curtain', { color: 0xf3ece0, transparent: true, opacity: 0.62, side: THREE.DoubleSide });
    mat('sofa', { color: "#a89978", roughness: 0.95 });
    mat('armchair', { color: "#abcc52", roughness: 0.95 });
    mat('JianE_Mtl_2021914957202752_1__Marble', { color: 0xf1ece4, roughness: 0.18 });
    mat('table base', { color: 0xc9a77a, roughness: 0.6 });
    mat('centre table lamp', { color: 0xffefc2 });
    mat('SDT-2800 K', { color: 0xffb25b });
    mat('Steel_ Copper_ Metal_ Aluminium', { color: 0x222222, roughness: 0.4, metalness: 0.8 });
    mat('spotlight', { color: 0xffd6a5 });
    mat('Emissive WALL', { color: 0xffc98a });
    mat('Licuala_Grandis_Leaf2', { map: T.get('leaf', 1, 1), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 });
    mat('trunk', { color: 0x6c5a3c, roughness: 0.9 });
    mat('[Color_F13]', { color: 0x77994f });

    const loadTex = (file, rx, ry) => {
      const t = new THREE.TextureLoader().load('./MODELSWEBSITE/' + file);
      t.encoding = THREE.sRGBEncoding;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(rx, ry);
      return t;
    };

    mat('left wall', { map: loadTex('wall_lime.jpg', 2, 2), roughness: 0.9 });

    // right wall + brown arch panel (wood)
    mat('adjacent wall', { map: loadTex('wood.jpg', 2, 2), bumpMap: loadTex('wood.jpg', 2, 2), bumpScale: 0, roughness: 0.9 });

    // ceiling
    mat('ceiling wall', { map: loadTex('wall_lime.jpg', 2, 2), roughness: 0.9 });

    // courtyard stone wall (also used for the brown fins on the right wall)
    mat('court wall', { map: loadTex('Beauford_Flagstone_Natural_Stone_Flooring.jpg', 0.5, 0.5), roughness: 0.9 });

    // floor  (name must contain "Dunstone" so material.js makes it glossy)
    mat('Dunstone floor', { map: loadTex('Dunstone___Contract__limestone_stone_effect_ceramic___Ceramiche_Keope.jpg', 2, 2) });
    mat('ground floor', { map: loadTex('_56_ground_texture-seamless.jpg', 1, 1), roughness: 0.9 });

    // rug  (centre must be set, otherwise the rotation drags the image sideways)
    {
      const rugTex = loadTex('rug.png', 1, 1);
      rugTex.center.set(0.5, 0.5);
      rugTex.rotation = Math.PI / -2;
      mat('rug', { map: rugTex, roughness: 1 });
    }

    // ---- helpers ----
    const add = (mesh, name, parent) => { mesh.name = name; (parent || root).add(mesh); return mesh; };
    const slab = (x0, x1, y0, y1, z0, z1, m, name, parent) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m);
      mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      return add(mesh, name, parent);
    };
    const withRepeat = (m, rx, ry) => { const c = m.clone(); if (m.map) { c.map = m.map.clone(); c.map.needsUpdate = true; c.map.repeat.set(rx, ry); } c.name = m.name; return c; };

    // ================= FLOOR, CEILING, OUTER WALLS =================
    slab(0, 8.5, -0.1, 0, 0, 6.0, mats['Dunstone floor'], 'floor');
    slab(0.23, 5.85, -0.1, 0, 6.0, 9.18, withRepeat(mats['Dunstone floor'], 5, 3), 'courtyard-floor');

    // ================= COURTYARD CENTER PLANTER PANEL =================
    slab(
      0.65, 3.35,       // X position (left to right)
      0.00, 0.01,       // Y position (panel height)
      7.05, 7.95,       // Z position (front to back)
      mats['ground floor'],
      'courtyard-center-planter-panel'
    );

    // tray ceiling: higher outer slab + thin dropped panel in the middle, LED strip hides in the gap
    slab(0, 6.11, REC, TOP, 0, 6.21, mats['ceiling wall'], 'ceiling');
    slab(0.38, 5.73, H, 2.90, 0.38, 5.77, mats['ceiling wall'], 'ceiling-drop');
    slab(WIN_X0, WIN_X1, H, REC, 5.95, 6.21, mats['ceiling wall'], 'window-lintel');   // closes the strip above the glass

    slab(0, 0.23, 0, TOP, 0, 9.18, mats['left wall'], 'wall-left');
    slab(5.85, 6.11, 0, TOP, 6.0, 9.18, withRepeat(mats.plaster, 2, 1.4), 'courtyard-wall-right');
    slab(0.23, 5.85, 0, TOP, 8.95, 9.18, withRepeat(mats['court wall'], 6, 3), 'courtyard-stone-wall');
    // a plain warm wall behind the arch so the orbit never shows a void
    slab(8.5, 8.6, 0, TOP, 0, 3.2, withRepeat(mats.plaster, 3, 1.4), 'adjacent-room-wall');

    // ================= RIGHT WALL: base wall with an arch opening =================
    {
      const s = new THREE.Shape();
      s.moveTo(0, 0); s.lineTo(6.0, 0); s.lineTo(6.0, TOP); s.lineTo(0, TOP); s.lineTo(0, 0);
      const arch = new THREE.Path();
      arch.moveTo(0.45, 0); arch.lineTo(0.45, 1.75); arch.absarc(1.0, 1.75, 0.55, Math.PI, 0, true); arch.lineTo(1.55, 0); arch.lineTo(0.45, 0);
      s.holes.push(arch);
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.26, bevelEnabled: false, curveSegments: 24 });
      g.rotateY(-Math.PI / 2); g.translate(6.11, 0, 0);          // shape x -> world z, extrusion -> -x
      add(new THREE.Mesh(g, withRepeat(mats['adjacent wall'], 1, 1)), 'wall-right-arch');
    }

    // ================= BROWN RAISED ARCH PANEL (frame around the arch) =================
    {
      const outer = new THREE.Shape();
      outer.moveTo(0, 0); outer.lineTo(0, TOP); outer.lineTo(2.25, TOP); outer.lineTo(2.25, 0); outer.closePath();
      const inner = new THREE.Path();
      inner.moveTo(1.55, 0); inner.lineTo(1.55, 1.75); inner.absarc(1.0, 1.75, 0.55, 0, Math.PI, false); inner.lineTo(0.45, 0); inner.closePath();
      outer.holes.push(inner);
      const g = new THREE.ExtrudeGeometry(outer, { depth: 0.08, bevelEnabled: false, curveSegments: 48 });
      g.rotateY(-Math.PI / 2); g.translate(5.85, 0, 0);
      const m = mats['adjacent wall'].clone(); m.side = THREE.DoubleSide;
      add(new THREE.Mesh(g, m), 'brown-raised-arch-panel');
    }

    // ================= RIGHT WALL PANELLING =================
    // RULE: the room side of the right wall ends at z = 5.95 (window wall). Keep  z + width  <= 5.95.

    // beige stone/plaster panels
    const wallPanels = [
      { z: 2.1,  width: 1.35 },
      { z: 4.15, width: 0.4 }
    ];
    wallPanels.forEach((p, i) => {
      slab(5.845, 5.85, 0, TOP, p.z, p.z + p.width, mats['left wall'], 'wall-accent-panel-' + i);
    });

    // brown fins (each is  { z: start, width })
    const brownPanels = [
      { z: 3.45,  width: 0.70 },
      { z: 4.47,  width: 0.065 },
      { z: 4.555, width: 0.065 },
      { z: 4.64,  width: 0.13 },
      { z: 4.81,  width: 0.066 },
      { z: 4.896, width: 0.066 },
      { z: 4.982, width: 0.066 },
      { z: 5.068, width: 0.15 },
      { z: 5.238, width: 0.066 },
      { z: 5.324, width: 0.066 },
      { z: 5.41,  width: 0.066 },
      { z: 5.496, width: 0.066 },
      { z: 5.582, width: 0.13 },
      { z: 5.732, width: 0.066 },
      { z: 5.818, width: 0.066 },
      { z: 5.904, width: 0.046 }       // ends exactly at 5.95
    ];
    brownPanels.forEach((p, i) => {
      slab(5.805, 5.85, 0, 2.95, p.z, p.z + p.width, mats['adjacent wall'], 'brown-wall-panel-' + i);
    });

    // ================= WINDOW WALL (z 5.95–6.21) =================
    slab(WIN_X1, 6.11, 0, TOP, 5.95, 6.21, withRepeat(mats['adjacent wall'], (6.11 - WIN_X1) / 0.8, 1 / TOP), 'window-wall-wood');

    // ================= WINDOW WALL — BROWN VERTICAL PANELS =================
    const windowBrownPanels = [
      { x: 3.31, width: 0.7 },
      { x: 4.41, width: 0.44 },
      { x: 4.89, width: 0.06 },
      { x: 4.99, width: 0.06 },
      { x: 5.09, width: 0.06 },
      { x: 5.19, width: 0.92 }
    ];
    windowBrownPanels.forEach((p, i) => {
      slab(p.x, p.x + p.width, 0, 2.95, 5.90, 5.95, mats['adjacent wall'], 'window-brown-panel-' + i);
    });

    const windowBeigePanels = [
      { x: 4.01, width: 0.4 }
    ];
    windowBeigePanels.forEach((p, i) => {
      slab(p.x, p.x + p.width, 0, TOP, 5.945, 5.95, mats['left wall'], 'window-beige-panel-' + i);
    });

    slab(0, WIN_X0, 0, TOP, 5.95, 6.21, withRepeat(mats.plaster, 0.5, 1.4), 'window-wall-left');
    const frame = mats['[Color_009]'];
    [WIN_X0, 1.37, 2.33, WIN_X1].forEach((x, i) => slab(x - 0.025, x + 0.025, 0, H, 6.02, 6.1, frame, 'sliding door_' + i));
    slab(WIN_X0, WIN_X1, H - 0.05, H, 6.02, 6.1, frame, 'sliding door_top');
    slab(WIN_X0, WIN_X1, 0, 0.05, 6.02, 6.1, frame, 'sliding door_bottom');
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN_X1 - WIN_X0, H), mats['Glass_Basic_1']);
    glass.position.set((WIN_X0 + WIN_X1) / 2, H / 2, 6.06); add(glass, 'window glass');

    // ================= LED COVE (disabled) =================
    // {
    //   const cove = mats['Emissive WALL'], cy0 = REC - 0.025, cy1 = REC - 0.005;
    //   slab(0.26, 0.34, cy0, cy1, 0.26, 5.86, cove, 'cove-left');
    //   slab(5.77, 5.82, cy0, cy1, 0.26, 5.86, cove, 'cove-right');
    //   slab(0.26, 5.82, cy0, cy1, 5.79, 5.86, cove, 'cove-back');
    //   slab(0.26, 5.82, cy0, cy1, 0.26, 0.34, cove, 'cove-front');
    // }

    // ================= CEILING DOWNLIGHTS =================
    [[0.74, 0.8], [0.74, 3.08], [0.74, 5.37], [5.37, 0.8], [5.37, 3.08], [5.37, 5.37], [3.05, 1.92], [3.05, 4.21]].forEach(([x, z], i) => {
      const gr = new THREE.Group(); gr.name = 'Spotlight_' + i; root.add(gr);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16), mats.spotlight);
      m.position.set(x, H - 0.01, z); add(m, 'fixture', gr);
    });

    // ================= PAINTING on the right wall =================
    slab(5.8, 5.85, 0.78, 2.12, 2.365, 3.265, frame, 'painting-frame');
    const art = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.28), mats.painting);
    art.rotation.y = -Math.PI / 2;
    art.position.set(5.795, 1.45, 2.815);
    add(art, 'painting');

    // ================= RUG =================
    slab(1.96, 5.15, 0, 0.01, 1.72, 5.72, mats.rug, 'rug');

    // ================= CURTAIN =================
    {
      const x0 = 0.23, x1 = 1.63, pleats = 26, amp = 0.045, z = 5.86, yTop = H;
      const P = [];
      for (let i = 0; i <= pleats * 2; i++) P.push([x0 + (x1 - x0) * i / (pleats * 2), z + (i % 2 ? amp : -amp)]);
      const pos = [], uv = [];
      for (let i = 0; i < P.length - 1; i++) {
        const [ax, az] = P[i], [bx, bz] = P[i + 1], u0 = i / (P.length - 1), u1 = (i + 1) / (P.length - 1);
        pos.push(ax, 0, az, bx, 0, bz, bx, yTop, bz, ax, 0, az, bx, yTop, bz, ax, yTop, az);
        uv.push(u0, 0, u1, 0, u1, 1, u0, 0, u1, 1, u0, 1);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals();
      add(new THREE.Mesh(g, mats.curtain), 'cortina');                 // node name + material "curtain" = what curtains.js looks for
      slab(x0, x1, yTop - 0.05, yTop, z - 0.06, z + 0.06, frame, 'rail-top');
    }

    // ================= BUBBLE FLOOR LAMP =================
    {
      const gr = new THREE.Group(); gr.name = 'bubble-lamp'; root.add(gr);
      [0.15, 0.41, 0.67, 0.93, 1.19].forEach((y, i) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.13, 28, 20), mats['SDT-2800 K']);
        s.position.set(3.58, y + 0.02, 5.75); add(s, 'bubble_' + i, gr);
      });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.4, 8), mats['Steel_ Copper_ Metal_ Aluminium']);
      stem.position.set(3.58, 0.7, 5.75); add(stem, 'stem', gr);
    }

    // ================= COURTYARD PLANTING (disabled — remove the /* and */ lines to turn it back on) =================
    
    {
      const gr = new THREE.Group(); gr.name = 'courtyard-plants'; root.add(gr);
      const palm = (x, z, scale, leaves) => {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.0, 10), mats.trunk);
        trunk.position.set(x, 0.5 * scale, z); trunk.scale.setScalar(scale); add(trunk, 'trunk', gr);
        for (let i = 0; i < leaves; i++) {
          const lg = new THREE.PlaneGeometry(0.55, 1.8, 1, 8);
          const p = lg.attributes.position;
          for (let k = 0; k < p.count; k++) { const t = (p.getY(k) + 0.9) / 1.8; p.setZ(k, -0.25 * t * t); }
          lg.translate(0, 0.9, 0); lg.computeVertexNormals();
          const leaf = new THREE.Mesh(lg, mats['Licuala_Grandis_Leaf2']);
          leaf.position.set(x, 0.95 * scale, z);
          leaf.rotation.order = 'YXZ';
          leaf.rotation.y = i * 2.399963;
          leaf.rotation.x = -(0.25 + (i % 5) * 0.16);
          leaf.scale.setScalar(scale * (0.8 + (i % 3) * 0.12));
          add(leaf, 'leaf', gr);
        }
      };
      palm(2.15, 7.8, 1, 14); palm(1.0, 7.4, 0.55, 8); palm(3.9, 7.6, 0.7, 9);
      const rock = mats['Beauford Flagstone Natural Stone Flooring'];
      [[1.5, 7.2, 0.18], [3.3, 7.2, 0.14], [3.6, 8.2, 0.2], [0.8, 8.3, 0.12], [2.6, 8.4, 0.16]].forEach(([x, z, r]) => {
        const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), rock); m.position.set(x, r * 0.55, z); m.scale.y = 0.65; add(m, 'rock', gr);
      });
    }
    

  
// ==========================================
// VEYRA — CUSTOM CURVY MARBLE COFFEE TABLE
// WHITE + BLACK MARBLE / GOLD C-SHAPED LEGS
// ==========================================

function createCoffeeTable(o = {}) {

  const {
    x = 3.2,
    z = 4.2,
    rotationY = 0,
    scale = 1,
    legH = 0.20,
    topT = 0.03,
    parent = root
  } = o;

  function veinTex(bg, vein, n) {

    const cv = document.createElement('canvas');
    cv.width = cv.height = 512;

    const c = cv.getContext('2d');

    c.fillStyle = bg;
    c.fillRect(0, 0, 512, 512);
    c.lineCap = 'round';

    let s = 7;

    const rnd = () =>
      (s = (s * 16807) % 2147483647) / 2147483647;

    for (let i = 0; i < n; i++) {

      c.strokeStyle = vein;
      c.globalAlpha = 0.15 + rnd() * 0.35;
      c.lineWidth = 0.6 + rnd() * 2.2;

      c.beginPath();

      let px = rnd() * 512;
      let py = rnd() * 512;

      c.moveTo(px, py);

      for (let k = 0; k < 8; k++) {

        px += (rnd() - 0.3) * 70;
        py += (rnd() - 0.5) * 70 + 30;

        c.lineTo(px, py);
      }

      c.stroke();
    }

    const t = new THREE.CanvasTexture(cv);

    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(0.7, 0.7);
    t.encoding = THREE.sRGBEncoding;

    return t;
  }

  // MATERIALS


// ==========================================
// IMAGE BASED MARBLE TEXTURES
// ==========================================

const textureLoader = new THREE.TextureLoader();

// WHITE MARBLE IMAGE
const whiteTexture = textureLoader.load(
  './MODELSWEBSITE/JianE_Mtl_2021914957202752_1__Marble.jpg'
);

// BLACK MARBLE IMAGE
const blackTexture = textureLoader.load(
  './MODELSWEBSITE/JianE_Mtl_2021914957202752_2__Marble.jpg'
);

// TEXTURE SETTINGS
[whiteTexture, blackTexture].forEach(tex => {

  tex.encoding = THREE.sRGBEncoding;

  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;

  tex.repeat.set(1, 1);

});

// WHITE MATERIAL
const whiteMat = new THREE.MeshStandardMaterial({
  map: whiteTexture,
  roughness: 0.65,
  metalness: 0
});

// BLACK MATERIAL
const blackMat = new THREE.MeshStandardMaterial({
  map: blackTexture,
  roughness: 0.65,
  metalness: 0
});

  const legMat = new THREE.MeshStandardMaterial({
    color: 0xc9a77a,
    roughness: 0.45,
    metalness: 0.3
  });

  const grp = new THREE.Group();
  grp.name = 'custom-table';

  // TOP OUTLINE

  const OUTLINE = [
    [-0.69,  0.00, 0.07],
    [-0.66, -0.51, 0.06],
    [ 0.36, -0.46, 0.08],
    [ 0.69,  0.19, 0.09],
    [ 0.21,  0.51, 0.08]
  ];

  const CUT = {
    nx: 0.951,
    nz: 0.308,
    d: 0.057
  };

  // ROUNDED OUTLINE

  function fillet(P, seg = 8) {

    const out = [];
    const n = P.length;

    for (let i = 0; i < n; i++) {

      const p = new THREE.Vector2(
        P[(i + n - 1) % n][0],
        P[(i + n - 1) % n][1]
      );

      const c = new THREE.Vector2(P[i][0], P[i][1]);

      const q = new THREE.Vector2(
        P[(i + 1) % n][0],
        P[(i + 1) % n][1]
      );

      const a = p.sub(c);
      const b = q.sub(c);

      const r = Math.min(
        P[i][2],
        a.length() * 0.45,
        b.length() * 0.45
      );

      a.normalize();
      b.normalize();

      const s = c.clone().addScaledVector(a, r);
      const e = c.clone().addScaledVector(b, r);

      out.push(
        ...new THREE.QuadraticBezierCurve(s, c, e).getPoints(seg)
      );
    }

    return out;
  }

  // SPLIT WHITE AND BLACK MARBLE

  function clip(poly, sgn) {

    const out = [];
    const n = poly.length;

    const f = p =>
      sgn * (
        CUT.nx * p.x +
        CUT.nz * p.y -
        CUT.d
      );

    for (let i = 0; i < n; i++) {

      const a = poly[i];
      const b = poly[(i + 1) % n];

      const fa = f(a);
      const fb = f(b);

      if (fa >= 0) out.push(a);

      if ((fa >= 0) !== (fb >= 0)) {

        const t = fa / (fa - fb);

        out.push(
          new THREE.Vector2(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t
          )
        );
      }
    }

    return out;
  }

  // CREATE MARBLE PLATES

  function plate(poly, material, name) {

    const bv = 0.006;

    const shape = new THREE.Shape(
      poly.map(p => new THREE.Vector2(p.x, -p.y))
    );

    const g = new THREE.ExtrudeGeometry(shape, {

      depth: topT - 2 * bv,

      bevelEnabled: true,
      bevelSize: bv,
      bevelThickness: bv,
      bevelSegments: 3

    });

    g.rotateX(-Math.PI / 2);

    const m = new THREE.Mesh(g, material);

    m.position.y = legH + bv;
    m.name = name;

    m.castShadow = true;
    m.receiveShadow = true;

    grp.add(m);
  }

  const outline = fillet(OUTLINE);

  plate(
    clip(outline, -1),
    whiteMat,
    'table-top-white'
  );

  plate(
    clip(outline, +1),
    blackMat,
    'table-top-black'
  );

  // C-SHAPED LEGS

  function leg(
    name,
    lx,
    lz,
    dir,
    rx = 0.20,
    rz = 0.24,
    t = 0.06
  ) {

    const pts = [];
    const N = 20;

    for (let i = 0; i <= N; i++) {

      const a = Math.PI / 2 + Math.PI * i / N;

      pts.push([
        rx * Math.cos(a),
        rz * Math.sin(a)
      ]);
    }

    for (let i = N; i >= 0; i--) {

      const a = Math.PI / 2 + Math.PI * i / N;

      pts.push([
        (rx - t) * Math.cos(a),
        (rz - t) * Math.sin(a)
      ]);
    }

    const shape = new THREE.Shape(
      pts.map(p =>
        new THREE.Vector2(dir * p[0], p[1])
      )
    );

    const g = new THREE.ExtrudeGeometry(shape, {

      depth: legH - 0.02,

      bevelEnabled: true,
      bevelSize: 0.008,
      bevelThickness: 0.008,
      bevelSegments: 2

    });

    g.rotateX(-Math.PI / 2);

    const m = new THREE.Mesh(g, legMat);

    m.position.set(lx, 0.01, lz);
    m.name = name;

    m.castShadow = true;
    m.receiveShadow = true;

    grp.add(m);
  }

  leg('table-leg-1', -0.38, -0.15,  1);
  leg('table-leg-2',  0.38,  0.00, -1);
  // =====================================================
// VEYRA — LUXURY COFFEE TABLE ACCESSORIES
// ARCH LAMP + 3 STACKED BOOKS + GLASS VASE TREE
// =====================================================

const decor = new THREE.Group();
decor.name = 'coffee-table-decor';

// TABLE SURFACE HEIGHT
const SY = legH + topT;


// =====================================================
// MATERIALS
// =====================================================

// Lamp black metal
const lampBlack = new THREE.MeshStandardMaterial({
  color: 0x191917,
  roughness: 0.32,
  metalness: 0.75
});

// Gold detailing
const lampGold = new THREE.MeshStandardMaterial({
  color: 0xb39a70,
  roughness: 0.35,
  metalness: 0.7
});

// Warm cream lamp shade
const lampGlow = new THREE.MeshStandardMaterial({
  color: 0xffe8b8,
  emissive: 0xffd18a,
  emissiveIntensity: 0.65,
  roughness: 0.5
});

// Book pages
const pageMat = new THREE.MeshStandardMaterial({
  color: 0xeee7dc,
  roughness: 1
});

// Glass vase
const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0x77736b,
  roughness: 0.12,
  metalness: 0,
  transmission: 0.65,
  transparent: true,
  opacity: 0.4,
  thickness: 0.015,
  side: THREE.DoubleSide,
  depthWrite: false
});

// Tree branches
const branchMat = new THREE.MeshStandardMaterial({
  color: 0x34291e,
  roughness: 1
});

// Leaves
const leafMat = new THREE.MeshStandardMaterial({
  color: 0x536d38,
  roughness: 0.9,
  side: THREE.DoubleSide
});

const leafMat2 = new THREE.MeshStandardMaterial({
  color: 0x788a50,
  roughness: 0.9,
  side: THREE.DoubleSide
});


// =====================================================
// 1. ARCH TABLE LAMP
// =====================================================

{
  const lamp = new THREE.Group();
  lamp.name = 'arch-table-lamp';

  const lx = -0.37;
  const lz = -0.2;


  // ---------------------------------
  // CIRCULAR BASE
  // ---------------------------------

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.087,
      0.095,
      0.018,
      48
    ),
    lampBlack
  );

  base.position.set(
    lx,
    SY + 0.009,
    lz
  );

  lamp.add(base);


  // BASE GOLD RING

  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(
      0.083,
      0.002,
      8,
      48
    ),
    lampGold
  );

  baseRing.rotation.x = Math.PI / 2;

  baseRing.position.set(
    lx,
    SY + 0.019,
    lz
  );

  lamp.add(baseRing);


  // ---------------------------------
  // CENTRAL STEM
  // ---------------------------------

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.035,
      0.045,
      0.105,
      24
    ),
    lampBlack
  );

  stem.position.set(
    lx,
    SY + 0.073,
    lz
  );

  lamp.add(stem);


  // ---------------------------------
  // CREAM GLOWING DOME
  // ---------------------------------

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.092,
      48,
      32,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    ),
    lampGlow
  );

  dome.position.set(
    lx,
    SY + 0.125,
    lz
  );

  lamp.add(dome);


  // ---------------------------------
  // BLACK ARCH FRAME
  // ---------------------------------

  const archPoints = [

    new THREE.Vector3(-0.075, 0.02, 0),
    new THREE.Vector3(-0.075, 0.19, 0),
    new THREE.Vector3(-0.068, 0.31, 0),
    new THREE.Vector3(-0.025, 0.375, 0),

    new THREE.Vector3(0.025, 0.375, 0),

    new THREE.Vector3(0.068, 0.31, 0),
    new THREE.Vector3(0.075, 0.19, 0),
    new THREE.Vector3(0.075, 0.02, 0)

  ];


  const archCurve = new THREE.CatmullRomCurve3(

    archPoints.map(p =>
      new THREE.Vector3(
        lx + p.x,
        SY + p.y,
        lz + p.z
      )
    )

  );


  const arch = new THREE.Mesh(
    new THREE.TubeGeometry(
      archCurve,
      80,
      0.008,
      10,
      false
    ),
    lampBlack
  );

  lamp.add(arch);


  // ---------------------------------
  // ARCH BOTTOM SUPPORTS
  // ---------------------------------

  [-1, 1].forEach(side => {

    const support = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.009,
        0.009,
        0.035,
        12
      ),
      lampBlack
    );

    support.position.set(
      lx + side * 0.075,
      SY + 0.018,
      lz
    );

    lamp.add(support);

  });


  // ---------------------------------
  // WARM LIGHT
  // ---------------------------------

  const light = new THREE.PointLight(
    0xffd79b,
    0.3,
    0.8
  );

  light.position.set(
    lx,
    SY + 0.15,
    lz
  );

  lamp.add(light);


  decor.add(lamp);
}


// =====================================================
// 2. THREE STACKED COFFEE TABLE BOOKS
// =====================================================

{
  const books = new THREE.Group();
  books.name = 'stacked-coffee-books';


  // BOOK COVER MATERIALS

  const covers = [

    new THREE.MeshStandardMaterial({
      color: 0xcfc3af,
      roughness: 0.95
    }),

    new THREE.MeshStandardMaterial({
      color: 0x817563,
      roughness: 0.95
    }),

    new THREE.MeshStandardMaterial({
      color: 0xe0d5c3,
      roughness: 0.95
    })

  ];


  // ---------------------------------
  // BOOK CREATION FUNCTION
  // ---------------------------------

  function createBook(
    name,
    x,
    z,
    w,
    d,
    h,
    mat,
    stackY,
    rotation
  ) {

    const book = new THREE.Group();
    book.name = name;


    // PAGES

    const page = new THREE.Mesh(
      new THREE.BoxGeometry(
        w - 0.014,
        h - 0.012,
        d - 0.012
      ),
      pageMat
    );

    page.position.y = h / 2;

    book.add(page);


    // BOTTOM COVER

    const bottom = new THREE.Mesh(
      new THREE.BoxGeometry(
        w,
        0.006,
        d
      ),
      mat
    );

    bottom.position.y = 0.003;

    book.add(bottom);


    // TOP COVER

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(
        w,
        0.006,
        d
      ),
      mat
    );

    top.position.y = h - 0.003;

    book.add(top);


    // SPINE

    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.009,
        h,
        d
      ),
      mat
    );

    spine.position.set(
      -w / 2 + 0.0045,
      h / 2,
      0
    );

    book.add(spine);


    // GOLD COVER DETAIL

    const line = new THREE.Mesh(
      new THREE.BoxGeometry(
        w * 0.36,
        0.0015,
        0.002
      ),
      lampGold
    );

    line.position.set(
      0.025,
      h + 0.001,
      0
    );

    book.add(line);


    // FINAL BOOK POSITION

    book.position.set(
      x,
      stackY,
      z
    );

    book.rotation.y = rotation;


    book.traverse(obj => {

      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }

    });


    books.add(book);

    return book;
  }


  // ---------------------------------
  // BOTTOM BOOK
  // ---------------------------------

  createBook(
    'book-bottom',
    0.025,
    0.17,
    0.39,
    0.25,
    0.038,
    covers[0],
    0,
    0.015
  );


  // ---------------------------------
  // MIDDLE BOOK
  // ---------------------------------

  createBook(
    'book-middle',
    -0.005,
    0.16,
    0.35,
    0.23,
    0.036,
    covers[1],
    0.038,
    -0.025
  );


  // ---------------------------------
  // TOP BOOK
  // ---------------------------------

  createBook(
    'book-top',
    -0.025,
    5,
    0.31,
    0.21,
    0.034,
    covers[2],
    0.074,
    0.02
  );


 // Move entire book stack onto table surface
books.position.y = SY;

decor.add(books);
}


// =====================================================
// 3. GLASS VASE + DECORATIVE TREE
// =====================================================


// =====================================================
// FINAL ACCESSORIES SETTINGS
// =====================================================

decor.traverse(obj => {

  if (obj.isMesh) {

    obj.castShadow = true;
    obj.receiveShadow = true;

  }

});

grp.add(decor);

  // FINAL POSITION

  grp.position.set(x, 0, z);
  grp.rotation.y = rotationY;
  grp.scale.setScalar(scale);

  parent.add(grp);

  return grp;
}


// CREATE TABLE IN ROOM

createCoffeeTable({
  x: 3.6,
  z: 3.0,
  rotationY: 80,
  scale: 0.8,
  parent: root
});
  

    // ================= VEYRA CUSTOM ORGANIC SOFA =================
    {
      const sofa = new THREE.Group();
      sofa.name = 'placeholder-sofa';
      root.add(sofa);

      // ==========================================
      // BUBBLE SIDE-FACE SETTINGS
      // ==========================================
      const SIDE_BULGE = 0.035; // how far the faces puff out (0 = straight / old look)
      const SIDE_ROUND = 1.2;   // lower = fuller bubble, higher = more pillow-in-the-middle
      const BEVEL_T    = 0.045; // must match bevelThickness in createSofaShape

      // HELPER 1: puffs the whole side face outward
      function puffySideWalls(geometry, shape, depth, bulge, round) {
        if (bulge <= 0) return;

        const pts = shape.getPoints(32);
        if (pts.length > 1 && pts[0].distanceTo(pts[pts.length - 1]) < 1e-6) pts.pop();

        const n = pts.length;
        let area = 0;
        for (let i = 0; i < n; i++) {
          const a = pts[i], b = pts[(i + 1) % n];
          area += a.x * b.y - b.x * a.y;
        }
        const sign = area > 0 ? 1 : -1;

        const segs = [];
        for (let i = 0; i < n; i++) {
          const a = pts[i], b = pts[(i + 1) % n];
          const dx = b.x - a.x, dy = b.y - a.y;
          const l = Math.hypot(dx, dy) || 1e-9;
          segs.push({
            ax: a.x, ay: a.y, dx, dy, l2: l * l,
            nx: sign * dy / l,
            ny: -sign * dx / l
          });
        }

        const pos = geometry.attributes.position;
        const total = depth + 2 * BEVEL_T;

        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);

          let best = null, bd = Infinity;
          for (const s of segs) {
            const t = Math.max(0, Math.min(1, ((x - s.ax) * s.dx + (y - s.ay) * s.dy) / s.l2));
            const ex = x - (s.ax + t * s.dx), ey = y - (s.ay + t * s.dy);
            const d = ex * ex + ey * ey;
            if (d < bd) { bd = d; best = s; }
          }

          const u = Math.max(0, Math.min(1, (z + BEVEL_T) / total));
          const w = Math.pow(Math.max(0, Math.sin(Math.PI * u)), round) * bulge;

          pos.setXY(i, x + best.nx * w, y + best.ny * w);
        }
        pos.needsUpdate = true;
      }

      // HELPER 2: merges duplicate vertices so normals are smooth
      function weldGeometry(geo) {
        geo.deleteAttribute('normal');
        geo.deleteAttribute('uv');

        const p = geo.attributes.position;
        const map = new Map(), out = [], idx = [];

        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
          const k = Math.round(x * 1e4) + '_' + Math.round(y * 1e4) + '_' + Math.round(z * 1e4);
          let j = map.get(k);
          if (j === undefined) {
            j = out.length / 3;
            map.set(k, j);
            out.push(x, y, z);
          }
          idx.push(j);
        }

        geo.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
        geo.setIndex(idx);
      }

      // createSofaShape  (used by left / right / middle)
      function createSofaShape(name, x, z, y, height, material, drawShape) {

        const shape = new THREE.Shape();
        drawShape(shape);

        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: height,
          bevelEnabled: true,
          bevelSegments: 8,
          steps: 12,
          bevelSize: 0.045,
          bevelThickness: BEVEL_T,
          curveSegments: 32
        });

        puffySideWalls(geometry, shape, height, SIDE_BULGE, SIDE_ROUND);
        weldGeometry(geometry);

        geometry.rotateX(-Math.PI / 2);
        geometry.computeVertexNormals();

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.name = name;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        sofa.add(mesh);
        return mesh;
      }

      // ==========================================
      // 1. LEFT SOFA
      // ==========================================
      createSofaShape(
        'sofa-left',
        5.1, 2.45, 0.02, 0.23,
        mats.sofa,

        function (s) {
          s.moveTo(-0.22, -0.45);
          s.lineTo(0.27, -0.45);
          s.bezierCurveTo(0.33, -0.45, 0.35, -0.42, 0.35, -0.36);
          s.lineTo(0.35, 0.36);
          s.bezierCurveTo(0.35, 0.43, 0.32, 0.46, 0.25, 0.48);
          s.lineTo(-0.25, 0.62);
          s.bezierCurveTo(-0.32, 0.64, -0.35, 0.60, -0.35, 0.54);
          s.lineTo(-0.35, -0.37);
          s.bezierCurveTo(-0.35, -0.43, -0.31, -0.45, -0.22, -0.45);
          s.closePath();
        }
      );

      // ==========================================
      // 2. RIGHT SOFA
      // ==========================================
      createSofaShape(
        'sofa-right',
        4.25, 4.17, 0.02, 0.23,
        mats.sofa,

        function (s) {
          s.moveTo(-0.27, -0.35);
          s.lineTo(0.27, -0.35);
          s.bezierCurveTo(0.33, -0.35, 0.35, -0.32, 0.35, -0.26);
          s.lineTo(0.35, 0.45);
          s.bezierCurveTo(0.35, 0.51, 0.32, 0.55, 0.26, 0.54);
          s.lineTo(-0.26, 0.35);
          s.bezierCurveTo(-0.33, 0.33, -0.35, 0.31, -0.35, 0.25);
          s.lineTo(-0.35, -0.25);
          s.bezierCurveTo(-0.35, -0.32, -0.33, -0.35, -0.27, -0.35);
          s.closePath();
        }
      );

      // ==========================================
      // 3. LONG MIDDLE SOFA
      // ==========================================
      createSofaShape(
        'sofa-middle',
        5.05, 3.60, 0.02, 0.23,
        mats.sofa,

        function (s) {
          s.moveTo(-0.30, -0.80);
          s.quadraticCurveTo(-0.30, -0.90, -0.223, -0.836);
          s.lineTo(0.223, -0.464);
          s.quadraticCurveTo(0.30, -0.40, 0.30, -0.30);
          s.lineTo(0.30, 0.50);
          s.quadraticCurveTo(0.30, 0.60, 0.20, 0.60);
          s.lineTo(-0.20, 0.60);
          s.quadraticCurveTo(-0.30, 0.60, -0.30, 0.50);
          s.closePath();
        }
      );

      // ==========================================
      // 4. MIDDLE SOFA BACK SUPPORT
      // HELPERS: smooth surface fitting (thin-plate spline)
      // ==========================================
      function solveLinear(A, b) {
        const n = b.length;

        for (let i = 0; i < n; i++) {
          let p = i;
          for (let r = i + 1; r < n; r++) {
            if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
          }
          [A[i], A[p]] = [A[p], A[i]];
          [b[i], b[p]] = [b[p], b[i]];

          for (let r = i + 1; r < n; r++) {
            const f = A[r][i] / A[i][i];
            if (!f) continue;
            for (let c = i; c < n; c++) A[r][c] -= f * A[i][c];
            b[r] -= f * b[i];
          }
        }

        const x = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
          let s = b[i];
          for (let c = i + 1; c < n; c++) s -= A[i][c] * x[c];
          x[i] = s / A[i][i];
        }
        return x;
      }

      const tpsPhi = r => (r > 1e-12 ? r * r * Math.log(r) : 0);

      // Fits a smooth surface Z(x, y) that passes through the boundary points
      function tpsFit(X, Y, Z) {
        const n = X.length, M = n + 3;
        const A = Array.from({ length: M }, () => new Array(M).fill(0));
        const b = new Array(M).fill(0);

        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            A[i][j] = tpsPhi(Math.hypot(X[i] - X[j], Y[i] - Y[j]));
          }
          A[i][i] += 1e-9;
          A[i][n] = 1;      A[n][i] = 1;
          A[i][n + 1] = X[i]; A[n + 1][i] = X[i];
          A[i][n + 2] = Y[i]; A[n + 2][i] = Y[i];
          b[i] = Z[i];
        }

        const w = solveLinear(A, b);

        return (x, y) => {
          let f = w[n] + w[n + 1] * x + w[n + 2] * y;
          for (let i = 0; i < n; i++) {
            f += w[i] * tpsPhi(Math.hypot(x - X[i], y - Y[i]));
          }
          return f;
        };
      }

      // MAIN FUNCTION
      function createSofaXYZShape(
        name, x, y, z, points, material,
        cornerRadius = 0.25
      ) {

        // 0. CLEAN INPUT POINTS (remove near-duplicates)
        const EPS = 0.05;
        const O = [];

        points.forEach(p => {
          const v = new THREE.Vector3(...p);
          if (!O.length || v.distanceTo(O[O.length - 1]) > EPS) O.push(v);
        });

        if (O.length > 1 && O[0].distanceTo(O[O.length - 1]) < EPS) O.pop();

        const n0 = O.length;

        // 1. SURFACE NORMAL (Newell)
        const normal = new THREE.Vector3();

        for (let i = 0; i < n0; i++) {
          const a = O[i], b = O[(i + 1) % n0];
          normal.x += (a.y - b.y) * (a.z + b.z);
          normal.y += (a.z - b.z) * (a.x + b.x);
          normal.z += (a.x - b.x) * (a.y + b.y);
        }
        normal.normalize();

        // 2. ROUND CORNERS (BEZIER)
        let pts = [];

        for (let i = 0; i < n0; i++) {
          const prev = O[(i - 1 + n0) % n0];
          const cur  = O[i];
          const next = O[(i + 1) % n0];

          const radius = Math.min(
            cornerRadius,
            cur.distanceTo(prev) * 0.4,
            cur.distanceTo(next) * 0.4
          );

          const s = cur.clone().add(
            prev.clone().sub(cur).normalize().multiplyScalar(radius)
          );
          const e = cur.clone().add(
            next.clone().sub(cur).normalize().multiplyScalar(radius)
          );

          pts.push(...new THREE.QuadraticBezierCurve3(s, cur, e).getPoints(12));
        }

        pts = pts.filter((p, i) =>
          p.distanceTo(pts[(i - 1 + pts.length) % pts.length]) > 1e-4
        );

        const count = pts.length;
        const origin = O[0];

        // 3. LOCAL FRAME (u, v, normal)
        const u = new THREE.Vector3().subVectors(O[1], O[0]);
        u.addScaledVector(normal, -u.dot(normal)).normalize();

        const v = new THREE.Vector3().crossVectors(normal, u).normalize();

        const local = pts.map(p => {
          const r = p.clone().sub(origin);
          return { u: r.dot(u), v: r.dot(v), n: r.dot(normal) };
        });

        // 4. BEVEL SETTINGS
        const thickness = 0.175;
        const bevelSize = 0.045;
        const bevelDepth = 0.03;
        const bevelSegments = 8;
        const capSubdivisions = 4;   // higher = smoother face (slower)

        // 5. TRUE INWARD OFFSET OF THE OUTLINE
        function offsetContour(d) {
          return local.map((c, i) => {
            const p = local[(i - 1 + count) % count];
            const q = local[(i + 1) % count];

            const e1 = new THREE.Vector2(c.u - p.u, c.v - p.v).normalize();
            const e2 = new THREE.Vector2(q.u - c.u, q.v - c.v).normalize();

            const n1 = new THREE.Vector2(-e1.y, e1.x);
            const n2 = new THREE.Vector2(-e2.y, e2.x);

            const bis = n1.clone().add(n2);
            if (bis.length() < 1e-6) bis.copy(n1); else bis.normalize();

            const k = d / Math.max(bis.dot(n1), 0.5);

            return { u: c.u + bis.x * k, v: c.v + bis.y * k, n: c.n };
          });
        }

        // 6. BEVEL PROFILE
        const front = [];
        for (let i = 0; i <= bevelSegments; i++) {
          const t = (i / bevelSegments) * Math.PI / 2;
          front.push({
            d:   bevelSize * (1 - Math.sin(t)),
            off: -bevelDepth * (1 - Math.cos(t))
          });
        }

        const back = front.slice().reverse().map(p => ({
          d: p.d,
          off: -thickness - p.off
        }));

        const profile = [...front, ...back];

        // 7. RING VERTICES
        const vertices = [];
        const indices = [];

        const toWorld = (c, off) =>
          origin.clone()
            .addScaledVector(u, c.u)
            .addScaledVector(v, c.v)
            .addScaledVector(normal, c.n + off);

        const rc = profile.map(p => offsetContour(p.d));

        profile.forEach((p, r) => {
          rc[r].forEach(c => {
            const w = toWorld(c, p.off);
            vertices.push(w.x, w.y, w.z);
          });
        });

        const rings = profile.length;

        // 8. SIDE STRIPS
        for (let r = 0; r < rings - 1; r++) {
          const cur = r * count;
          const nxt = (r + 1) * count;

          for (let i = 0; i < count; i++) {
            const j = (i + 1) % count;
            const a = cur + i, b = cur + j, c = nxt + j, d = nxt + i;
            indices.push(a, c, b, a, d, c);
          }
        }

        // 9. FRONT + BACK FACES (smooth surface)
        const caps = [];

        function addCap(ri, facing) {

          const contour = rc[ri];
          const off = profile[ri].off;
          const base = vertices.length / 3;

          const U = contour.map(c => c.u);
          const V2 = contour.map(c => c.v);
          const N = contour.map(c => c.n);

          let tris = THREE.ShapeUtils.triangulateShape(
            contour.map(c => new THREE.Vector2(c.u, c.v)), []
          );

          // subdivide into many small triangles
          for (let lv = 0; lv < capSubdivisions; lv++) {
            const mid = new Map(), nt = [];

            const gm = (a, b) => {
              const k = a < b ? a + '_' + b : b + '_' + a;
              if (mid.has(k)) return mid.get(k);
              const i = U.length;
              U.push((U[a] + U[b]) / 2);
              V2.push((V2[a] + V2[b]) / 2);
              N.push(0);
              mid.set(k, i);
              return i;
            };

            tris.forEach(t => {
              const a = t[0], b = t[1], c = t[2];
              const ab = gm(a, b), bc = gm(b, c), ca = gm(c, a);
              nt.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]);
            });

            tris = nt;
          }

          // one smooth surface through the outline
          const f = tpsFit(
            contour.map(c => c.u),
            contour.map(c => c.v),
            contour.map(c => c.n)
          );

          for (let i = 0; i < U.length; i++) N[i] = f(U[i], V2[i]);

          caps.push({ base, ri });

          for (let i = 0; i < U.length; i++) {
            const w = toWorld({ u: U[i], v: V2[i], n: N[i] }, off);
            vertices.push(w.x, w.y, w.z);
          }

          tris.forEach(t => {
            const a = t[0], b = t[1], c = t[2];
            const cr = (U[b] - U[a]) * (V2[c] - V2[a]) - (V2[b] - V2[a]) * (U[c] - U[a]);

            if (cr * facing >= 0) indices.push(base + a, base + b, base + c);
            else                  indices.push(base + a, base + c, base + b);
          });
        }

        addCap(0, +1);            // front
        addCap(rings - 1, -1);    // back

        // 10. GEOMETRY
        const geometry = new THREE.BufferGeometry();

        geometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(vertices, 3)
        );

        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        // blend face edge normals with the bevel -> no visible seam line
        const nrm = geometry.attributes.normal.array;

        caps.forEach(c => {
          for (let i = 0; i < count; i++) {
            const a = (c.base + i) * 3;
            const b = (c.ri * count + i) * 3;

            const nx = nrm[a]     + nrm[b];
            const ny = nrm[a + 1] + nrm[b + 1];
            const nz = nrm[a + 2] + nrm[b + 2];
            const l = Math.hypot(nx, ny, nz) || 1;

            nrm[a] = nrm[b] = nx / l;
            nrm[a + 1] = nrm[b + 1] = ny / l;
            nrm[a + 2] = nrm[b + 2] = nz / l;
          }
        });

        geometry.attributes.normal.needsUpdate = true;

        // 11. MESH
        const meshMaterial = material.clone();
        meshMaterial.side = THREE.DoubleSide;

        const mesh = new THREE.Mesh(geometry, meshMaterial);

        mesh.position.set(x, y, z);
        mesh.name = name;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        sofa.add(mesh);

        return mesh;
      }

      createSofaXYZShape(
        'sofa-middle-backsupport',

        2.23, 0.01, 5.17,

        [
          [2.45, 0, -0.67],
          [2.45, 0.5, -0.67],
          [3.3, 0.73, -1],
          [3.2, 0.5, -2.21],
          [3.2, 0, -2.21],
          [3.2, 0, -1],
          [2.46, 0, -0.669]
        ],

        mats.sofa,

        0.25
      );

      // ================= LOUNGE CHAIR =================
      createLoungeChair({
        material: mats.armchair,
        x: 2.8, y: 0, z: 4.3,
        rotationY: (Math.PI / -1.45),
        scale: 0.69,
        parent: root
      });
    }

    return root;
  };
})((window.VEYRA = window.VEYRA || {}));