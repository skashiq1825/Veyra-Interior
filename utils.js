(function (V) {
  'use strict';
  const U = (V.utils = {});

  U.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.deg = (r) => (r * 180) / Math.PI;
  U.rad = (d) => (d * Math.PI) / 180;
  U.query = (k) => new URLSearchParams(window.location.search).get(k);

  U.isMobile = () =>
    window.matchMedia('(pointer: coarse)').matches || Math.min(window.innerWidth, window.innerHeight) < 600;
  U.prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** GLTFLoader turns spaces in node names into "_", so compare names in a normalised form. */
  U.norm = (s) => String(s || '').toLowerCase().replace(/[\s_]+/g, '');

  U.hasWebGL = () => {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  };

  /** World-space bounding box of a mesh (cheap: transforms the geometry box). */
  U.meshBox = (mesh, target) => {
    const g = mesh.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    return (target || new THREE.Box3()).copy(g.boundingBox).applyMatrix4(mesh.matrixWorld);
  };

  U.materialsOf = (mesh) => (Array.isArray(mesh.material) ? mesh.material : [mesh.material]);
})((window.VEYRA = window.VEYRA || {}));