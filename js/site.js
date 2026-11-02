// C.O.S.M.O website: motion, the workflow tabs and the contact form.
// Everything on the page is readable without this file; it only adds polish.
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  document.querySelectorAll('details.menu a').forEach(function (a) {
    a.addEventListener('click', function () { var d = a.closest('details'); if (d) d.open = false; });
  });

  // Header gets a shadow and shrinks once the page scrolls.
  var head = document.querySelector('.site-head');
  var onScroll = function () { if (head) head.classList.toggle('scrolled', window.scrollY > 12); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Reveal on scroll, plus counters and the evidence card.
  var count = function (el) {
    var to = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (calm) { el.textContent = to; return; }
    var t0 = null;
    var step = function (t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  var targets = document.querySelectorAll('[data-reveal], .evidence, .sky, [data-count]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.hasAttribute('data-count')) count(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('in'); });
  }

  // Hero: a slow starfield, and a little mouse parallax on the laptop.
  var canvas = document.querySelector('canvas.stars');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d'), stars = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), running = true;
    var size = function () {
      W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(W * H / 5200); stars = [];
      for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.2 + 0.2, a: Math.random(), s: Math.random() * 0.12 + 0.02, tw: Math.random() * 6.28, c: Math.random() < 0.12 ? '79,209,255' : (Math.random() < 0.05 ? '247,147,30' : '255,255,255') });
    };
    var draw = function (t) {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        if (!calm) { s.y -= s.s; if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W; } }
        var a = calm ? s.a * 0.8 : (0.35 + 0.65 * Math.abs(Math.sin(t / 1800 + s.tw))) * s.a;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fillStyle = 'rgba(' + s.c + ',' + a.toFixed(3) + ')'; ctx.fill();
      }
      if (!calm && running) requestAnimationFrame(draw);
    };
    size(); requestAnimationFrame(draw);
    window.addEventListener('resize', function () { size(); if (calm) draw(0); });
    if ('IntersectionObserver' in window && !calm) {
      new IntersectionObserver(function (e) { var was = running; running = e[0].isIntersecting; if (running && !was) requestAnimationFrame(draw); }).observe(canvas);
    }
  }
  // Workflow: steps light up as the section scrolls past; clicking a step shows its screen.
  var tl = document.querySelector('.timeline');
  if (tl) {
    var btns = Array.prototype.slice.call(tl.querySelectorAll('button'));
    var imgs = document.querySelectorAll('.stage .screen img');
    var copies = document.querySelectorAll('.stage-text .panel-copy');
    var bar = tl.querySelector('.progress');
    var chosen = -1;
    var select = function (i, focus) {
      chosen = i;
      btns.forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; });
      imgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
      copies.forEach(function (c, k) { c.classList.toggle('on', k === i); });
      if (focus) btns[i].focus();
      light(Math.max(i, litUpTo));
    };
    var litUpTo = 0;
    var light = function (upto) {
      tl.querySelectorAll('li').forEach(function (li, k) { li.classList.toggle('lit', k <= upto); });
      if (bar) bar.style.setProperty('--p', (upto / 7).toFixed(3));
    };
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (k) { e.preventDefault(); select((chosen + k + btns.length) % btns.length, true); }
      });
    });
    select(0);
    if (calm) { litUpTo = 7; light(7); }
    else {
      var sec = tl.closest('section');
      var prog = function () {
        var r = sec.getBoundingClientRect(), vh = window.innerHeight;
        var k = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height * 0.55)));
        var up = Math.round(k * 7);
        if (up !== litUpTo) { litUpTo = up; light(Math.max(up, chosen)); }
      };
      window.addEventListener('scroll', prog, { passive: true }); prog();
    }
  }

  // Stagger index for lists that animate in one item at a time.
  document.querySelectorAll('.stagger, .why, .vs tbody').forEach(function (list) {
    Array.prototype.forEach.call(list.children, function (el, i) { el.style.setProperty('--i', i); });
  });

  // The C.O.S.M.O Bot illustration. A clock (t, in ms) only runs while the
  // demo is on screen and playing; render(t) sets everything from it, so any
  // step can be jumped to. With reduced motion it starts at the end.
  var demo = document.querySelector('[data-demo]');
  if (demo) (function () {
    var END = 24000, GROUP = 5900;
    var timed = Array.prototype.slice.call(demo.querySelectorAll('[data-at]'));
    var scenes = Array.prototype.slice.call(demo.querySelectorAll('.scene'));
    var presses = demo.querySelectorAll('[data-press]');
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.demo-tabs button'));
    var msgs = demo.querySelector('.msgs');
    var countEl = demo.querySelector('[data-countdown]');
    var nameEl = demo.querySelector('[data-scene-name]');
    var stateEl = demo.querySelector('[data-state]');
    var side = demo.querySelector('[data-side-tasks]');
    var bar = document.querySelector('.demo-bar');
    var toggle = document.querySelector('[data-toggle]');
    var replay = document.querySelector('[data-replay]');
    var feed = demo.querySelector('.feed');
    if (feed) feed.innerHTML += feed.innerHTML;
    var t = calm ? END : 0, playing = !calm, visible = false, raf = null, last = 0, shownCount = -1, curScene = -1;
    var render = function () {
      var n = 0;
      timed.forEach(function (el) {
        var on = t >= +el.getAttribute('data-at') && (!el.hasAttribute('data-until') || t < +el.getAttribute('data-until'));
        if (on !== el.classList.contains('shown')) el.classList.toggle('shown', on);
        if (on) n++;
        if (el.hasAttribute('data-done')) el.classList.toggle('done', t >= +el.getAttribute('data-done'));
      });
      Array.prototype.forEach.call(presses, function (el) { el.classList.toggle('pressed', t >= +el.getAttribute('data-press')); });
      var cur = 0;
      scenes.forEach(function (sc, i) { if (t >= +sc.getAttribute('data-scene')) cur = i; });
      if (cur !== curScene) {
        curScene = cur;
        scenes.forEach(function (sc, i) { sc.classList.toggle('on', i === cur); });
        tabs.forEach(function (b, i) { b.setAttribute('aria-pressed', i === cur ? 'true' : 'false'); b.classList.toggle('past', i < cur); });
        if (nameEl) nameEl.innerHTML = scenes[cur].getAttribute('data-name');
        if (side) side.classList.toggle('hit', cur === scenes.length - 1);
      }
      if (countEl) {
        var k = Math.min(1, Math.max(0, (t - GROUP - 300) / 1600));
        countEl.textContent = Math.round(214 - 205 * (1 - Math.pow(1 - k, 3)));
      }
      if (stateEl) stateEl.textContent = t >= 22600 ? 'Done' : t >= 18900 ? 'Waiting for you' : 'Working';
      if (bar) bar.firstElementChild.style.setProperty('--p', (t / END).toFixed(3));
      if (n !== shownCount) { shownCount = n; msgs.scrollTo({ top: msgs.scrollHeight, behavior: calm ? 'auto' : 'smooth' }); }
    };
    var setBtn = function () {
      if (!toggle) return;
      var done = t >= END;
      toggle.querySelector('use').setAttribute('href', playing ? '#i-pause' : '#i-play');
      toggle.querySelector('span').textContent = playing ? 'Pause' : done ? 'Play again' : 'Play';
    };
    var frame = function (now) {
      raf = null;
      if (!playing || !visible) return;
      t = Math.min(END, t + Math.min(100, now - last)); last = now;
      render();
      if (t >= END) { playing = false; setBtn(); return; }
      raf = requestAnimationFrame(frame);
    };
    var kick = function () { if (playing && visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    tabs.forEach(function (b) {
      b.addEventListener('click', function () { t = +b.getAttribute('data-t') + 1; playing = false; render(); setBtn(); });
    });
    if (toggle) toggle.addEventListener('click', function () {
      if (playing) playing = false; else { if (t >= END) t = 0; playing = true; kick(); }
      render(); setBtn();
    });
    if (replay) replay.addEventListener('click', function () { t = 0; playing = !calm; if (calm) t = END; render(); setBtn(); kick(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; kick(); }, { threshold: 0.35 }).observe(demo);
    } else { visible = true; }
    render(); setBtn(); kick();
  })();

  // The scroll story: the step nearest the middle of the screen is lit, and
  // the laptop beside it shows that step's screenshot.
  var story = document.querySelector('.story');
  if (story && 'IntersectionObserver' in window) (function () {
    var steps = Array.prototype.slice.call(story.querySelectorAll('.sstep'));
    var shots = story.querySelectorAll('.story-screen img');
    var who = story.querySelector('[data-cap-who]'), text = story.querySelector('[data-cap-text]');
    var prog = story.querySelector('.story-prog span');
    var activate = function (i) {
      steps.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      var n = +steps[i].getAttribute('data-shot');
      Array.prototype.forEach.call(shots, function (im, k) { im.classList.toggle('on', k === n); });
      var you = steps[i].classList.contains('you');
      var chap = steps[i].previousElementSibling;
      while (chap && !chap.classList.contains('chap')) chap = chap.previousElementSibling;
      if (who) { who.className = 'who ' + (you ? 'you' : 'bot'); who.textContent = steps[i].querySelector('.who').textContent; }
      if (text) text.textContent = 'Step ' + steps[i].querySelector('.n').textContent + ' · ' + (chap ? chap.textContent : '');
      if (prog) prog.style.setProperty('--p', ((i + 1) / steps.length).toFixed(3));
    };
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) activate(steps.indexOf(e.target)); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    steps.forEach(function (s) { io2.observe(s); });
    activate(0);
  })();

  // Contact form. The address it sends to is data-email on the <form> in contact.html.
  var form = document.querySelector('form[data-email]');
  if (!form || !window.fetch) return;
  var email = form.getAttribute('data-email').trim();
  form.setAttribute('action', 'https://formsubmit.co/' + email);
  var status = document.getElementById('form-status');
  var button = form.querySelector('button[type="submit"]');
  var label = button ? button.textContent : '';
  var show = function (msg, isError) { status.hidden = false; status.className = 'form-status' + (isError ? ' err' : ''); status.textContent = msg; status.focus(); };
  form.addEventListener('submit', function (e) {
    if (!form.checkValidity()) return;
    e.preventDefault();
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    if (data._honey) return;
    delete data._next;
    if (button) { button.disabled = true; button.textContent = 'Sending...'; }
    fetch('https://formsubmit.co/ajax/' + email, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && String(res.j.success) === 'true') { form.reset(); form.hidden = true; show('Thank you. Your message has been sent. We will be in touch to set up your demo.', false); }
        else throw new Error('not sent');
      })
      .catch(function () { show('Sorry, your message did not go through. Please email ' + email + ' or call (571) 206-1401.', true); })
      .finally(function () { if (button) { button.disabled = false; button.textContent = label; } });
  });
})();
