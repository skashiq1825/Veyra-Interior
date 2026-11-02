(function (V) {
  'use strict';

  /**
   * Builds the whole living room from code (no GLB).  Same coordinates as the SketchUp model
   * (metres, Y up, window wall at z ≈ 6, courtyard behind), so the camera views in config.js still apply.
   *
   * Object / material NAMES are deliberately the same as in the original model, so materials.js,
   * curtains.js and lights.js work unchanged:
   *   material "curtain" + node "cortina"  -> curtain animation
   *   nodes "Spotlight_n"                  -> ceiling downlights
   *   material "Emissive WALL"             -> LED cove glow
   *   material "centre table lamp"         -> table lamp light
   *   material "SDT-2800 K"                -> bubble floor lamp glow
   * Furniture placeholders are called  placeholder-sofa / placeholder-armchair / placeholder-table
   * and are swapped for your own GLB files by furniture.js.
   */
  V.buildRoom = function buildRoom() {
    const T = V.textures;
    const root = new THREE.Group(); root.name = 'veyra-room';

    // ---- key dimensions (m) ----
    const H = 2.84, TOP = 3.05;           // ceiling underside / top of walls
    const WIN_X0 = 0.38, WIN_X1 = 3.31;   // window opening along x (wall at z 5.95–6.21)

    // ---- materials ----
    const mats = {};
    const mat = (name, o) => (mats[name] = new THREE.MeshStandardMaterial(Object.assign({ name, roughness: 0.9, metalness: 0 }, o)));
    const plaster = (rx, ry) => T.get('plaster', rx, ry);
    mats.plaster = mat('wall lime', { map: plaster(3, 1.3) });
    mat('Dunstone _ Contract_ limestone stone effect ceramic', { map: T.get('floor', 5, 5) });
    mat('wood', { map: T.get('wood', 1, 1) });
    mat('Beauford Flagstone Natural Stone Flooring', { map: T.get('stone', 5, 3) });
    mat('rug', { map: T.get('rug', 1, 1), roughness: 1 });
    mat('painting', { map: T.get('painting', 1, 1), roughness: 0.8 });
    mat('Glass_Basic_1', { color: 0xfffafa, transparent: true, opacity: 0.25, roughness: 0, side: THREE.DoubleSide });
    mat('[Color_009]', { color: 0x151515, roughness: 0.5, metalness: 0.4 });
    mat('curtain', { color: 0xf3ece0, transparent: true, opacity: 0.62, side: THREE.DoubleSide });
    mat('sofa', { color: 0xc8bfb0, roughness: 0.95 });
    mat('armchair', { color: 0x6b7a54, roughness: 0.95 });
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

    const leftTex = new THREE.TextureLoader().load('./MODELSWEBSITE/wall_lime.jpg');
leftTex.encoding = THREE.sRGBEncoding;
leftTex.wrapS = leftTex.wrapT = THREE.RepeatWrapping;
leftTex.repeat.set(2, 2);        // (kitni baar lambai mein, kitni baar unchai mein)
mat('left wall', { map: leftTex, roughness: 0.9 });

const courtTex = new THREE.TextureLoader().load('./MODELSWEBSITE/Beauford_Flagstone_Natural_Stone_Flooring.jpg');
courtTex.encoding = THREE.sRGBEncoding;
courtTex.wrapS = courtTex.wrapT = THREE.RepeatWrapping;
courtTex.repeat.set(0.5, 0.5);        // (kitni baar lambai mein, kitni baar unchai mein)
mat('court wall', { map: courtTex, roughness: 0.9,});

const floorTex = new THREE.TextureLoader().load('./MODELSWEBSITE/Dunstone___Contract__limestone_stone_effect_ceramic___Ceramiche_Keope.jpg');
floorTex.encoding = THREE.sRGBEncoding;
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(2, 2);       // (x mein kitni baar, z mein kitni baar)
mat('Dunstone floor', { map: floorTex });

const rugTex = new THREE.TextureLoader().load('./MODELSWEBSITE/rug.png');
rugTex.encoding = THREE.sRGBEncoding;
rugTex.wrapS = rugTex.wrapT = THREE.RepeatWrapping;
rugTex.repeat.set(1, 1);
rugTex.rotation = Math.PI / -2; 
mat('rug', { map: rugTex, roughness: 1 });

    // ---- helpers ----
    const add = (mesh, name, parent) => { mesh.name = name; (parent || root).add(mesh); return mesh; };
    const slab = (x0, x1, y0, y1, z0, z1, m, name, parent) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m);
      mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      return add(mesh, name, parent);
    };
    const withRepeat = (m, rx, ry) => { const c = m.clone(); if (m.map) { c.map = m.map.clone(); c.map.needsUpdate = true; c.map.repeat.set(rx, ry); } c.name = m.name; return c; };

    // ---- floor, ceiling, outer walls ----
    
slab(0, 8.5, -0.1, 0, 0, 6.0, mats['Dunstone floor'], 'floor');
    slab(0.23, 5.85, -0.1, 0, 6.0, 9.18, withRepeat(mats['Dunstone floor'], 5, 3), 'courtyard-floor');
    slab(0, 6.11, H, TOP, 0, 6.21, withRepeat(mats.plaster, 4, 3), 'ceiling');
slab(0, 0.23, 0, TOP, 0, 9.18, mats['left wall'], 'wall-left');
    slab(5.85, 6.11, 0, TOP, 6.0, 9.18, withRepeat(mats.plaster, 2, 1.4), 'courtyard-wall-right');
    slab(0.23, 5.85, 0, TOP, 8.95, 9.18, withRepeat(mats['court wall'], 6, 3), 'courtyard-stone-wall');
    // a plain warm wall behind the arch so the orbit never shows a void
    slab(8.5, 8.6, 0, TOP, 0, 3.2, withRepeat(mats.plaster, 3, 1.4), 'adjacent-room-wall');

    // ---- right wall: timber panelling with an arch opening (extruded profile) ----
    
    {
      const s = new THREE.Shape();
      s.moveTo(0, 0); s.lineTo(6.0, 0); s.lineTo(6.0, TOP); s.lineTo(0, TOP); s.lineTo(0, 0);
      const arch = new THREE.Path();
      arch.moveTo(0.45, 0); arch.lineTo(0.45, 1.75); arch.absarc(1.0, 1.75, 0.55, Math.PI, 0, true); arch.lineTo(1.55, 0); arch.lineTo(0.45, 0);
      s.holes.push(arch);
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.26, bevelEnabled: false, curveSegments: 24 });
      g.rotateY(-Math.PI / 2); g.translate(6.11, 0, 0);          // shape x -> world z, extrusion -> -x
      const m = withRepeat(mats.wood, 1 / 0.8, 1 / TOP);
      add(new THREE.Mesh(g, m), 'wall-right-arch');
    }

    // ---- window wall (z 5.95–6.21): timber right of the opening, plaster left, black frames, glass ----
    slab(WIN_X1, 6.11, 0, TOP, 5.95, 6.21, withRepeat(mats.wood, (6.11 - WIN_X1) / 0.8, 1 / TOP), 'window-wall-wood');
    slab(0, WIN_X0, 0, TOP, 5.95, 6.21, withRepeat(mats.plaster, 0.5, 1.4), 'window-wall-left');
    const frame = mats['[Color_009]'];
    [WIN_X0, 1.37, 2.33, WIN_X1].forEach((x, i) => slab(x - 0.025, x + 0.025, 0, H, 6.02, 6.1, frame, 'sliding door_' + i));
    slab(WIN_X0, WIN_X1, H - 0.05, H, 6.02, 6.1, frame, 'sliding door_top');
    slab(WIN_X0, WIN_X1, 0, 0.05, 6.02, 6.1, frame, 'sliding door_bottom');
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN_X1 - WIN_X0, H), mats['Glass_Basic_1']);
    glass.position.set((WIN_X0 + WIN_X1) / 2, H / 2, 6.06); add(glass, 'window glass');

    // ---- LED cove ring just under the ceiling (thin meshes: lights.js reads this) ----
    // const cove = mats['Emissive WALL'], cy0 = H - 0.02, cy1 = H;
    // slab(0.43, 0.53, cy0, cy1, 0.43, 5.75, cove, 'cove-left');
    // slab(5.55, 5.65, cy0, cy1, 0.43, 5.75, cove, 'cove-right');
    // slab(0.43, 5.65, cy0, cy1, 5.65, 5.75, cove, 'cove-back');
    // slab(0.43, 5.65, cy0, cy1, 0.43, 0.53, cove, 'cove-front');

    // ---- ceiling downlights ----

    [[0.74, 0.8], [0.74, 3.08], [0.74, 5.37], [5.37, 0.8], [5.37, 3.08], [5.37, 5.37], [3.05, 1.92], [3.05, 4.21]].forEach(([x, z], i) => {
      const gr = new THREE.Group(); gr.name = 'Spotlight_' + i; root.add(gr);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16), mats.spotlight);
      m.position.set(x, H - 0.01, z); add(m, 'fixture', gr);
    });

    // ---- painting on the arch wall (above the sconce) ----
    slab(5.8, 5.85, 0.88, 2.72, 2.86, 3.76, frame, 'painting-frame');
    const art = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.78), mats.painting);
    art.rotation.y = -Math.PI / 2; art.position.set(5.795, 1.8, 3.31); add(art, 'painting');

    // ---- rug ----
    slab(1.96, 5.15, 0, 0.011, 1.72, 5.72, mats.rug, 'rug');

    // ---- curtain: pleated sheet, 2 vertex rows (curtains.js re-tessellates + animates it) ----


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


    // ---- bubble floor lamp (5 glowing spheres on a thin stem) ----
    {
      const gr = new THREE.Group(); gr.name = 'bubble-lamp'; root.add(gr);
      [0.15, 0.41, 0.67, 0.93, 1.19].forEach((y, i) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.13, 28, 20), mats['SDT-2800 K']);
        s.position.set(3.58, y + 0.02, 5.75); add(s, 'bubble_' + i, gr);
      });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.4, 8), mats['Steel_ Copper_ Metal_ Aluminium']);
      stem.position.set(3.58, 0.7, 5.75); add(stem, 'stem', gr);
    }

    // ---- courtyard planting: banana-leaf palm + low plants + rocks ----
    // {
    //   const gr = new THREE.Group(); gr.name = 'courtyard-plants'; root.add(gr);
    //   const palm = (x, z, scale, leaves) => {
    //     const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.0, 10), mats.trunk);
    //     trunk.position.set(x, 0.5 * scale, z); trunk.scale.setScalar(scale); add(trunk, 'trunk', gr);
    //     for (let i = 0; i < leaves; i++) {
    //       const lg = new THREE.PlaneGeometry(0.55, 1.8, 1, 8);
    //       const p = lg.attributes.position;
    //       for (let k = 0; k < p.count; k++) { const t = (p.getY(k) + 0.9) / 1.8; p.setZ(k, -0.25 * t * t); }   // arch the blade
    //       lg.translate(0, 0.9, 0); lg.computeVertexNormals();
    //       const leaf = new THREE.Mesh(lg, mats['Licuala_Grandis_Leaf2']);
    //       leaf.position.set(x, 0.95 * scale, z);
    //       leaf.rotation.order = 'YXZ';
    //       leaf.rotation.y = i * 2.399963;                                   // golden angle fan
    //       leaf.rotation.x = -(0.25 + (i % 5) * 0.16);
    //       leaf.scale.setScalar(scale * (0.8 + (i % 3) * 0.12));
    //       add(leaf, 'leaf', gr);
    //     }
    //   };
    //   palm(2.15, 7.8, 1, 14); palm(1.0, 7.4, 0.55, 8); palm(3.9, 7.6, 0.7, 9);
    //   const rock = mats['Beauford Flagstone Natural Stone Flooring'];
    //   [[1.5, 7.2, 0.18], [3.3, 7.2, 0.14], [3.6, 8.2, 0.2], [0.8, 8.3, 0.12], [2.6, 8.4, 0.16]].forEach(([x, z, r]) => {
    //     const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), rock); m.position.set(x, r * 0.55, z); m.scale.y = 0.65; add(m, 'rock', gr);
    //   });
    // }

    // ================= FURNITURE PLACEHOLDERS (replaced by your GLBs) =================
    // Same footprint / height as the original pieces, so views and lights keep working.
    {
      const sofa = new THREE.Group(); sofa.name = 'placeholder-sofa'; root.add(sofa);
      slab(4.67, 5.55, 0.02, 0.38, 2.1, 3.36, mats.sofa, 'seat-end', sofa);
      slab(4.67, 5.57, 0.02, 0.38, 3.3, 5.47, mats.sofa, 'seat-main', sofa);
      slab(5.25, 5.57, 0.38, 0.77, 3.3, 5.47, mats.sofa, 'back', sofa);
      slab(3.76, 4.7, 0.02, 0.38, 4.39, 5.47, mats.sofa, 'seat-return', sofa);
      slab(5.0, 5.3, 0.38, 0.62, 4.5, 4.9, mats.armchair, 'cushion', sofa);

      const arm = new THREE.Group(); arm.name = 'placeholder-armchair'; root.add(arm);
      slab(2.09, 3.31, 0.0, 0.34, 4.27, 5.49, mats.armchair, 'seat', arm);
      slab(2.09, 3.31, 0.34, 0.66, 5.2, 5.49, mats.armchair, 'back', arm);

      const table = new THREE.Group(); table.name = 'placeholder-table'; root.add(table);
      slab(3.2, 4.35, 0.25, 0.3, 2.9, 4.3, mats['JianE_Mtl_2021914957202752_1__Marble'], 'top', table);
      slab(3.55, 3.95, 0.0, 0.25, 3.3, 3.9, mats['table base'], 'base', table);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), mats['centre table lamp']);
      lamp.position.set(3.83, 0.4, 3.27); add(lamp, 'lamp', table);
    }
    return root;
  };
})((window.VEYRA = window.VEYRA || {}));

