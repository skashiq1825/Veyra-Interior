(function (V) {
  'use strict';

  /**
   * Swaps a placeholder block for YOUR optimised GLB.
   *   CONFIG.furniture = { sofa: { url: 'sofa.glb', placeholder: 'placeholder-sofa', rotationY: 0 }, ... }
   * The model is scaled uniformly to fit inside the placeholder's footprint/height, centred on it and
   * placed on its floor level, so you do not have to know the model's own units.
   * If a file fails to load the placeholder simply stays (the site keeps working).
   */
  V.loadFurniture = async function loadFurniture(root, list, onProgress) {
    const entries = Object.entries(list || {}).filter(([, f]) => f && f.url);
    if (!entries.length) return [];
    const loader = new THREE.GLTFLoader();
    if (window.MeshoptDecoder) loader.setMeshoptDecoder(window.MeshoptDecoder);
    const report = [];
    let done = 0;
    for (const [key, f] of entries) {
      try {
        const ph = root.getObjectByName(f.placeholder || 'placeholder-' + key);
        if (!ph) throw new Error('placeholder not found');
        const gltf = await new Promise((res, rej) => loader.load(f.url, res, undefined, rej));
        const obj = gltf.scene;
        if (f.rotationY) obj.rotation.y = f.rotationY;
        obj.updateMatrixWorld(true);
        const target = new THREE.Box3().setFromObject(ph), tSize = target.getSize(new THREE.Vector3());
        const own = new THREE.Box3().setFromObject(obj), oSize = own.getSize(new THREE.Vector3());
        const s = Math.min(tSize.x / oSize.x, tSize.y / oSize.y, tSize.z / oSize.z) * (f.fill || 1);
        obj.scale.multiplyScalar(s); obj.updateMatrixWorld(true);
        const fitted = new THREE.Box3().setFromObject(obj);
        const tc = target.getCenter(new THREE.Vector3()), fc = fitted.getCenter(new THREE.Vector3());
        obj.position.add(new THREE.Vector3(tc.x - fc.x, target.min.y - fitted.min.y, tc.z - fc.z));
        obj.name = key;
        ph.parent.add(obj); ph.parent.remove(ph);
        report.push(key + ': ok (scale ' + s.toFixed(3) + ')');
      } catch (err) {
        console.warn('[VEYRA] furniture "' + key + '" kept as placeholder:', err.message || err);
        report.push(key + ': placeholder');
      }
      onProgress && onProgress(++done / entries.length);
    }
    return report;
  };
})((window.VEYRA = window.VEYRA || {}));