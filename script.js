
(function () {
  var root = document.documentElement, reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var vh = function () { return innerHeight || document.documentElement.clientHeight };
  root.classList.add('js');

  /* split the name into letters */
  var nm = document.getElementById('name'), ci = 0;
  (function () {
    var t = nm.textContent.trim(); nm.setAttribute('aria-label', t); nm.textContent = '';
    t.split(' ').forEach(function (w) {
      var ws = document.createElement('span'); ws.className = 'w'; ws.setAttribute('aria-hidden', 'true');
      w.split('').forEach(function (ch) { var c = document.createElement('span'); c.className = 'c'; c.textContent = ch; c.style.setProperty('--ci', ci++); ws.appendChild(c) });
      nm.appendChild(ws)
    })
  })();
  var chars = nm.querySelectorAll('.c');
  document.querySelectorAll('.intro .reveal').forEach(function (el, i) { el.style.setProperty('--i', i + 4) });
  document.querySelectorAll('[data-stagger]').forEach(function (p) { Array.prototype.forEach.call(p.children, function (c, i) { c.style.setProperty('--i', i) }) });

  /* loader */
  var ld = document.getElementById('loader'), pc = document.getElementById('pct'), mt = document.getElementById('meter');
  function ready() {
    if (root.classList.contains('ready')) return; root.classList.add('ready');
    setTimeout(function () { nm.classList.add('live') }, 1700);
    setTimeout(function () { if (ld && ld.parentNode) ld.parentNode.removeChild(ld) }, 1000)
  }
  function finish() { ld.classList.add('done'); setTimeout(ready, 350) }
  if (reduce) { ld.parentNode.removeChild(ld); root.classList.add('ready'); nm.classList.add('live') }
  else {
    var t0 = null;
    (function f(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 1500), e = 1 - Math.pow(1 - k, 2); pc.textContent = Math.round(e * 100) + '%'; mt.style.width = (e * 100) + '%'; if (k < 1) requestAnimationFrame(f); else finish() })(performance.now());
    setTimeout(finish, 4000);
  }

  /* letters lift toward the pointer, hero only */
  if (matchMedia('(pointer:fine)').matches && !reduce) {
    addEventListener('mousemove', function (e) {
      if (!nm.classList.contains('live')) return;
      if (nm.getBoundingClientRect().bottom < 0) return;
      chars.forEach(function (c) {
        var b = c.getBoundingClientRect(), d = Math.hypot(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2)), k = Math.max(0, 1 - d / 170);
        c.style.transform = 'translateY(' + (-k * 12) + 'px)';
        c.style.color = 'color-mix(in srgb,var(--sage) ' + Math.round(k * 100) + '%,var(--ink))';
      });
    }, { passive: true });
  }

  /* count up */
  function countUp(el) {
    if (reduce || el.__done) return; el.__done = 1;
    var to = parseFloat(el.getAttribute('data-to')), dec = +el.getAttribute('data-dec') || 0, suf = el.getAttribute('data-suf') || '', t0 = null;
    function f(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 1100), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(to * e) + suf; if (k < 1) requestAnimationFrame(f); else el.textContent = fmt(to) + suf }
    function fmt(v) { return v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) }
    el.textContent = fmt(0) + suf; requestAnimationFrame(f);
  }

  /* reveal: only things below the first screen start hidden */
  if ('IntersectionObserver' in window && !reduce) {
    var pre = [];
    document.querySelectorAll('.reveal,.pipe,.chap').forEach(function (el) {
      if (el.closest('.intro')) return;
      var r = el.getBoundingClientRect();
      if (r.top > vh() * 0.92) { el.classList.add('pre'); pre.push(el) }
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target) }
      })
    }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
    pre.forEach(function (el) { io.observe(el) });
    var cio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target) } }) }, { threshold: .6 });
    document.querySelectorAll('.count').forEach(function (c) { cio.observe(c) });
  }

  /* routing demo */
  var pipe = document.getElementById('pipe'), steps = pipe.querySelectorAll('.step'), out = document.getElementById('simout'), timers = [];
  var cases = {
    strong: { on: [0, 1, 2, 3, 4], msg: 'Complete application and a strong score: all five agents run and the application continues without human review.' },
    marginal: { on: [0, 1, 2, 3, 5], msg: 'A score of 55 falls in the 40–69 band, so the application is sent to human review.' },
    incomplete: { on: [0, 1, 5], msg: 'The Gatekeeper finds missing information, so the application is sent to human review.' }
  };
  var sb = document.querySelectorAll('.sim-ctl button');
  sb.forEach(function (b) {
    b.addEventListener('click', function () {
      sb.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false') });
      timers.forEach(clearTimeout); timers = []; pipe.classList.remove('pre'); pipe.classList.add('sim');
      steps.forEach(function (s) { s.classList.remove('on') }); out.textContent = 'Running…';
      var c = cases[b.getAttribute('data-s')];
      c.on.forEach(function (i, n) { timers.push(setTimeout(function () { steps[i].classList.add('on') }, reduce ? 0 : n * 450)) });
      timers.push(setTimeout(function () { out.textContent = c.msg }, reduce ? 0 : c.on.length * 450 + 100));
    })
  });

  /* scroll: progress bar, current chapter, timeline line */
  var bar = document.getElementById('bar'), where = document.getElementById('where'), tl = document.getElementById('tl1');
  var chaps = Array.prototype.slice.call(document.querySelectorAll('[data-title]')), ticking = false;
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('.snav a')), totop = document.getElementById('totop');
  var spyEls = spyLinks.map(function (a) { var k = a.getAttribute('data-spy'); return k === 'intro' ? document.querySelector('.intro') : document.getElementById(k) });
  function onScroll() {
    var h = document.documentElement.scrollHeight - vh(), y = window.scrollY || 0;
    bar.style.width = (h > 0 ? Math.min(100, y / h * 100) : 0) + '%';
    var cur = 'Introduction';
    chaps.forEach(function (c, i) { if (c.getBoundingClientRect().top < vh() * 0.45) { cur = (c.classList.contains('close') ? '' : '0' + (i + 1) + ' · ') + c.getAttribute('data-title') } });
    if (where.textContent !== cur) where.textContent = cur;
    if (tl && !reduce) { var r = tl.getBoundingClientRect(), p = (vh() * 0.65 - r.top) / r.height; tl.style.setProperty('--p', Math.max(.02, Math.min(1, p))) }
    var act = 0; spyEls.forEach(function (el, i) { if (el && el.getBoundingClientRect().top < vh() * 0.4) act = i });
    spyLinks.forEach(function (a, i) { a.classList.toggle('active', i === act) });
    totop.classList.toggle('show', y > 400);
    ticking = false;
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll) } }, { passive: true });
  addEventListener('resize', onScroll); onScroll();

  document.querySelectorAll('.chips').forEach(function (ul) { Array.prototype.forEach.call(ul.children, function (li, i) { li.style.setProperty('--k', i) }) });
  /* stack pills */
  document.querySelectorAll('.stack').forEach(function (p) {
    var b = p.querySelector('b'); if (!b) return;
    var items = p.textContent.replace(b.textContent, '').split('·').map(function (x) { return x.trim() }).filter(Boolean);
    p.textContent = ''; p.appendChild(b); items.forEach(function (t) { var sp = document.createElement('span'); sp.className = 'pill'; sp.textContent = t; p.appendChild(sp) })
  });

  /* typed roles */
  var tp = document.getElementById('typed'), roles = ['a Python Developer', 'an AI/ML Engineer', 'a Data Analyst'];
  if (reduce) { tp.textContent = roles[1]; tp.style.animation = 'none' }
  else {
    setTimeout(function () {
      var ri = 0, n = 0, del = false; (function tick() {
        var w = roles[ri]; n += del ? -1 : 1; tp.textContent = w.slice(0, n); var d = del ? 40 : 80;
        if (!del && n === w.length) { del = true; d = 1500 } else if (del && n === 0) { del = false; ri = (ri + 1) % roles.length; d = 350 } setTimeout(tick, d)
      })()
    }, 2300)
  }

  /* mobile menu */
  var bg = document.getElementById('burger'), sn = document.getElementById('snav');
  bg.addEventListener('click', function () { var o = sn.classList.toggle('open'); bg.setAttribute('aria-expanded', o ? 'true' : 'false') });
  sn.addEventListener('click', function (e) { if (e.target.closest('a')) { sn.classList.remove('open'); bg.setAttribute('aria-expanded', 'false') } });

  /* copy email */
  var cb = document.getElementById('copy'), m = document.getElementById('mail');
  cb.addEventListener('click', function () {
    var done = function () { cb.textContent = 'Copied'; setTimeout(function () { cb.textContent = 'Copy email' }, 1800) };
    var sel = function () { var r = document.createRange(); r.selectNodeContents(m); var g = getSelection(); g.removeAllRanges(); g.addRange(r) };
    try { navigator.clipboard.writeText(m.textContent).then(done, sel) } catch (e) { sel() }
  });
})();
