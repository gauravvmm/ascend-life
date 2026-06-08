// ============================================================
// ENGINE.JS — Core Game Logic
// ============================================================

const Engine = (() => {
  const KEY = 'ascend_v1';

  // ---- SAVE / LOAD ----
  function save(player) {
    try { localStorage.setItem(KEY, JSON.stringify(player)); } catch(e) {}
  }
  function load() {
    try {
      const d = localStorage.getItem(KEY);
      if (d) return Object.assign({}, DEFAULT_PLAYER, JSON.parse(d));
    } catch(e) {}
    return null;
  }
  function reset() { localStorage.removeItem(KEY); }

  // ---- RANK ----
  function getRankForXp(totalXp) {
    let rank = 'E';
    for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalXp >= RANK_THRESHOLDS[i]) { rank = RANKS[i]; break; }
    }
    return rank;
  }
  function getRankColor(rank) {
    return `var(--rank-${rank.toLowerCase().replace('ss','ss').replace('sss','sss')})`;
  }

  // ---- XP & LEVELING ----
  function addXp(player, amount) {
    player.xp += amount;
    player.stats.totalXpEarned += amount;
    let leveled = false;
    while (true) {
      const needed = XP_PER_LEVEL(player.level);
      if (player.xp >= needed) {
        player.xp -= needed;
        player.level += 1;
        leveled = true;
      } else break;
    }
    const newRank = getRankForXp(player.stats.totalXpEarned);
    const rankUp = newRank !== player.rank;
    player.rank = newRank;
    return { leveled, rankUp };
  }

  function xpProgress(player) {
    const needed = XP_PER_LEVEL(player.level);
    return { current: player.xp, needed, pct: Math.min(100, (player.xp / needed) * 100) };
  }

  // ---- STATS ----
  function addStat(player, statId, amount) {
    if (player.statValues[statId] !== undefined) {
      player.statValues[statId] = Math.min(100, (player.statValues[statId] || 0) + amount);
    }
  }

  // ---- QUESTS ----
  function createQuest(data) {
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      name: data.name || 'Unnamed Quest',
      desc: data.desc || '',
      type: data.type || 'side',
      deadline: data.deadline || null,
      prerequisites: data.prerequisites || [],
      rewards: {
        xp: parseInt(data.rewardXp) || 50,
        gold: parseInt(data.rewardGold) || 0,
        stats: data.rewardStats || {},
        skills: data.rewardSkills || {},
      },
      penalty: {
        xp: parseInt(data.penaltyXp) || 0,
        gold: parseInt(data.penaltyGold) || 0,
        stats: data.penaltyStats || {},
      },
      status: 'active',
      createdAt: Date.now(),
      completedAt: null,
      repeatType: data.repeatType || 'none',
      repeatData: data.repeatData || null,
      notes: data.notes || '',
    };
  }

  function completeQuest(player, questId) {
    const q = player.quests.find(x => x.id === questId);
    if (!q || q.status !== 'active') return null;
    q.status = 'completed';
    q.completedAt = Date.now();
    player.stats.questsCompleted += 1;
    player.stats.daysSincePenalty += 0; // keeps counting

    const result = addXp(player, q.rewards.xp);
    player.gold += q.rewards.gold;
    player.totalGoldEarned += q.rewards.gold;
    Object.entries(q.rewards.stats || {}).forEach(([s,v]) => addStat(player, s, v));
    Object.entries(q.rewards.skills || {}).forEach(([skillId, xpAmt]) => {
      const sk = player.skills.find(x => x.id === skillId);
      if (sk) addSkillXp(player, skillId, xpAmt);
    });

    // Handle repeatable
    if (q.repeatType === 'daily') {
      const clone = { ...q, id: Date.now().toString(36)+Math.random().toString(36).slice(2,6), status:'active', completedAt:null, createdAt:Date.now() };
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1); tomorrow.setHours(23,59,0,0);
      clone.deadline = tomorrow.toISOString().slice(0,16);
      player.quests.push(clone);
    } else if (q.repeatType === 'weekly') {
      const clone = { ...q, id: Date.now().toString(36)+Math.random().toString(36).slice(2,6), status:'active', completedAt:null, createdAt:Date.now() };
      const next = new Date(); next.setDate(next.getDate()+7); next.setHours(23,59,0,0);
      clone.deadline = next.toISOString().slice(0,16);
      player.quests.push(clone);
    }

    return { quest: q, ...result };
  }

  function failQuest(player, questId) {
    const q = player.quests.find(x => x.id === questId);
    if (!q || q.status !== 'active') return;
    q.status = 'failed';
    player.stats.questsFailed += 1;
    player.stats.daysSincePenalty = 0;
    if (q.penalty.xp > 0) { player.xp = Math.max(0, player.xp - q.penalty.xp); }
    if (q.penalty.gold > 0) { player.gold = Math.max(0, player.gold - q.penalty.gold); }
    Object.entries(q.penalty.stats || {}).forEach(([s,v]) => {
      if (player.statValues[s] !== undefined)
        player.statValues[s] = Math.max(0, player.statValues[s] - v);
    });
  }

  function checkOverdueQuests(player) {
    const now = Date.now();
    const overdue = [];
    player.quests.forEach(q => {
      if (q.status === 'active' && q.deadline) {
        const dl = new Date(q.deadline).getTime();
        if (dl < now) overdue.push(q);
      }
    });
    return overdue;
  }

  // ---- SKILLS ----
  function createSkill(data) {
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,5),
      name: data.name,
      category: data.category || 'Other',
      icon: data.icon || '✦',
      desc: data.desc || '',
      level: 1,
      xp: 0,
      totalXp: 0,
    };
  }

  function skillXpNeeded(level) { return Math.floor(50 * Math.pow(1.15, level - 1)); }

  function addSkillXp(player, skillId, amount) {
    const sk = player.skills.find(x => x.id === skillId);
    if (!sk) return false;
    sk.xp += amount;
    sk.totalXp += amount;
    let leveled = false;
    while (sk.xp >= skillXpNeeded(sk.level)) {
      sk.xp -= skillXpNeeded(sk.level);
      sk.level += 1;
      leveled = true;
    }
    return leveled;
  }

  // ---- ACADEMICS ----
  function logStudySession(player, subjectId, duration, notes, mastered) {
    const session = { id: Date.now().toString(36), subjectId, duration, notes, mastered, date: Date.now() };
    player.academics.sessions.push(session);
    player.stats.studySessions += 1;
    const xpGain = Math.floor(duration * 1.5) + (mastered ? 30 : 0);
    const goldGain = Math.floor(duration / 10);
    const res = addXp(player, xpGain);
    player.gold += goldGain;
    player.totalGoldEarned += goldGain;
    addStat(player, 'intelligence', Math.floor(duration / 20) + (mastered ? 2 : 0));
    addStat(player, 'wisdom', Math.floor(duration / 30));
    return { xpGain, goldGain, ...res };
  }

  // ---- STREAK ----
  function checkStreak(player) {
    const today = new Date().toDateString();
    const last = player.stats.lastLogin;
    if (!last) {
      player.stats.streak = 1;
    } else if (last === today) {
      return; // same day
    } else {
      const diff = (new Date(today) - new Date(last)) / 86400000;
      if (diff <= 1.5) {
        player.stats.streak += 1;
      } else {
        player.stats.streak = 1;
      }
    }
    player.stats.maxStreak = Math.max(player.stats.maxStreak, player.stats.streak);
    player.stats.lastLogin = today;
    player.stats.daysSincePenalty = (player.stats.daysSincePenalty || 0) + 1;
  }

  // ---- ACHIEVEMENTS ----
  function checkAchievements(player) {
    const newly = [];
    ACHIEVEMENT_DEFS.forEach(def => {
      if (!player.unlockedAchievements.includes(def.id)) {
        try {
          if (def.check(player)) {
            player.unlockedAchievements.push(def.id);
            newly.push(def);
          }
        } catch(e) {}
      }
    });
    return newly;
  }

  // ---- NOTIFICATIONS ----
  function addNotif(player, msg) {
    player.notifications.unshift({ msg, date: Date.now(), read: false });
    if (player.notifications.length > 50) player.notifications.pop();
  }

  function unreadCount(player) {
    return player.notifications.filter(n => !n.read).length;
  }

  function timeLeft(deadline) {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return { text: 'OVERDUE', cls: 'danger' };
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (d > 1) return { text: `${d}d left`, cls: h < 24*3 ? 'warn' : 'ok' };
    if (h > 0) return { text: `${h}h left`, cls: h < 12 ? 'warn' : 'ok' };
    const m = Math.floor(diff / 60000);
    return { text: `${m}m left`, cls: 'danger' };
  }

  return {
    save, load, reset,
    getRankColor, getRankForXp,
    addXp, xpProgress,
    addStat,
    createQuest, completeQuest, failQuest, checkOverdueQuests,
    createSkill, addSkillXp, skillXpNeeded,
    logStudySession,
    checkStreak, checkAchievements,
    addNotif, unreadCount, timeLeft,
  };
})();
