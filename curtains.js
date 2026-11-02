(function (V) {
  'use strict';

  /**
   * WHY THIS IS A VERTEX SHADER (and not a rigid rotation):
   * your curtain is a pleated sheet, 8 panels of 96–104 triangles, each a zig-zag profile extruded
   * top→bottom with ONLY two vertex rows (floor and rail). Any per-vertex deformation of two rows
   * is a straight shear, so we first re-tessellate each panel into N horizontal bands (same
   * silhouette, same UVs, same material), then bend it in the vertex shader:
   *   - the rail (top) stays pinned, the hem moves most        -> looks hung, not floating
   *   - three slow sine waves travelling along the curtain      -> soft, non-repeating billow
   *   - a very slow "gust" envelope                             -> breathing, never mechanical
   * The displacement is evaluated in WORLD space (metres) and converted back to each mesh's local
   * space, so it works however the SketchUp transforms / mesh quantisation scaled the model.
   */
  const VERT_PARS = /* glsl */ `
    uniform float uTime; uniform float uAmp; uniform float uBottom; uniform float uTop; uniform mat3 uInv;`;
  const VERT_MAIN = /* glsl */ `
    vec4 vcW = modelMatrix * vec4( transformed, 1.0 );
    float vcH = clamp( ( vcW.y - uBottom ) / max( uTop - uBottom, 0.001 ), 0.0, 1.0 );   // 0 hem … 1 rail
    float vcHang = pow( 1.0 - vcH, 1.6 );
    float vcGust = 0.55 + 0.45 * sin( uTime * 0.21 + 1.3 );
    float vcWave = sin( uTime * 0.90 + vcW.x * 2.4 + vcH * 1.7 ) * 0.60
                 + sin( uTime * 1.70 - vcW.x * 4.1 + vcH * 3.1 ) * 0.28
                 + sin( uTime * 0.43 + vcW.x * 1.1 )             * 0.40;
    float vcSide = sin( uTime * 0.70 + vcW.x * 3.0 + vcH * 2.0 ) * 0.35;
    vec3 vcDisp = vec3( vcSide * 0.35, 0.0, vcWave ) * uAmp * vcHang * vcGust;           // metres
    transformed += uInv * vcDisp;`;

  /** Splits every triangle that spans the height axis into `rows` bands (keeps winding, normals, UVs). */
  function subdivide(geometry, axis, rows) {
    const pos = geometry.attributes.position, nor = geometry.attributes.normal, uv = geometry.attributes.uv;
    const idx = geometry.index;
    const triCount = (idx ? idx.count : pos.count) / 3;
    geometry.computeBoundingBox();
    const lo = geometry.boundingBox.min.getComponent(axis);
    const span = geometry.boundingBox.max.getComponent(axis) - lo;
    if (span <= 0) return null;

    const P = [], N = [], T = [];
    const get = (i) => ({
      p: [pos.getX(i), pos.getY(i), pos.getZ(i)],
      n: nor ? [nor.getX(i), nor.getY(i), nor.getZ(i)] : [0, 0, 1],
      t: uv ? [uv.getX(i), uv.getY(i)] : [0, 0]
    });
    const mix = (a, b, s) => ({
      p: a.p.map((v, k) => v + (b.p[k] - v) * s),
      n: a.n.map((v, k) => v + (b.n[k] - v) * s),
      t: a.t.map((v, k) => v + (b.t[k] - v) * s)
    });
    const emit = (...vs) => vs.forEach((v) => { P.push(...v.p); N.push(...v.n); T.push(...v.t); });
    let split = 0;

    for (let f = 0; f < triCount; f++) {
      const ids = idx ? [idx.getX(f * 3), idx.getX(f * 3 + 1), idx.getX(f * 3 + 2)] : [f * 3, f * 3 + 1, f * 3 + 2];
      const v = ids.map(get);
      const h = v.map((x) => (x.p[axis] - lo) / span);
      let apex = -1;
      for (let k = 0; k < 3; k++) {
        const a = h[(k + 1) % 3], b = h[(k + 2) % 3];
        if (Math.abs(a - b) < 0.02 && Math.abs(h[k] - a) > 0.5) apex = k;
      }
      if (apex < 0) { emit(v[0], v[1], v[2]); continue; }      // cap / sliver: keep as is
      split++;
      const b0 = v[(apex + 1) % 3], b1 = v[(apex + 2) % 3], ap = v[apex];   // same cyclic order => same winding
      for (let r = 0; r < rows; r++) {
        const s0 = r / rows, s1 = (r + 1) / rows;
        const p0a = mix(b0, ap, s0), p1a = mix(b1, ap, s0);
        if (r < rows - 1) {
          const p0b = mix(b0, ap, s1), p1b = mix(b1, ap, s1);
          emit(p0a, p1a, p1b, p0a, p1b, p0b);
        } else emit(p0a, p1a, ap);
      }
    }
    if (!split) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(T, 2));
    return g;
  }

  V.createCurtains = function createCurtains(meshes, { config, reduced }) {
    const result = { count: 0, animated: false, update() {}, setAmplitude() {}, setSpeed() {}, note: '' };
    if (!meshes.length) {
      result.note = 'No curtain meshes found (expected material "curtain" / node "cortina"). Use ?debug to list names.';
      console.warn('[VEYRA]', result.note);
      return result;
    }
    const uTime = { value: 0 };
    const uniformSets = [];
    let bottom = Infinity, top = -Infinity;
    meshes.forEach((m) => {
      m.updateWorldMatrix(true, false);
      const b = V.utils.meshBox(m);
      bottom = Math.min(bottom, b.min.y); top = Math.max(top, b.max.y);
    });
    const rows = config.curtain.rows;

    meshes.forEach((mesh) => {
      mesh.updateWorldMatrix(true, false);
      // which local axis is "up" in the world?
      const e = mesh.matrixWorld.elements;
      const ups = [Math.abs(e[1]), Math.abs(e[5]), Math.abs(e[9])];
      const axis = ups.indexOf(Math.max(...ups));
      const g = subdivide(mesh.geometry, axis, rows);
      if (g) { mesh.geometry.dispose(); mesh.geometry = g; }
      else console.warn('[VEYRA] curtain mesh could not be re-tessellated:', mesh.name);

      const inv = new THREE.Matrix3().setFromMatrix4(mesh.matrixWorld).invert();
      const uniforms = {
        uTime, uAmp: { value: config.curtain.amplitude }, uBottom: { value: bottom }, uTop: { value: top }, uInv: { value: inv }
      };
      uniformSets.push(uniforms);
      const mat = mesh.material.clone();
      mat.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\n' + VERT_PARS)
          .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + VERT_MAIN);
      };
      mat.customProgramCacheKey = () => 'veyra-curtain-v1';
      mesh.material = mat;
      mesh.renderOrder = 2;
      result.count++;
    });

    let speed = config.curtain.speed;
    let amp = reduced ? 0 : config.curtain.amplitude;
    const apply = () => uniformSets.forEach((u) => (u.uAmp.value = amp));
    apply();
    result.animated = amp > 0;
    result.update = (t) => { uTime.value = t * speed; };
    result.setAmplitude = (a) => { amp = a; apply(); result.animated = a > 0; };
    result.setSpeed = (s) => { speed = s; };
    result.note = 'Curtains re-tessellated into ' + rows + ' bands and bent in a vertex shader.';
    return result;
  };
})((window.VEYRA = window.VEYRA || {}));