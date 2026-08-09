/* =========================================================
   Game Records — Vanilla SPA
   해시 기반 라우팅 + JSON 데이터 렌더링
   ========================================================= */
const App = {
  data: null,
  app: null,
  topnav: null,
};

document.addEventListener('DOMContentLoaded', async () => {
  App.app = document.getElementById('app');
  App.topnav = document.getElementById('topnav');

  // 데이터 로드: 임베드된 window.GAMES_DATA 우선 사용 (file:// 환경 호환),
  // 없으면 fetch로 fallback (HTTP 서버 환경, 향후 갱신용).
  if (window.GAMES_DATA) {
    App.data = window.GAMES_DATA;
  } else {
    try {
      const res = await fetch('data/games.json');
      App.data = await res.json();
    } catch (e) {
      App.app.innerHTML = `<div class="empty-state">데이터 로딩 실패: ${e.message}</div>`;
      return;
    }
  }

  // 푸터 업데이트
  document.getElementById('footer-name').textContent = `${App.data.user.name} · 전투·던전 시스템 기획`;
  document.getElementById('footer-email').textContent = App.data.user.email;
  if (App.data.user.lastUpdated) {
    document.getElementById('footer-updated').textContent = `Updated ${App.data.user.lastUpdated}`;
  }

  renderTopnav();
  window.addEventListener('hashchange', route);
  route();
});

function renderTopnav() {
  App.topnav.innerHTML = `
    <a href="#/" data-route="home">홈</a>
    <a href="#/major" data-route="major">주요 기록</a>
    <a href="#/genres" data-route="genres">게임 기록</a>
  `;
}

function setActiveNav(routeId) {
  App.topnav.querySelectorAll('a').forEach(a => {
    a.classList.toggle('active', a.dataset.route === routeId);
  });
}

