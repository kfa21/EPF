/* =========================================================================
   Interactive 3D massing model of the M_NU10 EPF plot.
   Built procedurally with three.js (r149, UMD build, vendored locally).
   1 unit = 1 metre. Indicative layout only — not a general arrangement.
   ========================================================================= */

(function () {
  'use strict';

  const canvas = document.getElementById('viewport');
  if (!canvas || typeof THREE === 'undefined') return;

  const wrap = canvas.parentElement;
  const loadingEl = document.getElementById('viewerLoading');
  const labelsEl = document.getElementById('labels');
  const infoEl = document.getElementById('viewerInfo');
  const hintEl = document.getElementById('viewerHint');
  const chipsEl = document.getElementById('viewChips');

  /* ------------------------------------------------------------ renderer */

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x62706c, 300, 780);

  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.6, 2200);

  /* ------------------------------------------------------------ sky */

  const skyGeo = new THREE.SphereGeometry(1000, 24, 14);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(0x0b1622) },
      mid: { value: new THREE.Color(0x24394c) },
      bottom: { value: new THREE.Color(0x6b7368) }
    },
    vertexShader: `
      varying vec3 vP;
      void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP;
      void main(){
        float h = normalize(vP).y;
        vec3 c = mix(bottom, mid, smoothstep(-0.05, 0.22, h));
        c = mix(c, top, smoothstep(0.15, 0.75, h));
        gl_FragColor = vec4(c, 1.0);
      }`
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.frustumCulled = false;
  scene.add(sky);

  /* ------------------------------------------------------------ lights */

  const hemi = new THREE.HemisphereLight(0x9db9d2, 0x5c5344, 0.34);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffeccf, 1.85);
  sun.position.set(120, 190, -110);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -230;
  sun.shadow.camera.right = 230;
  sun.shadow.camera.top = 190;
  sun.shadow.camera.bottom = -190;
  sun.shadow.camera.near = 40;
  sun.shadow.camera.far = 620;
  sun.shadow.bias = -0.0007;
  sun.shadow.normalBias = 0.6;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x9dc0e0, 0.18);
  fill.position.set(-150, 90, 160);
  scene.add(fill);

  /* ------------------------------------------------------------ materials */

  const M = (c, rough, metal) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: metal });

  const MAT = {
    steel: M(0x93a0ad, 0.52, 0.72),
    darkSteel: M(0x46525f, 0.6, 0.6),
    vessel: M(0xe6e2d6, 0.64, 0.22),
    vesselAlt: M(0xd8d3c4, 0.66, 0.22),
    insulated: M(0xece8dc, 0.78, 0.1),
    pipe: M(0xc0c9d2, 0.42, 0.78),
    pipeGas: M(0xd6dee5, 0.42, 0.72),
    pipeWater: M(0x88a9a9, 0.5, 0.6),
    concrete: M(0xb9b4a8, 0.96, 0.04),
    concreteDark: M(0x9c9789, 0.96, 0.04),
    frame: M(0x404c58, 0.66, 0.55),
    tank: M(0xdfe3e4, 0.5, 0.32),
    tankRoof: M(0xc9ced1, 0.55, 0.4),
    building: M(0xdfe2e5, 0.8, 0.08),
    buildingDark: M(0x99a3ad, 0.78, 0.2),
    glass: M(0x2b3d4f, 0.18, 0.55),
    container: M(0xd9dde0, 0.72, 0.16),
    containerBlue: M(0x4b6f8f, 0.72, 0.2),
    containerGrey: M(0xb0b6ba, 0.75, 0.15),
    road: M(0x3b4048, 0.96, 0.02),
    gravel: M(0xa79e8c, 0.98, 0.02),
    desert: M(0xb2a184, 1.0, 0.0),
    flame: new THREE.MeshBasicMaterial({ color: 0xffa83a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
    hot: new THREE.MeshStandardMaterial({ color: 0xffd08a, emissive: 0xff8c1a, emissiveIntensity: 0.9, roughness: 0.5 }),
    accentM: M(0x4f86b8, 0.7, 0.2),
    accentN: M(0x5f9376, 0.7, 0.2),
    accentY: M(0xc08a45, 0.7, 0.2)
  };

  /* ------------------------------------------------------------ primitives */

  const root = new THREE.Group();
  scene.add(root);

  // soft contact shadow, drawn as a decal under each equipment item
  const blobTex = (function () {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(0,0,0,0.55)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.26)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const blobMat = new THREE.MeshBasicMaterial({
    map: blobTex, transparent: true, depthWrite: false, opacity: 0.85, color: 0x1a1a1a
  });

  function contactShadow(w, d, x, z) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), blobMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x || 0, 0.09, z || 0);
    m.renderOrder = 1;
    return m;
  }

  function box(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function cyl(rt, rb, h, seg, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20, 1, false), mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function seg(p1, p2, r, mat) {
    const a = new THREE.Vector3(p1[0], p1[1], p1[2]);
    const b = new THREE.Vector3(p2[0], p2[1], p2[2]);
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12, 1, false), mat);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    m.castShadow = true;
    return m;
  }

  function ground(w, d, x, z, y, mat) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y || 0.01, z);
    m.receiveShadow = true;
    return m;
  }

  /* ------------------------------------------------------------ textures */

  function noiseTexture(size, base, spread, dots, dotColor) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.fillStyle = base;
    g.fillRect(0, 0, size, size);
    for (let i = 0; i < dots; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * spread + 0.4;
      g.globalAlpha = 0.05 + Math.random() * 0.16;
      g.fillStyle = dotColor;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  const sandTex = noiseTexture(256, '#86775c', 2.4, 2600, '#6a5e48');
  sandTex.repeat.set(90, 60);
  const gravelTex = noiseTexture(256, '#7c7563', 2.0, 1800, '#645d4e');
  gravelTex.repeat.set(26, 16);

  const sandMat = new THREE.MeshStandardMaterial({ map: sandTex, color: 0xffffff, roughness: 1, metalness: 0 });
  const gravelMat = new THREE.MeshStandardMaterial({ map: gravelTex, color: 0xffffff, roughness: 0.98, metalness: 0 });

  /* ------------------------------------------------------------ ground */

  root.add(ground(920, 700, 0, 0, 0, sandMat));

  // plant platform (compacted gravel)
  root.add(ground(372, 176, -6, 0, 0.02, gravelMat));

  // perimeter roads
  const roadMat = MAT.road;
  function road(w, d, x, z) {
    const m = ground(w, d, x, z, 0.06, roadMat);
    root.add(m);
    return m;
  }
  road(372, 7, -6, -50);            // main east-west access
  road(372, 6, -6, 56);             // south perimeter road
  road(6, 106, -112, 3);            // between Mishrif and NU
  road(6, 106, -56, 3);             // between NU and Yamama
  road(6, 106, 3, 3);               // east of Yamama
  road(6, 106, 48, 3);              // to export area
  road(118, 6, 110, -50);           // site access to camp
  road(6, 96, 168, 8);              // east perimeter

  // plot perimeter fence line (thin kerb, not a fill)
  const kerbMat = MAT.concreteDark;
  root.add(box(372, 0.5, 0.4, kerbMat, -6, 0.25, -88));
  root.add(box(372, 0.5, 0.4, kerbMat, -6, 0.25, 88));
  root.add(box(0.4, 0.5, 176, kerbMat, -192, 0.25, 0));
  root.add(box(0.4, 0.5, 176, kerbMat, 180, 0.25, 0));

  /* ------------------------------------------------------------ tagging */

  const pickRoot = [];
  function tag(obj, info) {
    obj.userData.info = info;
    pickRoot.push(obj);
    return obj;
  }

  /* ------------------------------------------------------------ equipment builders */

  // horizontal vessel on a skid, axis along X
  function vessel(opts) {
    const g = new THREE.Group();
    const r = opts.dia / 2;
    const len = opts.len;
    const skidH = opts.skidH === undefined ? 0.9 : opts.skidH;
    const mat = opts.mat || MAT.vessel;

    g.add(contactShadow(len + 4, opts.dia + 4, 0, 0));

    // skid frame
    g.add(box(len + 1.4, skidH, opts.dia + 1.6, MAT.frame, 0, skidH / 2, 0));
    g.add(box(len + 1.4, 0.12, opts.dia + 1.7, MAT.darkSteel, 0, skidH, 0));

    const cy = skidH + r + 0.18;
    const shell = cyl(r, r, len, 24, mat, 0, cy, 0);
    shell.rotation.z = Math.PI / 2;
    g.add(shell);

    [1, -1].forEach((s) => {
      const head = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12), mat);
      head.scale.set(0.58, 1, 1);
      head.position.set((s * len) / 2, cy, 0);
      head.castShadow = true;
      g.add(head);
    });

    // saddles
    [0.32, -0.32].forEach((t) => {
      g.add(box(0.55, r * 0.7, r * 1.8, MAT.darkSteel, len * t, skidH + r * 0.35, 0));
    });

    // nozzles
    g.add(cyl(0.16, 0.16, 0.7, 10, MAT.pipe, -len * 0.18, cy + r + 0.26, 0));
    g.add(cyl(0.16, 0.16, 0.7, 10, MAT.pipe, len * 0.18, cy + r + 0.26, 0));
    g.add(cyl(0.12, 0.12, 0.9, 8, MAT.pipe, 0, skidH + 0.1, r * 0.9));

    // ladder + platform
    g.add(box(0.08, r * 1.7, 0.08, MAT.steel, len * 0.44, cy - r * 0.15, r * 0.72));
    g.add(box(0.08, r * 1.7, 0.08, MAT.steel, len * 0.44, cy - r * 0.15, -r * 0.72));
    for (let i = 0; i < 6; i++) {
      g.add(box(0.06, 0.06, r * 1.4, MAT.steel, len * 0.44, cy - r * 0.8 + i * r * 0.28, 0));
    }

    if (opts.insulation) {
      const band = cyl(r + 0.06, r + 0.06, len * 0.9, 24, MAT.insulated, 0, cy, 0);
      band.rotation.z = Math.PI / 2;
      g.add(band);
    }

    g.position.set(opts.x, 0, opts.z);
    if (opts.info) tag(g, opts.info);
    return g;
  }

  // vertical field-erected storage tank with cone roof
  function tank(o) {
    const g = new THREE.Group();
    const r = o.dia / 2;
    const h = o.h;
    g.add(contactShadow(o.dia * 1.22, o.dia * 1.22, 0, 0));
    g.add(cyl(r, r, h, 28, o.mat || MAT.tank, 0, h / 2 + 0.3, 0));
    g.add(cyl(r * 1.01, r * 1.01, 0.5, 28, MAT.concrete, 0, 0.25, 0)); // ring wall
    if (o.band) {
      g.add(cyl(r + 0.08, r + 0.08, 0.9, 28, o.band, 0, h * 0.46, 0));
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(r * 1.04, h * 0.12, 28), MAT.tankRoof);
    roof.position.set(0, h + 0.3 + h * 0.06, 0);
    roof.castShadow = true;
    g.add(roof);

    // shell courses
    for (let i = 1; i < 4; i++) {
      const ring = cyl(r + 0.05, r + 0.05, 0.16, 28, MAT.steel, 0, 0.3 + (h * i) / 4, 0);
      g.add(ring);
    }
    // top rail
    const rail = new THREE.Mesh(new THREE.TorusGeometry(r * 1.0, 0.05, 6, 32), MAT.steel);
    rail.rotation.x = Math.PI / 2;
    rail.position.y = h + 0.35;
    g.add(rail);

    // stair tower (simplified spiral)
    const steps = 22;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 1.7;
      const yy = 0.4 + (i / steps) * h;
      const rr = r + 0.75;
      const st = box(1.5, 0.07, 0.62, MAT.steel, Math.cos(a) * rr, yy, Math.sin(a) * rr);
      st.rotation.y = -a;
      g.add(st);
    }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 1.7;
      const yy = (i / 10) * h;
      g.add(box(0.09, h / 10 + 0.4, 0.09, MAT.steel, Math.cos(a) * (r + 0.75), yy + h / 20, Math.sin(a) * (r + 0.75)));
    }

    // nozzles / mixer
    g.add(cyl(0.22, 0.22, 1.0, 10, MAT.pipe, r * 0.7, 1.2, 0));

    g.position.set(o.x, 0, o.z);
    if (o.info) tag(g, o.info);
    return g;
  }

  // indirect water-bath heater with stack
  function heater(o) {
    const g = new THREE.Group();
    g.add(contactShadow(7, 7, 0, 0));
    g.add(box(4.2, 0.35, 4.2, MAT.concrete, 0, 0.18, 0));
    g.add(cyl(1.85, 1.85, 5.4, 22, MAT.insulated, 0, 3.1, 0));
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.95, 1.5, 22), MAT.vesselAlt);
    top.position.y = 6.55;
    top.castShadow = true;
    g.add(top);
    g.add(cyl(0.42, 0.42, 2.4, 12, MAT.darkSteel, 0.7, 8.2, 0.5));
    // burner front
    g.add(box(1.1, 1.0, 1.1, MAT.darkSteel, 0, 1.2, 2.0));
    // ladder
    g.add(box(0.07, 6.2, 0.07, MAT.steel, -1.5, 3.4, 1.5));
    g.add(box(0.07, 6.2, 0.07, MAT.steel, -1.5, 3.4, 0.9));
    for (let i = 0; i < 9; i++) g.add(box(0.06, 0.05, 0.62, MAT.steel, -1.5, 0.6 + i * 0.68, 1.2));
    g.position.set(o.x, 0, o.z);
    if (o.info) tag(g, o.info);
    return g;
  }

  // pump / compressor skid
  function pumpSkid(o) {
    const g = new THREE.Group();
    const w = o.w || 6.4;
    const d = o.d || 2.8;
    g.add(contactShadow(w + 2.5, d + 2.5, 0, 0));
    g.add(box(w, 0.34, d, MAT.frame, 0, 0.34, 0));
    const body = cyl(0.46, 0.46, 1.7, 16, MAT.pipe, -w * 0.22, 1.05, 0);
    body.rotation.z = Math.PI / 2;
    g.add(body);
    g.add(box(2.0, 1.1, 1.2, MAT.darkSteel, w * 0.16, 1.1, 0));      // motor
    g.add(box(0.5, 0.35, 0.35, MAT.steel, -w * 0.05, 1.0, 0));       // coupling guard
    g.add(cyl(0.16, 0.16, 1.8, 10, MAT.pipe, -w * 0.36, 1.9, 0));    // discharge
    g.add(cyl(0.18, 0.18, 1.2, 10, MAT.pipe, -w * 0.36, 1.4, d * 0.22));
    g.add(box(0.9, 0.7, 0.5, MAT.steel, w * 0.34, 0.85, 0));         // local panel
    g.position.set(o.x, 0, o.z);
    if (o.rot) g.rotation.y = o.rot;
    if (o.info) tag(g, o.info);
    return g;
  }

  // fin-fan air cooler
  function airCooler(o) {
    const g = new THREE.Group();
    g.add(contactShadow((o.w || 7) + 2, (o.d || 5) + 2, 0, 0));
    g.add(box(o.w || 7, 1.5, o.d || 5, MAT.steel, 0, 3.4, 0));
    for (let i = 0; i < 7; i++) {
      g.add(box((o.w || 7) * 0.9, 0.06, 0.12, MAT.darkSteel, 0, 4.16, -2.1 + i * 0.7));
    }
    const lx = (o.w || 7) * 0.38;
    const lz = (o.d || 5) * 0.38;
    [[lx, lz], [-lx, lz], [lx, -lz], [-lx, -lz]].forEach(([x, z]) => {
      g.add(box(0.24, 3.4, 0.24, MAT.steel, x, 1.7, z));
    });
    g.position.set(o.x, 0, o.z);
    if (o.info) tag(g, o.info);
    return g;
  }

  // packed column (H2S stripper)
  function column(o) {
    const g = new THREE.Group();
    const r = o.dia / 2;
    g.add(contactShadow(o.dia * 3.4, o.dia * 3.4, 0, 0));
    g.add(cyl(r * 1.25, r * 1.25, 1.1, 20, MAT.concrete, 0, 0.55, 0)); // skirt
    g.add(cyl(r, r, o.h, 22, MAT.vessel, 0, 1.1 + o.h / 2, 0));
    const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.vessel);
    dome.position.y = 1.1 + o.h;
    dome.castShadow = true;
    g.add(dome);
    // packing band
    g.add(cyl(r + 0.05, r + 0.05, o.h * 0.18, 22, MAT.accentY, 0, 1.1 + o.h * 0.42, 0));
    // platforms
    [0.3, 0.55, 0.8].forEach((f) => {
      const y = 1.1 + o.h * f;
      const p = cyl(r + 1.0, r + 1.0, 0.08, 20, MAT.steel, 0, y, 0);
      g.add(p);
      const rail = new THREE.Mesh(new THREE.TorusGeometry(r + 1.0, 0.035, 6, 26), MAT.steel);
      rail.rotation.x = Math.PI / 2;
      rail.position.y = y + 0.95;
      g.add(rail);
    });
    // ladder
    g.add(box(0.07, o.h, 0.07, MAT.steel, r + 0.8, 1.1 + o.h / 2, 0));
    g.add(box(0.07, o.h, 0.07, MAT.steel, r + 0.8, 1.1 + o.h / 2, 0.55));
    // top nozzle to flare
    g.add(cyl(0.14, 0.14, 1.6, 10, MAT.pipe, 0, 1.1 + o.h + 0.9, 0));
    g.position.set(o.x, 0, o.z);
    if (o.info) tag(g, o.info);
    return g;
  }

  // flare stack assembly
  function flare(o) {
    const g = new THREE.Group();
    const h = o.h || 26;
    g.add(contactShadow(9, 9, 0, 0));
    g.add(box(6, 0.3, 6, MAT.concrete, 0, 0.15, 0));
    // legs
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      g.add(seg([Math.cos(a) * 2.6, 0.3, Math.sin(a) * 2.6], [Math.cos(a) * 0.5, h * 0.55, Math.sin(a) * 0.5], 0.13, MAT.steel));
    }
    // stack
    g.add(cyl(0.26, 0.5, h, 16, MAT.vesselAlt, 0, h / 2 + 0.3, 0));
    // tip + pilots
    g.add(cyl(0.34, 0.3, 0.9, 14, MAT.darkSteel, 0, h + 0.75, 0));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.9, 8), MAT.hot);
      p.position.set(Math.cos(a) * 0.55, h + 1.1, Math.sin(a) * 0.55);
      p.rotation.z = Math.cos(a) * 0.25;
      p.rotation.x = Math.sin(a) * 0.25;
      g.add(p);
    }
    // flame
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.2, 12), MAT.flame);
    flame.position.y = h + 2.4;
    flame.userData.flame = true;
    g.add(flame);

    // knockout drum at the base
    const ko = vessel({ len: 5.2, dia: 2.0, x: -5.2, z: 1.6, info: null });
    ko.scale.set(1, 1, 1);
    g.add(ko);

    g.position.set(o.x, 0, o.z);
    if (o.info) tag(g, o.info);
    return g;
  }

  // container / E-house
  function container(o) {
    const g = new THREE.Group();
    const w = o.w || 12;
    const h = o.h || 3;
    const d = o.d || 3;
    const mat = o.mat || MAT.container;
    g.add(contactShadow(w + 3, d + 3, 0, 0));
    g.add(box(w, h, d, mat, 0, h / 2 + 0.35, 0));
    g.add(box(w + 0.3, 0.25, d + 0.3, MAT.darkSteel, 0, 0.35, 0));
    // ribs + door
    for (let i = -2; i <= 2; i++) {
      g.add(box(0.1, h * 0.9, 0.06, MAT.darkSteel, i * (w / 6), h / 2 + 0.35, d / 2 + 0.02));
    }
    g.add(box(0.9, h * 0.75, 0.06, MAT.buildingDark, w / 2 - 1.1, h * 0.42 + 0.35, d / 2 + 0.03));
    // roof units
    g.add(box(1.3, 0.5, 1.1, MAT.steel, -w * 0.22, h + 0.6, 0));
    g.add(box(1.1, 0.45, 1.0, MAT.steel, w * 0.2, h + 0.58, 0));
    g.position.set(o.x, 0, o.z);
    if (o.rot) g.rotation.y = o.rot;
    if (o.info) tag(g, o.info);
    return g;
  }

  // generator set package
  function genset(o) {
    const g = new THREE.Group();
    g.add(contactShadow(17, 8, 0, 0));
    g.add(box(13.5, 0.4, 3.6, MAT.concrete, 0, 0.2, 0));
    g.add(box(12.6, 3.1, 3.1, MAT.containerGrey, 0, 1.95, 0));
    g.add(box(12.8, 0.22, 3.3, MAT.darkSteel, 0, 3.55, 0));
    // radiator
    g.add(box(1.4, 2.4, 2.9, MAT.darkSteel, 5.6, 1.9, 0));
    for (let i = 0; i < 7; i++) g.add(box(0.1, 2.1, 0.1, MAT.steel, 6.35, 1.9, -1.2 + i * 0.4));
    // exhaust
    g.add(cyl(0.28, 0.28, 3.4, 12, MAT.darkSteel, 3.4, 4.6, 1.1));
    g.add(cyl(0.34, 0.34, 0.5, 12, MAT.steel, 3.4, 6.35, 1.1));
    // fuel tank
    const ft = cyl(0.9, 0.9, 5.4, 16, MAT.tank, -4.0, 1.6, -3.0);
    ft.rotation.z = Math.PI / 2;
    g.add(ft);
    g.position.set(o.x, 0, o.z);
    if (o.rot) g.rotation.y = o.rot;
    if (o.info) tag(g, o.info);
    return g;
  }

  // transformer with bushings and radiators
  function transformer(o) {
    const g = new THREE.Group();
    g.add(contactShadow(7, 6, 0, 0));
    g.add(box(4.6, 0.3, 3.6, MAT.concrete, 0, 0.15, 0));
    g.add(box(3.4, 2.7, 2.2, MAT.containerGrey, 0, 1.65, 0));
    g.add(box(3.6, 0.2, 2.4, MAT.darkSteel, 0, 3.05, 0));
    for (let i = 0; i < 3; i++) {
      g.add(cyl(0.13, 0.16, 0.9, 8, MAT.vesselAlt, -1.0 + i, 3.5, 0));
      g.add(cyl(0.1, 0.1, 0.5, 8, MAT.steel, -1.0 + i, 4.1, 0));
    }
    // radiators
    for (let i = 0; i < 4; i++) {
      g.add(box(0.1, 1.9, 1.6, MAT.steel, 1.85, 1.7, -1.2 + i * 0.8));
    }
    // bund
    g.add(box(5.4, 0.5, 0.25, MAT.concreteDark, 0, 0.25, 2.0));
    g.add(box(5.4, 0.5, 0.25, MAT.concreteDark, 0, 0.25, -2.0));
    g.position.set(o.x, 0, o.z);
    if (o.rot) g.rotation.y = o.rot;
    if (o.info) tag(g, o.info);
    return g;
  }

  // building
  function building(o) {
    const g = new THREE.Group();
    const w = o.w;
    const d = o.d;
    const h = o.h;
    g.add(contactShadow(w + 9, d + 9, 0, 0));
    g.add(box(w + 1.6, 0.4, d + 1.6, MAT.concrete, 0, 0.2, 0));
    g.add(box(w, h, d, o.mat || MAT.building, 0, h / 2 + 0.4, 0));
    g.add(box(w + 0.8, 0.35, d + 0.8, MAT.buildingDark, 0, h + 0.55, 0)); // parapet
    // windows
    const cols = Math.max(2, Math.round(w / 4));
    for (let i = 0; i < cols; i++) {
      const x = -w / 2 + (w / cols) * (i + 0.5);
      g.add(box(w / cols * 0.62, h * 0.3, 0.12, MAT.glass, x, h * 0.62, d / 2 + 0.02));
      g.add(box(w / cols * 0.62, h * 0.3, 0.12, MAT.glass, x, h * 0.62, -d / 2 - 0.02));
    }
    // door + canopy
    g.add(box(1.6, 2.3, 0.14, MAT.darkSteel, -w * 0.3, 1.55, d / 2 + 0.04));
    g.add(box(3.0, 0.18, 1.6, MAT.buildingDark, -w * 0.3, 2.85, d / 2 + 0.8));
    // roof units
    g.add(box(2.2, 0.8, 1.8, MAT.steel, w * 0.22, h + 1.1, 0));
    g.add(box(1.4, 0.7, 1.4, MAT.steel, -w * 0.16, h + 1.05, -d * 0.2));
    // window band on long side
    for (let i = 0; i < 4; i++) {
      g.add(box(0.12, h * 0.26, d / 5, MAT.glass, -w / 2 - 0.02, h * 0.6, -d / 2.8 + (i * d) / 4.4));
    }
    g.position.set(o.x, 0, o.z);
    if (o.rot) g.rotation.y = o.rot;
    if (o.info) tag(g, o.info);
    return g;
  }

  // pipe rack along X
  function pipeRack(o) {
    const g = new THREE.Group();
    const bays = o.bays || 6;
    const span = o.span || 6;
    for (let i = 0; i <= bays; i++) {
      const x = -((o.length || bays * span) / 2) + i * span;
      g.add(box(0.3, 4.6, 0.3, MAT.steel, x, 2.3, -1.4));
      g.add(box(0.3, 4.6, 0.3, MAT.steel, x, 2.3, 1.4));
      g.add(box(0.28, 0.28, 3.4, MAT.steel, x, 4.5, 0));
    }
    g.add(box(o.length || bays * span, 0.3, 0.32, MAT.steel, 0, 4.6, -1.4));
    g.add(box(o.length || bays * span, 0.3, 0.32, MAT.steel, 0, 4.6, 1.4));
    // pipes
    const ys = [4.95, 5.25, 4.75];
    const mats = [MAT.pipe, MAT.pipeGas, MAT.pipeWater];
    const zs = [-1.0, 0.1, 1.1];
    for (let i = 0; i < 3; i++) {
      const p = seg([-(o.length || bays * span) / 2, ys[i], zs[i]], [(o.length || bays * span) / 2, ys[i], zs[i]], 0.14 + i * 0.02, mats[i]);
      g.add(p);
    }
    g.position.set(o.x, 0, o.z);
    if (o.rot) g.rotation.y = o.rot;
    return g;
  }

  // small vertical vessel (desander, filter, KO)
  function vertVessel(o) {
    const g = new THREE.Group();
    const r = o.dia / 2;
    const h = o.h;
    g.add(contactShadow(r * 5, r * 5, 0, 0));
    g.add(box(r * 3.2, 0.3, r * 3.2, MAT.concrete, 0, 0.15, 0));
    g.add(cyl(r, r, h, 18, o.mat || MAT.vessel, 0, h / 2 + 0.3, 0));
    const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), o.mat || MAT.vessel);
    dome.position.y = h + 0.3;
    g.add(dome);
    g.add(cyl(0.1, 0.1, 1.0, 8, MAT.pipe, 0, h + 0.9, 0));
    g.add(cyl(0.13, 0.13, 0.7, 8, MAT.pipe, r * 0.8, 1.1, 0));
    g.position.set(o.x, 0, o.z);
    if (o.info) tag(g, o.info);
    return g;
  }

  // truck / ambulance
  function vehicle(o) {
    const g = new THREE.Group();
    const c = o.color || 0xdfe3e6;
    g.add(box(2.3, 2.0, 5.4, M(c, 0.6, 0.2), 0, 1.4, 0));
    g.add(box(2.2, 1.4, 2.0, M(0xd7dbe0, 0.5, 0.4), 0, 1.35, 3.0));
    g.add(box(2.0, 0.8, 0.1, MAT.glass, 0, 1.8, 4.02));
    [[1.05, 2.2], [-1.05, 2.2], [1.05, -1.4], [-1.05, -1.4]].forEach(([x, z]) => {
      const w = cyl(0.5, 0.5, 0.28, 12, MAT.darkSteel, x, 0.55, z);
      w.rotation.z = Math.PI / 2;
      g.add(w);
    });
    g.position.set(o.x, 0, o.z);
    if (o.rot) g.rotation.y = o.rot;
    return g;
  }

  /* ------------------------------------------------------------ train builder */

  const TRAINS = [
    {
      key: 'mishrif',
      name: 'Mishrif / Khasib EPF',
      short: 'Mishrif / Khasib',
      cap: '10,000 bopd',
      x: -140,
      accent: 'accentM',
      prefix: 'M_',
      tags: { sep1: 'M_Sep-1', dehyd: 'M_Dehydrator', desalt: 'M_Desalter', tank: 'M_Flow_Tanks' }
    },
    {
      key: 'nu',
      name: 'Nahr Umr EPF',
      short: 'Nahr Umr',
      cap: '10,000 bopd',
      x: -84,
      accent: 'accentN',
      prefix: 'N-U_',
      tags: { sep1: 'N-U_Sep-1', dehyd: 'N-U_Dehydrator', desalt: 'N-U_Desalter', tank: 'N-U_Flow_Tanks' }
    },
    {
      key: 'yamama',
      name: 'Yamama EPF (sour)',
      short: 'Yamama',
      cap: '5,000 bopd',
      x: -28,
      accent: 'accentY',
      prefix: 'Y_',
      tags: { sep1: 'Y_Sep-1', dehyd: 'Y_Dehydrator', desalt: 'Y_Desalter', tank: 'Y_Flow_Tanks' }
    }
  ];

  const trainGroups = {};

  function buildTrain(t) {
    const g = new THREE.Group();
    g.name = t.key;
    const X = t.x;
    const accentMat = MAT[t.accent];

    // pad + kerb
    const pad = ground(44, 54, 0, 0, 0.05, gravelMat);
    g.add(pad);
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(44.6, 0.35, 54.6), MAT.concreteDark);
    kerb.position.y = 0.16;
    g.add(kerb);

    // name board
    const board = box(12, 1.6, 0.3, accentMat, -14, 3.4, -25.5);
    g.add(board);
    g.add(box(0.4, 3.2, 0.4, MAT.steel, -19, 1.7, -25.5));
    g.add(box(0.4, 3.2, 0.4, MAT.steel, -9, 1.7, -25.5));

    // inlet manifold: header + valves
    const inletY = 2.2;
    const header = seg([-20, inletY, -21], [8, inletY, -21], 0.34, accentMat);
    tag(header, {
      tag: t.prefix + 'Inlet_Manifold',
      title: 'Inlet manifold and pig receiver',
      spec: '5 well slots · ESDV · sand removal downstream',
      note: 'Flowlines arrive from the north. Motorised isolation lets any well be routed to test or isolated.'
    });
    g.add(header);
    for (let i = 0; i < 5; i++) {
      const x = -18 + i * 5.5;
      g.add(seg([x, inletY, -21], [x, inletY, -17.6], 0.26, MAT.pipe));
      g.add(box(0.55, 0.75, 0.55, accentMat, x, inletY + 0.15, -19.6));
      g.add(cyl(0.1, 0.1, 1.4, 8, MAT.steel, x - 0.5, inletY + 0.9, -19.6));
    }

    // sand removal (2 vertical vessels)
    g.add(vertVessel({ x: 13, z: -19, dia: 1.6, h: 3.6, info: {
      tag: t.prefix + 'Desander',
      title: 'Sand removal package',
      spec: 'Desanding hydrocyclone + sand jetting',
      note: 'Protects the heater and separator internals. Sand is batched to a lined skip.'
    } }));
    g.add(vertVessel({ x: 17.5, z: -19, dia: 1.6, h: 3.6 }));

    // inlet heater
    g.add(heater({ x: 15.5, z: -11, info: {
      tag: t.prefix + 'Inlet_Heater Q-1',
      title: 'Inlet heater',
      spec: t.key === 'yamama' ? '447 kW indirect water-bath' : (t.key === 'nu' ? '137 kW indirect water-bath' : '166 kW indirect water-bath'),
      note: 'Fuel-gas or diesel fired, with high-temperature and low-flow trips.'
    } }));

    // HP separator
    g.add(vessel({
      len: 13, dia: 2.6, x: -8, z: -10, insulation: false,
      info: {
        tag: t.tags.sep1,
        title: 'HP three-phase separator',
        spec: '2.6 m ID × 13 m · ~7–14 barg · 5 min residence',
        note: 'Gas to the closed header, water to produced-water treatment, oil to the dehydrator.'
      }
    }));

    // LP separator
    g.add(vessel({
      len: 13, dia: 2.8, x: -8, z: -1.5,
      info: {
        tag: t.tags.sep1.replace('1', '2'),
        title: 'LP three-phase separator',
        spec: '2.8 m ID × 13 m · 5 barg',
        note: 'Final flash of solution gas before stabilisation and storage.'
      }
    }));

    // interstage heater
    g.add(heater({ x: 15.5, z: -2, info: {
      tag: t.prefix + 'Dehyd_Heater',
      title: 'Interstage / dehydration heater',
      spec: '0.668 MW indirect water-bath',
      note: 'Sets the electrostatic treating temperature at about 75 °C.'
    } }));

    // dehydrator
    g.add(vessel({
      len: 11, dia: 2.4, x: -8, z: 7,
      info: {
        tag: t.tags.dehyd,
        title: 'Electrostatic dehydrator',
        spec: '2.4 m ID × 11 m · 6–8 barg · ~75 °C',
        note: 'Removes bulk water before the two-stage desalter.'
      }
    }));

    // desalters (two, along X)
    const desalterZ = 16.5;
    g.add(vessel({
      len: 10, dia: 2.5, x: -13, z: desalterZ,
      info: {
        tag: t.tags.desalt + '_1',
        title: 'Desalter stage 1',
        spec: '2.5 m ID × 10 m · electrostatic',
        note: 'Wash water is mixed in and the emulsion is broken across the electric field.'
      }
    }));
    g.add(vessel({
      len: 10, dia: 2.5, x: 1, z: desalterZ,
      info: {
        tag: t.tags.desalt + '_2',
        title: 'Desalter stage 2',
        spec: '2.5 m ID × 10 m · electrostatic',
        note: 'Counter-current wash to 30 ppmw salt (2.7 ppmw on Yamama).'
      }
    }));

    // wash water package
    g.add(pumpSkid({ x: 13.5, z: 8.5, w: 5.6, d: 2.4, rot: 0, info: {
      tag: t.prefix + 'WW_Pump P-2',
      title: 'Wash-water pump and heater skid',
      spec: '9 barg · 73 kW heater · duty + standby',
      note: 'Recycled water is not counted as additional source-water demand.'
    } }));
    g.add(pumpSkid({ x: 15.5, z: 13.5, w: 5.6, d: 2.4, info: {
      tag: t.prefix + 'Chem_Injection',
      title: 'Chemical injection skid',
      spec: 'Demulsifier, corrosion, scale, biocide, antifoam',
      note: 'Flow-paced dosing with calibration pots and bunded storage.'
    } }));

    // sour treatment (Yamama only)
    if (t.key === 'yamama') {
      g.add(column({ x: 10, z: 22.5, dia: 1.0, h: 13.5, info: {
        tag: 'Y_H2S_Col',
        title: 'H\u2082S stripping column',
        spec: '500 mm × ~14 m · 2 m structured packing · 5 barg · 65 °C',
        note: 'Sour-service design, SIL 2 SIS. Strips crude to 10 ppmw H\u2082S using Nahr Umr separator off-gas.'
      } }));
      g.add(container({ x: 19.5, z: 26.5, w: 6, d: 2.6, h: 2.7, mat: MAT.containerGrey, info: {
        tag: 'Y_N2_Package',
        title: 'Nitrogen and stripping-gas package',
        spec: 'Inerting/blanketing N\u2082 · stripping-gas booster',
        note: 'Nitrogen is never used for stripping — only for inerting and blanketing.'
      } }));
    }

    // produced water treatment row
    const pwZ = 22.5;
    if (t.key !== 'yamama') {
      g.add(pumpSkid({ x: -19, z: pwZ, w: 5.2, d: 2.4, rot: Math.PI / 2, info: {
        tag: t.prefix + 'PW_Treatment',
        title: 'Produced-water treatment skid',
        spec: 'Degassing · CPI · filter-coalescer',
        note: 'About 10 ppm oil in water at the outlet; recovered oil returns to the crude train.'
      } }));
      g.add(vertVessel({ x: -13.5, z: pwZ + 0.5, dia: 1.5, h: 3.0 }));
      g.add(pumpSkid({ x: -7.5, z: pwZ, w: 4.6, d: 2.2, rot: Math.PI / 2 }));
    } else {
      g.add(pumpSkid({ x: -19, z: pwZ + 2, w: 5.2, d: 2.4, rot: Math.PI / 2, info: {
        tag: 'Y_PW_Treatment',
        title: 'Produced-water treatment skid',
        spec: '483 bbl/d polished · ~9.5 ppm oil',
        note: 'Sour water is degassed before it leaves the train; no untreated water to the pond.'
      } }));
      g.add(vertVessel({ x: -13.5, z: pwZ + 2.5, dia: 1.5, h: 3.0 }));
    }

    // flow tank (per train) + transfer pump
    g.add(tank({
      x: 15, z: 22, dia: 9, h: 9, band: accentMat,
      info: {
        tag: t.tags.tank,
        title: 'Flow tank with off-spec storage',
        spec: '9 m dia × 9 m · 55 °C · N\u2082 blanketed',
        note: 'Off-spec crude is segregated and reprocessed — never blended away.'
      }
    }));
    g.add(pumpSkid({ x: 3.5, z: 25.5, w: 5.0, d: 2.2, info: {
      tag: t.prefix + 'Transfer_Pump SPLT-100',
      title: 'Crude transfer pump',
      spec: t.key === 'yamama' ? '9.2 kW · 70 m head' : (t.key === 'nu' ? '18.1 kW · 65 m' : '17.4 kW · 65 m'),
      note: 'Duty/standby with recycle protection, feeding the allocation metering skid.'
    } }));

    // flare
    g.add(flare({ x: 0, z: 44, h: 24, info: {
      tag: t.prefix + 'Flare_Stack',
      title: 'Flare stack package',
      spec: 'Pilots, ignition and flame monitoring · design radiation 6.3 kW/m²',
      note: 'Handles maintenance, emergency and well-test relief; purge gas keeps the system live.'
    } }));

    // pipe rack across the pad
    g.add(pipeRack({ x: 4, z: 0, length: 34, bays: 6, span: 5.6, rot: Math.PI / 2 }));

    // cable tray / local instrumentation cabinets
    g.add(box(2.2, 2.2, 1.0, MAT.containerGrey, -20.2, 1.5, 6));
    g.add(box(0.8, 1.6, 0.6, MAT.steel, -20.2, 3.4, 6));

    g.position.x = X;
    return g;
  }

  TRAINS.forEach((t) => {
    const g = buildTrain(t);
    trainGroups[t.key] = g;
    root.add(g);
  });

  /* ------------------------------------------------------------ common: export */

  const exportGroup = new THREE.Group();
  exportGroup.name = 'export';

  // tank farm pad
  exportGroup.add(ground(74, 66, 74, 14, 0.04, gravelMat));
  exportGroup.add(new THREE.Mesh(new THREE.BoxGeometry(74, 0.3, 66), MAT.concreteDark).translateX(74).translateZ(14).translateY(0.15));

  // bund walls around the tank group
  const bundMat = MAT.concreteDark;
  exportGroup.add(box(74, 0.9, 1.1, bundMat, 74, 0.45, 62));
  exportGroup.add(box(74, 0.9, 1.1, bundMat, 74, 0.45, -34));
  exportGroup.add(box(0.9, 0.9, 97, bundMat, 37.5, 0.45, 14));
  exportGroup.add(box(0.9, 0.9, 97, bundMat, 110.5, 0.45, 14));

  // four export flow tanks
  const tankSpots = [[60, 0], [86, 0], [60, 28], [86, 28]];
  tankSpots.forEach(([x, z], i) => {
    exportGroup.add(tank({
      x, z, dia: 17, h: 12,
      info: {
        tag: 'E_Flow_Tank-' + (i + 1),
        title: 'Export flow tank',
        spec: '17 m dia × 12 m · continuously circulating',
        note: 'Comingles the three stabilised streams under controlled blending; nitrogen blanketed, vented to the closed system.'
      }
    }));
  });

  // export pump + metering skids
  exportGroup.add(pumpSkid({ x: 60, z: -24, w: 7.2, d: 3.0, info: {
    tag: 'E_Export_Pump',
    title: 'Export pump',
    spec: '290 kW · 430 m head · 37.7 bar',
    note: 'Sized so arrival pressure at Halfaya stays inside the receiving envelope.'
  } }));
  exportGroup.add(pumpSkid({ x: 69, z: -24, w: 6.2, d: 2.8, info: {
    tag: 'E_Blend_Booster',
    title: 'Blending booster pump',
    spec: 'Option A · tank circulation and transfer',
    note: 'Keeps the export tanks circulating and feeds the trunkline.'
  } }));
  exportGroup.add(pumpSkid({ x: 78, z: -24, w: 5.4, d: 2.6, info: {
    tag: 'E_Custody_Meter',
    title: 'Custody-transfer metering skid',
    spec: 'Fiscal metering interface · proving connections',
    note: 'Location and supply split agreed before award; fiscal metering may be MOC-owned at Halfaya.'
  } }));
  exportGroup.add(box(6, 2.6, 3.0, MAT.containerGrey, 87, 1.65, -24));
  exportGroup.add(cyl(0.4, 0.4, 8, 10, MAT.pipe, 95, 2.2, -24));

  // allocation metering skids (one per train stream) along the header
  TRAINS.forEach((t, i) => {
    exportGroup.add(pumpSkid({
      x: 46 + i * 0, z: -8 + i * 6, w: 4.4, d: 2.2, rot: Math.PI / 2,
      info: {
        tag: t.prefix + 'Allocation_Meter',
        title: 'Allocation metering skid',
        spec: 'Per-reservoir crude measurement',
        note: 'Each reservoir keeps its own meter so rental volumes and reservoir accounting stay separate.'
      }
    }));
  });

  // 10" trunkline leaving the plot east
  exportGroup.add(seg([95, 1.0, -24], [150, 1.0, -24], 0.32, MAT.pipe));
  exportGroup.add(seg([150, 1.0, -24], [175, 1.0, -14], 0.32, MAT.pipe));

  root.add(exportGroup);

  /* ------------------------------------------------------------ common: power island */

  const powerGroup = new THREE.Group();
  powerGroup.name = 'power';

  powerGroup.add(ground(40, 44, 21, -26, 0.04, gravelMat));
  powerGroup.add(box(40, 0.28, 44, MAT.concreteDark, 21, 0.14, -26));

  // six generator packages (2 per train, each at ~50%)
  const genSpots = [
    [12, -40], [12, -34], [26, -40], [26, -34], [12, -22], [26, -22]
  ];
  genSpots.forEach(([x, z], i) => {
    powerGroup.add(genset({
      x, z, rot: 0,
      info: {
        tag: 'GEN-' + (i + 1),
        title: 'Generator package',
        spec: 'Synchronised · each loaded to ~50% of rating',
        note: 'Diesel or treated associated gas. Loss of any one set leaves the facility fully supplied.'
      }
    }));
  });

  // emergency diesel generator
  powerGroup.add(container({ x: 33, z: -14, w: 8, d: 3, h: 3, mat: MAT.containerGrey, info: {
    tag: 'EDG',
    title: 'Emergency diesel generator',
    spec: 'Prime rated · containerised · back-up fuel',
    note: 'Independent controllers and protection, remote HMI in the substation.'
  } }));

  // substation, MCC, UPS containers
  powerGroup.add(container({ x: 18, z: -8, w: 13, d: 3.6, h: 3.4, mat: MAT.containerBlue, info: {
    tag: 'MV_SWB',
    title: 'MV switchgear / substation',
    spec: '11 kV · withdrawable vacuum · IEC 61850 IEDs',
    note: 'Air-conditioned E-house rated to keep running on HVAC failure.'
  } }));
  powerGroup.add(container({ x: 32, z: -3, w: 11, d: 3.2, h: 3.2, mat: MAT.containerBlue, info: {
    tag: 'LV_MCC',
    title: 'LV switchboard and MCC',
    spec: '400 V · draw-out · motor managers',
    note: 'All signals to the PMS and HMI; motor feeders on numerical relays.'
  } }));
  powerGroup.add(container({ x: 12, z: -3, w: 9, d: 3.2, h: 3.2, mat: MAT.containerGrey, info: {
    tag: 'UPS_Battery',
    title: 'AC/DC UPS and battery room',
    spec: '2 × 50% batteries · ≥2 h autonomy',
    note: 'Two-door escape, gas monitoring and eyewash; Zone 1 IIC T6 equipment inside.'
  } }));

  // transformers
  powerGroup.add(transformer({ x: 8, z: 6 }));
  powerGroup.add(transformer({ x: 14, z: 6 }));

  // cable trays between power island and trains
  for (let i = 0; i < 3; i++) {
    powerGroup.add(seg([2, 0.6, -6 + i * 3], [-4, 0.6, -6 + i * 3], 0.16, MAT.darkSteel));
  }

  root.add(powerGroup);

  /* ------------------------------------------------------------ common: utilities & ICSS */

  const utilGroup = new THREE.Group();
  utilGroup.name = 'utilities';

  utilGroup.add(ground(38, 22, 21, 26, 0.04, gravelMat));
  utilGroup.add(box(38, 0.26, 22, MAT.concreteDark, 21, 0.13, 26));

  utilGroup.add(container({ x: 12, z: 22, w: 10, d: 3.0, h: 3.0, mat: MAT.containerGrey, info: {
    tag: 'IA_Package',
    title: 'Instrument / plant air package',
    spec: 'Duty + standby compressors · dryers · receivers',
    note: 'Dewpoint monitored and alarmed; instrument air failure trips the ICSS consumers safely.'
  } }));
  utilGroup.add(container({ x: 12, z: 29, w: 8, d: 2.8, h: 2.8, mat: MAT.containerGrey }));
  utilGroup.add(vertVessel({ x: 23, z: 21, dia: 1.6, h: 5.0 }));
  utilGroup.add(vertVessel({ x: 26.5, z: 21, dia: 1.4, h: 4.4 }));
  utilGroup.add(pumpSkid({ x: 28, z: 29, w: 5.0, d: 2.2, info: {
    tag: 'RO_Unit',
    title: 'Wash-water reverse osmosis unit',
    spec: 'Produced-water slipstream to desalter wash water',
    note: 'Rejects return to disposal; recycled water is not new source demand.'
  } }));
  utilGroup.add(airCooler({ x: 20, z: 34, w: 6, d: 4 }));

  // ICSS container
  utilGroup.add(container({ x: 34, z: 24, w: 9, d: 3.2, h: 3.2, mat: MAT.containerBlue, info: {
    tag: 'ICSS',
    title: 'ICSS and safety system container',
    spec: 'DCS/SCADA · SIL 2 SIS · F&G · historian 30 s',
    note: 'Operator and engineering stations, marshalling and cyber-security boundary.'
  } }));

  // firewater
  utilGroup.add(tank({ x: 4, z: 34, dia: 7, h: 6, info: {
    tag: 'FW_Tank',
    title: 'Firewater storage',
    spec: 'First-response volume · pump set and foam',
    note: 'A mobile firewater/foam tender is acceptable for a temporary facility, supported by portable equipment.'
  } }));

  root.add(utilGroup);

  /* ------------------------------------------------------------ common: site & buildings */

  const siteGroup = new THREE.Group();
  siteGroup.name = 'site';

  siteGroup.add(building({ x: 132, z: -22, w: 20, d: 11, h: 6.2, info: {
    tag: 'CR/LER',
    title: 'Central control room and LER',
    spec: 'Sited per QRA and prevailing wind',
    note: 'Shared by all three trains; blast and fire resistance set by the safety studies.'
  } }));
  siteGroup.add(building({ x: 140, z: 4, w: 16, d: 12, h: 6.5, mat: MAT.buildingDark, info: {
    tag: 'Workshop',
    title: 'Workshop and warehouse',
    spec: 'Maintenance bay · spares store · laydown',
    note: 'Stocked to support the 95% availability guarantee, with critical spares in country.'
  } }));
  siteGroup.add(container({ x: 124, z: 4, w: 8, d: 3, h: 3, info: {
    tag: 'Laboratory',
    title: 'Laboratory container',
    spec: 'BS&W, salt, RVP, H\u2082S analysis',
    note: 'Supports the 06:00 daily quality report and the performance test evidence.'
  } }));
  siteGroup.add(building({ x: 148, z: 34, w: 26, d: 12, h: 4.2, mat: MAT.container, info: {
    tag: 'Camp',
    title: 'Portable accommodation and welfare',
    spec: 'Rooms · canteen · ablutions · drying room',
    note: 'Climate controlled; catering for up to ten Company personnel at no extra cost.'
  } }));
  siteGroup.add(building({ x: 122, z: 34, w: 14, d: 10, h: 4.0, mat: MAT.container }));
  siteGroup.add(container({ x: 112, z: -8, w: 7, d: 2.8, h: 2.8, mat: MAT.containerGrey }));

  // vehicles
  siteGroup.add(vehicle({ x: 108, z: -50, rot: Math.PI / 2, color: 0xe8ebee }));
  siteGroup.add(vehicle({ x: 96, z: -50, rot: Math.PI / 2, color: 0xb63a2a }));
  siteGroup.add(vehicle({ x: -30, z: -50, rot: Math.PI / 2, color: 0xd7dbe0 }));

  // flare header along the south edge (collects each train)
  siteGroup.add(seg([-140, 3.0, 40], [-28, 3.0, 40], 0.3, MAT.pipeGas));
  siteGroup.add(seg([-140, 3.0, 40], [-140, 6.0, 44], 0.3, MAT.pipeGas));

  root.add(siteGroup);

  /* ------------------------------------------------------------ labels */

  const LABELS = [
    { text: '<b>3 reservoir-specific EPF trains</b> · 25,000 bopd', pos: [-84, 34, -22], key: 'trains' },
    { text: '<b>Mishrif / Khasib</b> · 10,000 bopd', pos: [-140, 26, -20], key: 'mishrif' },
    { text: '<b>Nahr Umr</b> · 10,000 bopd', pos: [-84, 34, -14], key: 'nu' },
    { text: '<b>Yamama (sour)</b> · 5,000 bopd', pos: [-28, 26, -20], key: 'yamama' },
    { text: '<b>Export flow tanks</b> · blending + metering', pos: [74, 22, 14], key: 'export' },
    { text: '<b>Power island</b> · 6 × generators', pos: [21, 18, -30], key: 'power' },
    { text: '<b>Utilities &amp; ICSS</b>', pos: [20, 14, 30], key: 'utilities' },
    { text: '<b>Control room, workshop, camp</b>', pos: [136, 18, 8], key: 'site' },
    { text: '<b>Flare stacks</b> · south boundary', pos: [-84, 30, 50], key: 'flare' }
  ];

  const LABELS_FOR_VIEW = {
    overall: ['trains', 'export', 'power'],
    mishrif: ['mishrif'],
    nu: ['nu'],
    yamama: ['yamama'],
    export: ['export'],
    power: ['power', 'utilities'],
    flare: ['flare']
  };

  const labelEls = LABELS.map((l) => {
    const el = document.createElement('div');
    el.className = 'lbl';
    el.innerHTML = l.text;
    labelsEl.appendChild(el);
    return { el, pos: new THREE.Vector3(l.pos[0], l.pos[1], l.pos[2]), key: l.key };
  });

  const tmpV = new THREE.Vector3();

  function updateLabels() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const allowed = LABELS_FOR_VIEW[state.view] || LABELS_FOR_VIEW.overall;
    labelEls.forEach((l) => {
      if (allowed.indexOf(l.key) === -1) { l.el.style.opacity = '0'; return; }
      tmpV.copy(l.pos).project(camera);
      const visible = tmpV.z < 1 && tmpV.z > -1;
      const rawX = (tmpV.x * 0.5 + 0.5) * w;
      const y = (-tmpV.y * 0.5 + 0.5) * h;
      const x = Math.min(w - 96, Math.max(96, rawX));
      const onScreen = visible && rawX > -120 && rawX < w + 120 && y > -40 && y < h + 40;
      l.el.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px)`;
      l.el.style.opacity = onScreen ? '1' : '0';
    });
  }

  /* ------------------------------------------------------------ camera controls */

  const state = {
    target: new THREE.Vector3(-16, 7, -2),
    radius: 236,
    theta: 0.84,
    phi: 1.0,
    goalTarget: new THREE.Vector3(-16, 7, -2),
    goalRadius: 236,
    goalTheta: 0.84,
    goalPhi: 1.0,
    autoRotate: false,
    labels: true,
    animating: false,
    isolate: null,
    view: 'overall'
  };

  function applyCamera() {
    const { target, radius, theta, phi } = state;
    // widen the shot on narrow/portrait viewports so the plot still fits
    const aspect = camera.aspect || 1.6;
    const fit = aspect < 1.62 ? Math.min(1.95, 1.62 / aspect) : 1;
    const r = radius * fit;
    camera.position.set(
      target.x + r * Math.sin(phi) * Math.sin(theta),
      target.y + r * Math.cos(phi),
      target.z + r * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(target);
  }
  applyCamera();

  function setGoal(target, radius, theta, phi) {
    state.goalTarget.set(target[0], target[1], target[2]);
    state.goalRadius = radius;
    state.goalTheta = theta;
    state.goalPhi = phi;
    state.animating = true;
  }

  // pointer interaction
  let drag = null;
  let userMoved = false;

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    drag = {
      x: e.clientX, y: e.clientY,
      theta: state.goalTheta, phi: state.goalPhi,
      tx: state.goalTarget.x, ty: state.goalTarget.y, tz: state.goalTarget.z,
      button: e.button, shift: e.shiftKey, moved: false
    };
    state.animating = false;
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) {
      drag.moved = true;
      if (hintEl) hintEl.classList.add('dim');
    }

    const panning = drag.button === 2 || drag.button === 1 || drag.shift;
    if (panning) {
      const scale = state.goalRadius * 0.0016;
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
      state.goalTarget.x = drag.tx - right.x * dx * scale + up.x * dy * scale;
      state.goalTarget.y = drag.ty - right.y * dx * scale + up.y * dy * scale;
      state.goalTarget.z = drag.tz - right.z * dx * scale + up.z * dy * scale;
      state.target.copy(state.goalTarget);
    } else {
      state.goalTheta = drag.theta - dx * 0.005;
      state.goalPhi = Math.min(1.42, Math.max(0.14, drag.phi - dy * 0.004));
      state.theta = state.goalTheta;
      state.phi = state.goalPhi;
    }
    applyCamera();
  });

  function endDrag(e) {
    if (drag && !drag.moved && e && e.button === 0) pick(e);
    drag = null;
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', () => { drag = null; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = Math.exp(e.deltaY * 0.0012);
    state.goalRadius = Math.min(620, Math.max(38, state.goalRadius * factor));
    state.animating = true;
  }, { passive: false });

  // pinch zoom
  let pinch = null;
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      pinch = { d: Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      ), r: state.goalRadius };
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    if (pinch && e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      state.goalRadius = Math.min(620, Math.max(38, (pinch.r * pinch.d) / d));
      state.animating = true;
    }
  }, { passive: true });
  canvas.addEventListener('touchend', () => { pinch = null; });

  /* ------------------------------------------------------------ picking */

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function pick(e) {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(pickRoot, true);
    for (const hit of hits) {
      let o = hit.object;
      while (o && !o.userData.info) o = o.parent;
      if (o && o.userData.info) {
        showInfo(o.userData.info);
        return;
      }
    }
    hideInfo();
  }

  function showInfo(info) {
    if (!infoEl) return;
    document.getElementById('viTag').textContent = info.tag;
    document.getElementById('viTitle').textContent = info.title;
    document.getElementById('viSpec').textContent = info.spec;
    document.getElementById('viNote').textContent = info.note;
    infoEl.hidden = false;
  }
  function hideInfo() {
    if (infoEl) infoEl.hidden = true;
  }
  const viClose = document.getElementById('viClose');
  if (viClose) viClose.addEventListener('click', hideInfo);

  /* ------------------------------------------------------------ views */

  const VIEWS = [
    { id: 'overall', name: 'Overall plot', target: [-16, 7, -2], r: 236, theta: 0.84, phi: 1.0, isolate: null },
    { id: 'mishrif', name: 'Mishrif / Khasib', target: [-140, 7, -4], r: 96, theta: 0.62, phi: 0.96, isolate: 'mishrif' },
    { id: 'nu', name: 'Nahr Umr', target: [-84, 7, -4], r: 96, theta: 0.62, phi: 0.96, isolate: 'nu' },
    { id: 'yamama', name: 'Yamama (sour)', target: [-28, 8, -2], r: 96, theta: 0.62, phi: 0.96, isolate: 'yamama' },
    { id: 'export', name: 'Export & metering', target: [76, 8, 12], r: 118, theta: 1.02, phi: 0.92, isolate: 'export' },
    { id: 'power', name: 'Power island', target: [21, 5, -18], r: 82, theta: 0.9, phi: 0.94, isolate: 'power' },
    { id: 'flare', name: 'Flare & relief', target: [-84, 16, 42], r: 88, theta: 1.24, phi: 1.02, isolate: 'flare' }
  ];

  function applyIsolation(key) {
    state.isolate = key;
    if (!key) {
      Object.values(trainGroups).forEach((g) => { g.visible = true; });
      exportGroup.visible = true;
      powerGroup.visible = true;
      utilGroup.visible = true;
      siteGroup.visible = true;
      labelEls.forEach((l) => { l.el.classList.remove('hide'); });
      return;
    }
    if (key === 'flare') {
      // keep the trains visible for context, focus on flares
      Object.values(trainGroups).forEach((g) => { g.visible = true; });
      exportGroup.visible = false;
      powerGroup.visible = false;
      utilGroup.visible = false;
      siteGroup.visible = false;
    } else {
      Object.keys(trainGroups).forEach((k) => { trainGroups[k].visible = k === key; });
      exportGroup.visible = key === 'export';
      powerGroup.visible = key === 'power';
      utilGroup.visible = key === 'power';
      siteGroup.visible = false;
    }
    labelEls.forEach((l) => {
      const relevant = key === 'flare' ? ['mishrif', 'nu', 'yamama', 'flare'].includes(l.key) : l.key === key;
      l.el.classList.toggle('hide', !relevant);
    });
  }

  function setView(id) {
    const v = VIEWS.find((x) => x.id === id) || VIEWS[0];
    state.view = v.id;
    applyIsolation(v.isolate);
    setGoal(v.target, v.r, v.theta, v.phi);
    $$chips().forEach((c) => c.classList.toggle('is-active', c.dataset.view === v.id));
    hideInfo();
  }

  function $$chips() {
    return Array.from(document.querySelectorAll('#viewChips .chip'));
  }

  if (chipsEl) {
    chipsEl.innerHTML = VIEWS.map((v, i) =>
      `<button class="chip${i === 0 ? ' is-active' : ''}" type="button" data-view="${v.id}">${v.name}</button>`
    ).join('');
    chipsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (btn) setView(btn.dataset.view);
    });
  }

  const resetBtn = document.getElementById('resetView');
  if (resetBtn) resetBtn.addEventListener('click', () => setView('overall'));

  const labelsBtn = document.getElementById('toggleLabels');
  if (labelsBtn) {
    labelsBtn.addEventListener('click', () => {
      state.labels = !state.labels;
      labelsBtn.setAttribute('aria-pressed', String(state.labels));
      labelsEl.style.display = state.labels ? '' : 'none';
    });
  }

  const spinBtn = document.getElementById('toggleSpin');
  if (spinBtn) {
    spinBtn.addEventListener('click', () => {
      state.autoRotate = !state.autoRotate;
      spinBtn.setAttribute('aria-pressed', String(state.autoRotate));
    });
  }

  /* ------------------------------------------------------------ resize + loop */

  function resize() {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const ro = new ResizeObserver(resize);
  ro.observe(wrap);
  resize();

  const clock = new THREE.Clock();

  function animate() {
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;

    if (state.autoRotate && !drag) state.goalTheta += dt * 0.11;

    // smooth camera interpolation
    const k = 1 - Math.pow(0.002, dt);
    state.target.lerp(state.goalTarget, k);
    state.radius += (state.goalRadius - state.radius) * k;
    state.theta += (state.goalTheta - state.theta) * k;
    state.phi += (state.goalPhi - state.phi) * k;
    applyCamera();

    // flame flicker
    scene.traverse((o) => {
      if (o.userData && o.userData.flame) {
        const s = 1 + Math.sin(t * 9 + o.id) * 0.08 + Math.sin(t * 23) * 0.04;
        o.scale.set(0.9 + Math.sin(t * 7) * 0.06, s, 0.9 + Math.cos(t * 6) * 0.06);
      }
    });

    if (state.labels) updateLabels();

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // kick off
  setView('overall');
  state.target.copy(state.goalTarget);
  state.radius = state.goalRadius;
  state.theta = state.goalTheta;
  state.phi = state.goalPhi;

  if (loadingEl) {
    setTimeout(() => {
      loadingEl.classList.add('done');
      setTimeout(() => { loadingEl.style.display = 'none'; }, 600);
    }, 260);
  }

  animate();
})();
