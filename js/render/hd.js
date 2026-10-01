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
      const gl = c.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
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
              float d = length(vec2(Lv.x, plane > .5 ? Lv.y : Lv.z)); float at = clamp(1. - d / lp.z, 0., 1.); at *= at;
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
        uniform vec4 uShimR; uniform float uShimA; uniform float uPT; uniform vec4 uSh; uniform vec3 uShC;
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
          if (uSh.x > 0.) { vec2 sp = uSh.yz, dv = (uv - sp) * (1. / 16.), p = uv; float acc = 0., w = 1.;
            for (int i = 0; i < 16; i++) { p -= dv; vec3 s = texture2D(uB, clamp(p, .001, .999)).rgb; acc += max(dot(s, vec3(.3, .59, .11)) - .5, 0.) * w; w *= uSh.w; }
            vec2 d = uv - sp; float ang = atan(d.y, d.x), dist = length(d * vec2(1.78, 1.));
            float bands = pow(n1(ang * 26. + uPT * .08), 3.) * .7 + pow(n1(ang * 61. - uPT * .05), 4.) * .5;
            float fall = (1. - smoothstep(.15, 1.45, dist));
            c += uShC * (acc * .075 + bands * .22 * fall) * uSh.x * (.35 + .65 * fall); }
          vec2 q = uv - .5; c *= 1. - dot(q, q) * uVig;
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
      [this.lc, this.lx] = mk(512, 320); [this.scr, this.scrx] = mk(CONFIG.LW, CONFIG.LH);
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
  instrument(x) {
    const P2 = CanvasRenderingContext2D.prototype, self = this; let dirty = true, m = null;
    for (const k of ['setTransform', 'translate', 'scale', 'rotate', 'transform', 'resetTransform', 'restore']) x[k] = function () { dirty = true; return P2[k].apply(this, arguments); };
    const tr = (X, Y, W, H) => {
      const b = self.bb; if (!b.on) return; if (dirty) { m = P2.getTransform.call(x); dirty = false; }
      let x0, y0, x1, y1;
      if (m.b === 0 && m.c === 0) { x0 = m.a * X + m.e; x1 = m.a * (X + W) + m.e; y0 = m.d * Y + m.f; y1 = m.d * (Y + H) + m.f; if (x0 > x1) { const t = x0; x0 = x1; x1 = t; } if (y0 > y1) { const t = y0; y0 = y1; y1 = t; } }
      else { const xs = [X, X + W, X, X + W], ys = [Y, Y, Y + H, Y + H]; x0 = y0 = 1e9; x1 = y1 = -1e9; for (let i = 0; i < 4; i++) { const px = m.a * xs[i] + m.c * ys[i] + m.e, py = m.b * xs[i] + m.d * ys[i] + m.f; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; } }
      if (x0 < b.x0) b.x0 = x0; if (y0 < b.y0) b.y0 = y0; if (x1 > b.x1) b.x1 = x1; if (y1 > b.y1) b.y1 = y1;
    };
    x.fillRect = function (X, Y, W, H) { tr(X, Y, W, H); return P2.fillRect.call(this, X, Y, W, H); };
    x.drawImage = function (img, a, b, c, d, e, f, g, h) { const n = arguments.length; if (n === 3) tr(a, b, img.width, img.height); else if (n === 5) tr(a, b, c, d); else tr(e, f, g, h); return P2.drawImage.apply(this, arguments); };
    for (const k of ['fill', 'stroke', 'fillText', 'strokeText', 'putImageData']) x[k] = function () { const b = self.bb; if (b.on) { b.x0 = 0; b.y0 = 0; b.x1 = x.canvas.width; b.y1 = x.canvas.height; } return P2[k].apply(this, arguments); };
    this.bb = { on: false, x0: 0, y0: 0, x1: 0, y1: 0 };
  },
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
  calcView() { const pts = [[0, 0], [CONFIG.LW, 0], [0, CONFIG.LH], [CONFIG.LW, CONFIG.LH], [CONFIG.LW / 2, 0]].map(([a, b]) => this.unproject(a, b)); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } const k = this.cfg; y0 = Math.max(y0, k.ty - (k.maxBack || 700)); x0 = Math.max(x0, k.tx - 520); x1 = Math.min(x1, k.tx + 520); this.view = { x0: Math.floor(x0), y0: Math.floor(y0), x1: Math.ceil(x1), y1: Math.ceil(y1) }; },
  // ---------------- frame API ----------------
  begin(cfg) {
    this.frameN = (this.frameN || 0) + 1; this.on = true;
    this.cfg = Object.assign({ pitch: 52, fov: 34, zs: 1, zoom: 1, yaw: 0, dist: 0, fog: [0, 0, 0], fogC: [.6, .65, .8], cloud: 0, dof: [.2, .18, .9, .9], bloom: [.72, .45], vig: .5, clear: [.1, .1, .12] }, cfg);
    if (!this.cfg.dist) this.cfg.dist = (CONFIG.LH / 2) / Math.tan(this.cfg.fov * Math.PI / 360);
    if (this.cfg.zs === 'auto') this.cfg.zs = 1 / Math.sin(this.cfg.pitch * Math.PI / 180);
    this.setCam(); this.calcView();
    this.quads.length = 0; this.nq = 0; this.lights.length = 0; this.refl = []; this.shadows = []; this.firstBill = -1; this.deferTo = null; this.water = this.cfg.water || null; this.Q = Gfx.level >= 2 && Settings.hiSprites !== false && Gfx.trim < 2 ? 2 : 1; this.tint = null; this.planeL = null; this.amb = [255, 255, 255]; this.useLight = false; this.dark = 0;
    for (const s of this.strips) { s.x = 0; s.y = 0; s.h = 0; s.used = false; }
    const sx = this.scrx; sx.setTransform(1, 0, 0, 1, 0, 0); sx.clearRect(0, 0, CONFIG.LW, CONFIG.LH); sx.globalAlpha = 1; sx.globalCompositeOperation = 'source-over';
  },
  // a 2D canvas covering the visible ground; draw into it in world coords
  layer(name, opts = {}) {
    const v = this.view, w = Math.min(1100, v.x1 - v.x0 + 16), h = Math.min(640, v.y1 - v.y0 + 16); let L = this.layers[name];
    const bw = Math.ceil(w / 64) * 64, bh = Math.ceil(h / 64) * 64;
    const q = opts.q || 1; if (!L || L.c.width !== bw * q || L.c.height !== bh * q) { const [c, x] = this.mk(bw * q, bh * q); L = this.layers[name] = { c, x }; } L.q = q; L.x._q = q;
    L.ox = opts.ox !== undefined ? opts.ox : v.x0 - 8; L.oy = opts.oy !== undefined ? opts.oy : v.y0 - 8; L.w = opts.w || w; L.h = opts.h || h;
    const x = L.x; x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, L.c.width, L.c.height); x.setTransform(q, 0, 0, q, -L.ox * q, -L.oy * q);
    useCtx(x); return L;
  },
  screenLayer() { const x = this.scrx; x.setTransform(1, 0, 0, 1, 0, 0); useCtx(x); return x; },
  // ---- quad emitters ----
  pushQ(tex, P4, uv, W4, col, X) { if (this.nq >= this.MAXQ) return; const qd = { tex, P4, uv, W4, col, X: X || HD.X0 }; if (this.deferTo) this.deferTo.push(qd); else this.quads.push(qd); this.nq++; },
  ground(cv, x, y, o = {}) { const e = this.texFor(cv, o.dyn, o.rep), w = o.w || cv.width, h = o.h || cv.height, zs = this.cfg.zs, yy = (o.lift || 0); const sw = o.sw || (o.rep ? w : cv.width), sh = o.sh || (o.rep ? h : cv.height), u0 = (o.sx || 0) / e.w, v0 = (o.sy || 0) / e.h, u1 = ((o.sx || 0) + sw) / e.w, v1 = ((o.sy || 0) + sh) / e.h;
    this.pushQ(e.t, [x, yy, y * zs, x + w, yy, y * zs, x, yy, (y + h) * zs, x + w, yy, (y + h) * zs], [u0, v0, u1, v0, u0, v1, u1, v1], [x, y, x + w, y, x, y + h, x + w, y + h], o.col || (this.tint ? [this.tint[0], this.tint[1], this.tint[2], o.alpha === undefined ? 1 : o.alpha] : [1, 1, 1, o.alpha === undefined ? 1 : o.alpha])); },
  groundLayer(name, o = {}) { const L = this.layers[name]; if (!L) return; this.ground(L.c, L.ox, L.oy, Object.assign({ dyn: true, w: L.w, h: L.h, sw: L.w, sh: L.h }, o)); },
  // a camera-facing billboard for the 2D rect (x,y,w,h) whose row yb sits on the ground
  bill(tex, x, y, w, h, yb, uv, o = {}) {
    const zs = this.cfg.zs, r = this.r, u = this.u, ax = x + w / 2, bz = yb * zs, sw = o.sway || 0, lean = o.lean === undefined ? 1 : o.lean;
    const U = [u[0] * lean, u[1] * lean + (1 - lean), u[2] * lean]; const ul = Math.hypot(U[0], U[1], U[2]); U[0] /= ul; U[1] /= ul; U[2] /= ul;
    const pt = (px, py, s) => { const dx = px - ax + s, hh = yb - py; return [ax + r[0] * dx + U[0] * hh, r[1] * dx + U[1] * hh, bz + r[2] * dx + U[2] * hh]; };
    const a = pt(x, y, sw), b = pt(x + w, y, sw), c = pt(x, y + h, 0), d = pt(x + w, y + h, 0);
    const col = o.col ? o.col.slice() : (this.tint ? [this.tint[0], this.tint[1], this.tint[2], o.alpha === undefined ? 1 : o.alpha] : [1, 1, 1, o.alpha === undefined ? 1 : o.alpha]); if (o.unlit) col[3] += 2;
    if (this.firstBill < 0) this.firstBill = this.quads.length;
    const kind = o.plane ? 3 : o.lit ? (o.flip ? 2 : 1) : 0, X = kind || o.q ? [kind, yb, o.q || 1] : HD.X0;
    this.pushQ(tex, [...a, ...b, ...c, ...d], uv, [x, y, x + w, y, x, y + h, x + w, y + h], col, X);
    if (this.water && !o.plane && !o.noRefl && o.alpha !== 0 && this.nearWater(x, x + w, yb, h)) {
      // mirror as an upright (not camera-leaning) card: a camera-facing billboard mirrored through y=0 is seen almost edge-on
      // (projected height ~ h*cos(2*pitch)), which is why reflections used to vanish.  Upright -> visible height h*cos(pitch).
      const rk = o.reflK || .92, mp = (px, py, s) => { const dx = px - ax + s, hh = (yb - py) * rk; return [ax + r[0] * dx, -hh, bz + r[2] * dx]; };
      const ra = mp(x, y, sw * .6), rb = mp(x + w, y, sw * .6), rc = mp(x, y + h, 0), rd = mp(x + w, y + h, 0);
      this.refl.push({ tex, P4: [...ra, ...rb, ...rc, ...rd], uv, W4: [x, y, x + w, y, x, y + h, x + w, y + h], col: col.slice(), X: [4, yb, o.q || 1] });
    }
  },
  // cached art canvas -> static atlas -> billboard
  art(cv, dx, dy, yb, o = {}) {
    let e = this.artMap.get(cv); if (!e || e.gen !== this.sGen) { e = this.sAlloc(cv.width, cv.height); if (!e) return; this.gl.bindTexture(this.gl.TEXTURE_2D, this.sat); this.gl.texSubImage2D(this.gl.TEXTURE_2D, 0, e.x, e.y, this.gl.RGBA, this.gl.UNSIGNED_BYTE, cv); e.gen = this.sGen; this.artMap.set(cv, e); }
    const S = this.SA, sc = o.scale || 1; let u0 = e.x / S, u1 = (e.x + e.w) / S; if (o.flip) { const t = u0; u0 = u1; u1 = t; }
    this.bill(this.sat, dx, dy, e.w * sc, e.h * sc, yb, [u0, e.y / S, u1, e.y / S, u0, (e.y + e.h) / S, u1, (e.y + e.h) / S], o);
  },
  sGen: 1,
  sAlloc(w, h) { const p = this.sPack, S = this.SA; if (w > S || h > S) return null; if (p.x + w + 4 > S) { p.x = 0; p.y += p.h + 4; p.h = 0; } if (p.y + h + 4 > S) { this.sGen++; this.sMap.clear(); p.x = 0; p.y = 0; p.h = 0; } const e = { x: p.x, y: p.y, w, h, gen: this.sGen }; p.x += w + 4; p.h = Math.max(p.h, h); return e; },
  // run fn() (which draws in 2D world coords) and turn whatever it drew into a billboard.
  // key -> cache the result in the static atlas (re-captured when ver changes); rect -> clip to a 2D rect
  capture(yb, fn, key, ver, rect, o = {}) {
    if (key) { const s = this.sMap.get(key); if (s && s.gen === this.sGen && s.ver === ver) { if (s.w) this.bill(this.sat, s.wx, s.wy, s.w, s.h, yb, s.uv, o); return; } }
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
      const S = this.SA; Object.assign(s, { ver, w, h, wx, wy, uv: [s.x / S, s.y / S, (s.x + w) / S, s.y / S, s.x / S, (s.y + h) / S, (s.x + w) / S, (s.y + h) / S] }); this.sMap.set(key, s);
      x.clearRect(X0, Y0, w, h); this.bill(this.sat, wx, wy, w, h, yb, s.uv, o); return;
    }
    const cell = this.dAlloc(w, h); if (!cell) { x.clearRect(X0, Y0, w, h); return; }
    cell.s.x2.drawImage(this.cap, X0, Y0, w, h, cell.x, cell.y, w, h); x.clearRect(X0, Y0, w, h);
    const SW = this.STW, SH = this.STH; this.bill(cell.s, wx, wy, w / q, h / q, yb, [cell.x / SW, cell.y / SH, (cell.x + w) / SW, cell.y / SH, cell.x / SW, (cell.y + h) / SH, (cell.x + w) / SW, (cell.y + h) / SH], o);
  },
  tmpCanvas(w, h) { const k = w + 'x' + h; this.tmpC = this.tmpC || new Map(); let t = this.tmpC.get(k); if (!t) { if (this.tmpC.size > 60) this.tmpC.clear(); t = this.mk(w, h); this.tmpC.set(k, t); } return t; },
  dAlloc(w, h) {
    if (w + 14 > this.STW || h + 14 > this.STH) return null;
    for (const s of this.strips) { if (s.x + w + 14 > this.STW) { s.x = 0; s.y += s.h + 14; s.h = 0; } if (s.y + h + 14 <= this.STH) { if (!s.used) { s.used = true; s.x2.clearRect(0, 0, this.STW, this.STH); } const c = { s, x: s.x + 7, y: s.y + 7 }; s.x += w + 14; s.h = Math.max(s.h, h); return c; } }
    if (this.strips.length >= 8) return null;
    const [c, x2] = this.mk(this.STW, this.STH); const s = { c, x2, x: 0, y: 0, h: 0, used: true, isStrip: true }; this.strips.push(s); return this.dAlloc(w, h);
  },
  // an entire 2D canvas standing upright: canvas pixel (px,py) = world (ox+px, oy+py); row yb on the ground
  plane(cv, ox, oy, yb, o = {}) { const e = this.texFor(cv, true), q = o.q || 1, w = o.w || cv.width / q, h = o.h || cv.height / q; this.bill(e.t, ox, oy, w, h, yb, [0, 0, w * q / e.w, 0, 0, h * q / e.h, w * q / e.w, h * q / e.h], o); },
  // heat shimmer over a world point (forge, brazier): a w x h world-px box above (x, y), projected to the screen
  shimmerAt(x, y, w, h, amt = 1) { if (!this.cfg) return; const a = this.toScreen(x - w, y - h), b = this.toScreen(x + w, y + 6); if (a[2] <= 0 || b[0] < -20 || a[0] > CONFIG.LW + 20 || b[1] < -20 || a[1] > CONFIG.LH + 20) return; const lift = (b[1] - a[1]) * .9; this.cfg.shimmer = [amt, Math.min(a[0], b[0]), a[1] - lift, Math.max(a[0], b[0]), b[1]]; },
  // ---------------- lights (fed by Light.add while HD is on) ----------------
  light(x, y, r, col, a, glow) { this.lights.push([x, y, r, col, a, glow]); },
  buildLightMap() {
    const v = this.view, L = this.lightRect = this.cfg.lightRect || [v.x0 - 40, v.y0 - 40, v.x1 - v.x0 + 80, v.y1 - v.y0 + 80];
    const x = this.lx, W = this.lc.width, H = this.lc.height, sx = W / L[2], sy = H / L[3];
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.fillStyle = rgb(this.amb[0], this.amb[1], this.amb[2]); x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'lighter'; x.setTransform(sx, 0, 0, sy, -L[0] * sx, -L[1] * sy);
    for (const [lx, ly, r, col, a] of this.lights) { if (lx + r < L[0] || lx - r > L[0] + L[2] || ly + r < L[1] || ly - r > L[1] + L[3]) continue; LightSprite.draw(x, col, 'l', lx, ly, r, a); } // off-map lights are skipped
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
    const cand = this.useLight ? this.lights.filter(l => l[4] > .05 && l[2] > 8).map(l => [l, l[4] * l[2] / (1 + Math.hypot(l[0] - tx, l[1] - ty) / 160)]).sort((a, b) => b[1] - a[1]).slice(0, Math.min(this.NLM || 8, Gfx.level >= 2 && Gfx.trim < 1 ? 8 : 4)) : []; // per-pixel lights: 8 on full HIGH, 4 when trimmed / MEDIUM
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
    let best = null, bw = 0; if (this.useLight) for (const l of this.lights) { const d = Math.hypot(l[0] - x, l[1] - y); if (d < l[2] * .9 && d > 2) { const wgt = l[4] * (1 - d / l[2]); if (wgt > bw) { bw = wgt; best = [l, d]; } } }
    if (best && bw > .12) { const [l, d] = best; dx = (x - l[0]) / d; dy = (y - l[1]) / d; len = rx * (1.4 + Math.min(2.2, d / 30)); al = Math.min(.5, .22 + bw * .4); }
    else if (nk > .6 && !this.useLight) return;
    const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n; const px = -dy, py = dx, hw = rx * .95;
    const b0x = x - dx * rx * .35, b0y = y - dy * rx * .35, b1x = x + dx * len, b1y = y + dy * len, lift = .3;
    const P4 = [b0x - px * hw, lift, b0y * zs - py * hw * zs, b0x + px * hw, lift, (b0y + py * hw) * zs, b1x - px * hw * 1.2, lift, (b1y - py * hw * 1.2) * zs, b1x + px * hw * 1.2, lift, (b1y + py * hw * 1.2) * zs];
    const e = this.texFor(this.shadowTex(), false); const W4 = [P4[0], P4[2] / zs, P4[3], P4[5] / zs, P4[6], P4[8] / zs, P4[9], P4[11] / zs];
    this.shadows.push({ tex: e.t, P4, uv: [0, 0, 1, 0, 0, 1, 1, 1], W4, col: [1, 1, 1, al * (o.a || 1) + 2], X: this.X0 });
  },
  // ---------------- render ----------------
  render() {
    const gl = this.gl, k = this.cfg, post = Gfx.level >= 2;
    const want = post && Gfx.trim < 3 ? (Gfx.trim ? [1120, 630] : [1280, 720]) : [960, 540]; if (this.RW !== want[0]) this.resize(want[0], want[1]);
    for (const s of this.strips) if (s.used) { const e = this.texFor(s.c, true); s.tex = e.t; }
    if (this.useLight) this.buildLightMap();
    // fill vertex buffer
    const vf = this.vf; let o = 0; const runs = []; let cur = null;
    let QS = this.quads; if (this.refl.length || this.shadows.length) { const fb = this.firstBill < 0 ? QS.length : this.firstBill; QS = QS.slice(0, fb).concat(this.shadows, this.refl, QS.slice(fb)); if (QS.length > this.MAXQ) QS.length = this.MAXQ; }
    for (const q of QS) {
      const t = q.tex && q.tex.isStrip ? q.tex.tex : q.tex; if (!cur || cur.t !== t) { cur = { t, n: 0 }; runs.push(cur); }
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
    let first = 0; for (const r of runs) { const tt = r.t || this.white; gl.uniform2f(sp.u.uTx, tt._tw || 1 / 1024, tt._th || 1 / 1024); gl.bindTexture(gl.TEXTURE_2D, tt); gl.drawElements(gl.TRIANGLES, r.n * 6, gl.UNSIGNED_SHORT, first * 12); first += r.n; }
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
    if (sm) { gl.uniform1f(pp.u.uShimA, sm[0]); gl.uniform4f(pp.u.uShimR, sm[1] / CONFIG.LW, 1 - sm[4] / CONFIG.LH, sm[3] / CONFIG.LW, 1 - sm[2] / CONFIG.LH); } else gl.uniform1f(pp.u.uShimA, 0);
    if (sf && sf[0] > .01) { const cc = sf[3] || [1, .9, .7]; gl.uniform4f(pp.u.uSh, sf[0], sf[1] / CONFIG.LW, 1 - sf[2] / CONFIG.LH, sf[4] || .9); gl.uniform3f(pp.u.uShC, cc[0], cc[1], cc[2]); } else gl.uniform4f(pp.u.uSh, 0, 0, 0, 0);
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
  Light.add = function (x, y, r, col, a = 1, flick = 0, glow = .35) { if (HD.on) { const f = flick ? 1 + (noise1(T * 9 + x * .3) * .5 + noise1(T * 23 + y) * .5) * flick : 1; HD.light(x, y, r * f, col, a * f, glow); return; } return add.call(this, x, y, r, col, a, flick, glow); };
  Light.apply = function () { if (HD.on) return; return apply.call(this); };
  const ca = Cam.apply; Cam.apply = function (c, par, round) { if (HD.on && HD.planeL && c === HD.planeL.x) { const q = HD.planeL.q || 1; c.setTransform(q, 0, 0, q, -HD.planeL.ox * q, -HD.planeL.oy * q); return; } return ca.call(this, c, par, round); };
  const ts = Cam.toScreen; Cam.toScreen = function (x, y) { if (HD.live && HD.cfg) { const p = HD.toScreen(x, y); return [p[0], p[1]]; } return ts.call(this, x, y); };
})();
