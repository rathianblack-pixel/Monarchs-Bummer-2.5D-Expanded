'use strict';
/* =========================================================
   HD-2D RENDERER (WebGL)
   Pixel-art sprites as camera-facing billboards standing on a real 3D ground plane,
   seen through a perspective camera, with a light map, distance haze,
   tilt-shift depth of field, bloom and the colour grade done on the GPU.
   2D world coordinates (x, y) map to 3D as  X = x,  Z = y * zs,  Y = height.
   A billboard keeps its art row at "base y" on the ground; rows above stand up.
   Scenes opt in (scene.hd = true) and talk to it through:
     HD.begin(cfg)  HD.ground(canvas,x,y)  HD.layer(name)  HD.groundLayer(name)
     HD.capture(yb, fn, key, ver, rect)  HD.art(canvas, dx, dy, yb, o)  HD.plane(...)
   ========================================================= */
const HD = {
  ok: false, failed: false, on: false, RW: 1280, RH: 720,
  cfg: null, quads: [], lights: [], amb: [255, 255, 255], dark: 0,
  view: { x0: 0, y0: 0, x1: 640, y1: 360 },
  wanted() { return Gfx.level >= 1 && !this.failed && Settings.hd !== false; },
  // ---------------- GL setup ----------------
  init() {
    if (this.ok || this.failed) return this.ok;
    try {
      const c = document.createElement('canvas'); c.width = this.RW; c.height = this.RH;
      const gl = c.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
      if (!gl) throw new Error('no webgl');
      this.c = c; this.gl = gl;
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const prog = (vs, fs, attrs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const inf = gl.getActiveUniform(p, i); u[inf.name.replace('[0]', '')] = gl.getUniformLocation(p, inf.name); } return { p, u }; };
      // scene program: textured quads, light map, haze, cloud shadows
      const mkSP = (nl) => prog(`attribute vec3 aP; attribute vec2 aUV; attribute vec2 aW; attribute vec4 aC; attribute vec3 aX;
        uniform mat4 uM; uniform vec3 uCam; uniform float uZs; varying vec2 vUV; varying vec2 vW; varying vec4 vC; varying float vD; varying vec3 vX; varying vec2 vG;
        void main(){ vUV = aUV; vW = aW; vC = aC; vX = aX; vD = distance(aP, uCam);
          float t = uCam.y / max(.001, uCam.y - aP.y); vec3 g = uCam + (aP - uCam) * t; vG = vec2(g.x, g.z / uZs);
          gl_Position = uM * vec4(aP, 1.); }`,
        `#define NLM ${nl}
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif
        varying vec2 vUV; varying vec2 vW; varying vec4 vC; varying float vD; varying vec3 vX; varying vec2 vG;
        uniform sampler2D uT; uniform sampler2D uL; uniform vec4 uLR; uniform float uUseL;
        uniform vec2 uTx; uniform vec3 uKey; uniform vec4 uRim; uniform float uLit; uniform int uNL; uniform vec4 uLP[NLM]; uniform vec3 uLC[NLM]; uniform float uLH;
        uniform sampler2D uWM; uniform vec4 uWR; uniform vec3 uWC; uniform vec3 uOut;
        float A(vec2 o){ return texture2D(uT, vUV + o * uTx).a; }
        float Y(vec2 o){ vec4 t = texture2D(uT, vUV + o * uTx); return dot(t.rgb, vec3(.3, .59, .11)) * t.a; }
        vec3 nrm(float q){ float r1 = 1.5 * q, r2 = 3.5 * q, r3 = 6.5 * q;
          float gx = (A(vec2(r1, 0.)) - A(vec2(-r1, 0.))) * .5 + (A(vec2(r2, 0.)) - A(vec2(-r2, 0.))) * .35 + (A(vec2(r3, 0.)) - A(vec2(-r3, 0.))) * .25;
          float gy = (A(vec2(0., r1)) - A(vec2(0., -r1))) * .5 + (A(vec2(0., r2)) - A(vec2(0., -r2))) * .35 + (A(vec2(0., r3)) - A(vec2(0., -r3))) * .25;
          float lx = Y(vec2(q, 0.)) - Y(vec2(-q, 0.)), ly = Y(vec2(0., q)) - Y(vec2(0., -q));
          vec3 n = vec3(-gx * 1.5 - lx * .9, gy * 1.5 + ly * .9, 1.); return normalize(n); }
        uniform vec3 uFogC; uniform vec3 uFog; uniform vec3 uCloud; uniform float uTime; uniform float uDark;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
        void main(){ float ul = step(1.5, vC.a); float kind = vX.x, q = max(1., vX.z); vec2 uv = vUV;
          float refl = step(3.5, kind); float wm = 1.;
          if (refl > .5) { wm = texture2D(uWM, clamp((vG - uWR.xy) * uWR.zw, .002, .998)).r; if (wm < .1) discard; uv.x += sin(vG.y * .9 + uTime * 3.) * 1.4 * q * uTx.x; }
          vec4 c = texture2D(uT, uv) * vec4(vC.rgb, vC.a - ul * 2.);
          float lit = step(.5, kind) * (1. - refl) * uLit;
          if (c.a < .02) { if (lit < .5) discard; vec4 nb = max(max(texture2D(uT, vUV + vec2(q, 0.) * uTx), texture2D(uT, vUV - vec2(q, 0.) * uTx)), max(texture2D(uT, vUV + vec2(0., q) * uTx), texture2D(uT, vUV - vec2(0., q) * uTx)));
            if (nb.a < .5) discard; c = vec4(mix(nb.rgb * .3, uOut, .55), nb.a * (vC.a - ul * 2.)); }
          if (refl > .5) { float fall = clamp(1. - (vG.y - vX.y) / 70., .25, 1.); c.rgb = mix(c.rgb * .9, uWC, .32); c.a *= .62 * wm * fall; }
          vec3 L = vec3(1.); if (uUseL > .5 && ul < .5) L = texture2D(uL, clamp((vW - uLR.xy) * uLR.zw, .002, .998)).rgb;
          if (lit > .5 && ul < .5) {
            vec3 N = nrm(q); if (kind > 1.5 && kind < 2.5) N.x = -N.x;
            float plane = step(2.5, kind); float hgt = mix(vX.y - vW.y, 0., plane);
            vec3 K = normalize(uKey); float kd = max(dot(N, K), 0.);
            vec3 sh = L * (.74 + .42 * kd - (1. - N.z) * .06);
            for (int i = 0; i < NLM; i++) { if (i >= uNL) break; vec4 lp = uLP[i];
              vec3 Lv = plane > .5 ? vec3(lp.x - vW.x, vW.y - lp.y, 36.) : vec3(lp.x - vW.x, uLH - hgt, lp.y - vX.y);
              float d = length(vec2(Lv.x, plane > .5 ? Lv.y : Lv.z)); if (d >= lp.z) continue; float at = 1. - d / lp.z; at *= at;
              float df = max(dot(N, normalize(Lv)), 0.); sh += uLC[i] * at * (df * 1.05 - .3); }
            vec2 rd = normalize(N.xy + vec2(.0001)); float rim = pow(1. - N.z, 2.2) * (.55 + .45 * max(dot(rd, -normalize(K.xy + vec2(.0001))), 0.)) * uRim.a;
            c.rgb = c.rgb * max(sh, vec3(0.)) + uRim.rgb * rim * (L * .5 + .5) * c.a;
          } else c.rgb *= L;
          if (uCloud.x > 0.) { vec2 q = vW * .006 + vec2(uTime * uCloud.y, uTime * uCloud.y * .4); float k = smoothstep(.55, .75, n2(q) * .65 + n2(q * 2.3) * .35); c.rgb *= 1. - k * uCloud.x * vec3(.9, .85, .6); }
          float f = clamp((vD - uFog.x) / max(1., uFog.y - uFog.x), 0., 1.) * uFog.z; c.rgb = mix(c.rgb, uFogC, f);
          c.rgb *= 1. - uDark; gl_FragColor = c;  }`, ['aP', 'aUV', 'aW', 'aC', 'aX']);
      try { this.sp = mkSP(8); this.NLM = 8; } catch (e) { console.warn('HD: 8-light shader failed, using 3', e); this.sp = mkSP(3); this.NLM = 3; }
      const fsq = `attribute vec2 aP; varying vec2 uv; void main(){ uv = aP * .5 + .5; gl_Position = vec4(aP, 0., 1.); }`;
      this.bp = prog(fsq, `precision mediump float; varying vec2 uv; uniform sampler2D uT; uniform vec2 uD;
        void main(){ vec4 s = texture2D(uT, uv) * .227027; s += texture2D(uT, uv + uD * 1.3846) * .3162162; s += texture2D(uT, uv - uD * 1.3846) * .3162162; s += texture2D(uT, uv + uD * 3.2308) * .0702703; s += texture2D(uT, uv - uD * 3.2308) * .0702703; gl_FragColor = s; }`, ['aP']);
      this.pp = prog(fsq, `precision mediump float; varying vec2 uv; uniform sampler2D uS; uniform sampler2D uB; uniform vec4 uDof; uniform vec2 uBloom; uniform float uGrade; uniform float uVig;
        uniform vec4 uShimR; uniform float uShimA; uniform float uPT; uniform vec4 uSh; uniform vec3 uShC; uniform sampler2D uA; uniform float uPV; uniform sampler2D uScr; uniform float uScrOn;
        float sc(float v){ v = clamp(v, 0., 1.); return v + (v - .5) * (1. - abs(v - .5) * 2.) * .14; }
        float hh(float x){ return fract(sin(x * 91.7) * 43758.55); }
        float n1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(hh(i), hh(i + 1.), f); }
        void main(){ vec2 suv = uv;
          // heat shimmer: a rising, wobbling UV offset inside a soft screen rect (forges, braziers, the Midnight Flame)
          if (uShimA > 0.) { vec2 e = smoothstep(uShimR.xy - .04, uShimR.xy + .03, uv) * (1. - smoothstep(uShimR.zw - .03, uShimR.zw + .04, uv)); float m = e.x * e.y * uShimA;
            suv.x += (sin(uv.y * 150. - uPT * 11.) * .6 + sin(uv.y * 63. + uv.x * 40. - uPT * 6.3) * .4) * m * .0021;
            suv.y += sin(uv.x * 95. - uPT * 8.) * m * .0011; }
          vec3 c = texture2D(uS, suv).rgb, b = texture2D(uB, suv).rgb;
          float y = 1. - uv.y; float d = uDof.z * ((1. - smoothstep(uDof.x - uDof.y, uDof.x, y)) + smoothstep(uDof.w, uDof.w + uDof.y, y));
          c = mix(c, b, clamp(d, 0., 1.));
          c += max(b - uBloom.x, 0.) * uBloom.y;
          if (uGrade > .5) { float l = dot(c, vec3(.3, .59, .11)); float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), k = 1.32 - (mx - mn) * .35;
            c = l + (c - l) * k; float s = pow(1. - clamp(l, 0., 1.), 2.2) * .22, hh = pow(clamp(l, 0., 1.), 2.4) * .10;
            c += (vec3(.20, .12, .34) - c) * s; c.r += (1. - c.r) * hh; c.g += (.94 - c.g) * hh; c.b += (.80 - c.b) * hh * .6; c = vec3(sc(c.r), sc(c.g), sc(c.b)); }
          // light shafts: radial march from the light through the blurred buffer (occluders cut real gaps), plus soft procedural god-ray bands
          if (uSh.x > 0.) c += uShC * texture2D(uA, uv).rgb; // light shafts, computed at quarter res (perf)
          vec2 q = uv - .5; c *= 1. - dot(q, q) * uVig;
          if (uScrOn > 0.) { vec4 o = texture2D(uScr, vec2(uv.x, 1. - uv.y)); c = mix(c, o.rgb, o.a); } // the 2D screen overlay (motes, framing), composited here (perf)
          if (uPV > 0.) { vec2 pq = q * vec2(1280., 720.); c = mix(c, vec3(.0314, .0157, .0627), .62 * uPV * clamp((length(pq) - 250.) / 570., 0., 1.)); } // the UI-res 2D vignette, baked in here (perf: saves a full-screen 2D blend)
          gl_FragColor = vec4(c, 1.); }`, ['aP']);
      // light shafts at quarter res: radial march from the light through the blurred buffer (occluders cut real gaps), plus soft procedural god-ray bands
      this.shp = prog(fsq, `precision mediump float; varying vec2 uv; uniform sampler2D uB; uniform vec4 uSh; uniform float uPT;
        float hh(float x){ return fract(sin(x * 91.7) * 43758.55); }
        float n1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(hh(i), hh(i + 1.), f); }
        void main(){ vec3 c = vec3(0.); vec3 uShC = vec3(1.);
          { vec2 sp = uSh.yz, dv = (uv - sp) * (1. / 16.), p = uv; float acc = 0., w = 1.;
            for (int i = 0; i < 16; i++) { p -= dv; vec3 s = texture2D(uB, clamp(p, .001, .999)).rgb; acc += max(dot(s, vec3(.3, .59, .11)) - .5, 0.) * w; w *= uSh.w; }
            vec2 d = uv - sp; float ang = atan(d.y, d.x), dist = length(d * vec2(1.78, 1.));
            float bands = pow(n1(ang * 26. + uPT * .08), 3.) * .7 + pow(n1(ang * 61. - uPT * .05), 4.) * .5;
            float fall = (1. - smoothstep(.15, 1.45, dist));
            c += uShC * (acc * .075 + bands * .22 * fall) * uSh.x * (.35 + .65 * fall); }
          gl_FragColor = vec4(c, 1.); }`, ['aP']);
      // buffers
      this.MAXQ = 12000; this.VS = 14; this.vf = new Float32Array(this.MAXQ * 4 * this.VS); this.vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.vb); gl.bufferData(gl.ARRAY_BUFFER, this.vf.byteLength, gl.DYNAMIC_DRAW);
      const idx = new Uint16Array(Math.min(this.MAXQ, 16383) * 6); for (let i = 0, v = 0; i < idx.length; i += 6, v += 4) { idx[i] = v; idx[i + 1] = v + 1; idx[i + 2] = v + 2; idx[i + 3] = v + 2; idx[i + 4] = v + 1; idx[i + 5] = v + 3; }
      this.ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      this.fq = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.fq); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      this.white = this.mkTex(1, 1, new Uint8Array([255, 255, 255, 255]));
      this.texs = new WeakMap(); this.lightTex = this.mkTex(1, 1, new Uint8Array([255, 255, 255, 255]));
      this.fbo = {}; this.resize(this.RW, this.RH);
      // static atlas (cached art) + dynamic strips (per-frame captures)
      this.SA = 2048; this.sat = this.mkTex(this.SA, this.SA, null); this.sPack = { x: 0, y: 0, h: 0 }; this.sMap = new Map(); this.artMap = new WeakMap();
      this.strips = []; this.STW = 1024; this.STH = 256;
      // 2D helper canvases
      const mk = (w, h) => { const cc = document.createElement('canvas'); cc.width = w; cc.height = h; const x = cc.getContext('2d'); x.imageSmoothingEnabled = false; return [cc, x]; };
      this.mk = mk; [this.cap, this.capx] = mk(1200, 820); this.instrument(this.capx);
      [this.lc, this.lx] = mk(256, 160); [this.scr, this.scrx] = mk(CONFIG.LW, CONFIG.LH); this.scrT = this.instrument(this.scrx, { on: true, x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }); // perf: the light map is smooth and linearly filtered; 256x160 is plenty
      this.layers = {};
      c.addEventListener('webglcontextlost', e => { e.preventDefault(); this.failed = true; this.ok = false; });
      this.ok = true;
    } catch (e) { console.warn('HD renderer unavailable:', e); this.failed = true; this.ok = false; }
    return this.ok;
  },
  mkTex(w, h, data) { const gl = this.gl, t = gl.createTexture(); t._tw = 1 / Math.max(1, w); t._th = 1 / Math.max(1, h); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data); return t; },
  mkFbo(w, h, linear) { const gl = this.gl, t = this.mkTex(w, h, null); if (linear) { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); } const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null); return { f, t, w, h }; },
  resize(w, h) { this.RW = w; this.RH = h; this.c.width = w; this.c.height = h; this.fbo.s = this.mkFbo(w, h, true); const bw = Math.max(64, w >> 2), bh = Math.max(36, h >> 2); this.fbo.a = this.mkFbo(bw, bh, true); this.fbo.b = this.mkFbo(bw, bh, true); },
  // upload / fetch a texture for a canvas.  dyn = re-upload every frame it is used
  texFor(cv, dyn, rep) {
    const gl = this.gl; let e = this.texs.get(cv);
    if (!e) { e = { t: this.mkTex(1, 1, null), w: 0, h: 0, f: -1 }; this.texs.set(cv, e); dyn = true; if (rep) { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); } }
    if ((dyn && e.f !== this.frameN) || e.w !== cv.width || e.h !== cv.height) { gl.bindTexture(gl.TEXTURE_2D, e.t); if (e.w === cv.width && e.h === cv.height) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, cv); else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv); e.w = cv.width; e.h = cv.height; e.f = this.frameN; e.t._tw = 1 / cv.width; e.t._th = 1 / cv.height; }
    return e;
  },
  // ---------------- bounds-tracking capture context ----------------
  // bounds-tracking 2D context.  T = tracker {on, x0,y0,x1,y1 (device px), cells?: Uint8Array grid of CS-px cells, cw, ch}
  // perf: knowing exactly which parts of a canvas were drawn lets captures stay small and lets layers emit/upload only their painted cells
  instrument(x, T) {
    const P2 = CanvasRenderingContext2D.prototype; let dirty = true, m = null; T = T || (this.bb = { on: false, x0: 0, y0: 0, x1: 0, y1: 0 }); x._T = T;
    for (const k of ['setTransform', 'translate', 'scale', 'rotate', 'transform', 'resetTransform', 'restore']) x[k] = function () { dirty = true; return P2[k].apply(this, arguments); };
    const M = () => { if (dirty) { m = P2.getTransform.call(x); dirty = false; } return m; };
    const mark = (x0, y0, x1, y1) => {
      if (x0 < T.x0) T.x0 = x0; if (y0 < T.y0) T.y0 = y0; if (x1 > T.x1) T.x1 = x1; if (y1 > T.y1) T.y1 = y1;
      const C = T.cells; if (!C) return; const cs = HD.CS, i0 = Math.max(0, Math.floor((x0 - 2) / cs)), j0 = Math.max(0, Math.floor((y0 - 2) / cs)), i1 = Math.min(T.cw - 1, Math.floor((x1 + 2) / cs)), j1 = Math.min(T.ch - 1, Math.floor((y1 + 2) / cs));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) C[j * T.cw + i] = 1;
    };
    const all = () => mark(0, 0, x.canvas.width, x.canvas.height);
    const tr = (X, Y, W, H) => {
      if (!T.on) return; const m = M(); let x0, y0, x1, y1;
      if (m.b === 0 && m.c === 0) { x0 = m.a * X + m.e; x1 = m.a * (X + W) + m.e; y0 = m.d * Y + m.f; y1 = m.d * (Y + H) + m.f; if (x0 > x1) { const t = x0; x0 = x1; x1 = t; } if (y0 > y1) { const t = y0; y0 = y1; y1 = t; } }
      else { const xs = [X, X + W, X, X + W], ys = [Y, Y, Y + H, Y + H]; x0 = y0 = 1e9; x1 = y1 = -1e9; for (let i = 0; i < 4; i++) { const px = m.a * xs[i] + m.c * ys[i] + m.e, py = m.b * xs[i] + m.d * ys[i] + m.f; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; } }
      if (x1 < 0 || y1 < 0 || x0 > x.canvas.width || y0 > x.canvas.height) return; mark(x0, y0, x1, y1);
    };
    // current path bounds (device px), so fill()/stroke() mark only what they touch
    const pb = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9, bad: false };
    const pt = (X, Y, r) => { const m = M(); r = r || 0; const s = r ? Math.max(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d)) * r : 0, px = m.a * X + m.c * Y + m.e, py = m.b * X + m.d * Y + m.f; if (px - s < pb.x0) pb.x0 = px - s; if (py - s < pb.y0) pb.y0 = py - s; if (px + s > pb.x1) pb.x1 = px + s; if (py + s > pb.y1) pb.y1 = py + s; };
    x.beginPath = function () { pb.x0 = pb.y0 = 1e9; pb.x1 = pb.y1 = -1e9; pb.bad = false; return P2.beginPath.call(this); };
    x.moveTo = function (a, b) { if (T.on) pt(a, b); return P2.moveTo.call(this, a, b); };
    x.lineTo = function (a, b) { if (T.on) pt(a, b); return P2.lineTo.call(this, a, b); };
    x.quadraticCurveTo = function (a, b, c, d) { if (T.on) { pt(a, b); pt(c, d); } return P2.quadraticCurveTo.apply(this, arguments); };
    x.bezierCurveTo = function (a, b, c, d, e, f) { if (T.on) { pt(a, b); pt(c, d); pt(e, f); } return P2.bezierCurveTo.apply(this, arguments); };
    x.arcTo = function (a, b, c, d, r) { if (T.on) { pt(a, b, r); pt(c, d, r); } return P2.arcTo.apply(this, arguments); };
    x.rect = function (a, b, c, d) { if (T.on) { pt(a, b); pt(a + c, b + d); pt(a + c, b); pt(a, b + d); } return P2.rect.apply(this, arguments); };
    if (P2.roundRect) x.roundRect = function (a, b, c, d) { if (T.on) { pt(a, b); pt(a + c, b + d); pt(a + c, b); pt(a, b + d); } return P2.roundRect.apply(this, arguments); };
    x.arc = function (a, b, r) { if (T.on) pt(a, b, Math.abs(r)); return P2.arc.apply(this, arguments); };
    x.ellipse = function (a, b, rx, ry) { if (T.on) pt(a, b, Math.max(Math.abs(rx), Math.abs(ry))); return P2.ellipse.apply(this, arguments); };
    x.closePath = function () { return P2.closePath.call(this); };
    const pathMark = (pad) => { if (!T.on) return; if (pb.bad || pb.x1 < pb.x0) { if (pb.bad) all(); return; } const x0 = pb.x0 - pad, y0 = pb.y0 - pad, x1 = pb.x1 + pad, y1 = pb.y1 + pad; if (x1 < 0 || y1 < 0 || x0 > x.canvas.width || y0 > x.canvas.height) return; mark(Math.max(0, x0), Math.max(0, y0), Math.min(x.canvas.width, x1), Math.min(x.canvas.height, y1)); };
    x.fill = function (p) { if (T.on) { if (p && typeof p === 'object') all(); else pathMark(2); } return P2.fill.apply(this, arguments); };
    x.stroke = function (p) { if (T.on) { if (p && typeof p === 'object') all(); else { const m = M(); pathMark(this.lineWidth * Math.max(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d)) + (this.lineJoin === 'miter' ? this.lineWidth * this.miterLimit : 0) + 3); } } return P2.stroke.apply(this, arguments); };
    x.fillRect = function (X, Y, W, H) { tr(X, Y, W, H); return P2.fillRect.call(this, X, Y, W, H); };
    x.strokeRect = function (X, Y, W, H) { const l = this.lineWidth + 1; tr(X - l, Y - l, W + l * 2, H + l * 2); return P2.strokeRect.call(this, X, Y, W, H); };
    x.drawImage = function (img, a, b, c, d, e, f, g, h) { const n = arguments.length; if (n === 3) tr(a, b, img.width, img.height); else if (n === 5) tr(a, b, c, d); else tr(e, f, g, h); return P2.drawImage.apply(this, arguments); };
    for (const k of ['fillText', 'strokeText', 'putImageData']) x[k] = function () { if (T.on) all(); return P2[k].apply(this, arguments); };
    return T;
  },
  // cell trackers for layer canvases (cells of CS device px)
  CS: 64,
  mkTracker(w, h) { const cw = Math.ceil(w / this.CS), ch = Math.ceil(h / this.CS); return { on: true, x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9, cells: new Uint8Array(cw * ch), cw, ch }; },
  resetTracker(T) { T.x0 = T.y0 = 1e9; T.x1 = T.y1 = -1e9; if (T.cells) T.cells.fill(0); },
  // ---------------- camera ----------------
  setCam() {
    const k = this.cfg, D = k.dist / Math.max(.2, k.zoom || 1), th = k.pitch * Math.PI / 180, ya = (k.yaw || 0) * Math.PI / 180;
    const T3 = [k.tx, k.th || 0, k.ty * k.zs];
    const C = [T3[0] + Math.sin(ya) * Math.cos(th) * D, T3[1] + Math.sin(th) * D, T3[2] + Math.cos(ya) * Math.cos(th) * D];
    const f = norm3(sub3(T3, C)), r = norm3(cross3(f, [0, 1, 0])), u = cross3(r, f);
    this.C = C; this.f = f; this.r = r; this.u = u; this.tanH = Math.tan(k.fov * Math.PI / 360); this.asp = CONFIG.LW / CONFIG.LH;
    const proj = mat4Persp(k.fov * Math.PI / 180, this.asp, 8, 9000), view = mat4Look(C, f, r, u); this.M = mat4Mul(proj, view);
  },
  project3(X, Y, Z) { const m = this.M, x = m[0] * X + m[4] * Y + m[8] * Z + m[12], y = m[1] * X + m[5] * Y + m[9] * Z + m[13], w = m[3] * X + m[7] * Y + m[11] * Z + m[15]; return [(x / w + 1) * .5 * CONFIG.LW, (1 - y / w) * .5 * CONFIG.LH, w]; },
  // 2D world point -> low-res screen (ground mapping, or on the action plane if planeY is set)
  toScreen(x, y) { const k = this.cfg; if (k.planeY !== undefined) { const h = k.planeY - y, b = [x, 0, k.planeY * k.zs]; return this.project3(b[0] + this.u[0] * h, this.u[1] * h, b[2] + this.u[2] * h); } return this.project3(x, 0, y * k.zs); },
  // low-res screen -> 2D world point on the ground
  unproject(sx, sy) { const nx = (sx / CONFIG.LW) * 2 - 1, ny = 1 - (sy / CONFIG.LH) * 2, t = this.tanH, a = this.asp; const d = [this.f[0] + this.r[0] * nx * t * a + this.u[0] * ny * t, this.f[1] + this.r[1] * nx * t * a + this.u[1] * ny * t, this.f[2] + this.r[2] * nx * t * a + this.u[2] * ny * t]; if (d[1] > -1e-4) d[1] = -1e-4; const s = -this.C[1] / d[1]; return [this.C[0] + d[0] * s, (this.C[2] + d[2] * s) / this.cfg.zs]; },
  // 2D rect of ground visible on screen (for culling + layer canvases)
  calcView() { const pts = [[0, 0], [CONFIG.LW, 0], [0, CONFIG.LH], [CONFIG.LW, CONFIG.LH], [CONFIG.LW / 2, 0]].map(([a, b]) => this.unproject(a, b)); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } this.viewU = { x0, y0, x1, y1 }; const k = this.cfg; y0 = Math.max(y0, k.ty - (k.maxBack || 700)); x0 = Math.max(x0, k.tx - 520); x1 = Math.min(x1, k.tx + 520); this.view = { x0: Math.floor(x0), y0: Math.floor(y0), x1: Math.ceil(x1), y1: Math.ceil(y1) }; },
  // ---------------- frame API ----------------
  begin(cfg) {
    this.frameN = (this.frameN || 0) + 1; this.on = true;
    this.cfg = Object.assign({ pitch: 52, fov: 34, zs: 1, zoom: 1, yaw: 0, dist: 0, fog: [0, 0, 0], fogC: [.6, .65, .8], cloud: 0, dof: [.2, .18, .9, .9], bloom: [.72, .45], vig: .5, clear: [.1, .1, .12] }, cfg);
    if (!this.cfg.dist) this.cfg.dist = (CONFIG.LH / 2) / Math.tan(this.cfg.fov * Math.PI / 360);
    if (this.cfg.zs === 'auto') this.cfg.zs = 1 / Math.sin(this.cfg.pitch * Math.PI / 180);
    this.setCam(); this.calcView();
    this.quads.length = 0; this.nq = 0; this.reb = 0; this.lights.length = 0; this.refl = []; this.shadows = []; this.firstBill = -1; this.deferTo = null; this.water = this.cfg.water || null; this.Q = Gfx.level >= 2 && Settings.hiSprites !== false && Gfx.trim < 2 ? 2 : 1; this.tint = null; this.planeL = null; this.amb = [255, 255, 255]; this.useLight = false; this.dark = 0;
    for (const s of this.strips) { s.x = 0; s.y = 0; s.h = 0; s.used = false; }
    const sx = this.scrx; sx.setTransform(1, 0, 0, 1, 0, 0); if (this.scrUsed()) sx.clearRect(0, 0, CONFIG.LW, CONFIG.LH); this.resetTracker(this.scrT); sx.globalAlpha = 1; sx.globalCompositeOperation = 'source-over';
  },
  // a 2D canvas covering the visible ground; draw into it in world coords
  layer(name, opts = {}) {
    const v = this.view, w = Math.min(1100, v.x1 - v.x0 + 16), h = Math.min(640, v.y1 - v.y0 + 16); let L = this.layers[name];
    const bw = Math.ceil(w / 64) * 64, bh = Math.ceil(h / 64) * 64;
    const q = opts.q || 1; if (!L || L.c.width !== bw * q || L.c.height !== bh * q) { const [c, x] = this.mk(bw * q, bh * q); L = this.layers[name] = { c, x, T: null }; c._L = L; L.T = this.instrument(x, this.mkTracker(c.width, c.height)); L.T.x0 = 0; L.T.y0 = 0; L.T.x1 = c.width; L.T.y1 = c.height; } L.q = q; L.x._q = q;
    L.ox = opts.ox !== undefined ? opts.ox : v.x0 - 8; L.oy = opts.oy !== undefined ? opts.oy : v.y0 - 8; L.w = opts.w || w; L.h = opts.h || h;
    const x = L.x, T = L.T; x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    if (T.x1 > T.x0) { const x0 = Math.max(0, Math.floor(T.x0) - 4), y0 = Math.max(0, Math.floor(T.y0) - 4); x.clearRect(x0, y0, Math.min(L.c.width, Math.ceil(T.x1) + 4) - x0, Math.min(L.c.height, Math.ceil(T.y1) + 4) - y0); } // perf: clear only what was painted last frame
    this.resetTracker(T); L.f = this.frameN; x.setTransform(q, 0, 0, q, -L.ox * q, -L.oy * q);
    useCtx(x); return L;
  },
  // perf: a layer's painted cells -> a texture holding just their bounding box (small upload) + the list of painted cells
  layerTex(L) {
    const T = L.T, CS = this.CS; if (L.uf === this.frameN && L.ut) return L.ut;
    let n = 0; for (let i = 0; i < T.cells.length; i++) n += T.cells[i]; if (!n) return (L.uf = this.frameN, L.ut = { n: 0 });
    let i0 = 1e9, j0 = 1e9, i1 = -1, j1 = -1; for (let j = 0; j < T.ch; j++) for (let i = 0; i < T.cw; i++) if (T.cells[j * T.cw + i]) { if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j; }
    const bx = i0 * CS, by = j0 * CS, bw = Math.min(L.c.width, (i1 + 1) * CS) - bx, bh = Math.min(L.c.height, (j1 + 1) * CS) - by; let cv = L.c, e;
    if (bw * bh < L.c.width * L.c.height * .6) { const tw = Math.ceil(bw / 128) * 128, th = Math.ceil(bh / 128) * 128; if (!L.tc || L.tc.width !== tw || L.tc.height !== th) { [L.tc, L.tx] = this.mk(tw, th); } L.tx.clearRect(0, 0, tw, th); L.tx.drawImage(L.c, bx, by, bw, bh, 0, 0, bw, bh); cv = L.tc; e = this.texFor(cv, true); L.ut = { n, e, bx, by, cv }; }
    else { e = this.texFor(cv, true); L.ut = { n, e, bx: 0, by: 0, cv }; }
    L.uf = this.frameN; return L.ut;
  },
  scrUsed() { return this.scrT.x1 > this.scrT.x0; }, // perf: main.js skips the full-screen overlay blit when nothing was drawn on it
  screenLayer() { const x = this.scrx; x.setTransform(1, 0, 0, 1, 0, 0); useCtx(x); return x; },
  // ---- quad emitters ----
  pushQ(tex, P4, uv, W4, col, X) { if (this.nq >= this.MAXQ) return; const qd = { tex, P4, uv, W4, col, X: X || HD.X0 }; if (this.deferTo) this.deferTo.push(qd); else this.quads.push(qd); this.nq++; },
  // ground planes are emitted as 64px cells: empty cells are skipped and (for tiled fills) cells hidden under a later opaque ground are culled.  perf: fog/lava/decal planes are mostly empty, the tiled forest under the village is mostly hidden
  ground(cv, x, y, o = {}) { const e = this.texFor(cv, o.dyn, o.rep), w = o.w || cv.width, h = o.h || cv.height, zs = this.cfg.zs, yy = (o.lift || 0); const sw = o.sw || (o.rep ? w : cv.width), sh = o.sh || (o.rep ? h : cv.height), u0 = (o.sx || 0) / e.w, v0 = (o.sy || 0) / e.h, u1 = ((o.sx || 0) + sw) / e.w, v1 = ((o.sy || 0) + sh) / e.h;
    const col = o.col || (this.tint ? [this.tint[0], this.tint[1], this.tint[2], o.alpha === undefined ? 1 : o.alpha] : [1, 1, 1, o.alpha === undefined ? 1 : o.alpha]);
    if (Settings.sparseGround !== false && (o.rep || o.cells || !o.dyn)) { const G = { e, cv, x, y, w, h, yy, u0, v0, u1, v1, col, rep: !!o.rep, cells: o.cells || null, occ: o.rep || o.cells ? null : this.occGrid(cv), sx: o.sx || 0, sy: o.sy || 0, sw, sh }; (this.deferTo || this.quads).push({ G, col }); return; }
    this.pushQ(e.t, [x, yy, y * zs, x + w, yy, y * zs, x, yy, (y + h) * zs, x + w, yy, (y + h) * zs], [u0, v0, u1, v0, u0, v1, u1, v1], [x, y, x + w, y, x, y + h, x + w, y + h], col); },
  groundLayer(name, o = {}) { const L = this.layers[name]; if (!L) return; if (L.f !== this.frameN) return; const U = this.layerTex(L); if (!U.n) return; const q = L.q || 1;
    this.ground(U.cv, L.ox + U.bx / q, L.oy + U.by / q, Object.assign({ dyn: false, w: L.w - U.bx / q, h: L.h - U.by / q, sw: L.w * q - U.bx, sh: L.h * q - U.by, cells: { T: L.T, bx: U.bx, by: U.by } }, o)); },
  // per-canvas 64px cell occupancy (any visible pixel) + opacity (every pixel opaque), read back once.  Non-dyn canvases are treated as immutable by texFor already
  occGrid(cv) {
    this.occ = this.occ || new WeakMap(); let G = this.occ.get(cv); if (G && G.w === cv.width && G.h === cv.height) return G;
    G = this.occOf(cv, cv.width, cv.height); this.occ.set(cv, G); return G;
  },
  // any: a cell holds (or is within 8px of) a visible pixel -> must be drawn (the 8px margin keeps lit-sprite outlines); opq: every pixel opaque
  occOf(cv, W, H) {
    const CS = this.CS, cw = Math.ceil(W / CS), ch = Math.ceil(H / CS), any = new Uint8Array(cw * ch), opq = new Uint8Array(cw * ch), fw = Math.ceil(W / 8), fh = Math.ceil(H / 8), fine = new Uint8Array(fw * fh);
    try { const d = cv.getContext('2d').getImageData(0, 0, W, H).data; opq.fill(1);
      for (let y = 0; y < H; y++) { const fj = (y >> 3) * fw, cj = ((y / CS) | 0) * cw; for (let x = 0, p = y * W * 4 + 3; x < W; x++, p += 4) { const v = d[p]; if (v) fine[fj + (x >> 3)] = 1; if (v !== 255) opq[cj + ((x / CS) | 0)] = 0; } }
      const r = CS / 8; for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) { let a = 0; for (let fy = Math.max(0, j * r - 1); fy <= Math.min(fh - 1, (j + 1) * r) && !a; fy++) for (let fx = Math.max(0, i * r - 1); fx <= Math.min(fw - 1, (i + 1) * r); fx++) if (fine[fy * fw + fx]) { a = 1; break; } any[j * cw + i] = a; }
    } catch (err) { any.fill(1); opq.fill(0); }
    let n = 0; for (let i = 0; i < any.length; i++) n += any[i];
    return { w: W, h: H, cw, ch, any, opq, full: n === any.length };
  },
  // a billboard split into its non-empty cells (perf: big art with transparent areas — sky cut-outs, fog banks, light rays, trees)
  billCells(tex, x, y, w, h, yb, U, G, o) {
    if (!G || G.full || Settings.sparseGround === false || G.w < 96 && G.h < 96) return this.bill(tex, x, y, w, h, yb, [U[0], U[1], U[2], U[1], U[0], U[3], U[2], U[3]], o);
    const CS = this.CS, flip = U[0] > U[2], sw = o.sway || 0, oo = Object.assign({}, o, { ax: x + w / 2 }), sx = w / G.w, sy = h / G.h;
    for (let j = 0; j < G.ch; j++) for (let i = 0; i < G.cw; i++) { if (!G.any[j * G.cw + i]) continue;
      const p0 = i * CS, p1 = Math.min(G.w, (i + 1) * CS), q0 = j * CS, q1 = Math.min(G.h, (j + 1) * CS);
      const wx0 = flip ? x + (G.w - p1) * sx : x + p0 * sx, wx1 = flip ? x + (G.w - p0) * sx : x + p1 * sx, wy0 = y + q0 * sy, wy1 = y + q1 * sy;
      const uL = U[0] + (flip ? p1 : p0) / G.w * (U[2] - U[0]), uR = U[0] + (flip ? p0 : p1) / G.w * (U[2] - U[0]), vT = U[1] + q0 / G.h * (U[3] - U[1]), vB = U[1] + q1 / G.h * (U[3] - U[1]);
      oo.swy = [sw * (y + h - wy0) / h, sw * (y + h - wy1) / h];
      this.bill(tex, wx0, wy0, wx1 - wx0, wy1 - wy0, yb, [uL, vT, uR, vT, uL, vB, uR, vB], oo); }
  },
  // expand a deferred ground record into cell quads (called from render, so later opaque grounds can hide tiled ones)
  expandG(G, out, covers) {
    const zs = this.cfg.zs, VU = this.viewU, CS = this.CS, col = G.col, X = this.X0, t = G.e.t, yy = G.yy;
    const mg = 64 + Math.abs(yy) / Math.max(.15, Math.tan((this.cfg.pitch || 52) * Math.PI / 180)) * 1.3;
    const vx0 = VU.x0 - mg, vy0 = VU.y0 - mg, vx1 = VU.x1 + mg, vy1 = VU.y1 + mg;
    const ea = col[3] >= 1.5 ? col[3] - 2 : col[3], solid = ea >= .999; let opq = null; // perf: fully opaque cells are drawn without blending
    if (solid && !G.cells) { const O = G.rep ? this.occGrid(G.cv) : G.occ; opq = G.rep ? (O.opq.every(v => v) ? 1 : 0) : O.opq; }
    let curOp = false; const kx = G.w / G.sw, ky = G.h / G.sh, du = (G.u1 - G.u0) / G.w, dv = (G.v1 - G.v0) / G.h; // world px per canvas px, uv per world px
    const emit = (wx0, wy0, wx1, wy1) => {
      if (wx1 < vx0 || wx0 > vx1 || wy1 < vy0 || wy0 > vy1 || this.nq >= this.MAXQ) return;
      if (covers) for (const c of covers) if (c.covers(wx0, wy0, wx1, wy1)) return;
      const a0 = G.u0 + (wx0 - G.x) * du, a1 = G.u0 + (wx1 - G.x) * du, b0 = G.v0 + (wy0 - G.y) * dv, b1 = G.v0 + (wy1 - G.y) * dv;
      out.push({ tex: t, P4: [wx0, yy, wy0 * zs, wx1, yy, wy0 * zs, wx0, yy, wy1 * zs, wx1, yy, wy1 * zs], uv: [a0, b0, a1, b0, a0, b1, a1, b1], W4: [wx0, wy0, wx1, wy0, wx0, wy1, wx1, wy1], col, X, op: curOp }); this.nq++;
    };
    if (G.rep) { const st = 128, x0 = Math.max(G.x, vx0), y0 = Math.max(G.y, vy0), x1 = Math.min(G.x + G.w, vx1), y1 = Math.min(G.y + G.h, vy1); const i0 = Math.floor(x0 / st), j0 = Math.floor(y0 / st);
      for (let j = j0; j * st < y1; j++) for (let i = i0; i * st < x1; i++) { curOp = opq === 1; emit(Math.max(G.x, i * st), Math.max(G.y, j * st), Math.min(G.x + G.w, (i + 1) * st), Math.min(G.y + G.h, (j + 1) * st)); } return; }
    // canvas cells -> world rects (cell edges computed identically for neighbours, so no cracks)
    let cw, ch, has, ox = 0, oy = 0; if (G.cells) { const T = G.cells.T; cw = T.cw; ch = T.ch; has = T.cells; ox = G.cells.bx; oy = G.cells.by; } else { cw = G.occ.cw; ch = G.occ.ch; has = G.occ.any; }
    const cx = (px) => G.x + (Math.min(Math.max(px - ox, 0), G.sx + G.sw) - G.sx) * kx, cy = (py) => G.y + (Math.min(Math.max(py - oy, 0), G.sy + G.sh) - G.sy) * ky;
    const pi0 = G.cells ? Math.floor(ox / CS) : Math.floor(G.sx / CS), pj0 = G.cells ? Math.floor(oy / CS) : Math.floor(G.sy / CS);
    const pi1 = G.cells ? cw - 1 : Math.min(cw - 1, Math.floor((G.sx + G.sw - 1) / CS)), pj1 = G.cells ? ch - 1 : Math.min(ch - 1, Math.floor((G.sy + G.sh - 1) / CS));
    for (let j = pj0; j <= pj1; j++) for (let i = pi0; i <= pi1; i++) if (has[j * cw + i]) { curOp = !!(opq && opq[j * cw + i]); const x0 = cx(G.cells ? i * CS : Math.max(G.sx, i * CS) ), x1 = cx(G.cells ? (i + 1) * CS : Math.min(G.sx + G.sw, (i + 1) * CS)), y0 = cy(G.cells ? j * CS : Math.max(G.sy, j * CS)), y1 = cy(G.cells ? (j + 1) * CS : Math.min(G.sy + G.sh, (j + 1) * CS)); if (x1 > x0 && y1 > y0) emit(x0, y0, x1, y1); }
  },
  // a camera-facing billboard for the 2D rect (x,y,w,h) whose row yb sits on the ground
  bill(tex, x, y, w, h, yb, uv, o = {}) {
    const zs = this.cfg.zs, r = this.r, u = this.u, ax = o.ax !== undefined ? o.ax : x + w / 2, bz = yb * zs, sw = o.sway || 0, lean = o.lean === undefined ? 1 : o.lean;
    const U = [u[0] * lean, u[1] * lean + (1 - lean), u[2] * lean]; const ul = Math.hypot(U[0], U[1], U[2]); U[0] /= ul; U[1] /= ul; U[2] /= ul;
    const pt = (px, py, s) => { const dx = px - ax + s, hh = yb - py; return [ax + r[0] * dx + U[0] * hh, r[1] * dx + U[1] * hh, bz + r[2] * dx + U[2] * hh]; };
    const s0 = o.swy ? o.swy[0] : sw, s1 = o.swy ? o.swy[1] : 0, a = pt(x, y, s0), b = pt(x + w, y, s0), c = pt(x, y + h, s1), d = pt(x + w, y + h, s1);
    const col = o.col ? o.col.slice() : (this.tint ? [this.tint[0], this.tint[1], this.tint[2], o.alpha === undefined ? 1 : o.alpha] : [1, 1, 1, o.alpha === undefined ? 1 : o.alpha]); if (o.unlit) col[3] += 2;
    if (this.firstBill < 0) this.firstBill = this.quads.length;
    const kind = o.plane ? 3 : o.lit ? (o.flip ? 2 : 1) : 0, X = kind || o.q ? [kind, yb, o.q || 1] : HD.X0;
    this.pushQ(tex, [...a, ...b, ...c, ...d], uv, [x, y, x + w, y, x, y + h, x + w, y + h], col, X);
    if (this.water && !o.plane && !o.noRefl && o.alpha !== 0 && this.nearWater(x, x + w, yb, h)) {
      // mirror as an upright (not camera-leaning) card: a camera-facing billboard mirrored through y=0 is seen almost edge-on
      // (projected height ~ h*cos(2*pitch)), which is why reflections used to vanish.  Upright -> visible height h*cos(pitch).
      const rk = o.reflK || .92, mp = (px, py, s) => { const dx = px - ax + s, hh = (yb - py) * rk; return [ax + r[0] * dx, -hh, bz + r[2] * dx]; };
      const ra = mp(x, y, s0 * .6), rb = mp(x + w, y, s0 * .6), rc = mp(x, y + h, s1 * .6), rd = mp(x + w, y + h, s1 * .6);
      this.refl.push({ tex, P4: [...ra, ...rb, ...rc, ...rd], uv, W4: [x, y, x + w, y, x, y + h, x + w, y + h], col: col.slice(), X: [4, yb, o.q || 1] });
    }
  },
  // cached art canvas -> static atlas -> billboard
  art(cv, dx, dy, yb, o = {}) {
    let e = this.artMap.get(cv); if (!e || e.gen !== this.sGen) { e = this.sAlloc(cv.width, cv.height); if (!e) return; this.gl.bindTexture(this.gl.TEXTURE_2D, this.sat); this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, e.x, e.y, this.gl.RGBA, this.gl.UNSIGNED_BYTE, cv); e.gen = this.sGen; this.artMap.set(cv, e); }
    const S = this.SA, sc = o.scale || 1; let u0 = e.x / S, u1 = (e.x + e.w) / S; if (o.flip) { const t = u0; u0 = u1; u1 = t; }
    this.billCells(this.sat, dx, dy, e.w * sc, e.h * sc, yb, [u0, e.y / S, u1, (e.y + e.h) / S], cv.width >= 96 || cv.height >= 96 ? this.occGrid(cv) : null, o);
  },
  sGen: 1,
  sAlloc(w, h) { const p = this.sPack, S = this.SA; if (w > S || h > S) return null; if (p.x + w + 4 > S) { p.x = 0; p.y += p.h + 4; p.h = 0; } if (p.y + h + 4 > S) { this.sGen++; this.sMap.clear(); p.x = 0; p.y = 0; p.h = 0; } const e = { x: p.x, y: p.y, w, h, gen: this.sGen }; p.x += w + 4; p.h = Math.max(p.h, h); return e; },
  // run fn() (which draws in 2D world coords) and turn whatever it drew into a billboard.
  // key -> cache the result in the static atlas (re-captured when ver changes); rect -> clip to a 2D rect
  capture(yb, fn, key, ver, rect, o = {}) {
    if (key) { const s = this.sMap.get(key); if (s && s.gen === this.sGen && (s.ver === ver || (this.reb = (this.reb || 0) + 1) > CONFIG.RECAPTURES_PER_FRAME)) { if (s.w) this.billCells(this.sat, s.wx, s.wy, s.w, s.h, yb, [s.uv[0], s.uv[1], s.uv[6], s.uv[7]], s.occ, o); return; } } // perf: when many cached art pieces change version at once (dusk/dawn), rebuild a couple per frame and show the previous version meanwhile
    const v = this.view, ox = rect ? Math.floor(rect[0]) - 2 : Math.max(v.x0 - 30, (this.cfg.tx | 0) - 550), oy = rect ? Math.floor(rect[1]) - 2 : v.y0 - 300, x = this.capx, b = this.bb;
    const P2 = CanvasRenderingContext2D.prototype, q = (o.hi && rect && !key && this.Q > 1 && (rect[2] + 4) * this.Q < this.cap.width && (rect[3] + 4) * this.Q < this.cap.height) ? this.Q : 1;
    if (o.hi) o = Object.assign({ lit: true }, o, { q });
    P2.setTransform.call(x, 1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.imageSmoothingEnabled = false;
    if (rect) { x.save(); P2.setTransform.call(x, q, 0, 0, q, -ox * q, -oy * q); x.beginPath(); x.rect(rect[0], rect[1], rect[2], rect[3]); x.clip(); }
    x.setTransform(q, 0, 0, q, -ox * q, -oy * q); x._q = q;
    b.on = true; b.x0 = 1e9; b.y0 = 1e9; b.x1 = -1e9; b.y1 = -1e9;
    const prev = useCtx(x); try { fn(); } catch (err) { console.error(err); } finally { useCtx(prev); b.on = false; x._q = 1; }
    if (rect) x.restore();
    let X0 = Math.max(0, Math.floor(b.x0)), Y0 = Math.max(0, Math.floor(b.y0)), X1 = Math.min(this.cap.width, Math.ceil(b.x1)), Y1 = Math.min(this.cap.height, Math.ceil(b.y1));
    if (rect) { X0 = Math.max(X0, Math.floor((rect[0] - ox) * q)); Y0 = Math.max(Y0, Math.floor((rect[1] - oy) * q)); X1 = Math.min(X1, Math.ceil((rect[0] + rect[2] - ox) * q)); Y1 = Math.min(Y1, Math.ceil((rect[1] + rect[3] - oy) * q)); }
    const w = X1 - X0, h = Y1 - Y0; P2.setTransform.call(x, 1, 0, 0, 1, 0, 0);
    if (w <= 0 || h <= 0) { if (key && !(b.x1 > b.x0)) this.sMap.set(key, { gen: this.sGen, ver, w: 0 }); return; } // only cache 'empty' when nothing was drawn (not when it fell off the capture canvas)
    const wx = X0 / q + ox, wy = Y0 / q + oy;
    if (o.hi && o.shadow !== false) this.shadow(wx + w / q / 2, yb, Math.min(26, w / q * .42));
    if (key) {
      let s = this.sMap.get(key); if (!s || s.gen !== this.sGen || s.cw < w || s.ch < h) { const e = this.sAlloc(w, h); if (!e) { x.clearRect(X0, Y0, w, h); return; } s = { gen: this.sGen, x: e.x, y: e.y, cw: w, ch: h }; }
      const [tc, tx] = this.tmpCanvas(s.cw, s.ch); tx.clearRect(0, 0, s.cw, s.ch); tx.drawImage(this.cap, X0, Y0, w, h, 0, 0, w, h);
      const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, this.sat); gl.texSubImage2D(gl.TEXTURE_2D, 0, s.x, s.y, gl.RGBA, gl.UNSIGNED_BYTE, tc);
      const S = this.SA; Object.assign(s, { ver, w, h, wx, wy, occ: (w >= 96 || h >= 96) && Settings.sparseGround !== false && s.ver === undefined ? this.occOf(tc, w, h) : null, uv: [s.x / S, s.y / S, (s.x + w) / S, s.y / S, s.x / S, (s.y + h) / S, (s.x + w) / S, (s.y + h) / S] }); this.sMap.set(key, s);
      x.clearRect(X0, Y0, w, h); this.billCells(this.sat, wx, wy, w, h, yb, [s.uv[0], s.uv[1], s.uv[6], s.uv[7]], s.occ, o); return;
    }
    const cell = this.dAlloc(w, h); if (!cell) { x.clearRect(X0, Y0, w, h); return; }
    cell.s.x2.drawImage(this.cap, X0, Y0, w, h, cell.x, cell.y, w, h); if (o.grab) o.grab(X0, Y0, w, h, wx, wy, q); x.clearRect(X0, Y0, w, h);
    const SW = this.STW, SH = this.STH; this.bill(cell.s, wx, wy, w / q, h / q, yb, [cell.x / SW, cell.y / SH, (cell.x + w) / SW, cell.y / SH, cell.x / SW, (cell.y + h) / SH, (cell.x + w) / SW, (cell.y + h) / SH], o);
  },
  // perf: a moving character whose image is re-drawn only when asked (ver changes); in between the last image is re-used at the
  // current position.  ax/ay = integer anchor (feet), rel = capture rect relative to the anchor.  Each key keeps one fixed atlas slot.
  frameSprite(key, ver, ax, ay, yb, fn, rel, o = {}) {
    this.fMap = this.fMap || new Map(); let s = this.fMap.get(key); const q = o.hi && this.Q > 1 ? this.Q : 1;
    if (s && s.gen === this.sGen && s.ver === ver && s.q === q && s.uv) {
      const oo = o.hi ? Object.assign({ lit: true }, o, { q }) : o; if (o.hi && o.shadow !== false) this.shadow(ax + s.dx + s.w / 2, yb, Math.min(26, s.w * .42));
      this.bill(this.sat, ax + s.dx, ay + s.dy, s.w, s.h, yb, s.uv, oo); return; }
    if (!s || s.gen !== this.sGen || s.q !== q) { const sl = this.sAlloc(Math.ceil(rel[2] * q) + 8, Math.ceil(rel[3] * q) + 8); if (!sl) { this.capture(yb, fn, null, 0, [ax + rel[0], ay + rel[1], rel[2], rel[3]], o); return; } s = { gen: this.sGen, q, sl }; this.fMap.set(key, s); }
    s.ver = ver; s.uv = null;
    const grab = (X0, Y0, w, h, wx, wy, qq) => { const sl = s.sl; if (w > sl.w || h > sl.h || qq !== q) return; const [tc, tx] = this.tmpCanvas(sl.w, sl.h); tx.clearRect(0, 0, sl.w, sl.h); tx.drawImage(this.cap, X0, Y0, w, h, 0, 0, w, h);
      const gl = this.gl, S = this.SA; gl.bindTexture(gl.TEXTURE_2D, this.sat); gl.texSubImage2D(gl.TEXTURE_2D, 0, sl.x, sl.y, gl.RGBA, gl.UNSIGNED_BYTE, tc);
      Object.assign(s, { dx: wx - ax, dy: wy - ay, w: w / q, h: h / q, uv: [sl.x / S, sl.y / S, (sl.x + w) / S, sl.y / S, sl.x / S, (sl.y + h) / S, (sl.x + w) / S, (sl.y + h) / S] }); };
    this.capture(yb, fn, null, 0, [ax + rel[0], ay + rel[1], rel[2], rel[3]], Object.assign({}, o, { grab }));
  },
  tmpCanvas(w, h) { const k = w + 'x' + h; this.tmpC = this.tmpC || new Map(); let t = this.tmpC.get(k); if (!t) { if (this.tmpC.size > 60) this.tmpC.clear(); t = this.mk(w, h); this.tmpC.set(k, t); } return t; },
  dAlloc(w, h) {
    if (w + 14 > this.STW || h + 14 > this.STH) return null;
    for (const s of this.strips) { if (s.x + w + 14 > this.STW) { s.x = 0; s.y += s.h + 14; s.h = 0; } if (s.y + h + 14 <= this.STH) { if (!s.used) { s.used = true; s.x2.clearRect(0, 0, this.STW, this.STH); } const c = { s, x: s.x + 7, y: s.y + 7 }; s.x += w + 14; s.h = Math.max(s.h, h); return c; } }
    if (this.strips.length >= 8) return null;
    const [c, x2] = this.mk(this.STW, this.STH); const s = { c, x2, x: 0, y: 0, h: 0, used: true, isStrip: true }; this.strips.push(s); return this.dAlloc(w, h);
  },
  // an entire 2D canvas standing upright: canvas pixel (px,py) = world (ox+px, oy+py); row yb on the ground
  plane(cv, ox, oy, yb, o = {}) { const q = o.q || 1, w = o.w || cv.width / q, h = o.h || cv.height / q, L = cv._L;
    if (L && L.T && Settings.sparseGround !== false) { // perf: a layer plane (combat action plane) -> only its painted cells, from a bounding-box texture
      const U = this.layerTex(L); if (!U.n) return; const e = U.e, CS = this.CS, T = L.T, ax = ox + w / 2, oo = Object.assign({}, o, { ax, sway: 0 });
      for (let j = 0; j < T.ch; j++) for (let i = 0; i < T.cw; i++) if (T.cells[j * T.cw + i]) { const px0 = i * CS, py0 = j * CS, px1 = Math.min((i + 1) * CS, w * q), py1 = Math.min((j + 1) * CS, h * q); if (px1 <= px0 || py1 <= py0) continue;
        const a0 = (px0 - U.bx) / e.w, a1 = (px1 - U.bx) / e.w, b0 = (py0 - U.by) / e.h, b1 = (py1 - U.by) / e.h; this.bill(e.t, ox + px0 / q, oy + py0 / q, (px1 - px0) / q, (py1 - py0) / q, yb, [a0, b0, a1, b0, a0, b1, a1, b1], oo); }
      return; }
    const e = this.texFor(cv, true); this.bill(e.t, ox, oy, w, h, yb, [0, 0, w * q / e.w, 0, 0, h * q / e.h, w * q / e.w, h * q / e.h], o); },
  // heat shimmer over a world point (forge, brazier): a w x h world-px box above (x, y), projected to the screen
  shimmerAt(x, y, w, h, amt = 1) { if (!this.cfg) return; const a = this.toScreen(x - w, y - h), b = this.toScreen(x + w, y + 6); if (a[2] <= 0 || b[0] < -20 || a[0] > CONFIG.LW + 20 || b[1] < -20 || a[1] > CONFIG.LH + 20) return; const lift = (b[1] - a[1]) * .9; this.cfg.shimmer = [amt, Math.min(a[0], b[0]), a[1] - lift, Math.max(a[0], b[0]), b[1]]; },
  // ---------------- lights (fed by Light.add while HD is on) ----------------
  light(x, y, r, col, a, glow, soft) { this.lights.push([x, y, r, col, a, glow, !!soft]); },
  buildLightMap() {
    const v = this.view, L = this.lightRect = this.cfg.lightRect || [v.x0 - 40, v.y0 - 40, v.x1 - v.x0 + 80, v.y1 - v.y0 + 80];
    const x = this.lx, W = this.lc.width, H = this.lc.height, sx = W / L[2], sy = H / L[3];
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.fillStyle = rgb(this.amb[0], this.amb[1], this.amb[2]); x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'lighter'; x.setTransform(sx, 0, 0, sy, -L[0] * sx, -L[1] * sy);
    x.imageSmoothingEnabled = true; for (const [lx, ly, r, col, a] of this.lights) { if (a <= .01 || lx + r < L[0] || lx - r > L[0] + L[2] || ly + r < L[1] || ly - r > L[1] + L[3]) continue; x.globalAlpha = Math.min(1, a); x.drawImage(LightSprite.get(col, 'l'), lx - r, ly - r, r * 2, r * 2); } x.globalAlpha = 1; x.imageSmoothingEnabled = false; // off-map lights are skipped
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over';
    const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, this.lightTex); if (this._lmUp) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.lc); else { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.lc); this._lmUp = true; } gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  },
  // ---------------- lit sprites: lights, soft shadows, water ----------------
  X0: [0, 0, 1],
  // pick the 8 point lights that matter most near the camera target and feed them to the per-pixel sprite shader
  litUniforms(sp) {
    const gl = this.gl, k = this.cfg, on = Settings.litSprites !== false ? 1 : 0; gl.uniform1f(sp.u.uLit, on); gl.uniform1f(sp.u.uZs, k.zs || 1);
    const nk = typeof World !== 'undefined' ? World.nightK() : 0;
    const key = k.key || [-.55, .62, .55]; gl.uniform3f(sp.u.uKey, key[0], key[1], key[2]);
    const sky = k.rim || (k.fogC ? [Math.min(1, k.fogC[0] * 1.15 + .1), Math.min(1, k.fogC[1] * 1.12 + .08), Math.min(1, k.fogC[2] * 1.1 + .1), .32 + nk * .1] : [.8, .85, 1, .3]);
    gl.uniform4f(sp.u.uRim, sky[0], sky[1], sky[2], sky[3] === undefined ? .3 : sky[3]);
    const oc = k.outline || (nk > .5 ? [.1, .08, .24] : [.24, .1, .2]); gl.uniform3f(sp.u.uOut, oc[0], oc[1], oc[2]);
    gl.uniform1f(sp.u.uLH, k.lightH || 22);
    const tx = k.tx || 0, ty = k.planeY !== undefined ? (k.th !== undefined ? k.planeY - 40 : k.planeY) : (k.ty || 0);
    const vw = this.view, maxL = Math.min(this.NLM || 8, Gfx.level >= 2 && Gfx.trim < 1 ? (nk > .5 ? CONFIG.NIGHT_PIXEL_LIGHTS : 8) : 4); // perf: night scenes have 40+ lights; only the strongest few on screen go per-pixel (the light map still has them all)
    const cand = this.useLight && maxL > 0 ? this.lights.filter(l => !l[6] && l[4] > .08 && l[2] > 8 && l[0] + l[2] > vw.x0 && l[0] - l[2] < vw.x1 && l[1] + l[2] > vw.y0 && l[1] - l[2] < vw.y1).map(l => [l, l[4] * l[2] / (1 + Math.hypot(l[0] - tx, l[1] - ty) / 160)]).sort((a, b) => b[1] - a[1]).slice(0, maxL) : []; // per-pixel lights: 8 on full HIGH, 4 when trimmed / MEDIUM
    const LP = this.LPa || (this.LPa = new Float32Array(32)), LC = this.LCa || (this.LCa = new Float32Array(24)); LP.fill(0); LC.fill(0);
    cand.forEach(([l], i) => { const c = hexToRgb(l[3]); LP[i * 4] = l[0]; LP[i * 4 + 1] = l[1]; LP[i * 4 + 2] = l[2] * 1.15; LP[i * 4 + 3] = 0; const a = Math.min(1.4, l[4]) * .95; LC[i * 3] = c[0] / 255 * a; LC[i * 3 + 1] = c[1] / 255 * a; LC[i * 3 + 2] = c[2] / 255 * a; });
    gl.uniform1i(sp.u.uNL, cand.length); if (sp.u['uLP[0]']) gl.uniform4fv(sp.u['uLP[0]'], LP.subarray(0, this.NLM * 4)); else if (sp.u.uLP) gl.uniform4fv(sp.u.uLP, LP.subarray(0, this.NLM * 4)); if (sp.u['uLC[0]']) gl.uniform3fv(sp.u['uLC[0]'], LC.subarray(0, this.NLM * 3)); else if (sp.u.uLC) gl.uniform3fv(sp.u.uLC, LC.subarray(0, this.NLM * 3));
    // water mask
    const W = this.water; gl.uniform1i(sp.u.uWM, 2); gl.activeTexture(gl.TEXTURE2);
    if (W) { const e = this.texFor(W.cv, false); gl.bindTexture(gl.TEXTURE_2D, e.t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.uniform4f(sp.u.uWR, W.rect[0], W.rect[1], 1 / W.rect[2], 1 / W.rect[3]); const wc = W.col || [.3, .45, .6]; gl.uniform3f(sp.u.uWC, wc[0], wc[1], wc[2]); }
    else { gl.bindTexture(gl.TEXTURE_2D, this.white); gl.uniform4f(sp.u.uWR, 0, 0, 1, 1); gl.uniform3f(sp.u.uWC, .3, .45, .6); }
    gl.activeTexture(gl.TEXTURE0);
  },
  // water mask helper for scenes: fn(x,y) -> true where the ground is open water.  Cached per key.
  waterMask(key, rect, fn, col) {
    this.wm = this.wm || {}; let W = this.wm[key];
    if (!W) { const sc = 4, w = Math.ceil(rect[2] / sc), h = Math.ceil(rect[3] / sc); const [cv, x] = this.mk(w, h); const id = x.createImageData(w, h); const m = new Uint8Array(w * h);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const v = fn(rect[0] + i * sc + 2, rect[1] + j * sc + 2) ? 255 : 0; m[j * w + i] = v ? 1 : 0; const p = (j * w + i) * 4; id.data[p] = id.data[p + 1] = id.data[p + 2] = v; id.data[p + 3] = 255; }
      x.putImageData(id, 0, 0); W = this.wm[key] = { cv, rect, m, w, h, sc, col }; }
    return W;
  },
  nearWater(x0, x1, yb, h) {
    const W = this.water; if (!W) return false; const R = W.rect, sc = W.sc;
    for (let yy = yb + 2; yy < yb + Math.max(12, h * .9); yy += 6) for (let xx = x0; xx <= x1; xx += Math.max(4, (x1 - x0) / 4)) { const i = Math.floor((xx - R[0]) / sc), j = Math.floor((yy - R[1]) / sc); if (i >= 0 && j >= 0 && i < W.w && j < W.h && W.m[j * W.w + i]) return true; }
    return false;
  },
  // soft contact/cast shadow on the ground, stretched away from the strongest nearby light (or the sun by day)
  shadowTex() { if (this._sht) return this._sht; const [c, x] = this.mk(32, 64); x.setTransform(1, 0, 0, 3.6, 0, 0); const g = x.createRadialGradient(16, 3.2, 1, 16, 3.2, 14.5); g.addColorStop(0, 'rgba(10,6,20,.9)'); g.addColorStop(.4, 'rgba(10,6,20,.55)'); g.addColorStop(1, 'rgba(10,6,20,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 18); x.setTransform(1, 0, 0, 1, 0, 0); return (this._sht = c); },
  shadow(x, y, rx, o = {}) {
    if (Settings.softShadows === false || !this.cfg) return; const zs = this.cfg.zs; const nk = typeof World !== 'undefined' ? World.nightK() : 0;
    let dx = .45, dy = .5, len = rx * (1.5 + (1 - nk) * .7), al = .26 * (1 - nk * .5);
    let best = null, bw = 0; if (this.useLight) for (const l of this.lights) { if (l[6]) continue; const d = Math.hypot(l[0] - x, l[1] - y); if (d < l[2] * .9 && d > 2) { const wgt = l[4] * (1 - d / l[2]); if (wgt > bw) { bw = wgt; best = [l, d]; } } }
    if (best && bw > .12) { const [l, d] = best; dx = (x - l[0]) / d; dy = (y - l[1]) / d; len = rx * (1.4 + Math.min(2.2, d / 30)); al = Math.min(.5, .22 + bw * .4); }
    else if (nk > .6 && !this.useLight) return;
    const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n; const px = -dy, py = dx, hw = rx * .95;
    const b0x = x - dx * rx * .35, b0y = y - dy * rx * .35, b1x = x + dx * len, b1y = y + dy * len, lift = .3;
    const P4 = [b0x - px * hw, lift, b0y * zs - py * hw * zs, b0x + px * hw, lift, (b0y + py * hw) * zs, b1x - px * hw * 1.2, lift, (b1y - py * hw * 1.2) * zs, b1x + px * hw * 1.2, lift, (b1y + py * hw * 1.2) * zs];
    const e = this.texFor(this.shadowTex(), false); const W4 = [P4[0], P4[2] / zs, P4[3], P4[5] / zs, P4[6], P4[8] / zs, P4[9], P4[11] / zs];
    this.shadows.push({ tex: e.t, P4, uv: [0, 0, 1, 0, 0, 1, 1, 1], W4, col: [1, 1, 1, al * (o.a || 1) + 2], X: this.X0 });
  },
  // replace deferred ground records by their cells; tiled grounds skip cells hidden under a later fully-opaque ground canvas
  expandAll(QS) {
    const out = [], gs = []; let fb = this.firstBill; QS.forEach((q, i) => { if (q.G) gs.push([i, q.G]); });
    const mkCover = (G) => ({ covers: (x0, y0, x1, y1) => { const kx = G.sw / G.w, ky = G.sh / G.h, px0 = G.sx + (x0 - G.x) * kx, px1 = G.sx + (x1 - G.x) * kx, py0 = G.sy + (y0 - G.y) * ky, py1 = G.sy + (y1 - G.y) * ky;
      if (px0 < G.sx || py0 < G.sy || px1 > G.sx + G.sw || py1 > G.sy + G.sh) return false; const O = G.occ, CS = this.CS;
      for (let j = Math.floor(py0 / CS); j * CS < py1; j++) for (let i = Math.floor(px0 / CS); i * CS < px1; i++) if (!O.opq[j * O.cw + i]) return false; return true; } });
    let gi = 0; this.nq = 0;
    for (let i = 0; i < QS.length; i++) { const q = QS[i]; if (i === this.firstBill) fb = out.length;
      if (!q.G) { out.push(q); this.nq++; continue; }
      const G = q.G; gi++; let covers = null;
      if (G.rep) for (let k = gi; k < gs.length; k++) { const H = gs[k][1], a = H.col[3] >= 1.5 ? H.col[3] - 2 : H.col[3]; if (H.occ && !H.yy && a >= .999) (covers = covers || []).push(mkCover(H)); }
      this.expandG(G, out, covers); }
    if (this.firstBill >= 0) this.firstBill = fb; return out;
  },
  // ---------------- render ----------------
  render() {
    const gl = this.gl, k = this.cfg, post = Gfx.level >= 2;
    const ks = Math.min(1, Math.max(.5, CONFIG.HD_SCALE || 1)), w0 = post && Gfx.trim < 3 ? (Gfx.trim ? [1120, 630] : [1280, 720]) : [960, 540], want = [Math.round(w0[0] * ks / 16) * 16, Math.round(w0[1] * ks / 9) * 9]; if (this.RW !== want[0]) this.resize(want[0], want[1]); // CONFIG.HD_SCALE < 1: optional extra saving (softer image)
    for (const s of this.strips) if (s.used) { const e = this.texFor(s.c, true); s.tex = e.t; }
    if (this.useLight) this.buildLightMap();
    // fill vertex buffer
    const vf = this.vf; let o = 0; const runs = []; let cur = null;
    let QS = this.quads; if (QS.some(q => q.G)) QS = this.expandAll(QS);
    if (this.refl.length || this.shadows.length) { const fb = this.firstBill < 0 ? QS.length : this.firstBill; QS = QS.slice(0, fb).concat(this.shadows, this.refl, QS.slice(fb)); if (QS.length > this.MAXQ) QS.length = this.MAXQ; }
    for (const q of QS) {
      if (!q.P4) continue; const t = q.tex && q.tex.isStrip ? q.tex.tex : q.tex, op = !!q.op; if (!cur || cur.t !== t || cur.op !== op) { cur = { t, n: 0, op }; runs.push(cur); }
      const X = q.X;
      for (let i = 0; i < 4; i++) { vf[o++] = q.P4[i * 3]; vf[o++] = q.P4[i * 3 + 1]; vf[o++] = q.P4[i * 3 + 2]; vf[o++] = q.uv[i * 2]; vf[o++] = q.uv[i * 2 + 1]; vf[o++] = q.W4[i * 2]; vf[o++] = q.W4[i * 2 + 1]; vf[o++] = q.col[0]; vf[o++] = q.col[1]; vf[o++] = q.col[2]; vf[o++] = q.col[3]; vf[o++] = X[0]; vf[o++] = X[1]; vf[o++] = X[2]; }
      cur.n++;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo.s.f); gl.viewport(0, 0, this.RW, this.RH);
    gl.clearColor(k.clear[0], k.clear[1], k.clear[2], 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const sp = this.sp; gl.useProgram(sp.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, vf.subarray(0, o));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ib);
    const st = 56; gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 3, gl.FLOAT, false, st, 44); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, st, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, st, 12); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, st, 20); gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.FLOAT, false, st, 28);
    gl.uniformMatrix4fv(sp.u.uM, false, this.M); gl.uniform3fv(sp.u.uCam, this.C);
    gl.uniform1i(sp.u.uT, 0); gl.uniform1i(sp.u.uL, 1); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.lightTex); gl.activeTexture(gl.TEXTURE0);
    const LR = this.lightRect || [0, 0, 1, 1]; gl.uniform4f(sp.u.uLR, LR[0], LR[1], 1 / LR[2], 1 / LR[3]); gl.uniform1f(sp.u.uUseL, this.useLight ? 1 : 0);
    gl.uniform3f(sp.u.uFogC, k.fogC[0], k.fogC[1], k.fogC[2]); gl.uniform3f(sp.u.uFog, k.fog[0], k.fog[1], k.fog[2]);
    gl.uniform3f(sp.u.uCloud, k.cloud, .02 + World.wind * .03, 0); gl.uniform1f(sp.u.uTime, T); gl.uniform1f(sp.u.uDark, this.dark);
    this.litUniforms(sp);
    let first = 0, bl = true; for (const r of runs) { const tt = r.t || this.white; if (r.op === bl) { bl = !r.op; if (bl) gl.enable(gl.BLEND); else gl.disable(gl.BLEND); } gl.uniform2f(sp.u.uTx, tt._tw || 1 / 1024, tt._th || 1 / 1024); gl.bindTexture(gl.TEXTURE_2D, tt); gl.drawElements(gl.TRIANGLES, r.n * 6, gl.UNSIGNED_SHORT, first * 12); first += r.n; }
    for (let i = 1; i < 5; i++) gl.disableVertexAttribArray(i);
    gl.disable(gl.BLEND);
    // blur chain (quarter res) for depth of field + bloom
    const fsq = (p) => { gl.bindBuffer(gl.ARRAY_BUFFER, this.fq); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
    if (post) {
      const A = this.fbo.a, Bf = this.fbo.b; gl.useProgram(this.bp.p); gl.uniform1i(this.bp.u.uT, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, A.f); gl.viewport(0, 0, A.w, A.h); gl.bindTexture(gl.TEXTURE_2D, this.fbo.s.t); gl.uniform2f(this.bp.u.uD, 1 / A.w, 0); fsq();
      gl.bindFramebuffer(gl.FRAMEBUFFER, Bf.f); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.uniform2f(this.bp.u.uD, 0, 1 / A.h); fsq();
      gl.bindFramebuffer(gl.FRAMEBUFFER, A.f); gl.bindTexture(gl.TEXTURE_2D, Bf.t); gl.uniform2f(this.bp.u.uD, 1.6 / A.w, 0); fsq();
      gl.bindFramebuffer(gl.FRAMEBUFFER, Bf.f); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.uniform2f(this.bp.u.uD, 0, 1.6 / A.h); fsq();
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, this.RW, this.RH);
    const pp = this.pp; gl.useProgram(pp.p); gl.uniform1i(pp.u.uS, 0); gl.uniform1i(pp.u.uB, 1);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, post ? this.fbo.b.t : this.fbo.s.t); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.fbo.s.t);
    const d = k.dof; gl.uniform4f(pp.u.uDof, d[0], d[1], post ? d[2] : 0, d[3]); gl.uniform2f(pp.u.uBloom, k.bloom[0], post ? k.bloom[1] : 0); gl.uniform1f(pp.u.uGrade, 1); gl.uniform1f(pp.u.uVig, k.vig);
    // post FX (HIGH only): heat shimmer + light shafts.  cfg.shimmer = [amt, x0, y0, x1, y1] in low-res screen px; cfg.shafts = [strength, sunX, sunY, [r,g,b], decay]
    const fx = post && Settings.postFX !== false, sm = fx && k.shimmer, sf = fx && Gfx.trim < 1 && k.shafts; gl.uniform1f(pp.u.uPT, T % 1000);
    gl.uniform1f(pp.u.uPV, this.postVig ? 1 : 0); gl.uniform1i(pp.u.uA, 2); gl.uniform1i(pp.u.uScr, 3);
    this.scrIn = this.postVig && this.scrUsed(); gl.uniform1f(pp.u.uScrOn, this.scrIn ? 1 : 0); if (this.scrIn) { const e = this.texFor(this.scr, true); gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, e.t); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.fbo.s.t); } // texFor binds on unit 0: restore the scene texture
    if (sm) { gl.uniform1f(pp.u.uShimA, sm[0]); gl.uniform4f(pp.u.uShimR, sm[1] / CONFIG.LW, 1 - sm[4] / CONFIG.LH, sm[3] / CONFIG.LW, 1 - sm[2] / CONFIG.LH); } else gl.uniform1f(pp.u.uShimA, 0);
    if (sf && sf[0] > .01) { const cc = sf[3] || [1, .9, .7]; gl.uniform4f(pp.u.uSh, sf[0], sf[1] / CONFIG.LW, 1 - sf[2] / CONFIG.LH, sf[4] || .9); gl.uniform3f(pp.u.uShC, cc[0], cc[1], cc[2]);
      const A = this.fbo.a, hp = this.shp; gl.useProgram(hp.p); gl.uniform1i(hp.u.uB, 0); gl.uniform4f(hp.u.uSh, sf[0], sf[1] / CONFIG.LW, 1 - sf[2] / CONFIG.LH, sf[4] || .9); gl.uniform1f(hp.u.uPT, T % 1000);
      gl.bindFramebuffer(gl.FRAMEBUFFER, A.f); gl.viewport(0, 0, A.w, A.h); gl.bindTexture(gl.TEXTURE_2D, this.fbo.b.t); fsq();
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, this.RW, this.RH); gl.useProgram(pp.p); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.fbo.s.t);
    } else gl.uniform4f(pp.u.uSh, 0, 0, 0, 0);
    fsq();
    this.on = false;
    return this.c;
  }
};
// capture option presets for characters (2x hi-res, per-pixel lit, soft cast shadow)
const HI_CHAR = { hi: true }, HI_SMALL = { hi: true, shadow: false };
// ---- tiny vector / matrix helpers ----
function sub3(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function cross3(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function norm3(a) { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
function mat4Persp(fy, asp, n, f) { const t = 1 / Math.tan(fy / 2); return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]); }
function mat4Look(C, f, r, u) { return new Float32Array([r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, -(r[0] * C[0] + r[1] * C[1] + r[2] * C[2]), -(u[0] * C[0] + u[1] * C[1] + u[2] * C[2]), f[0] * C[0] + f[1] * C[1] + f[2] * C[2], 1]); }
function mat4Mul(a, b) { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }
// ---- hooks: lights, camera mapping ----
(function () {
  const add = Light.add, begin = Light.begin, apply = Light.apply;
  Light.begin = function (amb) { if (HD.on) { HD.amb = amb; HD.useLight = true; this.list.length = 0; return; } return begin.call(this, amb); };
  Light.add = function (x, y, r, col, a = 1, flick = 0, glow = .35, soft = false) { if (HD.on) { if (a <= .01 || r <= 0) return; const f = flick ? 1 + (noise1(T * 9 + x * .3) * .5 + noise1(T * 23 + y) * .5) * flick : 1; HD.light(x, y, r * f, col, a * f, glow, soft); return; } return add.call(this, x, y, r, col, a, flick, glow); };
  Light.apply = function () { if (HD.on) return; return apply.call(this); };
  const ca = Cam.apply; Cam.apply = function (c, par, round) { if (HD.on && HD.planeL && c === HD.planeL.x) { const q = HD.planeL.q || 1; c.setTransform(q, 0, 0, q, -HD.planeL.ox * q, -HD.planeL.oy * q); return; } return ca.call(this, c, par, round); };
  const ts = Cam.toScreen; Cam.toScreen = function (x, y) { if (HD.live && HD.cfg) { const p = HD.toScreen(x, y); return [p[0], p[1]]; } return ts.call(this, x, y); };
})();
