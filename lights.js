(function (V) {
  'use strict';
  const U = V.utils;

  /**
   * IMPORTANT — what the GLB contains:  geometry + materials only.
   * SimLab/SketchUp exported the *placeholders* of the render lights (empty nodes called
   * "Rectangle Light ceiling", "IES Light", …) but no light type / intensity / colour, so every
   * light here is a real Three.js light that we PLACE from the model:
   *   - ceiling downlights  <- the "Spotlight*" fixtures (positions read from their meshes)
   *   - LED cove            <- the "Emissive WALL" strip
   *   - table lamp          <- material "centre table lamp"
   *   - bubble floor lamp   <- the "Enscape.PointLight" / "SDT-2800K" glow meshes
   *   - wall sconce         <- "IES Light" placeholder (position in config)
   * The glowing meshes are additionally driven through emissive intensity.
   *
   * Two independent groups:   ARTIFICIAL (all of the above)   and   DAYLIGHT (sun + sky + IBL).
   */
  V.createLighting = function createLighting({ scene, renderer, root, info, config, quality }) {
    const L = config.lighting, A = L.artificial;
    const art = new THREE.Group(); art.name = 'veyra-artificial';
    scene.add(art);
    const artLights = [];            // { light, base }
    const warm = new THREE.Color(A.color);

    function addLight(light, base) { art.add(light); artLights.push({ light, base }); return light; }

    // ---- DAYLIGHT --------------------------------------------------------------------------
    const sun = new THREE.DirectionalLight(L.sun.color, L.sun.intensity);
    const dir = new THREE.Vector3(...L.sun.direction).normalize();
    const sTarget = new THREE.Vector3(...L.sun.target);
    sun.position.copy(sTarget).addScaledVector(dir, L.sun.distance);
    sun.target.position.copy(sTarget);
    sun.castShadow = true;
    sun.shadow.mapSize.set(quality.shadowMap, quality.shadowMap);
    const b = L.sun.shadowBounds;
    Object.assign(sun.shadow.camera, { left: -b, right: b, top: b, bottom: -b, near: 1, far: L.sun.distance * 2 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
    scene.add(sun, sun.target);

    const sky = new THREE.HemisphereLight(L.sky.sky, L.sky.ground, L.sky.intensity);
    scene.add(sky);

    // ---- ARTIFICIAL: downlights from the model ----------------------------------------------
    const spots = [];
    root.traverse((o) => {
      if (!/^spotlight\d*$/.test(U.norm(o.name))) return;
      const bx = new THREE.Box3().setFromObject(o);
      if (bx.isEmpty()) return;
      const c = bx.getCenter(new THREE.Vector3()); c.y = bx.min.y;
      if (!spots.some((p) => p.distanceTo(c) < 0.35)) spots.push(c);        // merge doubled fixtures
    });
    const seat = new THREE.Vector3(4.0, 2.8, 3.6);
    spots.sort((p, q) => p.distanceTo(seat) - q.distanceTo(seat));
    const S = A.spot;
    spots.slice(0, quality.maxSpots).forEach((p) => {
      const sp = new THREE.SpotLight(A.color, S.intensity, 0, S.angle, S.penumbra, 2);
      sp.position.set(p.x, p.y - S.drop, p.z);
      sp.target.position.set(p.x, 0, p.z);
      art.add(sp.target);
      addLight(sp, S.intensity);
    });

    // ---- table lamp, bubble lamp, cove ------------------------------------------------------
    // union of the world boxes of all visible meshes using a material (optionally filtered by their box)
    const boxOfMaterial = (re, accept) => {
      const bx = new THREE.Box3(), tmp = new THREE.Box3(); let found = false;
      root.traverse((o) => {
        if (!o.isMesh || !o.visible || !U.materialsOf(o).some((m) => re.test(m.name))) return;
        U.meshBox(o, tmp);
        if (accept && !accept(tmp)) return;
        bx.union(tmp); found = true;
      });
      return found ? bx : null;
    };
    const tl = boxOfMaterial(/^centre table lamp$/i);
    if (tl) {
      const c = tl.getCenter(new THREE.Vector3()); c.y += 0.04;
      const p = new THREE.PointLight(A.color, A.tableLamp.intensity, A.tableLamp.distance, 2); p.position.copy(c);
      addLight(p, A.tableLamp.intensity);
    }
    const bl = boxOfMaterial(/sdt-2800/i);
    if (bl) {
      const c = bl.getCenter(new THREE.Vector3());
      const p = new THREE.PointLight(A.color, A.bubbleLamp.intensity, A.bubbleLamp.distance, 2); p.position.copy(c);
      addLight(p, A.bubbleLamp.intensity);
    }
    // the same material is also used on a vertical wall strip -> only take the thin ceiling-level mesh
    const cv = boxOfMaterial(/^emissive wall$/i, (b) => b.min.y > 2.5 && b.max.y - b.min.y < 0.1);
    if (cv) {
      const y = cv.min.y - A.cove.below, i = A.cove.inset, c = cv.getCenter(new THREE.Vector3());
      const spots3 = [
        [cv.min.x + i, y, c.z], [cv.max.x - i, y, c.z], [c.x, y, cv.max.z - i]    // left wall, right wall, window wall
      ].slice(0, quality.coves);
      spots3.forEach((pp) => {
        const p = new THREE.PointLight(A.color, A.cove.intensity, A.cove.distance, 2); p.position.set(...pp);
        addLight(p, A.cove.intensity);
      });
    }
    // wall sconce above the painting
    {
      const s = A.sconce;
      const sp = new THREE.SpotLight(A.color, s.intensity, 4, s.angle, s.penumbra, 2);
      sp.position.set(...s.position); sp.target.position.set(...s.aim); art.add(sp.target);
      addLight(sp, s.intensity);
    }

    // ---- state + animation -----------------------------------------------------------------
    const state = { art: 1, day: 1, artMul: 1 };
    const bgDay = new THREE.Color(L.background.day), bgNight = new THREE.Color(L.background.night);
    const bg = new THREE.Color();
    let tweenArt = null, tweenDay = null;

    function apply() {
      artLights.forEach(({ light, base }) => (light.intensity = base * state.art * state.artMul));
      info.emissive.forEach(({ key, material }) => (material.emissiveIntensity = (A.emissive[key] || 1) * state.art));
      sun.intensity = L.sun.intensity * state.day;
      sky.intensity = L.sky.intensity * state.day;
      const env = U.lerp(L.env.night, L.env.day, state.day);
      info.envMaterials.forEach((m) => (m.envMapIntensity = env * (m.userData.envBase || 1)));
      renderer.toneMappingExposure = U.lerp(L.exposure.night, L.exposure.day, state.day);
      bg.copy(bgNight).lerp(bgDay, state.day);
      renderer.setClearColor(bg, 1);
    }
    function tween(key, to, immediate, slot) {
      if (window.gsap && !immediate && !U.prefersReducedMotion()) {
        const prev = slot === 'a' ? tweenArt : tweenDay;
        if (prev) prev.kill();
        const t = gsap.to(state, { [key]: to, duration: 1.1, ease: 'power2.inOut', onUpdate: apply });
        if (slot === 'a') tweenArt = t; else tweenDay = t;
      } else { state[key] = to; apply(); }
    }
    apply();

    return {
      sun, sky, artLights, state, apply,
      setArtificial(on, immediate) { tween('art', on ? 1 : 0, immediate, 'a'); },
      setDaylight(on, immediate) { tween('day', on ? 1 : 0, immediate, 'd'); },
      isArtificialOn: () => state.art > 0.5,
      isDaylightOn: () => state.day > 0.5,
      summary: () => ({
        downlights: artLights.filter((l) => l.light.isSpotLight).length - 1,
        pointLights: artLights.filter((l) => l.light.isPointLight).length,
        emissiveMaterials: info.emissive.length,
        spotsFoundInModel: spots.length
      })
    };
  };
})((window.VEYRA = window.VEYRA || {}));