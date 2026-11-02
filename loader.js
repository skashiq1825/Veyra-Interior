(function (V) {
  'use strict';

  function b64ToBuffer(str) {
    const bin = atob(str);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  /**
   * Loads the GLB. Normal sites use `url`; the single-file preview build embeds the
   * file as base64 in <script id="veyra-glb-b64"> and parses it directly.
   * Works with both the optimised (meshopt + WebP) file and your original export.
   */
  V.loadModel = function ({ url, embeddedId, approxBytes, onProgress }) {
    const report = (p) => onProgress && onProgress(Math.max(0, Math.min(1, p)));
    return new Promise((resolve, reject) => {
      const loader = new THREE.GLTFLoader();
      if (window.MeshoptDecoder) loader.setMeshoptDecoder(window.MeshoptDecoder);

      const el = embeddedId && document.getElementById(embeddedId);
      if (el && el.textContent.trim().length > 1000) {
        report(0.2);
        setTimeout(() => {              // let the loader paint before the heavy synchronous decode
          try {
            let buffer = b64ToBuffer(el.textContent.trim());
            el.textContent = '';        // free the string
            report(0.45);
            const shim = V.shims || {};
            if (shim.glb) buffer = shim.glb(buffer);                  // preview sandbox: textures as data: URIs
            const cib = window.createImageBitmap;
            if (shim.noImageBitmap) window.createImageBitmap = undefined;   // GLTFLoader then uses <img>, not fetch()
            try { loader.parse(buffer, '', (gltf) => { report(1); resolve(gltf); }, reject); }
            finally { if (shim.noImageBitmap) window.createImageBitmap = cib; }
          } catch (err) { reject(err); }
        }, 60);
        return;
      }

      loader.load(
        url,
        (gltf) => { report(1); resolve(gltf); },
        (ev) => {
          const total = ev.lengthComputable && ev.total ? ev.total : approxBytes || 1;
          report((ev.loaded / total) * 0.92);       // the last 8 % = parsing + texture decode
        },
        (err) => reject(err instanceof Error ? err : new Error('Could not load ' + url))
      );
    });
  };
})((window.VEYRA = window.VEYRA || {}));