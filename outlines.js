(function (V) {
  'use strict';

  /**
   * VEYRA Architectural Outlines
   *
   * Creates subtle architectural edge lines without changing
   * original geometry, materials, textures or lighting.
   */

  V.createOutlines = function createOutlines(root, options = {}) {
    const settings = {
      threshold: options.threshold ?? 28,
      architecturalOpacity: options.architecturalOpacity ?? 0.68,
      furnitureOpacity: options.furnitureOpacity ?? 0.38,
      color: options.color ?? 0x171713,
      enabled: options.enabled ?? true
    };

 const architecturalMaterial = new THREE.LineBasicMaterial({
  color: 0x080807,
  transparent: true,
  opacity: 1,
  depthTest: true,
  depthWrite: false,
  toneMapped: false
});

const furnitureMaterial = new THREE.LineBasicMaterial({
  color: 0x080807,
  transparent: true,
  opacity: 0.85,
  depthTest: true,
  depthWrite: false,
  toneMapped: false
});

    const generatedLines = [];

    // Surfaces that should not receive outlines.
   const EXCLUDED = /curtain|cortina|leaf|grass|trunk|stem/i;

    // Names commonly used for furniture objects.
    const FURNITURE = /sofa|chair|table|lamp|cabinet|shelf|stool|bed|pillow|cushion/i;

    root.updateMatrixWorld(true);

    root.traverse((obj) => {
      if (!obj.isMesh || !obj.geometry) return;
      if (!obj.geometry.attributes.position) return;

      // Prevent duplicate outline generation.
      if (obj.userData.veyraOutline) return;

      // Ignore excluded materials.
      const materials = Array.isArray(obj.material)
        ? obj.material
        : [obj.material];

      if (materials.some((m) => {
        if (!m) return false;

        const name = m.name || '';

        return EXCLUDED.test(name) || m.transparent;
      })) return;

      // Ignore invisible objects.
      if (!obj.visible) return;

      // Generate only meaningful sharp edges.
      const edges = new THREE.EdgesGeometry(
  obj.geometry,
  10
);

      if (!edges.attributes.position || edges.attributes.position.count === 0) {
        edges.dispose();
        return;
      }

      const objectName = obj.name || '';

      const isFurniture = FURNITURE.test(objectName);

      const line = new THREE.LineSegments(
        edges,
        isFurniture ? furnitureMaterial : architecturalMaterial
      );
line.position.set(0, 0, 0);
line.scale.setScalar(1.001);
      line.name = 'veyra-outline';
      line.renderOrder = 2;
      line.frustumCulled = false;

      // Keep the original mesh transform.
      // The line geometry is in the same local coordinate space.
      obj.add(line);

      obj.userData.veyraOutline = line;

      generatedLines.push({
        mesh: obj,
        line,
        geometry: edges
      });
    });

    let enabled = settings.enabled;

    generatedLines.forEach(({ line }) => {
      line.visible = enabled;
    });

    return {
      setEnabled(value) {
        enabled = Boolean(value);

        generatedLines.forEach(({ line }) => {
          line.visible = enabled;
        });
      },

      toggle() {
        this.setEnabled(!enabled);
      },

      get enabled() {
        return enabled;
      },

      get count() {
        return generatedLines.length;
      },

      dispose() {
        generatedLines.forEach(({ mesh, line, geometry }) => {
          mesh.remove(line);
          geometry.dispose();
          delete mesh.userData.veyraOutline;
        });

        architecturalMaterial.dispose();
        furnitureMaterial.dispose();

        generatedLines.length = 0;
      }
    };
  };

})((window.VEYRA = window.VEYRA || {}));