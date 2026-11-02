(function (V) {
  'use strict';
  const U = V.utils, C = V.CONFIG;

  document.addEventListener('DOMContentLoaded', () => {
    const reduced = U.prefersReducedMotion();
    const viewNames = Object.keys(C.views);
    let rig = null, lighting = null;

    const ui = V.createUI({
      views: C.views,
      onView: (name) => rig && rig.goTo(name),
      onToggle: (name, on) => {
        if (!lighting) return;
        if (name === 'lights') lighting.setArtificial(on); else lighting.setDaylight(on);
        ui.setToggle(name, on);
      }
    });

    if (!U.hasWebGL() || !window.THREE || !window.THREE.GLTFLoader) {
      ui.fallback('Your browser could not start the 3D viewer. Please try a recent version of Chrome, Safari, Edge or Firefox.');
      return;
    }

    const stage = V.createStage(document.getElementById('stage'), document.getElementById('scene'));
    const { renderer, scene, camera, controls } = stage;

    renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault(); stage.stop();
      ui.fallback('The graphics context was lost. Reload the page to restore the 3D view.');
    });

    async function boot() {
      try {
        let root;
        if (C.source === 'procedural') {
          ui.setProgress(0.3);
          root = V.buildRoom();
          const report = await V.loadFurniture(root, C.furniture, (p) => ui.setProgress(0.3 + p * 0.6));
          if (report.length) console.info('[VEYRA] furniture:', report.join(' | '));
        } else {
          const gltf = await V.loadModel({
            url: C.model.url, embeddedId: C.model.embeddedId, approxBytes: C.model.approxBytes, onProgress: ui.setProgress
          });
          root = gltf.scene;
        }
        scene.add(root);
        root.updateMatrixWorld(true);

        const info = V.prepareModel(root, { renderer, config: C });
        const curtains = V.createCurtains(info.curtainMeshes, { config: { ...C, curtain: { ...C.curtain, rows: stage.quality.curtainRows } }, reduced });
        lighting = V.createLighting({ scene, renderer, root, info, config: C, quality: stage.quality });
        rig = V.createCameraRig({ camera, controls, stage, config: C, reduced, onViewChange: (n) => ui.setView(n) });

        stage.onTick((t) => { curtains.update(t); rig.update(); });
        ui.setView('wide'); ui.setToggle('lights', true); ui.setToggle('daylight', true);
        rig.goTo('wide', { immediate: true });

        // compile shaders + render the static shadow map behind the loader, so the reveal never stutters
        renderer.compile(scene, camera);
        renderer.shadowMap.needsUpdate = true;
        renderer.render(scene, camera);
        stage.start();

        V.debug.ctx = { root, scene, camera, controls, renderer, lighting, curtains, info, config: C };
        console.info('[VEYRA] model ready —', info.stats.meshes, 'meshes,', Math.round(info.stats.tris), 'triangles,',
          'curtain panels:', curtains.count, '| ' + curtains.note, '| lights:', lighting.summary(),
          '| hidden front-wall meshes:', info.hidden.length, '| debug helpers: VEYRA.debug.dump() / find() / camera()');
        if (U.query('debug') !== null) V.debug.panel();

        ui.setProgress(1);
        await ui.reveal();
        rig.intro();
      } catch (err) {
        console.error('[VEYRA] failed to load model', err);
        ui.showError('The room could not be loaded (' + (err && err.message ? err.message : err) + '). Check that ' + C.model.url + ' exists and is served over http(s).', boot);
      }
    }
    boot();
  });
})((window.VEYRA = window.VEYRA || {}));