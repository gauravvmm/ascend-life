// ============================================================
// APP.JS — Main Controller
// ============================================================
const App = (() => {
  let player = null;
  let currentPage = 'dashboard';

  const pages = {
    dashboard: DashboardPage,
    quests: QuestsPage,
    skills: SkillsPage,
    academics: AcademicsPage,
    achievements: AchievementsPage,
  };

  function init() {
    // Boot animation
    setTimeout(() => {
      document.getElementById('boot-screen').style.opacity = '0';
      document.getElementById('boot-screen').style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        document.getElementById('boot-screen').style.display = 'none';
        start();
      }, 500);
    }, 2400);
  }

  function start() {
    player = Engine.load();
    if (!player || !player.name) {
      showSetup();
    } else {
      Engine.checkStreak(player);
      checkDailyPenalties();
      const newAch = Engine.checkAchievements(player);
      Engine.save(player);
      showShell();
      newAch.forEach(a => setTimeout(() => toast(`🏆 Achievement: ${a.name}!`, 'gold'), 500));
    }
  }

  function showSetup() {
    const shell = document.getElementById('shell');
    shell.classList.remove('hidden');
    document.getElementById('page-content').innerHTML = `
      <div class="setup-screen">
        <div class="setup-logo">ASCEND</div>
        <div class="setup-sub">YOUR JOURNEY BEGINS</div>
        <div style="width:100%;max-width:340px">
          <div class="form-group">
            <label class="form-label">YOUR NAME, HUNTER</label>
            <input class="form-input" id="setup-name" placeholder="Enter your name..." style="font-size:16px;text-align:center" maxlength="24">
          </div>
          <div class="form-group">
            <label class="form-label">YOUR TITLE</label>
            <input class="form-input" id="setup-title" placeholder="The Awakened" value="The Awakened" style="text-align:center">
          </div>
          <div class="form-group">
            <label class="form-label">YOUR GOAL (optional)</label>
            <textarea class="form-textarea" id="setup-goal" placeholder="What do you want to become in 5 years?" style="text-align:center;min-height:80px"></textarea>
          </div>
          <button class="btn btn-primary btn-full" style="margin-top:8px;padding:14px;font-size:16px" onclick="App.createPlayer()">
            ⚡ AWAKEN
          </button>
        </div>
      </div>
    `;
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('bottom-nav').classList.add('hidden');
  }

  function createPlayer() {
    const name = document.getElementById('setup-name')?.value.trim();
    if (!name) { toast('You need a name, Hunter!', 'error'); return; }
    const newPlayer = { ...DEFAULT_PLAYER };
    newPlayer.name = name;
    newPlayer.title = document.getElementById('setup-title')?.value.trim() || 'The Awakened';
    newPlayer.goal = document.getElementById('setup-goal')?.value.trim() || '';
    newPlayer.createdAt = Date.now();
    newPlayer.stats.lastLogin = new Date().toDateString();
    newPlayer.stats.streak = 1;
    newPlayer.stats.maxStreak = 1;
    newPlayer.unlockedAchievements = [];
    newPlayer.notifications = [{ msg: 'Welcome, Hunter. Your journey begins now.', date: Date.now(), read: false }];
    // init academics
    newPlayer.academics = { subjects: SUBJECT_DEFAULTS.map(s => ({...s, topics:[], sessions:0, totalTime:0})), sessions: [] };
    Engine.save(newPlayer);
    player = newPlayer;
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('bottom-nav').classList.remove('hidden');
    showShell();
    setTimeout(() => toast(`Welcome, ${name}! Your story starts now.`, 'gold'), 300);
  }

  function showShell() {
    document.getElementById('shell').classList.remove('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('bottom-nav').classList.remove('hidden');
    refreshHud();
    navigate('dashboard');
  }

  function navigate(page) {
    currentPage = page;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    renderPage();
  }

  function renderPage() {
    const pg = pages[currentPage];
    if (!pg) return;
    document.getElementById('page-content').innerHTML = pg.render(player);
  }
  function exportSave() {
    const saveData = localStorage.getItem('ascend_v1');

    if (!saveData) {
      alert('No save data found.');
      return;
    }

    const blob = new Blob([saveData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `ascend-save-${new Date().toISOString().slice(0,10)}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }
  function importSave(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = e => {
    try {
      JSON.parse(e.target.result); // validate JSON

      if (!confirm('This will overwrite your current save. Continue?')) {
        return;
      }

      localStorage.setItem('ascend_v1', e.target.result);

      alert('Save imported successfully. Reloading...');
      location.reload();
    } catch {
      alert('Invalid save file.');
    }
  };

  reader.readAsText(file);
}
  function refreshHud() {
    if (!player) return;
    const xp = Engine.xpProgress(player);
    document.getElementById('hud-rank').textContent = player.rank;
    document.getElementById('hud-rank').className = `player-rank rank-${player.rank.toLowerCase()}`;
    document.getElementById('hud-name').textContent = player.name || 'Hunter';
    document.getElementById('hud-title').textContent = player.title || '';
    document.getElementById('xp-fill').style.width = xp.pct + '%';
    document.getElementById('xp-text').textContent = `${xp.current} / ${xp.needed}`;
    document.getElementById('hud-gold').textContent = `⬡ ${player.gold}`;
    const unread = Engine.unreadCount(player);
    document.getElementById('notif-dot').classList.toggle('hidden', unread === 0);
  }

  function save() {
    const newAch = Engine.checkAchievements(player);
    Engine.save(player);
    newAch.forEach((a, i) => setTimeout(() => toast(`🏆 ${a.name} unlocked!`, 'gold'), i * 800));
    if (newAch.length) refreshHud();
  }

  function checkDailyPenalties() {
    const overdue = Engine.checkOverdueQuests(player);
    overdue.forEach(q => {
      if (!q._penalized) {
        q._penalized = true;
        Engine.failQuest(player, q.id);
        Engine.addNotif(player, `Quest FAILED: "${q.name}" — penalties applied.`);
      }
    });
  }

  // ---- QUEST DETAIL MODAL ----
  function openQuestDetail(questId) {
    const q = player.quests.find(x => x.id === questId);
    if (!q) return;
    const tl = Engine.timeLeft(q.deadline);
    const statRewards = Object.entries(q.rewards.stats || {}).map(([s,v]) => {
      const def = STAT_DEFS.find(d => d.id === s);
      return `<span class="chip chip-stat">${def?.icon||''} +${v} ${def?.label||s}</span>`;
    }).join('');
    const penaltyStats = Object.entries(q.penalty?.stats || {}).map(([s,v]) => {
      const def = STAT_DEFS.find(d => d.id === s);
      return `<span class="chip chip-penalty">-${v} ${def?.label||s}</span>`;
    }).join('');
    const prereqs = (q.prerequisites || []).filter(p => p.trim());

    openModal(`
      <div class="modal-title" style="color:${q.status==='completed'?'var(--green)':q.status==='failed'?'var(--red)':'var(--accent)'}">
        ${q.status==='completed'?'✓ ':q.status==='failed'?'✗ ':QUEST_TYPES.find(t=>t.id===q.type)?.icon||'⚔'} ${q.name.toUpperCase()}
        <button class="modal-close" onclick="App.closeModal()">✕</button>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
        <span class="tag tag-blue">${q.type.toUpperCase()}</span>
        ${q.repeatType!=='none'?`<span class="tag tag-orange">↺ ${q.repeatType.toUpperCase()}</span>`:''}
        ${tl?`<span class="timer-badge ${tl.cls}">${tl.text}</span>`:''}
        <span class="tag ${q.status==='active'?'tag-blue':q.status==='completed'?'tag-green':'tag-red'}">${q.status.toUpperCase()}</span>
      </div>
      ${q.desc ? `<div style="font-size:13px;color:var(--text2);margin-bottom:12px;line-height:1.5">${q.desc}</div>` : ''}
      ${prereqs.length ? `<div style="font-size:11px;color:var(--text3);margin-bottom:10px">📌 Prerequisites: ${prereqs.join(', ')}</div>` : ''}
      ${q.deadline ? `<div style="font-size:11px;color:var(--text2);margin-bottom:10px">📅 Deadline: ${new Date(q.deadline).toLocaleString()}</div>` : ''}
      ${q.notes ? `<div style="font-size:11px;color:var(--text2);margin-bottom:10px;padding:8px;background:var(--bg2);border-radius:4px">${q.notes}</div>` : ''}
      <div class="section-title">REWARDS</div>
      <div class="chip-row" style="margin-bottom:12px">
        <span class="chip chip-xp">+${q.rewards.xp} XP</span>
        ${q.rewards.gold?`<span class="chip chip-gold">+⬡${q.rewards.gold}</span>`:''}
        ${statRewards}
      </div>
      ${(q.penalty.xp || q.penalty.gold || Object.keys(q.penalty.stats||{}).length) ? `
        <div class="section-title">PENALTY IF FAILED</div>
        <div class="chip-row" style="margin-bottom:12px">
          ${q.penalty.xp?`<span class="chip chip-penalty">-${q.penalty.xp} XP</span>`:''}
          ${q.penalty.gold?`<span class="chip chip-penalty">-⬡${q.penalty.gold}</span>`:''}
          ${penaltyStats}
        </div>` : ''}
      ${q.status === 'active' ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-success" style="flex:1" onclick="App.completeQuest('${q.id}')">✓ COMPLETE</button>
          <button class="btn btn-danger" style="flex:1" onclick="App.failQuest('${q.id}')">✗ FAIL</button>
          <button class="btn btn-secondary btn-sm" onclick="App.deleteQuest('${q.id}')">DELETE</button>
          <button class="btn btn-secondary btn-sm" onclick="App.closeModal()">CLOSE</button>
        </div>` :
        `<button class="btn btn-secondary btn-full" onclick="App.closeModal()">CLOSE</button>`}
    `);
  }

  function completeQuest(questId) {
    const result = Engine.completeQuest(player, questId);
    if (!result) return;
    save();
    closeModal();
    toast(`Quest Complete! +${result.quest.rewards.xp} XP${result.quest.rewards.gold ? `, +⬡${result.quest.rewards.gold}` : ''}`, 'gold');
    if (result.leveled) setTimeout(() => showLevelUp(), 500);
    if (result.rankUp) setTimeout(() => toast(`⚡ RANK UP → ${player.rank}!`, 'gold'), 1200);
    refreshHud();
    renderPage();
  }

  function failQuest(questId) {
    if (!confirm('Mark this quest as FAILED? Penalties will apply.')) return;
    Engine.failQuest(player, questId);
    save();
    closeModal();
    toast('Quest failed. Penalties applied.', 'error');
    refreshHud();
    renderPage();
  }

  function deleteQuest(questId) {
    if (!confirm('Delete this quest permanently?')) return;
    player.quests = player.quests.filter(x => x.id !== questId);
    save();
    closeModal();
    toast('Quest deleted', 'info');
    renderPage();
  }

  // ---- STAT BOOST MODAL ----
  function openStatBoost() {
    const statOpts = STAT_DEFS.map(s => `<option value="${s.id}">${s.icon} ${s.label} (${player.statValues[s.id]||0})</option>`).join('');
    openModal(`
      <div class="modal-title">◈ MANUAL STAT BOOST <button class="modal-close" onclick="App.closeModal()">✕</button></div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:14px">Record real-world activity and boost your stats manually. Be honest!</div>
      <div class="form-group">
        <label class="form-label">STAT</label>
        <select class="form-select" id="boost-stat">${statOpts}</select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">AMOUNT (+)</label>
          <input class="form-input" id="boost-amount" type="number" value="1" min="1" max="20">
        </div>
        <div class="form-group">
          <label class="form-label">XP REWARD</label>
          <input class="form-input" id="boost-xp" type="number" value="20" min="0">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">REASON / ACTIVITY</label>
        <input class="form-input" id="boost-reason" placeholder="e.g. 5km run, read 30 pages...">
      </div>
      <div style="display:flex;gap:8px;margin-top:4px">
        <button class="btn btn-secondary btn-full" onclick="App.closeModal()">CANCEL</button>
        <button class="btn btn-primary btn-full" onclick="App.submitStatBoost()">APPLY BOOST</button>
      </div>
    `);
  }

  function submitStatBoost() {
    const statId = document.getElementById('boost-stat')?.value;
    const amount = parseInt(document.getElementById('boost-amount')?.value) || 1;
    const xpGain = parseInt(document.getElementById('boost-xp')?.value) || 0;
    Engine.addStat(player, statId, amount);
    if (xpGain > 0) {
      const res = Engine.addXp(player, xpGain);
      if (res.leveled) setTimeout(() => showLevelUp(), 400);
    }
    save();
    closeModal();
    toast(`Stat boosted! +${amount} ${STAT_DEFS.find(s=>s.id===statId)?.label}`, 'success');
    refreshHud();
    renderPage();
  }

  // ---- LEVEL UP ----
  function showLevelUp() {
    const overlay = document.createElement('div');
    overlay.className = 'levelup-overlay';
    overlay.style.color = Engine.getRankColor(player.rank);
    overlay.innerHTML = `
      <div class="levelup-title">LEVEL UP</div>
      <div class="levelup-rank" style="color:${Engine.getRankColor(player.rank)};text-shadow:0 0 40px ${Engine.getRankColor(player.rank)}">${player.level}</div>
      <div class="levelup-label">YOU ARE NOW</div>
      <div style="font-family:var(--font-head);font-size:18px;color:var(--text);margin-top:4px">LEVEL ${player.level} — RANK ${player.rank}</div>
      <button class="btn btn-primary" style="margin-top:24px;padding:12px 32px" onclick="this.parentElement.remove()">CONTINUE ▶</button>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => { if (overlay.parentElement) overlay.remove(); }, 5000);
  }

  // ---- NOTIFICATIONS ----
  document.getElementById('notif-btn').addEventListener('click', () => {
    if (!player) return;
    player.notifications.forEach(n => n.read = true);
    Engine.save(player);
    refreshHud();
    const notifs = player.notifications.slice(0, 10);
    openModal(`
      <div class="modal-title">🔔 NOTIFICATIONS <button class="modal-close" onclick="App.closeModal()">✕</button></div>
      ${!notifs.length ? '<div class="empty-state"><div class="empty-text">No notifications</div></div>' :
        notifs.map(n => `<div style="padding:10px 0;border-bottom:1px solid var(--border);font-size:13px;color:var(--text2)">${n.msg}<br><span style="font-size:10px;color:var(--text3)">${new Date(n.date).toLocaleString()}</span></div>`).join('')
      }
      <button class="btn btn-secondary btn-full" style="margin-top:12px" onclick="App.closeModal()">CLOSE</button>
    `);
  });

  // ---- MODAL ----
  function openModal(html) {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');
  }
  function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  }
  document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  // ---- TOAST ----
  function toast(msg, type = 'info') {
    const icons = { success:'✓', error:'✗', gold:'⬡', info:'ℹ' };
    const el = document.createElement('div');
    el.className = `toast toast-${type==='gold'?'gold':type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ'}</span>${msg}`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // Expose
  return {
    get player() { return player; },
    set player(v) { player = v; },
    init, navigate, renderPage, refreshHud, save,
    openModal, closeModal, toast,
    showLevelUp, createPlayer,
    openQuestDetail, completeQuest, failQuest, deleteQuest,
    openStatBoost, submitStatBoost,
  };
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

window.addEventListener('DOMContentLoaded', App.init);

window.exportSave = function() {
  const saveData = localStorage.getItem('ascend_v1');

  if (!saveData) {
    alert('No save data found.');
    return;
  }

  const blob = new Blob([saveData], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'ascend-save.json';

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
};

window.importSave = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = e => {
    if (!confirm('Overwrite current save?')) return;

    localStorage.setItem('ascend_v1', e.target.result);

    alert('Save imported successfully.');
    location.reload();
  };

  reader.readAsText(file);
};