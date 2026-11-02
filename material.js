(function (V) {
  'use strict';
  const U = V.utils;

  // name pattern -> physical tuning.  SimLab wrote metallic = 0.5 / roughness = 0.5 on everything,
  // which makes fabric and plaster look like dull chrome, so we set sensible PBR values by material name.
  const RULES = [
    { re: /dunstone|limestone|ceramic/i,       p: { roughness: 0.24, metalness: 0, env: 1.15 } },   // polished floor
    { re: /marble/i,                           p: { roughness: 0.16, metalness: 0, env: 1.2 } },
    { re: /^wood$|__wood/i,                    p: { roughness: 0.42, metalness: 0 } },
    { re: /wall lime/i,                        p: { roughness: 0.88, metalness: 0 } },
    { re: /flagstone/i,                        p: { roughness: 0.85, metalness: 0 } },
    { re: /^rug$/i,                            p: { roughness: 1.0,  metalness: 0 } },
    { re: /^sofa$|^3seat$|可变布/i,             p: { roughness: 0.95, metalness: 0 } },
    { re: /steel|aluminium|不锈钢/i,            p: { roughness: 0.32, metalness: 0.9 } },
    { re: /^spotlight$/i,                      p: { roughness: 0.35, metalness: 0.5 } },
    { re: /^lamp$|2109106_043/i,               p: { roughness: 0.28, metalness: 0, env: 1.1 } },
    { re: /leaf|stem|trunk|jaburan|树叶|grass|green/i, p: { roughness: 0.7, metalness: 0, double: true } }
  ];

  const EMISSIVE = [
    { re: /^emissive wall$/i, key: 'cove' },
    { re: /^spotlight$/i, key: 'spot' },
    { re: /^centre table lamp$/i, key: 'tableLamp' },
    { re: /sdt-2800/i, key: 'bubbleLamp' }
  ];

  /** SimLab exports KHR_materials_pbrSpecularGlossiness — turn it into a normal PBR material. */
  function fromSpecGloss(m) {
    const n = new THREE.MeshStandardMaterial({
      name: m.name, color: m.color ? m.color.clone() : 0xffffff, map: m.map || null,
      opacity: m.opacity, transparent: m.transparent, alphaTest: m.alphaTest, side: m.side,
      normalMap: m.normalMap || null, emissive: m.emissive ? m.emissive.clone() : 0x000000,
      emissiveMap: m.emissiveMap || null, roughness: 0.6, metalness: 0
    });
    n.userData = m.userData || {};
    return n;
  }

  /**
   * Walks the loaded model once: hides the front wall, tunes materials, sets shadow flags and
   * collects the meshes the other modules need (curtains, emissive materials).
   */
  V.prepareModel = function prepareModel(root, { renderer, config }) {
    const C = config;
    const info = { curtainMeshes: [], hidden: [], emissive: [], envMaterials: [], stats: { meshes: 0, tris: 0 } };
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const box = new THREE.Box3();
    const cache = new Map();
    root.updateMatrixWorld(true);

    function tune(src) {
      if (cache.has(src)) return cache.get(src);
      let m = src.isGLTFSpecularGlossinessMaterial ? fromSpecGloss(src) : src;
      const name = m.name || '';
      const rule = RULES.find((r) => r.re.test(name));
      if (rule) {
        if (rule.p.roughness !== undefined) m.roughness = rule.p.roughness;
        if (rule.p.metalness !== undefined) m.metalness = rule.p.metalness;
        if (rule.p.double) m.side = THREE.DoubleSide;
      }
      m.userData.envBase = rule && rule.p.env ? rule.p.env : 1;

      if (/^glass/i.test(name)) {                       // window glazing: nearly clear, still reflective
        m.transparent = true; m.opacity = 0.14; m.depthWrite = false; m.roughness = 0.04; m.metalness = 0;
        m.userData.envBase = 1.4; m.userData.noShadow = true;
      }
      if (/^curtain$/i.test(name)) {                    // sheer fabric
        m.transparent = true; m.depthWrite = false; m.roughness = 0.92; m.metalness = 0; m.side = THREE.DoubleSide;
        m.userData.noShadow = true;
      }
      if (m.transparent && !m.userData.noShadow && m.alphaTest === 0) m.userData.noShadow = true;

      for (const k of ['map', 'normalMap', 'emissiveMap']) if (m[k]) m[k].anisotropy = aniso;

      const em = EMISSIVE.find((e) => e.re.test(name));
      if (em) {
        m.emissive = m.color.clone();                   // glow in the material's own warm colour
        m.emissiveIntensity = 0;
        info.emissive.push({ key: em.key, material: m });
      }
      info.envMaterials.push(m);
      cache.set(src, m);
      return m;
    }

    root.traverse((obj) => {
      if (!obj.isMesh) return;
      U.meshBox(obj, box);
      // 1) hide the front wall so the camera can look into the room (matches the reference render)
      if (box.max.z <= C.room.frontWallMaxZ && box.max.x - box.min.x > 2) {
        obj.visible = false; info.hidden.push(obj); return;
      }
      // 2) materials
      const mats = U.materialsOf(obj).map(tune);
      obj.material = Array.isArray(obj.material) ? mats : mats[0];
      const noShadow = mats.some((m) => m.userData.noShadow);
      obj.castShadow = !noShadow;
      obj.receiveShadow = !mats.some((m) => /^glass/i.test(m.name));
      // 3) curtains (found by material name, falls back to the node name)
      let anc = obj, isCurtain = mats.some((m) => /^curtain$/i.test(m.name));
      while (!isCurtain && anc) { isCurtain = /cortina|curtain/i.test(anc.name || ''); anc = anc.parent; }
      if (isCurtain) { obj.castShadow = false; obj.frustumCulled = false; info.curtainMeshes.push(obj); }

      info.stats.meshes++;
      const g = obj.geometry;
      info.stats.tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    });
    return info;
  };
})((window.VEYRA = window.VEYRA || {}));


