// ============================================================
// ACHIEVEMENTS PAGE
// ============================================================
const AchievementsPage = {
  filter: 'all',

  render(player) {
    const unlocked = player.unlockedAchievements || [];
    const filters = ['all','unlocked','locked'];
    let html = `<div class="filter-row">`;
    filters.forEach(f => {
      html += `<button class="filter-btn ${this.filter===f?'active':''}" onclick="AchievementsPage.setFilter('${f}')">${f.toUpperCase()}</button>`;
    });
    html += `</div>`;

    // Stats banner
    html += `<div class="card" style="background:linear-gradient(135deg,var(--panel),var(--panel2));margin-bottom:12px">
      <div style="display:flex;justify-content:space-around;text-align:center">
        <div><div style="font-family:var(--font-head);font-size:28px;font-weight:700;color:var(--gold)">${unlocked.length}</div><div style="font-size:10px;color:var(--text2);letter-spacing:1px">UNLOCKED</div></div>
        <div><div style="font-family:var(--font-head);font-size:28px;font-weight:700;color:var(--text3)">${ACHIEVEMENT_DEFS.length - unlocked.length}</div><div style="font-size:10px;color:var(--text2);letter-spacing:1px">LOCKED</div></div>
        <div><div style="font-family:var(--font-head);font-size:28px;font-weight:700;color:var(--accent)">${Math.floor(unlocked.length/ACHIEVEMENT_DEFS.length*100)}%</div><div style="font-size:10px;color:var(--text2);letter-spacing:1px">COMPLETE</div></div>
      </div>
      <div style="margin-top:12px;height:6px;background:var(--border);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${Math.floor(unlocked.length/ACHIEVEMENT_DEFS.length*100)}%;background:linear-gradient(90deg,var(--gold),var(--orange));border-radius:3px"></div>
      </div>
    </div>`;

    let defs = ACHIEVEMENT_DEFS;
    if (this.filter === 'unlocked') defs = defs.filter(d => unlocked.includes(d.id));
    if (this.filter === 'locked') defs = defs.filter(d => !unlocked.includes(d.id));

    // Sort: unlocked first
    defs = [...defs].sort((a,b) => {
      const au = unlocked.includes(a.id);
      const bu = unlocked.includes(b.id);
      if (au && !bu) return -1;
      if (!au && bu) return 1;
      return 0;
    });

    if (!defs.length) {
      html += `<div class="empty-state"><div class="empty-icon">⬟</div><div class="empty-text">Nothing here.</div></div>`;
    } else {
      defs.forEach(def => {
        const isUnlocked = unlocked.includes(def.id);
        html += `<div class="achievement-card ${isUnlocked?'':'locked'}">
          <div class="ach-badge">${def.icon}</div>
          <div class="ach-info">
            <div class="ach-name">${def.name}</div>
            <div class="ach-desc">${def.desc}</div>
            <div class="ach-reward">⬡ ${def.reward}</div>
          </div>
          ${isUnlocked ? `<div style="font-size:20px;color:var(--gold)">✓</div>` : `<div style="font-size:16px;color:var(--text3)">🔒</div>`}
        </div>`;
      });
    }

    html += `<div style="height:70px"></div>`;
    return html;
  },

  setFilter(f) { this.filter = f; App.renderPage(); },
};
