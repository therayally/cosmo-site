/* C.O.S.M.O home page effects: comets (a round head with a tail that fades to nothing), the flow diagram, and the slowly rotating galaxy.
   Everything here is decoration. With "reduce motion" on, nothing moves and the galaxy is drawn once. */
(function () {
  'use strict';
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var rand = function (a, b) { return a + Math.random() * (b - a); };

  // One comet: a fat round head and a tail made of its last positions, thinner and fainter the older they are.
  function drawComet(ctx, trail, rgb, headR) {
    var n = trail.length; if (n < 2) return;
    ctx.lineCap = 'round';
    for (var i = n - 1; i > 0; i--) {
      var k = 1 - (n - 1 - i) / (n - 1);            // 1 at the head, 0 at the tail end
      ctx.beginPath(); ctx.moveTo(trail[i].x, trail[i].y); ctx.lineTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineWidth = Math.max(0.4, headR * 1.7 * k * k);
      ctx.strokeStyle = 'rgba(' + rgb + ',' + (Math.pow(k, 1.7) * 0.9).toFixed(3) + ')';
      ctx.stroke();
    }
    var h = trail[n - 1];
    var g = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, headR * 4.2);
    g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.25, 'rgba(' + rgb + ',.55)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h.x, h.y, headR * 4.2, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(h.x, h.y, headR, 0, 6.283); ctx.fill();
  }
  function sizeCanvas(c, w, h) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); }
  function whenVisible(el, cb) {
    var vis = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { var was = vis; vis = e[0].isIntersecting; if (vis && !was) cb(); }, { rootMargin: '80px' }).observe(el);
    return function () { return vis; };
  }

  // ---------- 1. Hero: shooting stars across the starfield ----------
  var hero = document.querySelector('.h-hero');
  if (hero && !calm) (function () {
    var c = document.createElement('canvas'); c.className = 'comets'; c.setAttribute('aria-hidden', 'true'); hero.insertBefore(c, hero.children[1] || null);
    var ctx = c.getContext('2d'), W = 0, H = 0, list = [], next = 600, last = 0;
    var size = function () { W = hero.clientWidth; H = hero.clientHeight; sizeCanvas(c, W, H); };
    size(); window.addEventListener('resize', size);
    var visible = whenVisible(hero, function () { requestAnimationFrame(loop); });
    function spawn() {
      var ang = rand(0.42, 0.7), sp = rand(7, 11), x = rand(W * 0.25, W * 1.05), y = rand(-20, H * 0.35);
      list.push({ x: x, y: y, vx: -Math.cos(ang) * sp, vy: Math.sin(ang) * sp, trail: [], life: 0, max: rand(55, 85), r: rand(1.7, 2.6), rgb: Math.random() < 0.25 ? '247,190,120' : '150,210,255' });
    }
    function loop(t) {
      if (!visible()) return;
      var dt = t - last; last = t; next -= dt; if (next <= 0 && list.length < 2) { spawn(); next = rand(2600, 6500); }
      ctx.clearRect(0, 0, W, H);
      for (var i = list.length - 1; i >= 0; i--) {
        var s = list[i]; s.x += s.vx; s.y += s.vy; s.life++; s.trail.push({ x: s.x, y: s.y }); if (s.trail.length > 34) s.trail.shift();
        var fade = s.life > s.max - 14 ? (s.max - s.life) / 14 : 1;
        ctx.globalAlpha = Math.max(0, fade); drawComet(ctx, s.trail, s.rgb, s.r); ctx.globalAlpha = 1;
        if (s.life >= s.max || s.x < -60 || s.y > H + 60) list.splice(i, 1);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();

  // ---------- 2. Constellation: comets travel along the lines between the stars ----------
  var cn = document.querySelector('svg.cn');
  if (cn && !calm) (function () {
    var wrap = cn.parentElement; wrap.style.position = 'relative';
    var c = document.createElement('canvas'); c.className = 'cn-fx'; c.setAttribute('aria-hidden', 'true'); wrap.appendChild(c);
    var ctx = c.getContext('2d'), W = 0, H = 0, vb = cn.viewBox.baseVal, sx = 1, sy = 1, ox = 0, oy = 0;
    var lines = Array.prototype.map.call(cn.querySelectorAll('.cn-lines polyline'), function (p) { return p.getAttribute('points').trim().split(/\s+/).map(function (q) { var a = q.split(','); return { x: +a[0], y: +a[1] }; }); });
    var size = function () { var r = cn.getBoundingClientRect(), r2 = wrap.getBoundingClientRect(); W = r.width; H = r.height; ox = r.left - r2.left; oy = r.top - r2.top; c.style.cssText = 'position:absolute;left:' + ox + 'px;top:' + oy + 'px;width:' + W + 'px;height:' + H + 'px;pointer-events:none'; sizeCanvas(c, W, H); sx = W / vb.width; sy = H / vb.height; };
    size(); window.addEventListener('resize', size);
    var list = [], next = 300, last = 0;
    var visible = whenVisible(cn, function () { requestAnimationFrame(loop); });
    function lenOf(pts) { var L = 0; for (var i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return L; }
    function at(pts, d) { for (var i = 1; i < pts.length; i++) { var seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); if (d <= seg) { var k = d / seg; return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k }; } d -= seg; } return pts[pts.length - 1]; }
    function spawn() {
      var pts = lines[Math.floor(Math.random() * lines.length)].slice(); if (Math.random() < 0.5) pts.reverse();
      list.push({ pts: pts, L: lenOf(pts), d: 0, sp: rand(2.6, 4.2), trail: [], rgb: Math.random() < 0.3 ? '255,178,92' : '160,215,255' });
    }
    function loop(t) {
      if (!visible()) return;
      var dt = t - last; last = t; next -= dt; if (next <= 0 && list.length < 3) { spawn(); next = rand(700, 1800); }
      ctx.clearRect(0, 0, W, H);
      for (var i = list.length - 1; i >= 0; i--) {
        var s = list[i]; s.d += s.sp; var p = at(s.pts, s.d); s.trail.push({ x: p.x * sx, y: p.y * sy }); if (s.trail.length > 30) s.trail.shift();
        drawComet(ctx, s.trail, s.rgb, 2.4);
        if (s.d >= s.L + 30) { s.trail.shift(); s.trail.shift(); if (s.trail.length < 2) list.splice(i, 1); }
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();

  // ---------- 3. Flow diagram: coloured paths, with comets carrying data from the inputs, through C.O.S.M.O, to your people ----------
  var flow = document.querySelector('[data-flow]');
  if (flow) (function () {
    var c = flow.querySelector('canvas.flow-fx'), ctx = c.getContext('2d'), W = 0, H = 0, paths = [], list = [], next = 200, last = 0;
    var COL = { n1: '79,209,255', n2: '120,170,255', n3: '167,139,250', n4: '79,209,255', n5: '255,138,142', t1: '247,147,30', t2: '54,211,153', t3: '79,209,255' };
    function pt(el, side) { var r = el.getBoundingClientRect(), f = flow.getBoundingClientRect(); return { x: (side === 'r' ? r.right : r.left) - f.left, y: r.top + r.height / 2 - f.top }; }
    function build() {
      var f = flow.getBoundingClientRect(); W = f.width; H = f.height; sizeCanvas(c, W, H); paths = [];
      if (W < 900) return;
      var core = flow.querySelector('.flow-core'), cr = core.getBoundingClientRect(), mid = cr.top + cr.height / 2 - f.top;
      var cl = { x: cr.left - f.left, y: 0 }, cR = { x: cr.right - f.left, y: 0 };
      flow.querySelectorAll('.flow-in li').forEach(function (li) { var a = pt(li, 'r'); paths.push({ a: a, b: { x: cl.x, y: mid + (a.y - mid) * 0.35 }, rgb: COL[li.className] || '79,209,255' }); });
      flow.querySelectorAll('.flow-out .teams li, .flow-out .snap').forEach(function (el) { var b = pt(el, 'l'); paths.push({ a: { x: cR.x, y: mid + (b.y - mid) * 0.35 }, b: b, rgb: COL[el.className] || '255,178,92' }); });
    }
    function bez(p, t) { var dx = (p.b.x - p.a.x) * 0.5, x0 = p.a.x, y0 = p.a.y, x1 = p.a.x + dx, y1 = p.a.y, x2 = p.b.x - dx, y2 = p.b.y, x3 = p.b.x, y3 = p.b.y, u = 1 - t; return { x: u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, y: u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3 }; }
    function stat() {
      ctx.clearRect(0, 0, W, H); ctx.lineWidth = 1.4;
      paths.forEach(function (p) { var g = ctx.createLinearGradient(p.a.x, 0, p.b.x, 0); g.addColorStop(0, 'rgba(' + p.rgb + ',.55)'); g.addColorStop(1, 'rgba(' + p.rgb + ',.12)'); ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(p.a.x, p.a.y); var dx = (p.b.x - p.a.x) * 0.5; ctx.bezierCurveTo(p.a.x + dx, p.a.y, p.b.x - dx, p.b.y, p.b.x, p.b.y); ctx.stroke(); });
    }
    build(); window.addEventListener('resize', function () { build(); stat(); });
    window.addEventListener('load', function () { build(); stat(); });
    stat(); if (calm) return;
    var visible = whenVisible(flow, function () { requestAnimationFrame(loop); });
    function loop(t) {
      if (!visible()) return;
      var dt = t - last; last = t; next -= dt;
      if (next <= 0 && paths.length && list.length < 8) { list.push({ p: paths[Math.floor(Math.random() * paths.length)], k: 0, sp: rand(0.012, 0.018), trail: [] }); next = rand(260, 650); }
      stat();
      for (var i = list.length - 1; i >= 0; i--) {
        var s = list[i]; s.k += s.sp; var q = bez(s.p, Math.min(1, s.k)); s.trail.push(q); if (s.trail.length > 26) s.trail.shift();
        drawComet(ctx, s.trail, s.p.rgb, 2.3);
        if (s.k >= 1.25) list.splice(i, 1);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();

  // ---------- 4. Galaxy: a spiral that turns slowly, and a little faster as the page scrolls ----------
  var gx = document.querySelector('canvas.galaxy');
  if (gx) (function () {
    var sec = gx.parentElement, ctx = gx.getContext('2d'), W = 0, H = 0, stars = [], nodes = [], rot = 0, base = 0, scrollPos = 0, last = 0, comets = [], next = 1500;
    var ARMS = 4;
    function build() {
      W = sec.clientWidth; H = sec.clientHeight; sizeCanvas(gx, W, H);
      stars = []; var n = Math.round(Math.min(4200, W * H / 150));
      for (var i = 0; i < n; i++) {
        var r = Math.pow(Math.random(), 0.8), arm = Math.floor(Math.random() * ARMS), th = r * 5.4 + arm * (6.283 / ARMS) + rand(-0.22, 0.22) * (0.15 + r * 0.6);
        var hue = r < 0.25 ? '255,206,150' : (Math.random() < 0.18 ? '167,139,250' : (Math.random() < 0.3 ? '255,255,255' : '120,190,255'));
        stars.push({ r: r, th: th, s: rand(0.6, 2), a: rand(0.4, 1), c: hue, tw: rand(0, 6.283) });
      }
      nodes = []; for (var j = 0; j < 26; j++) { var rr = Math.pow(Math.random(), 0.7) * 0.92 + 0.05, aa = Math.floor(Math.random() * ARMS); nodes.push({ r: rr, th: rr * 5.4 + aa * (6.283 / ARMS), hot: Math.random() < 0.2 }); }
    }
    function pos(r, th, cx, cy, R) { var x = Math.cos(th + rot) * r * R, y = Math.sin(th + rot) * r * R; return { x: cx + x, y: cy + y * 0.42 - x * 0.08 }; } // tilted disc
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      var cx = W * (W > 900 ? 0.68 : 0.5), cy = H * (W > 900 ? 0.5 : 0.76), R = Math.min(W * (W > 900 ? 0.46 : 0.9), 760);
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.55); g.addColorStop(0, 'rgba(255,214,160,.55)'); g.addColorStop(0.18, 'rgba(255,160,90,.22)'); g.addColorStop(0.5, 'rgba(70,110,255,.12)'); g.addColorStop(1, 'rgba(70,110,255,0)');
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.42); ctx.translate(-cx, -cy); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 0.55, 0, 6.283); ctx.fill(); ctx.restore();
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i], p = pos(s.r, s.th, cx, cy, R), a = s.a * (calm ? 0.8 : 0.6 + 0.4 * Math.sin(t / 1500 + s.tw));
        ctx.fillStyle = 'rgba(' + s.c + ',' + a.toFixed(3) + ')'; ctx.fillRect(p.x, p.y, s.s, s.s);
      }
      // linked nodes: the "cyber" part, a thin web between nearby bright points
      var P = nodes.map(function (n) { return pos(n.r, n.th, cx, cy, R); });
      ctx.lineWidth = 0.7;
      for (var a = 0; a < P.length; a++) for (var b = a + 1; b < P.length; b++) { var d = Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y); if (d < R * 0.3) { ctx.strokeStyle = 'rgba(150,200,255,' + (0.22 * (1 - d / (R * 0.3))).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(P[a].x, P[a].y); ctx.lineTo(P[b].x, P[b].y); ctx.stroke(); } }
      for (var k = 0; k < P.length; k++) { var hot = nodes[k].hot; ctx.fillStyle = hot ? 'rgba(255,120,125,.95)' : 'rgba(210,235,255,.95)'; ctx.beginPath(); ctx.arc(P[k].x, P[k].y, hot ? 2.8 : 2, 0, 6.283); ctx.fill(); if (hot) { ctx.strokeStyle = 'rgba(255,120,125,.35)'; ctx.beginPath(); ctx.arc(P[k].x, P[k].y, 6 + 2 * Math.sin(t / 500 + k), 0, 6.283); ctx.stroke(); } }
      for (var q = comets.length - 1; q >= 0; q--) { var m = comets[q]; m.x += m.vx; m.y += m.vy; m.life++; m.trail.push({ x: m.x, y: m.y }); if (m.trail.length > 30) m.trail.shift(); ctx.globalAlpha = Math.max(0, m.life > m.max - 12 ? (m.max - m.life) / 12 : 1); drawComet(ctx, m.trail, '170,215,255', 2.2); ctx.globalAlpha = 1; if (m.life >= m.max) comets.splice(q, 1); }
    }
    build(); window.addEventListener('resize', function () { build(); draw(0); });
    if (calm) { draw(0); return; }
    var visible = whenVisible(sec, function () { requestAnimationFrame(loop); });
    function onScroll() { var r = sec.getBoundingClientRect(); scrollPos = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight; }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    function loop(t) {
      if (!visible()) return;
      var dt = Math.min(64, t - last); last = t; base += dt * 0.000045; next -= dt;
      if (next <= 0 && comets.length < 1) { var ang = rand(0.4, 0.7), sp = rand(7, 10); comets.push({ x: rand(W * 0.4, W), y: rand(0, H * 0.3), vx: -Math.cos(ang) * sp, vy: Math.sin(ang) * sp, trail: [], life: 0, max: rand(50, 80) }); next = rand(3500, 8000); }
      rot = base + (window.pageYOffset || 0) * 0.00045;
      draw(t); requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();
})();