function route() {
  const hash = location.hash || '#/';
  const path = hash.replace(/^#\//, '').split('/').filter(Boolean);

  window.scrollTo(0, 0);

  if (path.length === 0) {
    setActiveNav('home');
    return renderHome();
  }

  if (path[0] === 'major') {
    setActiveNav('major');
    return renderMajor();
  }

  if (path[0] === 'genres') {
    setActiveNav('genres');
    if (path.length === 1) {
      renderGenresHub();
      bindDonutHover();
      return;
    }
    return renderGenreDetail(path[1]);
  }

  if (path[0] === 'games') {
    // 게임 상세 페이지 임시 비활성화 (사용자 요청, 2026-05-05).
    // 복구하려면 아래 두 줄을 살리고 redirect를 제거.
    // setActiveNav('genres');
    // return renderGameDetail(path[1]);
    location.hash = '#/genres';
    return;
  }

  // fallback
  renderHome();
}

/* ================ Pages ================ */

function renderHome() {
  const u = App.data.user;
  App.app.innerHTML = `
    <section class="hero">
      <div class="hero-line"></div>
      <div class="hero-name">${escapeHtml(u.name)}</div>
      <h1 class="hero-title">${escapeHtml(u.title)}</h1>
      <p class="hero-tagline">${escapeHtml(u.tagline)}</p>

      <div class="home-buttons">
        <a class="home-btn" href="#/major">
          <img class="home-btn-icon" src="assets/icons/home_trophy.png" alt="">
          <div class="home-btn-no">01</div>
          <div class="home-btn-title">주요 기록</div>
          <div class="home-btn-sub">상위 티어 달성 게임 한눈에</div>
          <div class="home-btn-arrow">VIEW →</div>
        </a>
        <a class="home-btn" href="#/genres">
          <img class="home-btn-icon" src="assets/icons/home_archive.png" alt="">
          <div class="home-btn-no">02</div>
          <div class="home-btn-title">게임 기록</div>
          <div class="home-btn-sub">장르별 플레이 이력 · 시간 · 게임 목록</div>
          <div class="home-btn-arrow">VIEW →</div>
        </a>
      </div>
    </section>
  `;
}

function renderMajor() {
  const ids = App.data.majorRecords;
  const games = ids.map(id => App.data.games.find(g => g.id === id)).filter(Boolean);

  App.app.innerHTML = `
    <a class="back-link" href="#/">홈으로</a>
    <section class="section">
      <div class="section-sub">MAJOR RECORDS</div>
      <h2 class="section-title">주요 기록</h2>
      <p style="color: var(--c-dim); margin: 0 0 28px;">상위 티어를 달성한 게임들입니다.</p>

      <div class="major-stack">
        ${games.map((g, i) => {
          const grad = (g.bgGradient && g.bgGradient.length === 2)
            ? `linear-gradient(120deg, ${g.bgGradient[0]} 0%, ${g.bgGradient[0]}99 35%, ${g.bgGradient[1]} 100%)`
            : `linear-gradient(120deg, var(--c-card-2) 0%, var(--c-card) 100%)`;
          const styleVars = g.bgImage
            ? `background: ${grad}; --bg-image: url('${escapeAttr(g.bgImage)}');`
            : `background: ${grad};`;
          const imageBlock = g.bgImage
            ? `<div class="major-wide-image" style="background-image: url('${escapeAttr(g.bgImage)}');"></div>`
            : `<div class="major-wide-image major-wide-image-empty"></div>`;
          // 게임 상세 임시 비활성화: <a href> → <div>로 변경 (2026-05-05).
          // 복구하려면 div를 a로, 그리고 href="#/games/..." 추가.
          return `
            <div class="major-wide no-link ${g.bgImage ? 'has-image' : ''}" style="${styleVars}">
              <div class="major-wide-overlay"></div>
              <div class="major-wide-inner">
                <div class="major-wide-no">0${i + 1}</div>
                <div class="major-wide-content">
                  <div class="major-wide-tier">${escapeHtml(g.tierBadge || g.tier)}</div>
                  <h3 class="major-wide-name">${escapeHtml(g.name)}</h3>
                  <div class="major-wide-name-en">${escapeHtml(g.nameEn || '')}</div>
                  <p class="major-wide-desc">${escapeHtml(g.shortDesc || '(짧은 설명 작성 예정)')}</p>
                </div>
                ${imageBlock}
                <div class="major-wide-meta">
                  <div class="major-wide-meta-item">
                    <span class="k">PLAY TIME</span>
                    <span class="v">${escapeHtml(g.hoursDisplay)}</span>
                  </div>
                  <div class="major-wide-meta-item">
                    <span class="k">TIER</span>
                    <span class="v tier-v">${escapeHtml(g.tier)}</span>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function renderGenresHub() {
  const stats = computeGenreStats();

  // 시간 순 정렬 (시간 높은 순 → 빈 장르는 마지막)
  const sortedGenres = [...App.data.genres].sort((a, b) => {
    const ha = (stats.byGenre[a.id] || { hours: 0 }).hours;
    const hb = (stats.byGenre[b.id] || { hours: 0 }).hours;
    return hb - ha;
  });

  // 게이지 기준 = 최대 시간을 가진 장르
  const maxHours = Math.max(1, ...sortedGenres.map(g => (stats.byGenre[g.id] || { hours: 0 }).hours));

  App.app.innerHTML = `
    <a class="back-link" href="#/">홈으로</a>
    <section class="section">
      <div class="section-sub">GAME RECORDS</div>
      <h2 class="section-title">장르별 게임 기록</h2>

      ${renderOverviewCard(sortedGenres, stats)}
    </section>
  `;
}

/* Donut chart for genre distribution */
const DONUT_PALETTE = [
  '#C89B3C', '#E8C766', '#7E5BAE', '#B5414A',
  '#5C95E8', '#6B9D6B', '#FF6B73', '#9B6BFF',
  '#F4A100', '#2DB76B', '#8A8A93'
];

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const startOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const endOuter   = polarToCartesian(cx, cy, rOuter, startAngle);
  const startInner = polarToCartesian(cx, cy, rInner, startAngle);
  const endInner   = polarToCartesian(cx, cy, rInner, endAngle);
  const largeArc   = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
    'Z'
  ].join(' ');
}

function renderOverviewCard(sortedGenres, stats) {
  // 활성 장르(시간 > 0)만 표시
  const filled = sortedGenres
    .filter(g => (stats.byGenre[g.id] || { hours: 0 }).hours > 0)
    .map(g => ({
      id: g.id,
      name: g.name,
      hours: stats.byGenre[g.id].hours,
      count: stats.byGenre[g.id].count,
      pct: (stats.byGenre[g.id].hours / stats.totalHours) * 100
    }));

  return renderCardGridOverview(filled, stats);
}

