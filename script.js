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
          <div class="home-btn-no">01</div>
          <div class="home-btn-title">주요 기록</div>
          <div class="home-btn-sub">상위 티어 달성 게임 한눈에</div>
          <div class="home-btn-arrow">VIEW →</div>
        </a>
        <a class="home-btn" href="#/genres">
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

      <p style="color: var(--c-dim); margin: 0 0 24px; font-size: 13px;">
        장르를 선택하면 해당 게임 목록을 확인할 수 있습니다.
      </p>

      <div class="genre-stack">
        ${sortedGenres.map((genre, i) => {
          const s = stats.byGenre[genre.id] || { count: 0, hours: 0 };
          const isEmpty = s.count === 0;
          const pct = isEmpty ? 0 : Math.max(4, Math.round((s.hours / maxHours) * 100));
          const tag = isEmpty ? 'div' : 'a';
          const href = isEmpty ? '' : ` href="#/genres/${escapeAttr(genre.id)}"`;
          return `
            <${tag} class="genre-wide ${isEmpty ? 'empty' : ''}" data-genre-id="${escapeAttr(genre.id)}"${href}>
              <div class="genre-wide-no">0${i + 1}</div>
              <div class="genre-wide-content">
                <div class="genre-wide-head">
                  <h3 class="genre-wide-name">${escapeHtml(genre.name)}</h3>
                  <div class="genre-wide-stats">
                    <span class="games">${s.count}게임</span>
                    <span class="dot">·</span>
                    <span class="hours">${formatHours(s.hours)}</span>
                  </div>
                </div>
                <div class="genre-wide-desc">${escapeHtml(genre.description)}</div>
                <div class="genre-wide-bar">
                  <div class="genre-wide-bar-fill" style="width: ${pct}%;"></div>
                </div>
              </div>
            </${tag}>
          `;
        }).join('')}
      </div>
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
  // 활성 장르(시간 > 0)만 도넛에 시간 비율로 표시. 비활성은 가운데 라벨로.
  const filled = sortedGenres
    .filter(g => (stats.byGenre[g.id] || { hours: 0 }).hours > 0)
    .map(g => ({
      id: g.id,
      name: g.name,
      hours: stats.byGenre[g.id].hours,
      pct: (stats.byGenre[g.id].hours / stats.totalHours) * 100
    }));

  // SVG 도넛 segments — 시간 비율 분할
  const cx = 0, cy = 0;
  const rOuter = 110, rInner = 66;
  let segPaths = '';
  let cumAngle = 0;

  let labelEls = '';
  filled.forEach((g, i) => {
    const startAngle = cumAngle;
    const endAngle = cumAngle + (g.pct / 100) * 360;
    cumAngle = endAngle;

    const color = DONUT_PALETTE[i % DONUT_PALETTE.length];
    const d = describeArc(cx, cy, rOuter, rInner, startAngle, endAngle);
    const safeId = escapeAttr(g.id);

    segPaths += `<path
      class="ov-donut-seg"
      d="${d}"
      fill="${color}"
      data-genre-id="${safeId}"
      data-name="${escapeAttr(g.name)}"
      data-hours="${g.hours}"
      data-pct="${g.pct.toFixed(1)}"
      data-active="1"
      data-color="${color}"
    />`;

    // Leader line + 라벨
    const midAngle  = (startAngle + endAngle) / 2;
    const segEdge   = polarToCartesian(cx, cy, rOuter + 1, midAngle);
    const isRight   = midAngle < 180;
    const isUpper   = midAngle < 90 || midAngle > 270;

    // elbow: segment edge에서 외부 + 위/아래 offset → 항상 60° 가까운 꺾임 보장
    const elbowOffsetX = 18;
    const elbowOffsetY = 22;
    const elbow = {
      x: segEdge.x + (isRight ? elbowOffsetX : -elbowOffsetX),
      y: segEdge.y + (isUpper ? -elbowOffsetY : elbowOffsetY)
    };

    const labelEndX = isRight ? elbow.x + 38 : elbow.x - 38;
    const labelY    = elbow.y;
    const anchor    = isRight ? 'start' : 'end';
    const underlineY = labelY + 14;
    const underlineStartX = isRight ? labelEndX + 4 : labelEndX - 4;
    const underlineEndX   = isRight ? labelEndX + 28 : labelEndX - 28;

    // 직선 두 개 (segEdge → elbow → labelEnd) — linejoin/linecap round로 부드러운 꺾임
    const linePath = [
      `M ${segEdge.x.toFixed(2)} ${segEdge.y.toFixed(2)}`,
      `L ${elbow.x.toFixed(2)} ${elbow.y.toFixed(2)}`,
      `L ${labelEndX.toFixed(2)} ${labelY.toFixed(2)}`
    ].join(' ');

    labelEls += `
      <g class="ov-donut-label" data-genre-id="${safeId}">
        <path class="dl-line" d="${linePath}"
              fill="none" stroke="${color}" stroke-width="1.2"
              stroke-linecap="round" stroke-linejoin="round"
              opacity="0.6" />
        <circle class="dl-dot" cx="${segEdge.x.toFixed(2)}" cy="${segEdge.y.toFixed(2)}"
                r="2.4" fill="${color}" />
        <line class="dl-underline" x1="${underlineStartX.toFixed(2)}" y1="${underlineY}"
              x2="${underlineEndX.toFixed(2)}" y2="${underlineY}"
              stroke="${color}" stroke-width="1.5" stroke-linecap="round" opacity="0.6" />
        <text x="${labelEndX + (isRight ? 3 : -3)}" y="${labelY - 2}"
              text-anchor="${anchor}" class="donut-label-name">${escapeHtml(g.name)}</text>
        <text x="${labelEndX + (isRight ? 3 : -3)}" y="${labelY + 12}"
              text-anchor="${anchor}" class="donut-label-pct">${g.pct.toFixed(1)}%</text>
      </g>
    `;
  });
  segPaths += labelEls;

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
          <svg class="ov-donut-svg" viewBox="-200 -160 400 320" aria-label="장르별 시간 분포">
            <g class="ov-donut-segments">
              ${segPaths || `<circle r="${rOuter}" fill="${'var(--c-bg-2)'}" /><circle r="${rInner}" fill="${'var(--c-bg)'}" />`}
            </g>
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
