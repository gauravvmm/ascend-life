// ============================================================
// SKILLS PAGE
// ============================================================
const SkillsPage = {
  filter: 'all',

  render(player) {
    let skills = [...player.skills].sort((a,b) => b.totalXp - a.totalXp);
    if (this.filter !== 'all') skills = skills.filter(s => s.category === this.filter);

    const cats = ['all', ...SKILL_CATEGORIES.filter(c => player.skills.some(s => s.category === c))];
    let html = `<div class="filter-row">`;
    cats.forEach(c => {
      html += `<button class="filter-btn ${this.filter===c?'active':''}" onclick="SkillsPage.setFilter('${c}')">${c === 'all' ? 'ALL' : c.toUpperCase().split(' ')[0]}</button>`;
    });
    html += `</div>`;

    if (!skills.length) {
      html += `<div class="empty-state"><div class="empty-icon">✦</div><div class="empty-text">No skills yet.<br>Start learning something!</div></div>`;
    } else {
      skills.forEach(sk => { html += this.renderSkillCard(sk, player); });
    }

    html += `<button class="fab" onclick="SkillsPage.openAddSkill()">+</button>`;
    html += `<div style="height:70px"></div>`;
    return html;
  },

  setFilter(f) { this.filter = f; App.renderPage(); },

  renderSkillCard(sk, player) {
    const needed = Engine.skillXpNeeded(sk.level);
    const pct = Math.min(100, (sk.xp / needed) * 100);
    const totalPct = Math.min(100, (sk.level / 50) * 100);
    return `<div class="skill-card" onclick="SkillsPage.openSkillDetail('${sk.id}')">
      <div class="skill-icon-wrap">${sk.icon}</div>
      <div class="skill-info">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div class="skill-name">${sk.name}</div>
          <div style="font-family:var(--font-head);font-size:10px;color:var(--accent)">LV ${sk.level}</div>
        </div>
        <div class="skill-cat">${sk.category}</div>
        ${sk.desc ? `<div style="font-size:11px;color:var(--text2);margin-bottom:5px">${sk.desc}</div>` : ''}
        <div class="skill-xp-row">
          <div class="skill-level" style="font-size:9px;color:var(--text3)">${sk.xp}/${needed}</div>
          <div class="skill-bar-wrap"><div class="skill-bar-fill" style="width:${pct}%"></div></div>
        </div>
        <div style="font-size:9px;color:var(--text3);margin-top:3px">MASTERY: ${totalPct.toFixed(0)}%</div>
      </div>
    </div>`;
  },

  openAddSkill() {
    const catOptions = SKILL_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
    App.openModal(`
      <div class="modal-title">✦ NEW SKILL <button class="modal-close" onclick="App.closeModal()">✕</button></div>
      <div class="form-group">
        <label class="form-label">SKILL NAME *</label>
        <input class="form-input" id="sk-name" placeholder="e.g. Python, Boxing, Piano...">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">ICON (emoji)</label>
          <input class="form-input" id="sk-icon" placeholder="✦" maxlength="2">
        </div>
        <div class="form-group">
          <label class="form-label">CATEGORY</label>
          <select class="form-select" id="sk-cat">${catOptions}</select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">DESCRIPTION</label>
        <textarea class="form-textarea" id="sk-desc" placeholder="What is this skill about?" style="min-height:60px"></textarea>
      </div>
      <div style="display:flex;gap:8px;margin-top:4px">
        <button class="btn btn-secondary btn-full" onclick="App.closeModal()">CANCEL</button>
        <button class="btn btn-primary btn-full" onclick="SkillsPage.submitSkill()">ADD SKILL</button>
      </div>
    `);
  },

  submitSkill() {
    const name = document.getElementById('sk-name')?.value.trim();
    if (!name) { App.toast('Skill needs a name!', 'error'); return; }
    const sk = Engine.createSkill({
      name,
      icon: document.getElementById('sk-icon')?.value.trim() || '✦',
      category: document.getElementById('sk-cat')?.value,
      desc: document.getElementById('sk-desc')?.value.trim(),
    });
    App.player.skills.push(sk);
    App.save();
    App.closeModal();
    App.toast('Skill added!', 'success');
    App.renderPage();
  },

  openSkillDetail(skillId) {
    const sk = App.player.skills.find(x => x.id === skillId);
    if (!sk) return;
    const needed = Engine.skillXpNeeded(sk.level);
    const pct = Math.min(100, (sk.xp / needed) * 100);
    App.openModal(`
      <div class="modal-title">${sk.icon} ${sk.name.toUpperCase()} <button class="modal-close" onclick="App.closeModal()">✕</button></div>
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
        <div style="font-size:48px">${sk.icon}</div>
        <div>
          <div style="font-family:var(--font-head);font-size:28px;font-weight:700;color:var(--accent)">LV ${sk.level}</div>
          <div style="font-size:11px;color:var(--text2)">${sk.category}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px">Total XP: ${sk.totalXp}</div>
        </div>
      </div>
      <div style="margin-bottom:12px">
        <div class="xp-label" style="margin-bottom:4px">LEVEL PROGRESS: ${sk.xp} / ${needed}</div>
        <div class="xp-track"><div class="xp-fill" style="width:${pct}%"></div></div>
      </div>
      ${sk.desc ? `<div style="font-size:13px;color:var(--text2);margin-bottom:14px">${sk.desc}</div>` : ''}
      <div class="section-title">LOG PRACTICE SESSION</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">XP EARNED</label>
          <input class="form-input" id="sk-log-xp" type="number" value="25" min="1">
        </div>
        <div class="form-group">
          <label class="form-label">DURATION (min)</label>
          <input class="form-input" id="sk-log-dur" type="number" value="30" min="1">
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">
        <button class="btn btn-primary" style="flex:1" onclick="SkillsPage.logSkill('${skillId}')">LOG SESSION</button>
        <button class="btn btn-secondary btn-sm" onclick="SkillsPage.deleteSkill('${skillId}')">DELETE</button>
        <button class="btn btn-secondary btn-sm" onclick="App.closeModal()">CLOSE</button>
      </div>
    `);
  },

  logSkill(skillId) {
    const xpAmt = parseInt(document.getElementById('sk-log-xp')?.value) || 25;
    const leveled = Engine.addSkillXp(App.player, skillId, xpAmt);
    // Also give a little character XP
    const res = Engine.addXp(App.player, Math.floor(xpAmt * 0.3));
    App.save();
    App.closeModal();
    if (leveled) {
      const sk = App.player.skills.find(x => x.id === skillId);
      App.toast(`${sk?.icon||'✦'} SKILL LEVELED UP → LV ${sk?.level}!`, 'gold');
    } else {
      App.toast('Practice logged! +' + xpAmt + ' skill XP', 'success');
    }
    if (res.leveled) App.showLevelUp();
    App.refreshHud();
    App.renderPage();
  },

  deleteSkill(skillId) {
    if (!confirm('Delete this skill? This cannot be undone.')) return;
    App.player.skills = App.player.skills.filter(x => x.id !== skillId);
    App.save();
    App.closeModal();
    App.toast('Skill deleted', 'info');
    App.renderPage();
  },
};