function renderCardGridOverview(filled, stats) {
  // 시간 순 정렬 — 큰 장르가 상단/좌측
  const sorted = [...filled].sort((a, b) => b.hours - a.hours);
  const maxHours = Math.max(...sorted.map(g => g.hours), 1);

  let cards = '';
  sorted.forEach((g, i) => {
    const color = DONUT_PALETTE[filled.indexOf(g) % DONUT_PALETTE.length];
    const safeId = escapeAttr(g.id);
    const pctBar = Math.max(4, (g.hours / maxHours) * 100);

    cards += `
      <a class="ov-card ov-donut-seg"
         href="#/genres/${safeId}"
         data-genre-id="${safeId}"
         data-name="${escapeAttr(g.name)}"
         data-hours="${g.hours}"
         data-pct="${g.pct.toFixed(1)}"
         data-color="${color}"
         style="--card-color: ${color};">
        <div class="ov-card-name">${escapeHtml(g.name)}</div>
        <div class="ov-card-hours">${g.hours.toLocaleString()}<span class="ov-card-h">h</span></div>
        <div class="ov-card-pct">${g.pct.toFixed(1)}%</div>
        <div class="ov-card-bar"><div class="ov-card-bar-fill" style="width: ${pctBar}%;"></div></div>
      </a>
    `;
  });

  return `
    <div class="overview-card">
      <div class="ov-left">
        <div class="ov-stat">
          <div class="ov-stat-num">${stats.totalGames}</div>
          <div class="ov-stat-label">TOTAL GAMES</div>
        </div>
        <div class="ov-stat-hr"></div>
        <div class="ov-stat">
          <div class="ov-stat-num">${stats.totalHours.toLocaleString()}<span class="plus">+</span></div>
          <div class="ov-stat-label">PLAY HOURS</div>
        </div>
      </div>
      <div class="ov-right ov-cards-wrap">
        <div class="ov-cards-grid">
          ${cards}
        </div>
      </div>
    </div>
  `;
}

