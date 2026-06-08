// ============================================================
// QUESTS PAGE
// ============================================================
const QuestsPage = {
  filter: 'all',

  render(player) {
    const filters = ['all','active','daily','weekly','main','side','challenge','habit','completed','failed'];
    let quests = [...player.quests].sort((a,b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return b.createdAt - a.createdAt;
    });

    if (this.filter !== 'all') {
      if (['active','completed','failed'].includes(this.filter)) {
        quests = quests.filter(q => q.status === this.filter);
      } else {
        quests = quests.filter(q => q.type === this.filter && q.status === 'active');
      }
    }

    let html = `<div class="filter-row">`;
    filters.forEach(f => {
      html += `<button class="filter-btn ${this.filter===f?'active':''}" onclick="QuestsPage.setFilter('${f}')">${f.toUpperCase()}</button>`;
    });
    html += `</div>`;

    if (!quests.length) {
      html += `<div class="empty-state"><div class="empty-icon">⚔</div><div class="empty-text">No quests here.<br>Tap + to add one!</div></div>`;
    } else {
      quests.forEach(q => { html += this.renderQuestCard(q); });
    }

    html += `<button class="fab" onclick="QuestsPage.openAddForm()">+</button>`;
    html += `<div style="height:70px"></div>`;
    return html;
  },

  setFilter(f) {
    this.filter = f;
    App.renderPage();
  },

  renderQuestCard(q) {
    const tl = Engine.timeLeft(q.deadline);
    const isOverdue = tl && tl.cls === 'danger' && q.status === 'active';
    const statRewards = Object.entries(q.rewards.stats || {}).map(([s,v]) => `<span class="chip chip-stat">+${v} ${s.slice(0,3).toUpperCase()}</span>`).join('');
    const penaltyChips = q.penalty.xp ? `<span class="chip chip-penalty">-${q.penalty.xp} XP</span>` : '';
    const prereqs = (q.prerequisites || []).filter(p => p.trim());
    
    return `<div class="quest-card q-${q.type} ${q.status} ${isOverdue?'overdue':''}" onclick="App.openQuestDetail('${q.id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="quest-name" style="flex:1">${q.status==='completed'?'✓ ':''}${q.status==='failed'?'✗ ':''}${q.name}</div>
      </div>
      <div class="quest-meta">
        <span class="tag tag-blue">${q.type.toUpperCase()}</span>
        ${q.repeatType!=='none'?`<span class="tag tag-orange">↺ ${q.repeatType.toUpperCase()}</span>`:''}
        ${tl?`<span class="timer-badge ${tl.cls}">${tl.text}</span>`:''}
      </div>
      ${q.desc ? `<div class="quest-desc">${q.desc}</div>` : ''}
      ${prereqs.length ? `<div style="font-size:10px;color:var(--text3);padding-left:8px;margin-bottom:4px">📌 Requires: ${prereqs.join(', ')}</div>` : ''}
      <div class="chip-row">
        <span class="chip chip-xp">+${q.rewards.xp} XP</span>
        ${q.rewards.gold ? `<span class="chip chip-gold">+⬡${q.rewards.gold}</span>` : ''}
        ${statRewards}
        ${penaltyChips}
      </div>
    </div>`;
  },

  openAddForm(prefill = {}) {
    const statOptions = STAT_DEFS.map(s => `<option value="${s.id}">${s.icon} ${s.label}</option>`).join('');
    const typeOptions = QUEST_TYPES.map(t => `<option value="${t.id}" ${prefill.type===t.id?'selected':''}>${t.icon} ${t.label}</option>`).join('');
    const repeatOptions = `<option value="none">None</option><option value="daily">Daily</option><option value="weekly">Weekly</option>`;

    App.openModal(`
      <div class="modal-title">⚔ NEW QUEST <button class="modal-close" onclick="App.closeModal()">✕</button></div>
      <div class="form-group">
        <label class="form-label">QUEST NAME *</label>
        <input class="form-input" id="q-name" placeholder="Name your quest..." value="${prefill.name||''}">
      </div>
      <div class="form-group">
        <label class="form-label">DESCRIPTION</label>
        <textarea class="form-textarea" id="q-desc" placeholder="What needs to be done?">${prefill.desc||''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">TYPE</label>
          <select class="form-select" id="q-type">${typeOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">REPEAT</label>
          <select class="form-select" id="q-repeat">${repeatOptions}</select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">DEADLINE</label>
        <input class="form-input" id="q-deadline" type="datetime-local" value="${prefill.deadline||''}">
      </div>
      <div class="form-group">
        <label class="form-label">PREREQUISITES (comma separated)</label>
        <input class="form-input" id="q-prereqs" placeholder="e.g. Complete Level 5, Read book">
      </div>
      <div class="section-title" style="margin-top:14px">REWARDS</div>
      <div class="form-row-3">
        <div class="form-group">
          <label class="form-label">XP</label>
          <input class="form-input" id="q-xp" type="number" value="${prefill.xp||50}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">GOLD ⬡</label>
          <input class="form-input" id="q-gold" type="number" value="${prefill.gold||0}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">STAT +</label>
          <input class="form-input" id="q-stat-val" type="number" value="1" min="0" max="10">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">STAT TO BOOST</label>
        <select class="form-select" id="q-stat-id"><option value="">None</option>${statOptions}</select>
      </div>
      <div class="section-title" style="margin-top:14px">PENALTY (if failed/overdue)</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">XP LOSS</label>
          <input class="form-input" id="q-pen-xp" type="number" value="0" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">GOLD LOSS ⬡</label>
          <input class="form-input" id="q-pen-gold" type="number" value="0" min="0">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">NOTES</label>
        <textarea class="form-textarea" id="q-notes" placeholder="Extra details, links, context..." style="min-height:50px"></textarea>
      </div>
      <div style="display:flex;gap:8px;margin-top:4px">
        <button class="btn btn-secondary btn-full" onclick="App.closeModal()">CANCEL</button>
        <button class="btn btn-primary btn-full" onclick="QuestsPage.submitQuest()">CREATE QUEST</button>
      </div>
    `);
  },

  submitQuest() {
    const name = document.getElementById('q-name')?.value.trim();
    if (!name) { App.toast('Quest needs a name!', 'error'); return; }
    const statId = document.getElementById('q-stat-id')?.value;
    const statVal = parseInt(document.getElementById('q-stat-val')?.value) || 0;
    const rewardStats = statId && statVal ? { [statId]: statVal } : {};
    const prereqRaw = document.getElementById('q-prereqs')?.value || '';
    const prerequisites = prereqRaw.split(',').map(s => s.trim()).filter(Boolean);

    const q = Engine.createQuest({
      name,
      desc: document.getElementById('q-desc')?.value.trim(),
      type: document.getElementById('q-type')?.value,
      deadline: document.getElementById('q-deadline')?.value,
      prerequisites,
      repeatType: document.getElementById('q-repeat')?.value,
      rewardXp: document.getElementById('q-xp')?.value,
      rewardGold: document.getElementById('q-gold')?.value,
      rewardStats,
      penaltyXp: document.getElementById('q-pen-xp')?.value,
      penaltyGold: document.getElementById('q-pen-gold')?.value,
      notes: document.getElementById('q-notes')?.value.trim(),
    });
    App.player.quests.push(q);
    App.save();
    App.closeModal();
    App.toast('Quest created!', 'success');
    App.renderPage();
  },
};
