(function (V) {
  'use strict';
  const U = V.utils;

  /** Keeps the horizontal FOV of the 16:9 design on narrow screens (portrait phones). */
  function fitFov(baseV, aspect) {
    const design = 16 / 9;
    if (aspect >= design) return baseV;
    const h = 2 * Math.atan(Math.tan(U.rad(baseV) / 2) * design);
    return Math.min(78, U.deg(2 * Math.atan(Math.tan(h / 2) / aspect)));
  }

  V.createCameraRig = function createCameraRig({ camera, controls, stage, config, reduced, onViewChange }) {
    const views = config.views, bounds = config.room.bounds;
    const bMin = new THREE.Vector3(...bounds.min), bMax = new THREE.Vector3(...bounds.max);
    const FREE = { minA: -Infinity, maxA: Infinity, minP: 0, maxP: Math.PI };
    let current = null, tween = null, baseFov = views.wide.fov, userMoved = false;

    controls.addEventListener('start', () => { userMoved = true; });

    function poseFor(v) {
      const pos = new THREE.Vector3(...v.position), target = new THREE.Vector3(...v.target);
      if (v.cutaway) {
        // camera sits outside the (hidden) front wall; on tall screens move in so the floor edge never shows
        const half = U.rad(fitFov(v.fov, camera.aspect)) / 2;
        pos.z = Math.max(pos.z, -pos.y / Math.tan(half + 0.10));
      }
      return { pos, target, fov: v.fov };
    }
    function setLimits(l) {
      controls.minAzimuthAngle = l.minA; controls.maxAzimuthAngle = l.maxA;
      controls.minPolarAngle = l.minP; controls.maxPolarAngle = l.maxP;
    }
    function limitsFor(v, pose) {
      const s = new THREE.Spherical().setFromVector3(pose.pos.clone().sub(pose.target));
      controls.minDistance = controls.maxDistance = s.radius;      // zoom is disabled; distance stays on the composition
      return {
        minA: s.theta - v.orbit.azimuth, maxA: s.theta + v.orbit.azimuth,
        minP: Math.max(0.05, s.phi - v.orbit.polar), maxP: Math.min(Math.PI - 0.05, s.phi + v.orbit.polar)
      };
    }
    function setPose(pos, target, fov) {
      baseFov = fov;
      camera.position.copy(pos); controls.target.copy(target);
      camera.fov = fitFov(fov, camera.aspect); camera.updateProjectionMatrix();
      controls.update();
    }
    function release(v, pose) {
      controls.minDistance = 0; controls.maxDistance = Infinity;
      setLimits(limitsFor(v, pose));
      controls.enabled = true; controls.update();
    }
    function stopTween() { if (tween) { tween.kill(); tween = null; } }

    function goTo(name, opts = {}) {
      const v = views[name]; if (!v) return Promise.resolve();
      stopTween(); userMoved = false;
      current = name;
      onViewChange && onViewChange(name, v);
      const pose = poseFor(v);
      controls.enabled = false; setLimits(FREE); controls.minDistance = 0; controls.maxDistance = Infinity;

      if (opts.immediate || reduced || !window.gsap) { setPose(pose.pos, pose.target, pose.fov); release(v, pose); return Promise.resolve(); }

      const from = { pos: camera.position.clone(), target: controls.target.clone(), fov: baseFov };
      const p = { t: 0 }, pos = new THREE.Vector3(), tgt = new THREE.Vector3();
      return new Promise((resolve) => {
        tween = gsap.to(p, {
          t: 1, duration: opts.duration || config.transitionSeconds, ease: opts.ease || 'power3.inOut',
          onUpdate() {
            pos.lerpVectors(from.pos, pose.pos, p.t);
            tgt.lerpVectors(from.target, pose.target, p.t);
            setPose(pos, tgt, U.lerp(from.fov, pose.fov, p.t));
          },
          onComplete() { tween = null; release(v, pose); resolve(); }
        });
      });
    }

    /** Cinematic opening: starts higher and further back, then settles into the wide view. */
    function intro() {
      const i = config.intro;
      setPose(new THREE.Vector3(...i.position), new THREE.Vector3(...i.target), i.fov);
      return goTo('wide', { duration: i.duration, ease: 'power3.out' });
    }

    /** Called every frame: inside views can never leave the room. */
    function update() {
      const v = views[current];
      if (v && v.bounds && controls.enabled) camera.position.clamp(bMin, bMax);
    }

    stage.onResize(() => {
      camera.fov = fitFov(baseFov, camera.aspect); camera.updateProjectionMatrix();
      const v = views[current];
      if (v && v.cutaway && !userMoved && !tween) { const p = poseFor(v); setPose(p.pos, p.target, p.fov); release(v, p); }
    });

    return { goTo, intro, update, get current() { return current; }, views };
  };
})((window.VEYRA = window.VEYRA || {}));