function renderConstellationOverview(filled, stats) {
  const N = filled.length;

  // Phase 1 — 별 위치: Poisson disc 샘플링으로 별자리스러운 자연 분포
  // 태양 바깥(>SUN_CLEAR), viewBox 안쪽(<MAX_R), 별 사이 최소 거리(MIN_DIST) 보장
  const SUN_CLEAR = 145;     // 태양 + 코로나 회피
  const MAX_R     = 285;     // viewBox 가장자리 안쪽
  const MIN_DIST  = 92;      // 별끼리 최소 간격
  const sortedByHours = [...filled].sort((a, b) => b.hours - a.hours);

  // 시드된 PRNG — 매번 같은 별자리 패턴 보장
  let seed = 0x9E3779B9;
  const rand = () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const positions = [];
  let attempts = 0;
  while (positions.length < sortedByHours.length && attempts < 5000) {
    attempts++;
    // sqrt 분포로 annulus 균등 샘플링
    const r2 = SUN_CLEAR * SUN_CLEAR + rand() * (MAX_R * MAX_R - SUN_CLEAR * SUN_CLEAR);
    const r  = Math.sqrt(r2);
    const a  = rand() * Math.PI * 2;
    const x  = r * Math.cos(a);
    const y  = r * Math.sin(a);
    // 기존 별과 최소 거리 확인
    let ok = true;
    for (const p of positions) {
      const dx = x - p.x, dy = y - p.y;
      if (dx * dx + dy * dy < MIN_DIST * MIN_DIST) { ok = false; break; }
    }
    if (ok) positions.push({ x, y });
  }

  // 안전장치: Poisson 실패 시 균등 링으로 폴백 (위치 모자랄 때만)
  while (positions.length < sortedByHours.length) {
    const i = positions.length;
    const a = (i / sortedByHours.length) * Math.PI * 2 - Math.PI / 2;
    positions.push({ x: 220 * Math.cos(a), y: 220 * Math.sin(a) });
  }

  const stars = sortedByHours.map((g, i) => ({
    ...g,
    x: positions[i].x,
    y: positions[i].y,
    origIdx: filled.indexOf(g)
  }));

  // Phase 2 — 별 크기: sqrt(시간) 비례, 가독성 위해 더 키움
  const maxHours = Math.max(...filled.map(g => g.hours), 1);
  const MIN_SIZE = 7, MAX_SIZE = 26;
  stars.forEach(s => {
    const norm = Math.sqrt(s.hours / maxHours);
    s.size = MIN_SIZE + norm * (MAX_SIZE - MIN_SIZE);
  });

  // Phase 3 — 별자리 선: 가운데 "11 GENRES" 구체도 하나의 별로 취급
  // 중심 별을 인덱스 0에 두고, 각 별은 "이미 그려진" 노드 중 가장 가까운 것에 연결
  // → 결과: 중심 별이 자연스럽게 별자리의 허브 역할
  const CENTER = { x: 0, y: 0 };
  const allNodes = [CENTER, ...stars];
  let lines = '';
  for (let i = 1; i < allNodes.length; i++) {
    let minD = Infinity, nearest = 0;
    for (let j = 0; j < i; j++) {
      const dx = allNodes[i].x - allNodes[j].x;
      const dy = allNodes[i].y - allNodes[j].y;
      const d = dx * dx + dy * dy;
      if (d < minD) { minD = d; nearest = j; }
    }
    const a = allNodes[i], b = allNodes[nearest];
    lines += `<line class="cnst-line"
                     x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}"
                     x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}"
                     stroke="var(--c-cyan-2)" stroke-width="1.5"
                     opacity="0.75" stroke-linecap="round" />`;
  }

  // Phase 4 — 별 렌더 (halo + core + bright center)
  let starsSvg = '';
  stars.forEach((s, i) => {
    const color = DONUT_PALETTE[s.origIdx % DONUT_PALETTE.length];
    const safeId = escapeAttr(s.id);
    starsSvg += `
      <g class="ov-donut-seg cnst-star"
         data-genre-id="${safeId}"
         data-name="${escapeAttr(s.name)}"
         data-hours="${s.hours}"
         data-pct="${s.pct.toFixed(1)}"
         data-color="${color}">
        <circle cx="${s.x.toFixed(2)}" cy="${s.y.toFixed(2)}" r="${(s.size * 2.8).toFixed(2)}"
                fill="${color}" opacity="0.18" class="cnst-halo" />
        <circle cx="${s.x.toFixed(2)}" cy="${s.y.toFixed(2)}" r="${s.size.toFixed(2)}"
                fill="${color}" opacity="0.92" class="cnst-core" />
        <circle cx="${s.x.toFixed(2)}" cy="${s.y.toFixed(2)}" r="${(s.size * 0.45).toFixed(2)}"
                fill="#fff" opacity="0.98" class="cnst-flare" />
      </g>
    `;
  });

  // Phase 5 — 배경 우주 먼지 (deterministic, 더 큰 캔버스에 맞춰 더 멀리까지)
  let dust = '';
  for (let i = 0; i < 140; i++) {
    const a = ((i * 137.5) % 360) * Math.PI / 180;
    const r = 30 + ((i * 17.3) % 240);
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    const sz = 0.4 + ((i * 7) % 9) * 0.13;
    const op = 0.16 + ((i * 11) % 30) * 0.012;
    dust += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${sz.toFixed(2)}"
                     fill="#fff" opacity="${op.toFixed(2)}" />`;
  }

  return `
    <div class="overview-card">
      <div class="ov-left">
        <div class="ov-stat">
          <div class="ov-stat-num">${stats.totalGames}</div>
          <div class="ov-stat-label">TOTAL GAMES</div>
        </div>
        <div class="ov-stat-hr"></div>
        <div class="ov-stat">
          <div class="ov-stat-num">${stats.totalHours.toLocaleString()}<span class="plus">+</span></div>
          <div class="ov-stat-label">PLAY HOURS</div>
        </div>
      </div>
      <div class="ov-right">
        <div class="ov-donut-wrap">
          <svg class="ov-donut-svg" viewBox="-310 -310 620 620" aria-label="장르별 별자리">
            <g class="cnst-dust">${dust}</g>
            <g class="cnst-lines">${lines}</g>
            <g class="cnst-stars">${starsSvg}</g>
            <g class="cnst-center-star">
              <circle cx="0" cy="0" r="48" fill="var(--c-cyan)" opacity="0.10" />
              <circle cx="0" cy="0" r="34" fill="var(--c-cyan)" opacity="0.16" />
              <circle cx="0" cy="0" r="3"  fill="#fff"        opacity="0.95" />
            </g>
          </svg>
          <div class="ov-donut-center cnst-center">
            <div class="ov-donut-center-default">
              <div class="ov-donut-center-num">${App.data.genres.length}</div>
              <div class="ov-donut-center-label">GENRES</div>
            </div>
            <div class="ov-donut-center-active">
              <div class="ov-donut-center-name"></div>
              <div class="ov-donut-center-hours"></div>
              <div class="ov-donut-center-pct"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── (deprecated) 듀얼 링 틱 마크 — 별자리로 교체됨 ──
function _unused_buildTickRing(filled, stats) {
  const buildTickRing = (totalTicks, rIn, rOut, strokeWidth, metric, total) => {
    let svg = '';
    let cumTicks = 0;
    // 1차 분배: 비율대로 (최소 2틱 보장)
    const allocations = filled.map(g => Math.max(2, Math.round((g[metric] / total) * totalTicks)));
    // 합이 totalTicks 넘으면 큰 것에서 빼기, 부족하면 추가
    let sum = allocations.reduce((a, b) => a + b, 0);
    while (sum > totalTicks) {
      const idx = allocations.indexOf(Math.max(...allocations));
      if (allocations[idx] > 2) { allocations[idx]--; sum--; } else break;
    }
    while (sum < totalTicks) {
      const idx = allocations.indexOf(Math.max(...allocations));
      allocations[idx]++; sum++;
    }

    filled.forEach((g, gi) => {
      const numTicks = allocations[gi];
      const color = DONUT_PALETTE[gi % DONUT_PALETTE.length];
      const safeId = escapeAttr(g.id);
      let groupSvg = '';

      for (let t = 0; t < numTicks; t++) {
        // 갭 1틱 효과: 마지막 틱은 그리지 않음 (다음 장르와 시각적 분리)
        if (t === numTicks - 1 && numTicks > 2) continue;
        const angle = ((cumTicks + t) / totalTicks) * 360 - 90;
        const rad = angle * Math.PI / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        const x1 = rIn * cos,  y1 = rIn * sin;
        const x2 = rOut * cos, y2 = rOut * sin;
        groupSvg += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}"
                            x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"
                            stroke="${color}" stroke-width="${strokeWidth}"
                            stroke-linecap="round" />`;
      }

      svg += `<g class="ov-donut-seg rb-tick-group"
                 data-genre-id="${safeId}"
                 data-name="${escapeAttr(g.name)}"
                 data-hours="${g.hours}"
                 data-pct="${g.pct.toFixed(1)}"
                 data-color="${color}">
                ${groupSvg}
              </g>`;
      cumTicks += numTicks;
    });

    return svg;
  };

  const outerRing = buildTickRing(120, 122, 152, 2.4, 'hours', stats.totalHours);
  const innerRing = buildTickRing(80,   82, 105, 2.0, 'count', stats.totalGames);

  // ── 천문도/나침반 스타일 장식 ──
  // 1) 외부 큰 외곽 링 (얇은 골드)
  // 2) 12 시 위치에 작은 dial marks (시계처럼)
  // 3) 4 cardinal (12/3/6/9) 위치에 큰 marks
  // 4) 안쪽에 동심원 한 줄 더 (이중 테두리 느낌)
  const decorMarks = (() => {
    let svg = '';
    const R_OUTER_RING = 168;
    const TICK_INNER = 161;
    const CARDINAL_INNER = 156;
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * 360 - 90;
      const rad = angle * Math.PI / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      const isCardinal = i % 6 === 0;
      const innerR = isCardinal ? CARDINAL_INNER : TICK_INNER;
      svg += `<line x1="${(innerR * cos).toFixed(2)}" y1="${(innerR * sin).toFixed(2)}"
                    x2="${(R_OUTER_RING * cos).toFixed(2)}" y2="${(R_OUTER_RING * sin).toFixed(2)}"
                    stroke="var(--c-cyan)" stroke-width="${isCardinal ? 1.6 : 0.8}"
                    opacity="${isCardinal ? 0.55 : 0.32}" stroke-linecap="round" />`;
    }
    return svg;
  })();

  const guideRings = `
    <circle r="170" fill="none" stroke="var(--c-cyan)" stroke-width="0.7" opacity="0.32" />
    <circle r="159" fill="none" stroke="var(--c-cyan)" stroke-width="0.4" opacity="0.18" />
    <circle r="115" fill="none" stroke="var(--c-cyan)" stroke-width="0.4" opacity="0.18" stroke-dasharray="1 4" />
    <circle r="76"  fill="none" stroke="var(--c-cyan)" stroke-width="0.5" opacity="0.25" />
    <circle r="62"  fill="none" stroke="var(--c-cyan)" stroke-width="0.4" opacity="0.18" />
    ${decorMarks}
  `;

  return `
    <div class="overview-card">
      <div class="ov-left">
        <div class="ov-stat">
          <div class="ov-stat-num">${stats.totalGames}</div>
          <div class="ov-stat-label">TOTAL GAMES</div>
        </div>
        <div class="ov-stat-hr"></div>
        <div class="ov-stat">
          <div class="ov-stat-num">${stats.totalHours.toLocaleString()}<span class="plus">+</span></div>
          <div class="ov-stat-label">PLAY HOURS</div>
        </div>
      </div>
      <div class="ov-right">
        <div class="ov-donut-wrap">
          <svg class="ov-donut-svg" viewBox="-180 -180 360 360" aria-label="장르별 시간·게임 수 분포">
            <g class="rb-guides">${guideRings}</g>
            <g class="rb-ring rb-ring-outer">${outerRing}</g>
            <g class="rb-ring rb-ring-inner">${innerRing}</g>
          </svg>
          <div class="ov-donut-center">
            <div class="ov-donut-center-default">
              <div class="ov-donut-center-num">${App.data.genres.length}</div>
              <div class="ov-donut-center-label">GENRES</div>
            </div>
            <div class="ov-donut-center-active">
              <div class="ov-donut-center-name"></div>
              <div class="ov-donut-center-hours"></div>
              <div class="ov-donut-center-pct"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* hover 인터랙션 — 도넛 segment ↔ 와이드 카드 */
function bindDonutHover() {
  const segments = document.querySelectorAll('.ov-donut-seg');
  const center = document.querySelector('.overview-card .ov-donut-center');
  if (!segments.length || !center) return;

  const nameEl = center.querySelector('.ov-donut-center-name');
  const hoursEl = center.querySelector('.ov-donut-center-hours');
  const pctEl = center.querySelector('.ov-donut-center-pct');

  const labels = document.querySelectorAll('.ov-donut-label');

  segments.forEach(seg => {
    seg.addEventListener('mouseenter', () => {
      const id = seg.dataset.genreId;
      const name = seg.dataset.name;
      const hours = parseInt(seg.dataset.hours, 10);
      const pct = seg.dataset.pct;
      const color = seg.dataset.color;

      // 도넛 가운데 정보
      center.classList.add('is-active');
      nameEl.textContent = name;
      nameEl.style.color = color;
      hoursEl.textContent = `${hours.toLocaleString()}h`;
      pctEl.textContent = `${pct}%`;

      // segment + label dim/active
      segments.forEach(s => {
        if (s !== seg) s.classList.add('is-dim');
      });
      seg.classList.add('is-active');
      labels.forEach(l => {
        if (l.dataset.genreId === id) l.classList.add('is-active');
        else l.classList.add('is-dim');
      });

      // 와이드 카드 하이라이트
      const target = document.querySelector(`.genre-wide[data-genre-id="${id}"]`);
      if (target) target.classList.add('is-highlighted');
    });

    seg.addEventListener('mouseleave', () => {
      center.classList.remove('is-active');
      segments.forEach(s => s.classList.remove('is-dim', 'is-active'));
      labels.forEach(l => l.classList.remove('is-dim', 'is-active'));
      const id = seg.dataset.genreId;
      const target = document.querySelector(`.genre-wide[data-genre-id="${id}"]`);
      if (target) target.classList.remove('is-highlighted');
    });

    // 클릭 → 해당 장르 상세 페이지로 이동
    seg.addEventListener('click', () => {
      const id = seg.dataset.genreId;
      if (id) location.hash = `#/genres/${id}`;
    });
  });

  // 라벨 그룹도 클릭 가능하게
  labels.forEach(l => {
    l.style.cursor = 'pointer';
    l.addEventListener('click', () => {
      const id = l.dataset.genreId;
      if (id) location.hash = `#/genres/${id}`;
    });
  });
}

function renderGenreDetail(genreId) {
  const genre = App.data.genres.find(g => g.id === genreId);
  if (!genre) {
    App.app.innerHTML = `<div class="empty-state">장르를 찾을 수 없습니다.</div>`;
    return;
  }

  const games = App.data.games.filter(g => g.genre === genreId);
  const sortedGames = [...games].sort((a, b) => (b.hours || 0) - (a.hours || 0));
  const maxHours = Math.max(1, ...sortedGames.map(g => g.hours || 0));

  App.app.innerHTML = `
    <a class="back-link" href="#/genres">장르 목록으로</a>
    <section class="section">
      <div class="section-sub">${escapeHtml(genre.name).toUpperCase()}</div>
      <h2 class="section-title">${escapeHtml(genre.name)}</h2>
      <p style="color: var(--c-dim); margin: 0 0 24px;">
        ${escapeHtml(genre.description)} · ${games.length}게임
      </p>

      ${games.length === 0
        ? `<div class="empty-state">아직 등록된 게임이 없습니다.</div>`
        : `<div class="game-grid">
            ${sortedGames.map(g => {
              const pct = Math.max(4, Math.round(((g.hours || 0) / maxHours) * 100));
              // 게임 상세 임시 비활성화: <a href> → <div>로 변경 (2026-05-05).
              // 복구하려면 div를 a로, 그리고 href="#/games/..." 추가.
              return `
              <div class="game-card no-link">
                <div class="name">${escapeHtml(g.name)}</div>
                <div class="name-en">${escapeHtml(g.nameEn || '')}</div>
                <div class="row"><span class="k">플레이 시간</span><span class="v">${escapeHtml(g.hoursDisplay)}</span></div>
                <div class="game-card-bar">
                  <div class="game-card-bar-fill" style="width: ${pct}%;"></div>
                </div>
                ${g.season ? `<div class="row"><span class="k">시즌</span><span class="v">${escapeHtml(g.season)}</span></div>` : ''}
              </div>
            `;
            }).join('')}
          </div>`}
    </section>
  `;
}

function renderGameDetail(gameId) {
  const g = App.data.games.find(x => x.id === gameId);
  if (!g) {
    App.app.innerHTML = `<div class="empty-state">게임을 찾을 수 없습니다.</div>`;
    return;
  }

  const genre = App.data.genres.find(x => x.id === g.genre);
  const backHref = genre ? `#/genres/${genre.id}` : '#/genres';
  const backLabel = genre ? `${genre.name} 목록으로` : '장르 목록으로';

  App.app.innerHTML = `
    <a class="back-link" href="${escapeAttr(backHref)}">${escapeHtml(backLabel)}</a>
    <article class="game-detail">
      <div class="gd-hero">
        <div class="gd-genre">${escapeHtml(genre ? genre.name : '')}</div>
        <h1 class="gd-name">${escapeHtml(g.name)}</h1>
        <div class="gd-name-en">${escapeHtml(g.nameEn || '')}</div>

        <div class="gd-stats">
          <div class="gd-stat">
            <div class="label">PLAY TIME</div>
            <div class="value">${escapeHtml(g.hoursDisplay)}</div>
          </div>
          ${g.tier ? `<div class="gd-stat tier">
            <div class="label">TIER</div>
            <div class="value">${escapeHtml(g.tier)}</div>
          </div>` : ''}
          ${g.season ? `<div class="gd-stat">
            <div class="label">SEASON</div>
            <div class="value">${escapeHtml(g.season)}</div>
          </div>` : ''}
          ${g.position ? `<div class="gd-stat">
            <div class="label">POSITION</div>
            <div class="value">${escapeHtml(g.position)}</div>
          </div>` : ''}
        </div>
      </div>

      <div class="gd-section">
        <h3>COMMENT</h3>
        <div class="gd-comment">${escapeHtml(g.comment || '(코멘트 작성 예정)')}</div>
      </div>
    </article>
  `;
}

/* ================ Helpers ================ */

function computeGenreStats() {
  const byGenre = {};
  let totalHours = 0;
  let totalGames = 0;
  for (const g of App.data.games) {
    if (!byGenre[g.genre]) byGenre[g.genre] = { count: 0, hours: 0 };
    byGenre[g.genre].count++;
    byGenre[g.genre].hours += g.hours || 0;
    totalGames++;
    totalHours += g.hours || 0;
  }
  return { byGenre, totalGames, totalHours };
}

function formatHours(h) {
  if (!h) return '0h';
  if (h >= 1000) return `${(h / 1000).toFixed(h % 1000 === 0 ? 0 : 1)}k h`;
  return `${h}h`;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s) {
  return escapeHtml(s);
}
