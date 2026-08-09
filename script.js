/* =========================================================
   Game Records — 단일 페이지 렌더러 (2026-08 리뉴얼)
   데이터: data/games.js (window.GAMES_DATA, hours 내림차순 정렬됨)
   ========================================================= */

(function () {
  const DATA = window.GAMES_DATA;
  if (!DATA) return;

  const GAMES = DATA.games;
  const GENRES = DATA.genres;
  const genreById = Object.fromEntries(GENRES.map(g => [g.id, g]));

  // ---------------- 유틸 ----------------

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  function fmt(n) { return n.toLocaleString("ko-KR"); }

  // ---------------- 집계 ----------------

  const totalHours = GAMES.reduce((a, g) => a + g.hours, 0);
  const genreStats = GENRES.map(gen => {
    const list = GAMES.filter(g => g.genre === gen.id);
    return {
      ...gen,
      count: list.length,
      hours: list.reduce((a, g) => a + g.hours, 0)
    };
  }).filter(g => g.count > 0).sort((a, b) => b.hours - a.hours);

  // ---------------- 히어로 KPI ----------------

  function renderKpis() {
    const kpis = [
      { value: fmt(Math.floor(totalHours / 1000) * 1000) + "+", unit: "시간", label: "총 플레이 시간" },
      { value: String(GAMES.length), unit: "종", label: "플레이한 게임" },
      { value: String(genreStats.length), unit: "개", label: "경험한 장르" },
      { value: String(DATA.majorRecords.length), unit: "종", label: "상위 티어 기록" }
    ];
    document.getElementById("kpi-row").innerHTML = kpis.map(k => `
      <div class="kpi reveal">
        <div class="kpi-value">${esc(k.value)}<span class="unit">${esc(k.unit)}</span></div>
        <div class="kpi-label">${esc(k.label)}</div>
      </div>`).join("");
  }

  // ---------------- 주요 기록 카드 ----------------

  function renderMajor() {
    const cards = DATA.majorRecords
      .map(id => GAMES.find(g => g.id === id))
      .filter(Boolean)
      .map(g => {
        const [c1, c2] = g.bgGradient.length === 2 ? g.bgGradient : ["#1e293b", "#0a0f1a"];
        const badge = g.bgImage
          ? `<img class="major-badge-img" src="${esc(g.bgImage)}" alt="${esc(g.name)} ${esc(g.tier)} 뱃지" loading="lazy">`
          : "";
        return `
        <article class="major-card reveal">
          <div class="card-tint" style="background: linear-gradient(135deg, ${esc(c1)}, ${esc(c2)});"></div>
          <div class="major-top">
            <h3 class="major-name">${esc(g.name)}
              <span class="major-name-en">${esc(g.nameEn)}</span>
            </h3>
            ${badge}
          </div>
          ${g.tierBadge ? `<span class="tier-pill">${esc(g.tierBadge)}</span>` : ""}
          <div class="major-hours">${esc(g.hoursDisplay)}</div>
          ${g.shortDesc ? `<p class="major-desc">${esc(g.shortDesc)}</p>` : ""}
        </article>`;
      });
    document.getElementById("major-grid").innerHTML = cards.join("");
  }

  // ---------------- 장르 분포 바 차트 ----------------

  function renderGenreChart() {
    const max = genreStats[0].hours;
    document.getElementById("genre-chart").innerHTML = genreStats.map(g => `
      <button class="genre-bar-row reveal" data-genre="${esc(g.id)}"
              aria-label="${esc(g.name)} ${fmt(g.hours)}시간, ${g.count}개 게임 — 눌러서 목록 보기">
        <span>
          <span class="genre-bar-name">${esc(g.name)}</span>
          <span class="genre-bar-count">${g.count}개 게임</span>
        </span>
        <span class="genre-bar-track">
          <span class="genre-bar-fill" style="width:${(g.hours / max * 100).toFixed(1)}%"></span>
          <span class="genre-bar-hours">${fmt(g.hours)}시간</span>
        </span>
      </button>`).join("");

    document.querySelectorAll(".genre-bar-row").forEach(btn => {
      btn.addEventListener("click", () => {
        setFilter(btn.dataset.genre);
        document.getElementById("library").scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  // ---------------- 전체 기록 (필터 + 목록) ----------------

  let currentFilter = "all";

  function renderChips() {
    const chips = [{ id: "all", name: "전체", count: GAMES.length }]
      .concat(genreStats.map(g => ({ id: g.id, name: g.name, count: g.count })));
    document.getElementById("chip-row").innerHTML = chips.map(c => `
      <button class="chip${c.id === currentFilter ? " active" : ""}" data-genre="${esc(c.id)}">
        ${esc(c.name)}<span class="n">${c.count}</span>
      </button>`).join("");
    document.querySelectorAll(".chip").forEach(btn => {
      btn.addEventListener("click", () => setFilter(btn.dataset.genre));
    });
  }

  function renderList() {
    const list = currentFilter === "all" ? GAMES : GAMES.filter(g => g.genre === currentFilter);
    const el = document.getElementById("game-list");
    if (!list.length) {
      el.innerHTML = `<li class="list-empty">해당 장르의 기록이 없습니다.</li>`;
      return;
    }
    el.innerHTML = list.map((g, i) => `
      <li class="game-row">
        <span class="game-rank">${i + 1}</span>
        <div class="game-main">
          <div>
            <span class="game-name">${esc(g.name)}</span>
            <span class="game-name-en">${esc(g.nameEn)}</span>
          </div>
          <div class="game-meta">
            <span class="game-genre-tag">${esc(genreById[g.genre] ? genreById[g.genre].name : g.genre)}</span>
            ${g.tierBadge ? `<span class="game-tier">${esc(g.tierBadge)}</span>` : ""}
          </div>
        </div>
        <span class="game-hours">${fmt(g.hours)}<span class="unit">시간${g.hoursDisplay.includes("+") ? "+" : ""}</span></span>
      </li>`).join("");
  }

  function setFilter(id) {
    currentFilter = id;
    renderChips();
    renderList();
  }

  // ---------------- 푸터 ----------------

  function renderFooter() {
    document.getElementById("footer-email").textContent = DATA.user.email;
    document.getElementById("footer-updated").textContent =
      "마지막 업데이트 " + DATA.user.lastUpdated;
  }

  // ---------------- 스크롤 리빌 ----------------

  function initReveal() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll(".reveal").forEach(el => io.observe(el));
  }

  // ---------------- 실행 ----------------

  renderKpis();
  renderMajor();
  renderGenreChart();
  renderChips();
  renderList();
  renderFooter();
  initReveal();
})();
