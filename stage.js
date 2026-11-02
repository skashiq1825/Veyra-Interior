(function (V) {
  'use strict';
  const U = V.utils;

  /** Renderer, scene, camera, orbit controls, environment, resize + adaptive resolution. */
  V.createStage = function createStage(container, canvas) {
    const C = V.CONFIG;
    const mobile = U.isMobile();
    const Q = mobile ? C.quality.mobile : C.quality.desktop;

    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: !mobile, powerPreference: 'high-performance'
    });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = C.lighting.exposure.day;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;          // the room is static: render the shadow map once
    renderer.setClearColor(C.lighting.background.day, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(C.views.wide.fov, 1, 0.1, 60);

    // Neutral studio-like IBL gives the glossy floor, marble and glass something to reflect.
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.4;                     // restrained
    controls.enablePan = false;
    controls.enableZoom = false;                    // wheel keeps scrolling the page; views are button-driven
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    canvas.style.touchAction = 'pan-y';             // horizontal drag = look around, vertical swipe = scroll page

    // ---- sizing ----------------------------------------------------------------------------
    let pixelRatio = Math.min(window.devicePixelRatio || 1, Q.maxPixelRatio);
    const maxPixelRatio = pixelRatio;
    const listeners = [];
    function resize() {
      const w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      listeners.forEach((fn) => fn(camera.aspect));
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(container);
    else window.addEventListener('resize', resize);
    resize();

    // ---- loop with adaptive pixel ratio ---------------------------------------------------
    let running = false, visible = true, raf = 0, last = 0, acc = 0, frames = 0;
    const tickFns = [];
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = now - last; last = now;
      if (dt < 500) {                                // ignore tab-switch gaps
        acc += dt; frames++;
        if (acc > 2000) {                            // every ~2 s: if slow, drop resolution a little
          const avg = acc / frames;
          if (avg > 24 && pixelRatio > 1) { pixelRatio = Math.max(1, pixelRatio - 0.25); resize(); }
          acc = 0; frames = 0;
        }
      }
      controls.update();
      tickFns.forEach((fn) => fn(now / 1000));
      renderer.render(scene, camera);
    }
    function start() { if (!running && visible) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
    function stop() { running = false; cancelAnimationFrame(raf); }
    function setVisible(v) { visible = v; v ? start() : stop(); }

    document.addEventListener('visibilitychange', () => setVisible(!document.hidden));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => setVisible(e.isIntersecting && !document.hidden), { threshold: 0.02 }).observe(container);
    }

    return {
      renderer, scene, camera, controls, mobile, quality: Q,
      onResize: (fn) => listeners.push(fn),
      onTick: (fn) => tickFns.push(fn),
      start, stop,
      get maxPixelRatio() { return maxPixelRatio; }
    };
  };
})((window.VEYRA = window.VEYRA || {}));