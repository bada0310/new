(function(){
  /* ── plain mode: ?plain=1 keeps the graph paper, drops the motion ── */
  var PLAIN = false;
  try {
    var q = new URLSearchParams(location.search).get('plain');
    if (q === '1') sessionStorage.setItem('pf-plain', '1');
    else if (q === '0') sessionStorage.removeItem('pf-plain');
    PLAIN = sessionStorage.getItem('pf-plain') === '1';
  } catch (e) {}
  if (PLAIN) document.documentElement.setAttribute('data-plain', '1');
  (function () {
    var b = document.getElementById('pl');
    if (!b) return;
    b.setAttribute('aria-pressed', String(PLAIN));
    b.addEventListener('click', function () {
      var on = document.documentElement.getAttribute('data-plain') === '1';
      try { if (on) sessionStorage.removeItem('pf-plain'); else sessionStorage.setItem('pf-plain', '1'); } catch (e) {}
      location.search = (function () {
        var u = new URLSearchParams(location.search);
        u.set('plain', on ? '0' : '1');
        return '?' + u.toString();
      })();
    });
  })();

  /* theme — white by default, dark on demand */
  var root = document.documentElement, btn = document.getElementById('tt');
  try { if (localStorage.getItem('pf-theme') === 'dark') root.setAttribute('data-theme','dark'); } catch(e) {}
  btn.addEventListener('click', function(){
    var dark = root.getAttribute('data-theme') === 'dark';
    if (dark) root.removeAttribute('data-theme'); else root.setAttribute('data-theme','dark');
    try { localStorage.setItem('pf-theme', dark ? 'light' : 'dark'); } catch(e) {}
    readColours(); paint();
  });

  /* ── graph paper that bends around the pointer ── */
  var cv = document.getElementById('bg-grid');
  if (PLAIN || !cv) { if (cv) cv.remove(); } else {
  var cx = cv.getContext('2d');
  var W = 0, H = 0, minor = '#16161A', major = '#22222A';
  var STEP = 58, MAJOR = 4, SEG = 11, R = 300, STRENGTH = 0.42;   /* R/STRENGTH are damped below when reduce-motion is on */
  var mx = -1e5, my = -1e5, tx = -1e5, ty = -1e5, raf = null;
  var still = matchMedia('(prefers-reduced-motion: reduce)');

  function readColours(){
    var s = getComputedStyle(root);
    minor = (s.getPropertyValue('--grid') || '#16161A').trim();
    major = (s.getPropertyValue('--grid-hi') || '#22222A').trim();
  }
  function size(){
    var d = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * d); cv.height = Math.round(H * d);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    cx.setTransform(d, 0, 0, d, 0, 0);
  }
  /* push points away from the cursor — a lens bulging over the paper */
  function wx(x, y){
    var dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
    if (d2 >= R * R) return x;
    var k = 1 - Math.sqrt(d2) / R;
    return x + dx * k * k * STRENGTH;
  }
  function wy(x, y){
    var dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
    if (d2 >= R * R) return y;
    var k = 1 - Math.sqrt(d2) / R;
    return y + dy * k * k * STRENGTH;
  }
  function paint(){
    if (!W) return;
    cx.clearRect(0, 0, W, H);
    cx.lineWidth = 1;
    var i, x, y;
    for (i = 0, x = 0; x <= W + STEP; x += STEP, i++){
      cx.beginPath(); cx.strokeStyle = (i % MAJOR === 0) ? major : minor;
      for (y = 0; y <= H + SEG; y += SEG){
        var px = wx(x, y), py = wy(x, y);
        if (y === 0) cx.moveTo(px, py); else cx.lineTo(px, py);
      }
      cx.stroke();
    }
    for (i = 0, y = 0; y <= H + STEP; y += STEP, i++){
      cx.beginPath(); cx.strokeStyle = (i % MAJOR === 0) ? major : minor;
      for (x = 0; x <= W + SEG; x += SEG){
        var qx = wx(x, y), qy = wy(x, y);
        if (x === 0) cx.moveTo(qx, qy); else cx.lineTo(qx, qy);
      }
      cx.stroke();
    }
  }
  function tick(){
    mx += (tx - mx) * 0.14; my += (ty - my) * 0.14;
    paint();
    raf = (Math.abs(tx - mx) > 0.4 || Math.abs(ty - my) > 0.4) ? requestAnimationFrame(tick) : null;
  }
  readColours(); size(); paint();
  window.addEventListener('resize', function(){ size(); paint(); }, { passive: true });
  /* the warp used to be switched off entirely here, which left the page dead
     still for anyone with reduce-motion on. it follows the pointer rather than
     playing on its own, so a damped version is fine to keep. */
  if (still.matches){ STRENGTH *= 0.34; R *= 0.7; }
  {
    window.addEventListener('pointermove', function(e){
      if (e.pointerType === 'touch') return;
      tx = e.clientX; ty = e.clientY;
      if (mx < -1e4){ mx = tx; my = ty; }
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    window.addEventListener('pointerleave', function(){
      tx = -1e5; ty = -1e5;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* folders — all closed at rest; click one and its files come out below */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.folder[role="tab"]'));
  var hint = document.getElementById('folder-hint');
  function open(tab, focus){
    tabs.forEach(function(t){
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.setAttribute('aria-expanded', String(on));
      t.querySelector('.folder-state').textContent = on ? '닫기 ×' : '폴더 열기 →';
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (hint) hint.hidden = !!tab;
    if (focus && tab) tab.focus();
  }
  tabs.forEach(function(t, i){
    t.addEventListener('click', function(){
      open(t.getAttribute('aria-selected') === 'true' ? null : t);
    });
    t.addEventListener('keydown', function(e){
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      open(tabs[(i + d + tabs.length) % tabs.length], true);
    });
  });
  if (tabs.length) open(null);
  } /* end grid module */


  /* stickers peel off the profile card, then open the link */
  Array.prototype.forEach.call(document.querySelectorAll('.sticker'), function(s){
    s.addEventListener('click', function(e){
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;              // let people open in a new tab
      if (PLAIN) return;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (s.classList.contains('peel')) return;
      e.preventDefault();
      s.classList.add('peel');
      var go = function(){ window.open(s.href, '_blank', 'noopener'); s.classList.remove('peel'); };
      s.addEventListener('animationend', go, { once: true });
      setTimeout(function(){ if (s.classList.contains('peel')) go(); }, 700);   // fallback
    });
  });

  /* bookmark tabs inside each project folder */
  var SEC = [['overview','개요'],['scope','나의 활동'],['decision','기술 의사결정'],
             ['flow','User Flow'],['arch','아키텍처'],['trouble','트러블슈팅'],['retro','회고']];
  var BMC = ['var(--c-blue)','var(--c-green)','var(--c-yellow)','var(--c-pink)'];

  Array.prototype.forEach.call(document.querySelectorAll('.panel'), function(panel){
    var els = Array.prototype.slice.call(panel.querySelectorAll('[data-sec]'));
    if (!els.length) return;
    var body = panel.querySelector('.deep-body');
    var present = SEC.filter(function(s){
      return els.some(function(e){ return e.getAttribute('data-sec') === s[0]; });
    });
    var strip = document.createElement('div');
    strip.className = 'bm';
    strip.setAttribute('role', 'tablist');
    strip.setAttribute('aria-label', '프로젝트 내용 구분');

    function pick(key){
      els.forEach(function(e){ e.hidden = e.getAttribute('data-sec') !== key; });
      if (body) body.hidden = !Array.prototype.some.call(
        body.querySelectorAll('[data-sec]'), function(e){ return !e.hidden; });
      Array.prototype.forEach.call(strip.children, function(b, i){
        b.setAttribute('aria-selected', String(present[i][0] === key));
      });
    }

    present.forEach(function(s, i){
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = s[1];
      b.setAttribute('role', 'tab');
      b.style.setProperty('--bmc', BMC[i % BMC.length]);
      b.style.zIndex = String(20 - i);
      b.addEventListener('click', function(){ pick(s[0]); });
      strip.appendChild(b);
    });

    panel.querySelector('.panel-hd').insertAdjacentElement('afterend', strip);
    pick(present[0][0]);
  });

  /* filters */
  var bar = document.getElementById('filters');
  if (bar) {
  var cards = Array.prototype.slice.call(document.querySelectorAll('#grid .card'));
  bar.addEventListener('click', function(e){
    var b = e.target.closest('button[data-f]');
    if (!b) return;
    Array.prototype.forEach.call(bar.querySelectorAll('button'), function(x){ x.setAttribute('aria-pressed', String(x === b)); });
    var f = b.getAttribute('data-f');
    cards.forEach(function(c){
      c.hidden = !(f === 'all' || (c.getAttribute('data-tags') || '').split(' ').indexOf(f) > -1);
    });
  });
  }
  /* ── timeline: edge-hover scrolling + click-to-preview ── */
  (function(){
    var wrap = document.querySelector('.tlx-wrap');
    var lane = document.querySelector('.tlx');
    if (!wrap || !lane) return;

    /* edge auto-scroll: the closer to an edge, the faster it flows */
    var EDGE = 110, MAX = 15, vel = 0, raf = null;
    function step(){
      if (vel === 0) { raf = null; return; }
      lane.scrollLeft += vel;
      follow();
      raf = requestAnimationFrame(step);
    }
    function setVel(v){
      vel = v;
      if (vel !== 0 && !raf) raf = requestAnimationFrame(step);
    }
    lane.addEventListener('pointermove', function(e){
      if (e.pointerType === 'touch') return;
      var r = lane.getBoundingClientRect();
      var dl = e.clientX - r.left, dr = r.right - e.clientX;
      if (dl < EDGE)      setVel(-MAX * (1 - dl / EDGE));
      else if (dr < EDGE) setVel( MAX * (1 - dr / EDGE));
      else                setVel(0);
    }, { passive: true });
    lane.addEventListener('pointerleave', function(){ setVel(0); }, { passive: true });

    /* The board leans, so travelling along it has to move diagonally. Scroll
       alone slides the rule off the top of the frame; pinning the rule to the
       middle of the view and letting the scroll carry the eye down-left /
       up-right makes the board hold still while you move along it.

       It also pays for itself: once the view follows the rule, only the
       VISIBLE window's rise (laneW * tan) has to fit, not the whole rule's
       (railW * tan), so the section gets a few hundred pixels shorter. */
    var rail = lane.querySelector('.tlx-rail');
    var k = 0, laneW = 0, railW = 0;

    function follow(){
      if (!rail) return;
      if (k <= 0.001) { rail.style.setProperty('--ty', '0px'); return; }
      var cx = lane.scrollLeft + laneW / 2;
      rail.style.setProperty('--ty', ((cx - railW / 2) * k).toFixed(1) + 'px');
    }
    function measure(){
      if (!rail) return;
      /* flat on phones and under prefers-reduced-motion, where --sk is 0 */
      k = -Math.tan((parseFloat(getComputedStyle(lane).getPropertyValue('--sk')) || 0) * Math.PI / 180);
      laneW = lane.clientWidth;
      railW = rail.offsetWidth;
      var card = lane.querySelector('.tlx-card');
      var lean = card ? card.offsetWidth / 2 * k : 0;
      if (k > 0.001 && railW > 0) lane.style.paddingBlock = Math.ceil(laneW / 2 * k + lean + 13) + 'px';
      else lane.style.paddingBlock = '';
      follow();
    }

    function edges(){
      wrap.classList.toggle('can-l', lane.scrollLeft > 4);
      wrap.classList.toggle('can-r', lane.scrollLeft < lane.scrollWidth - lane.clientWidth - 4);
      follow();
    }
    lane.addEventListener('scroll', edges, { passive: true });
    window.addEventListener('resize', function(){ measure(); edges(); }, { passive: true });
    measure();
    edges();
    /* card images settle after load and can change the rail's width */
    window.addEventListener('load', measure);

    /* click a card -> short overview, with a link into the detail page */
    var peek = document.getElementById('tl-peek');
    if (!peek) return;
    var pWhen = peek.querySelector('.tlx-peek-when'),
        pT    = peek.querySelector('.tlx-peek-t'),
        pS    = peek.querySelector('.tlx-peek-s'),
        pGo   = peek.querySelector('.tlx-peek-go');

    function close(){
      peek.hidden = true;
      Array.prototype.forEach.call(document.querySelectorAll('.tlx-item.sel'), function(i){ i.classList.remove('sel'); });
    }
    document.getElementById('tl-peek-x').addEventListener('click', close);

    Array.prototype.forEach.call(document.querySelectorAll('.tlx-card'), function(card){
      card.addEventListener('click', function(){
        var item = card.closest('.tlx-item');
        if (item.classList.contains('sel')) { close(); return; }
        close();
        item.classList.add('sel');
        peek.style.setProperty('--tc', getComputedStyle(item).getPropertyValue('--tc'));
        pWhen.textContent = card.querySelector('.tlx-when').textContent;
        pT.textContent    = card.querySelector('h4').textContent;
        pS.textContent    = card.getAttribute('data-sum') || card.querySelector('p').textContent;
        pGo.setAttribute('href', card.getAttribute('data-href'));
        peek.hidden = false;
        peek.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    });
  })();

  /* ══════════ role view — ?role=fe | infra | data | pm ══════════ */
  (function () {
    var P = {
      vimp:     { n: 'Bimp',               y: '2024.03 – 06', c: 'c-blue',   p: ['YOLO 인식', '추천 알고리즘', '재고 정합성'],
                  d: '냉장고 사진 한 장으로 식재료를 등록한다. 문제를 ‘추천’이 아니라 ‘등록’으로 재정의한 졸업 프로젝트.' },
      dero:     { n: 'DERO',               y: '2026.07 – 08', c: 'c-green',  p: ['blue-green', 'Three.js', '38MB → 378KB'],
                  d: '제품을 고르는 화면과 내 책상에 놓아보는 화면을 합쳤다. EC2 한 대에서 무중단 배포까지.' },
      aws:      { n: 'AWS 예약 서비스',     y: '2024.11 – 12', c: 'c-yellow', p: ['멀티 리전', '−20%', 'OpenSearch'],
                  d: '배포로 끝내지 않고 장애 추적·확장성·비용까지. 비용의 최대 항목이 NAT Gateway였다.' },
      lumiere:  { n: 'Lumière',            y: '2026.05 – 06', c: 'c-pink',   p: ['Cloudflare Tunnel', '데이터 계약', 'FastAPI'],
                  d: '진단과 추천 사이의 빈 칸을 메웠다. 붙이기 전에 데이터 계약부터 문서로 확정한 2인 협업.' },
      pawlice:  { n: '멍경찰과 냥도둑',      y: '2026.01 – 06', c: 'c-yellow', p: ['STT 5종', '비대칭 설계', 'Unity'],
                  d: '손이 이미 묶여 있어 음성이 유일하게 남은 입력 채널이었다. 1인 프로젝트.' },
      quiz:     { n: '실시간 노션 퀴즈 쇼',  y: '2026.03 – 04', c: 'c-blue',   p: ['Notion API', 'WebSocket', '3~4h → 2h'],
                  d: '새 도구를 배우게 하지 않았다. 평소처럼 노션에 정리하면 그게 그대로 문제가 된다.' },
      cafe:     { n: '인천 카페 창업 분석',  y: '2025',         c: 'c-green',  p: ['150개 행정동', 'SHAP', 'BERT'],
                  d: '정확도가 아니라 “왜 이 입지인가”에 답하는 분석. 설명 가능성을 목표로 잡았다.' },
      movierec: { n: '영화 추천 (NCF)',     y: '2025',         c: 'c-pink',   p: ['GMF vs NNMF', '과적합 판정', 'PyTorch'],
                  d: '두 모델을 나란히 세우고 학습 성능이 아니라 일반화 성능으로 골랐다.' }
    };

    var ROLES = {
      fe: {
        label: 'Frontend · UI/UX', cls: 'ax-fe',
        pill: 'Portfolio 2026 · Frontend · UI/UX',
        head: '화면에서 사람이 할 수 있는 일을 설계합니다.',
        sub: '3D 시뮬레이터 · 게임 인터랙션 · 업무 도구. 입력 채널과 성능 예산을 먼저 정하고 시작합니다.',
        top: ['dero', 'pawlice', 'quiz']
      },
      infra: {
        label: 'Infra', cls: 'ax-infra',
        pill: 'Portfolio 2026 · Cloud · Infra',
        head: '한정된 자원 안에서 끊기지 않게 만듭니다.',
        sub: 'EC2 한 대의 무중단 배포부터 멀티 리전 설계와 비용 구조 분해까지.',
        top: ['aws', 'dero', 'lumiere']
      },
      data: {
        label: 'Data · AI', cls: 'ax-data',
        pill: 'Portfolio 2026 · Data · AI',
        head: '모델의 출력을 믿을 수 있는 데이터로 바꿉니다.',
        sub: '인식은 반드시 틀린다는 전제에서 검증 규칙과 보정 흐름을 함께 설계합니다.',
        top: ['vimp', 'movierec', 'cafe']
      },
      product: {
        label: 'Product Engineer', cls: 'ax-pm',
        pill: 'Portfolio 2026 · Product Engineer',
        head: '제품의 문제를 기술로 풉니다.',
        sub: '기획부터 배포·운영까지 한 줄로 가져가고, 선택할 때마다 기준과 트레이드오프를 남깁니다.',
        top: ['dero', 'quiz', 'vimp']
      },
      pm: {
        label: 'PM · 기획', cls: 'ax-pm',
        pill: 'Portfolio 2026 · PM · Product',
        head: '문제를 다시 정의하고, 기준을 먼저 세웁니다.',
        sub: '무엇을 만들지보다 무엇을 만들지 않을지를 먼저 정합니다.',
        top: ['dero', 'cafe', 'vimp']
      }
    };

    /* The URL is the only source of truth. This used to fall back to a
       sessionStorage copy when the address had no ?role=, which meant the
       plain link kept showing whichever role had been opened earlier in the
       tab. The role still follows internal navigation: every internal link
       gets the parameter appended a few lines down. */
    var role = null;
    try {
      role = new URLSearchParams(location.search).get('role');
      if (role && !ROLES[role]) role = null;
    } catch (e) { role = null; }
    if (!role) return;

    var R = ROLES[role];
    document.documentElement.setAttribute('data-role', role);

    /* carry the role through internal navigation */
    Array.prototype.forEach.call(document.querySelectorAll('a[href^="/"]'), function (a) {
      var h = a.getAttribute('href');
      if (h.indexOf('role=') > -1 || h.indexOf('#') === 0) return;
      a.setAttribute('href', h + (h.indexOf('?') > -1 ? '&' : '?') + 'role=' + role);
    });

    /* hero copy */
    var pill = document.querySelector('.hero .pill');
    if (pill) pill.textContent = R.pill;
    var big = document.querySelector('.hero-lede .big');
    if (big) big.textContent = R.head;
    var en = document.querySelector('.hero-lede .en');
    if (en) en.textContent = R.sub;

    /* featured folders → this role's top three */
    var row = document.querySelector('.folders');
    if (row && document.querySelector('.hero')) {
      /* three folders, three different colours - a role's top three can share
         a project colour, so a collision falls through to the next free hue */
      var PAL = ['c-green', 'c-blue', 'c-yellow', 'c-pink'];
      var want = R.top.map(function (id) { return P[id].c; });
      var claims = {};
      want.forEach(function (c) { claims[c] = (claims[c] || 0) + 1; });
      var used = {}, cols = [];
      want.forEach(function (c, i) { if (claims[c] === 1) { used[c] = 1; cols[i] = c; } });
      want.forEach(function (c, i) {
        if (cols[i]) return;
        if (!used[c]) { used[c] = 1; cols[i] = c; return; }
        for (var k = 0; k < PAL.length; k++) {
          if (!used[PAL[k]]) { used[PAL[k]] = 1; cols[i] = PAL[k]; return; }
        }
        cols[i] = c;
      });
      row.innerHTML = R.top.map(function (id, i) {
        var x = P[id];
        return '<a class="folder" style="--fc:var(--' + cols[i] + ')" href="/projects/' + id + '?role=' + role + '">' +
          '<span class="folder-art" aria-hidden="true"><span class="fb"></span><span class="papers">' +
          x.p.map(function (t, k) { return '<span class="paper p' + (k + 1) + '">' + t + '</span>'; }).join('') +
          '</span><span class="ff"><span class="mark">0' + (i + 1) + '</span></span></span>' +
          '<span class="folder-cap"><span class="nm">' + x.n + '</span><span class="yr">' + x.y + '</span></span>' +
          '<span class="folder-desc">' + x.d + '</span>' +
          '<span class="folder-state">자세히 보기 →</span></a>';
      }).join('');

    }

    /* pre-apply the matching filter on /projects */
    var fb = document.querySelector('.filters button[data-f="' + role + '"]');
    if (fb) fb.click();

    /* the switcher is a tool for me, not something a reader should see —
       a recruiter seeing five other job-title views reads as mass-applying.
       it only appears with ?sw=1 */
    var showSwitcher = false;
    try { showSwitcher = new URLSearchParams(location.search).get('sw') === '1'; } catch (e) {}
    if (!showSwitcher) return;
    /* a banner so nobody is confused about why the page looks different */
    var bar = document.createElement('div');
    bar.className = 'rolebar';
    bar.innerHTML = '<div class="rolebar-in">' +
      '<span class="ax ' + R.cls + '">' + R.label + '</span>' +
      '<span class="rolebar-t">직무 맞춤 보기 — 이 직무 기준으로 프로젝트 순서와 소개를 바꿔 보여주고 있습니다.</span>' +
      '<span class="rolebar-sw">' +
        Object.keys(ROLES).map(function (k) {
          return '<a href="?role=' + k + '"' + (k === role ? ' aria-current="true"' : '') + '>' + ROLES[k].label + '</a>';
        }).join('') +
      '<a class="rolebar-x" href="' + location.pathname + '?role=none">전체 보기</a></span></div>';
    document.body.insertBefore(bar, document.body.firstChild.nextSibling);
  })();


  /* ── timeline cards: hover slideshow / mini icon ── */
  (function () {
    var ICONS = {
      paw: '<svg viewBox="0 0 48 40" aria-hidden="true">' +
        '<g class="pulse"><ellipse class="fl" cx="17" cy="26" rx="8.5" ry="7"/>' +
        '<circle class="fl" cx="9" cy="15" r="3.4"/><circle class="fl" cx="16" cy="11" r="3.6"/>' +
        '<circle class="fl" cx="24" cy="13" r="3.2"/></g>' +
        '<path class="st w1" d="M31 16 q4 8 0 16"/><path class="st w2" d="M37 12 q6 12 0 24"/></svg>',
      camera: '<svg viewBox="0 0 48 40" aria-hidden="true">' +
        '<rect class="st" x="5" y="11" width="38" height="24" rx="4"/>' +
        '<path class="st" d="M17 11 l3-4h8l3 4"/>' +
        '<circle class="st blink" cx="24" cy="23" r="7"/>' +
        '<circle class="fl" cx="37" cy="16" r="1.6"/></svg>'
    };
    Array.prototype.forEach.call(document.querySelectorAll('.tlx-card'), function (card) {
      var imgs = card.getAttribute('data-imgs');
      var icon = card.getAttribute('data-icon');
      var when = card.querySelector('.tlx-when');
      if (!when) return;

      if (icon && ICONS[icon]) {
        var box = document.createElement('span');
        box.className = 'tlx-ico';
        box.innerHTML = ICONS[icon];
        card.insertBefore(box, when);
        return;
      }
      if (!imgs) return;

      var names = imgs.split(','), built = false, timer = null, at = 0, shot, pics, dots;

      function build() {
        if (built) return;
        shot = document.createElement('span');
        shot.className = 'tlx-shot';
        shot.innerHTML =
          names.map(function (n, i) {
            return '<img src="/assets/' + n + '.webp" alt="" loading="lazy"' + (i === 0 ? ' class="on"' : '') + '>';
          }).join('') +
          '<span class="bar">' + names.map(function (_, i) {
            return '<i' + (i === 0 ? ' class="on"' : '') + '></i>';
          }).join('') + '</span>';
        card.insertBefore(shot, when);
        pics = shot.querySelectorAll('img');
        dots = shot.querySelectorAll('.bar i');
        built = true;
      }
      function show(i) {
        pics[at].classList.remove('on'); dots[at].classList.remove('on');
        at = i % pics.length;
        pics[at].classList.add('on'); dots[at].classList.add('on');
      }
      function start() {
        build();
        if (timer || pics.length < 2) return;
        timer = setInterval(function () { show(at + 1); }, 1100);
      }
      function stop() {
        if (timer) { clearInterval(timer); timer = null; }
        if (built && at !== 0) show(0);
      }
      build();
      card.addEventListener('pointerenter', start);
      card.addEventListener('focus', start);
      card.addEventListener('pointerleave', function () {
        if (!card.closest('.tlx-item').classList.contains('sel')) stop();
      });
      card.addEventListener('blur', stop);
    });
  })();
})();
/* ═══════════════════════════════════════════════════════════════════
   증거 이미지 확대 뷰어 (2026-09-21)
   .shots 안의 figure.shot > img 를 클릭·Enter 로 원본 크기로 띄운다.
   같은 .shots 묶음 안에서 ‹ › · ←/→ 로 이동, Esc 로 닫기(native dialog).
   확대 상태에서 한 번 더 클릭하면 1:1 원본 픽셀, 다시 누르면 화면 맞춤.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  var groups = [].slice.call(document.querySelectorAll('.shots'));
  if (!groups.length || !window.HTMLDialogElement) return;

  var shots = [];
  groups.forEach(function (g) {
    var imgs = [].slice.call(g.querySelectorAll('.shot img'));
    imgs.forEach(function (im, i) {
      im.setAttribute('tabindex', '0');
      im.setAttribute('role', 'button');
      im.setAttribute('aria-haspopup', 'dialog');
      im.setAttribute('aria-label', (im.alt || '이미지') + ' — 크게 보기');
      im.__lbSet = imgs;
      im.__lbAt = i;
    });
    shots = shots.concat(imgs);
  });
  if (!shots.length) return;

  var dlg = document.createElement('dialog');
  dlg.className = 'lbx';
  dlg.setAttribute('aria-label', '이미지 확대 보기');
  dlg.innerHTML =
    '<div class="lbx-wrap">' +
      '<div class="lbx-stage"><img class="lbx-img" alt=""></div>' +
      '<div class="lbx-foot"><p class="lbx-cap"></p><p class="lbx-meta"></p></div>' +
      '<button type="button" class="lbx-btn lbx-x" aria-label="닫기">✕</button>' +
      '<button type="button" class="lbx-btn lbx-prev" aria-label="이전 이미지">‹</button>' +
      '<button type="button" class="lbx-btn lbx-next" aria-label="다음 이미지">›</button>' +
    '</div>';
  document.body.appendChild(dlg);

  var stage = dlg.querySelector('.lbx-stage');
  var big   = dlg.querySelector('.lbx-img');
  var cap   = dlg.querySelector('.lbx-cap');
  var meta  = dlg.querySelector('.lbx-meta');
  var bPrev = dlg.querySelector('.lbx-prev');
  var bNext = dlg.querySelector('.lbx-next');
  var set = [], at = 0, opener = null;

  function paint() {
    var src = set[at];
    big.classList.remove('is-full');
    big.src = src.currentSrc || src.src;
    big.alt = src.alt || '';
    var fc = src.parentNode.querySelector('figcaption');
    cap.textContent = fc ? fc.textContent.trim() : '';
    meta.textContent = '';
    big.onload = function () {
      meta.textContent = big.naturalWidth + ' × ' + big.naturalHeight +
        (set.length > 1 ? '  ·  ' + (at + 1) + ' / ' + set.length : '') +
        '  ·  클릭하면 1:1';
    };
    bPrev.hidden = bNext.hidden = set.length < 2;
    stage.scrollTop = 0; stage.scrollLeft = 0;
  }

  function open(img) {
    set = img.__lbSet || [img];
    at = img.__lbAt || 0;
    opener = img;
    paint();
    dlg.showModal();
  }

  function step(d) {
    if (set.length < 2) return;
    at = (at + d + set.length) % set.length;
    paint();
  }

  shots.forEach(function (im) {
    im.addEventListener('click', function () { open(im); });
    im.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(im); }
    });
  });

  big.addEventListener('click', function (e) {
    e.stopPropagation();
    big.classList.toggle('is-full');
  });
  bPrev.addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
  bNext.addEventListener('click', function (e) { e.stopPropagation(); step(1); });
  dlg.querySelector('.lbx-x').addEventListener('click', function () { dlg.close(); });

  /* 배경(이미지 바깥) 클릭으로 닫기 */
  stage.addEventListener('click', function (e) { if (e.target === stage) dlg.close(); });

  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });

  dlg.addEventListener('close', function () {
    big.removeAttribute('src');
    if (opener) { try { opener.focus(); } catch (err) {} }
  });
})();
