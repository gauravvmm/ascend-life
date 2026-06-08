// ============================================================
// DASHBOARD PAGE
// ============================================================
const DashboardPage = {
  render(player) {
    const xp = Engine.xpProgress(player);
    const overdue = Engine.checkOverdueQuests(player);
    const activeQuests = player.quests.filter(q => q.status === 'active');
    const rankIdx = RANKS.indexOf(player.rank);
    const nextRankXp = RANK_THRESHOLDS[rankIdx + 1] || RANK_THRESHOLDS[rankIdx];
    const rankPct = Math.min(100, ((player.stats.totalXpEarned - RANK_THRESHOLDS[rankIdx]) / (nextRankXp - RANK_THRESHOLDS[rankIdx])) * 100);

    let html = ``;

    // Overdue alerts
    if (overdue.length) {
      html += `<div class="alert-box">⚠ ${overdue.length} quest${overdue.length>1?'s':''} overdue! Check QUESTS tab.</div>`;
    }

    // Player identity card
    html += `
    <div class="card" style="background:linear-gradient(135deg,var(--panel),var(--panel2))">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="position:relative">
          <div class="player-rank rank-${player.rank.toLowerCase()}" style="width:60px;height:60px;font-size:24px;border-radius:12px;flex-shrink:0">
            ${player.rank}
          </div>
          <div style="position:absolute;bottom:-4px;right:-4px;background:var(--accent);border-radius:3px;padding:1px 5px;font-family:var(--font-head);font-size:9px;color:white">LV${player.level}</div>
        </div>
        <div style="flex:1">
          <div style="font-family:var(--font-head);font-size:18px;font-weight:700;color:var(--text)">${player.name || 'Hunter'}</div>
          <div style="font-size:11px;color:var(--text2);letter-spacing:1px;margin-bottom:8px">${player.title}</div>
          <div style="font-size:10px;color:var(--text3);margin-bottom:4px;font-family:var(--font-head)">RANK PROGRESS</div>
          <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${rankPct.toFixed(1)}%;background:${Engine.getRankColor(player.rank)};border-radius:2px;transition:width 0.6s ease"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:3px;font-size:9px;color:var(--text3)">
            <span>${player.rank}</span>${rankIdx < RANKS.length-1 ? `<span>${RANKS[rankIdx+1]}</span>`:``}
          </div>
        </div>
      </div>
    </div>`;

    // Quick stats
    html += `<div class="stats-grid">
      <div class="mini-stat"><div class="mini-stat-val">${player.stats.questsCompleted}</div><div class="mini-stat-label">QUESTS DONE</div></div>
      <div class="mini-stat"><div class="mini-stat-val" style="color:var(--red)">${player.stats.questsFailed}</div><div class="mini-stat-label">FAILED</div></div>
      <div class="mini-stat"><div class="mini-stat-val" style="color:var(--orange)">${player.stats.streak}🔥</div><div class="mini-stat-label">STREAK</div></div>
      <div class="mini-stat"><div class="mini-stat-val" style="color:var(--gold)">${activeQuests.length}</div><div class="mini-stat-label">ACTIVE</div></div>
    </div>`;

    // Stats bars
    html += `<div class="card">
      <div class="card-header">
        <div class="card-title">◈ ATTRIBUTES</div>
        <button class="btn btn-secondary btn-sm" onclick="App.openStatBoost()">+ BOOST</button>
      </div>`;
    STAT_DEFS.forEach(s => {
      const val = player.statValues[s.id] || 0;
      html += `
      <div class="stat-row">
        <div class="stat-icon">${s.icon}</div>
        <div class="stat-name">${s.label.toUpperCase()}</div>
        <div class="stat-bar-wrap">
          <div class="stat-bar-fill" style="width:${val}%;background:linear-gradient(90deg,${s.color}88,${s.color})"></div>
        </div>
        <div class="stat-val">${val}</div>
      </div>`;
    });
    html += `</div>`;

    // Active quests preview
    if (activeQuests.length) {
      html += `<div class="card">
        <div class="card-header">
          <div class="card-title">⚔ ACTIVE QUESTS</div>
          <button class="btn btn-secondary btn-sm" onclick="App.navigate('quests')">VIEW ALL</button>
        </div>`;
      activeQuests.slice(0, 3).forEach(q => {
        const tl = Engine.timeLeft(q.deadline);
        html += `<div class="quest-card q-${q.type}" onclick="App.openQuestDetail('${q.id}')">
          <div class="quest-name">${q.name}</div>
          <div class="quest-meta">
            <span class="tag tag-blue">${q.type.toUpperCase()}</span>
            ${tl ? `<span class="timer-badge ${tl.cls}">${tl.text}</span>` : ''}
          </div>
          <div class="chip-row">
            <span class="chip chip-xp">+${q.rewards.xp} XP</span>
            ${q.rewards.gold ? `<span class="chip chip-gold">+⬡${q.rewards.gold}</span>` : ''}
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    // Skills preview
    if (player.skills.length) {
      html += `<div class="card">
        <div class="card-header">
          <div class="card-title">✦ TOP SKILLS</div>
          <button class="btn btn-secondary btn-sm" onclick="App.navigate('skills')">VIEW ALL</button>
        </div>`;
      [...player.skills].sort((a,b) => b.level - a.level).slice(0,3).forEach(sk => {
        const needed = Engine.skillXpNeeded(sk.level);
        const pct = Math.min(100, (sk.xp / needed) * 100);
        html += `<div class="skill-card">
          <div class="skill-icon-wrap">${sk.icon}</div>
          <div class="skill-info">
            <div class="skill-name">${sk.name}</div>
            <div class="skill-cat">${sk.category}</div>
            <div class="skill-xp-row">
              <div class="skill-level">LVL ${sk.level}</div>
              <div class="skill-bar-wrap"><div class="skill-bar-fill" style="width:${pct}%"></div></div>
            </div>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    // Days since creation
    if (player.createdAt) {
      const days = Math.floor((Date.now() - player.createdAt) / 86400000);
      html += `<div style="text-align:center;padding:10px 0 4px;font-size:11px;color:var(--text3)">
        DAY ${days + 1} OF YOUR JOURNEY
      </div>`;
    }

    return html;
  }
};
