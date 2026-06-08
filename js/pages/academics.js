// ============================================================
// ACADEMICS PAGE
// ============================================================
const AcademicsPage = {
  activeTab: 'subjects',
  expandedSubject: null,

  render(player) {
    const tabs = [
      { id:'subjects', label:'SUBJECTS' },
      { id:'log', label:'LOG SESSION' },
      { id:'history', label:'HISTORY' },
    ];
    let html = `<div class="tab-row">`;
    tabs.forEach(t => {
      html += `<button class="tab-btn ${this.activeTab===t.id?'active':''}" onclick="AcademicsPage.setTab('${t.id}')">${t.label}</button>`;
    });
    html += `</div>`;

    if (this.activeTab === 'subjects') html += this.renderSubjects(player);
    else if (this.activeTab === 'log') html += this.renderLogForm(player);
    else if (this.activeTab === 'history') html += this.renderHistory(player);

    html += `<div style="height:70px"></div>`;
    return html;
  },

  setTab(t) { this.activeTab = t; App.renderPage(); },

  renderSubjects(player) {
    const subjects = player.academics.subjects.length ? player.academics.subjects : SUBJECT_DEFAULTS.map(s => ({...s, topics:[], totalTime:0, sessions:0}));
    // sync defaults if new
    SUBJECT_DEFAULTS.forEach(def => {
      if (!player.academics.subjects.find(s => s.id === def.id)) {
        player.academics.subjects.push({...def, topics:[], totalTime:0, sessions:0});
      }
    });
    App.save();

    let html = `<div style="display:flex;justify-content:flex-end;margin-bottom:10px">
      <button class="btn btn-primary btn-sm" onclick="AcademicsPage.openAddSubject()">+ SUBJECT</button>
    </div>`;

    player.academics.subjects.forEach(sub => {
      const sessions = player.academics.sessions.filter(s => s.subjectId === sub.id);
      const totalMins = sessions.reduce((a,s) => a + (s.duration||0), 0);
      const expanded = this.expandedSubject === sub.id;
      const topicsDone = (sub.topics||[]).filter(t => t.done).length;
      const topicsTotal = (sub.topics||[]).length;
      const grade = this.calcGrade(sessions);

      html += `<div class="subject-card">
        <div class="subject-header" onclick="AcademicsPage.toggleSubject('${sub.id}')">
          <div class="subject-icon">${sub.icon}</div>
          <div class="subject-name">${sub.name}</div>
          <div style="display:flex;align-items:center;gap:8px">
            ${grade ? `<div class="subject-grade">${grade}</div>` : ''}
            <div style="font-size:10px;color:var(--text3)">${totalMins}min</div>
            <div style="color:var(--text3)">${expanded?'▲':'▼'}</div>
          </div>
        </div>`;

      if (expanded) {
        html += `<div style="margin-top:8px">
          <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
            <div class="mini-stat" style="flex:1;min-width:70px"><div class="mini-stat-val" style="font-size:16px">${sessions.length}</div><div class="mini-stat-label">SESSIONS</div></div>
            <div class="mini-stat" style="flex:1;min-width:70px"><div class="mini-stat-val" style="font-size:16px">${Math.floor(totalMins/60)}h ${totalMins%60}m</div><div class="mini-stat-label">TOTAL</div></div>
            <div class="mini-stat" style="flex:1;min-width:70px"><div class="mini-stat-val" style="font-size:16px">${topicsDone}/${topicsTotal}</div><div class="mini-stat-label">TOPICS</div></div>
          </div>`;

        // Topics
        if (sub.topics?.length) {
          sub.topics.forEach(t => {
            html += `<div class="topic-item">
              <div class="topic-check ${t.done?'done':''}" onclick="AcademicsPage.toggleTopic('${sub.id}','${t.id}')">${t.done?'✓':''}</div>
              <div class="topic-name ${t.done?'':''}">` +
              `${t.done ? `<span style="text-decoration:line-through;opacity:0.5">${t.name}</span>` : t.name}</div>
              <div class="topic-mastery">${t.mastery||'Learning'}</div>
              <button onclick="AcademicsPage.deleteTopic('${sub.id}','${t.id}')" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:12px;padding:2px 4px">✕</button>
            </div>`;
          });
        }

        html += `<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onclick="AcademicsPage.openAddTopic('${sub.id}')">+ TOPIC</button>
          <button class="btn btn-primary btn-sm" onclick="AcademicsPage.quickLogSession('${sub.id}')">LOG SESSION</button>
          <button class="btn btn-danger btn-sm" onclick="AcademicsPage.deleteSubject('${sub.id}')">DELETE</button>
        </div>
        </div>`;
      }
      html += `</div>`;
    });
    return html;
  },

  renderLogForm(player) {
    const subOptions = player.academics.subjects.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('');
    const masteryOpts = ['Learning','Practicing','Understood','Mastered'].map(m => `<option value="${m}">${m}</option>`).join('');
    return `<div class="card">
      <div class="card-title" style="margin-bottom:14px">◉ LOG STUDY SESSION</div>
      <div class="form-group">
        <label class="form-label">SUBJECT *</label>
        <select class="form-select" id="ac-subject">${subOptions}</select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">DURATION (min) *</label>
          <input class="form-input" id="ac-duration" type="number" value="45" min="1">
        </div>
        <div class="form-group">
          <label class="form-label">MASTERY LEVEL</label>
          <select class="form-select" id="ac-mastery">${masteryOpts}</select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">WHAT DID YOU STUDY?</label>
        <textarea class="form-textarea" id="ac-notes" placeholder="Topics covered, key insights..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">DATE</label>
        <input class="form-input" id="ac-date" type="date" value="${new Date().toISOString().slice(0,10)}">
      </div>
      <button class="btn btn-primary btn-full" onclick="AcademicsPage.submitSession()" style="margin-top:4px">SUBMIT SESSION</button>
    </div>`;
  },

  renderHistory(player) {
    const sessions = [...player.academics.sessions].reverse().slice(0, 50);
    if (!sessions.length) return `<div class="empty-state"><div class="empty-icon">◉</div><div class="empty-text">No sessions logged yet.</div></div>`;
    let html = '';
    sessions.forEach(s => {
      const sub = player.academics.subjects.find(x => x.id === s.subjectId);
      const date = new Date(s.date);
      const dateStr = date.toLocaleDateString('en-IN', {day:'numeric',month:'short'});
      html += `<div class="card" style="padding:10px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div style="font-size:13px;font-weight:600">${sub?.icon||'◉'} ${sub?.name||'Unknown'}</div>
          <div style="font-size:10px;color:var(--text3)">${dateStr}</div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:4px">
          <span class="chip chip-xp">${s.duration} min</span>
          ${s.mastered ? `<span class="chip chip-stat">✓ ${s.mastered}</span>` : ''}
        </div>
        ${s.notes ? `<div style="font-size:11px;color:var(--text2)">${s.notes}</div>` : ''}
      </div>`;
    });
    return html;
  },

  calcGrade(sessions) {
    const total = sessions.reduce((a,s) => a + (s.duration||0), 0);
    if (total >= 3000) return 'A+';
    if (total >= 2000) return 'A';
    if (total >= 1200) return 'B+';
    if (total >= 700)  return 'B';
    if (total >= 300)  return 'C';
    if (total >= 100)  return 'D';
    return null;
  },

  toggleSubject(id) {
    this.expandedSubject = this.expandedSubject === id ? null : id;
    App.renderPage();
  },

  toggleTopic(subjectId, topicId) {
    const sub = App.player.academics.subjects.find(x => x.id === subjectId);
    if (!sub) return;
    const t = sub.topics.find(x => x.id === topicId);
    if (t) {
      t.done = !t.done;
      if (t.done) {
        Engine.addXp(App.player, 15);
        App.toast('Topic completed! +15 XP', 'success');
      }
    }
    App.save();
    App.refreshHud();
    App.renderPage();
  },

  openAddTopic(subjectId) {
    const masteryOpts = ['Learning','Practicing','Understood','Mastered'].map(m => `<option value="${m}">${m}</option>`).join('');
    App.openModal(`
      <div class="modal-title">+ ADD TOPIC <button class="modal-close" onclick="App.closeModal()">✕</button></div>
      <div class="form-group">
        <label class="form-label">TOPIC NAME *</label>
        <input class="form-input" id="tp-name" placeholder="e.g. Integration by Parts...">
      </div>
      <div class="form-group">
        <label class="form-label">INITIAL MASTERY</label>
        <select class="form-select" id="tp-mastery">${masteryOpts}</select>
      </div>
      <div style="display:flex;gap:8px;margin-top:4px">
        <button class="btn btn-secondary btn-full" onclick="App.closeModal()">CANCEL</button>
        <button class="btn btn-primary btn-full" onclick="AcademicsPage.submitTopic('${subjectId}')">ADD</button>
      </div>
    `);
  },

  submitTopic(subjectId) {
    const name = document.getElementById('tp-name')?.value.trim();
    if (!name) { App.toast('Topic needs a name!', 'error'); return; }
    const sub = App.player.academics.subjects.find(x => x.id === subjectId);
    if (!sub) return;
    if (!sub.topics) sub.topics = [];
    sub.topics.push({
      id: Date.now().toString(36),
      name,
      mastery: document.getElementById('tp-mastery')?.value || 'Learning',
      done: false,
    });
    App.save();
    App.closeModal();
    App.toast('Topic added!', 'success');
    App.renderPage();
  },

  deleteTopic(subjectId, topicId) {
    const sub = App.player.academics.subjects.find(x => x.id === subjectId);
    if (sub) sub.topics = sub.topics.filter(t => t.id !== topicId);
    App.save();
    App.renderPage();
  },

  openAddSubject() {
    App.openModal(`
      <div class="modal-title">+ ADD SUBJECT <button class="modal-close" onclick="App.closeModal()">✕</button></div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">SUBJECT NAME *</label>
          <input class="form-input" id="sub-name" placeholder="e.g. Physics">
        </div>
        <div class="form-group">
          <label class="form-label">ICON (emoji)</label>
          <input class="form-input" id="sub-icon" placeholder="📖" maxlength="2">
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:4px">
        <button class="btn btn-secondary btn-full" onclick="App.closeModal()">CANCEL</button>
        <button class="btn btn-primary btn-full" onclick="AcademicsPage.submitSubject()">ADD</button>
      </div>
    `);
  },

  submitSubject() {
    const name = document.getElementById('sub-name')?.value.trim();
    if (!name) { App.toast('Subject needs a name!', 'error'); return; }
    App.player.academics.subjects.push({
      id: Date.now().toString(36),
      name,
      icon: document.getElementById('sub-icon')?.value.trim() || '📖',
      topics: [],
      sessions: 0,
      totalTime: 0,
    });
    App.save();
    App.closeModal();
    App.toast('Subject added!', 'success');
    App.renderPage();
  },

  deleteSubject(subjectId) {
    if (!confirm('Delete this subject?')) return;
    App.player.academics.subjects = App.player.academics.subjects.filter(x => x.id !== subjectId);
    App.save();
    App.renderPage();
  },

  quickLogSession(subjectId) {
    App.openModal(`
      <div class="modal-title">◉ QUICK LOG <button class="modal-close" onclick="App.closeModal()">✕</button></div>
      <div class="form-group">
        <label class="form-label">DURATION (min)</label>
        <input class="form-input" id="ql-dur" type="number" value="45" min="1">
      </div>
      <div class="form-group">
        <label class="form-label">NOTES</label>
        <textarea class="form-textarea" id="ql-notes" placeholder="What did you study?" style="min-height:60px"></textarea>
      </div>
      <div style="display:flex;gap:8px;margin-top:4px">
        <button class="btn btn-secondary btn-full" onclick="App.closeModal()">CANCEL</button>
        <button class="btn btn-primary btn-full" onclick="AcademicsPage.submitQuickLog('${subjectId}')">LOG</button>
      </div>
    `);
  },

  submitQuickLog(subjectId) {
    const dur = parseInt(document.getElementById('ql-dur')?.value) || 45;
    const notes = document.getElementById('ql-notes')?.value.trim();
    const res = Engine.logStudySession(App.player, subjectId, dur, notes, false);
    App.save();
    App.closeModal();
    App.toast(`Session logged! +${res.xpGain} XP, +⬡${res.goldGain}`, 'gold');
    if (res.leveled) App.showLevelUp();
    App.refreshHud();
    App.renderPage();
  },

  submitSession() {
    const subjectId = document.getElementById('ac-subject')?.value;
    const dur = parseInt(document.getElementById('ac-duration')?.value) || 45;
    const mastered = document.getElementById('ac-mastery')?.value;
    const notes = document.getElementById('ac-notes')?.value.trim();
    if (!subjectId) { App.toast('Pick a subject!', 'error'); return; }
    const res = Engine.logStudySession(App.player, subjectId, dur, notes, mastered);
    Engine.addStat(App.player, 'intelligence', Math.floor(dur / 15));
    App.save();
    App.toast(`Session logged! +${res.xpGain} XP, +⬡${res.goldGain}`, 'gold');
    if (res.leveled) App.showLevelUp();
    App.refreshHud();
    App.renderPage();
  },
};
