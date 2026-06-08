// ============================================================
// DATA.JS — Schema, Defaults, Constants
// ============================================================

const RANKS = ['E','D','C','B','A','S','SS','SSS'];
const RANK_THRESHOLDS = [0,500,1500,3500,7000,13000,22000,36000];
const XP_PER_LEVEL = (level) => Math.floor(100 * Math.pow(1.18, level - 1));

const STAT_DEFS = [
  { id:'strength',    label:'Strength',    icon:'💪', color:'#ef5350', desc:'Physical power & lifting' },
  { id:'stamina',     label:'Stamina',     icon:'🫀', color:'#ff7043', desc:'Endurance & cardio' },
  { id:'agility',     label:'Agility',     icon:'⚡', color:'#ffca28', desc:'Speed & flexibility' },
  { id:'intelligence',label:'Intelligence',icon:'🧠', color:'#42a5f5', desc:'Learning & problem solving' },
  { id:'wisdom',      label:'Wisdom',      icon:'📖', color:'#7e57c2', desc:'Judgment & insight' },
  { id:'charisma',    label:'Charisma',    icon:'✨', color:'#ec407a', desc:'Social & communication' },
  { id:'discipline',  label:'Discipline',  icon:'🔥', color:'#ff8f00', desc:'Consistency & focus' },
  { id:'creativity',  label:'Creativity',  icon:'🎨', color:'#26c6da', desc:'Art, ideas & innovation' },
  { id:'reputation',  label:'Reputation',  icon:'👑', color:'#ffd84d', desc:'Social standing & respect' },
  { id:'wealth',      label:'Wealth',      icon:'💰', color:'#66bb6a', desc:'Financial growth & management' },
];

const QUEST_TYPES = [
  { id:'main',      label:'MAIN',      color:'var(--gold)',   icon:'⚔' },
  { id:'daily',     label:'DAILY',     color:'var(--accent)', icon:'☀' },
  { id:'weekly',    label:'WEEKLY',    color:'var(--purple)', icon:'📅' },
  { id:'side',      label:'SIDE',      color:'var(--green)',  icon:'◈' },
  { id:'challenge', label:'CHALLENGE', color:'var(--red)',    icon:'🏆' },
  { id:'habit',     label:'HABIT',     color:'var(--orange)', icon:'🔄' },
];

const SKILL_CATEGORIES = [
  'Combat & Fitness','Knowledge & Study','Craft & Tech','Social & Leadership',
  'Finance & Business','Arts & Creativity','Mindset & Discipline','Language','Other'
];

const SUBJECT_DEFAULTS = [
  { id:'math',    name:'Mathematics', icon:'∑', color:'#42a5f5' },
  { id:'science', name:'Science',     icon:'⚗', color:'#26c6da' },
  { id:'english', name:'English',     icon:'📝', color:'#66bb6a' },
  { id:'history', name:'History',     icon:'🏛', color:'#ffa726' },
  { id:'cs',      name:'Comp. Science',icon:'💻', color:'#ab47bc' },
];

const ACHIEVEMENT_DEFS = [
  { id:'first_quest',   name:'First Step',         icon:'👣', desc:'Complete your first quest',       reward:'100 XP',    check: s => s.stats.questsCompleted >= 1 },
  { id:'quest_10',      name:'On the Path',         icon:'🛤', desc:'Complete 10 quests',              reward:'300 XP',    check: s => s.stats.questsCompleted >= 10 },
  { id:'quest_50',      name:'Veteran Hunter',      icon:'⚔', desc:'Complete 50 quests',              reward:'1000 XP',   check: s => s.stats.questsCompleted >= 50 },
  { id:'quest_100',     name:'Centurion',           icon:'💯', desc:'Complete 100 quests',             reward:'3000 XP',   check: s => s.stats.questsCompleted >= 100 },
  { id:'streak_7',      name:'Unwavering',          icon:'🔥', desc:'7-day login streak',              reward:'500 XP',    check: s => s.stats.maxStreak >= 7 },
  { id:'streak_30',     name:'Iron Will',           icon:'🏔', desc:'30-day login streak',             reward:'2000 XP',   check: s => s.stats.maxStreak >= 30 },
  { id:'streak_100',    name:'Legendary Grind',     icon:'👁', desc:'100-day login streak',            reward:'8000 XP',   check: s => s.stats.maxStreak >= 100 },
  { id:'level_10',      name:'Awakened',            icon:'⚡', desc:'Reach Level 10',                  reward:'500 XP',    check: s => s.level >= 10 },
  { id:'level_25',      name:'Ascendant',           icon:'🌟', desc:'Reach Level 25',                  reward:'2000 XP',   check: s => s.level >= 25 },
  { id:'level_50',      name:'Transcendent',        icon:'💠', desc:'Reach Level 50',                  reward:'10000 XP',  check: s => s.level >= 50 },
  { id:'rank_d',        name:'D-Rank Hunter',       icon:'🔵', desc:'Reach Rank D',                    reward:'⬡ 500',     check: s => RANKS.indexOf(s.rank) >= 1 },
  { id:'rank_c',        name:'C-Rank Hunter',       icon:'🔷', desc:'Reach Rank C',                    reward:'⬡ 1000',    check: s => RANKS.indexOf(s.rank) >= 2 },
  { id:'rank_s',        name:'S-Rank Hunter',       icon:'⭐', desc:'Reach Rank S',                    reward:'⬡ 10000',   check: s => RANKS.indexOf(s.rank) >= 5 },
  { id:'skill_10',      name:'Jack of All',         icon:'🎭', desc:'Have 10+ skills',                 reward:'500 XP',    check: s => s.skills.length >= 10 },
  { id:'skill_max',     name:'Master Craftsman',    icon:'🎖', desc:'Max out any skill to Level 50',   reward:'5000 XP',   check: s => s.skills.some(k => k.level >= 50) },
  { id:'gold_1000',     name:'Merchant',            icon:'💰', desc:'Accumulate ⬡ 1,000',              reward:'100 XP',    check: s => s.totalGoldEarned >= 1000 },
  { id:'gold_10000',    name:'Tycoon',              icon:'🏦', desc:'Accumulate ⬡ 10,000',             reward:'500 XP',    check: s => s.totalGoldEarned >= 10000 },
  { id:'no_penalty',    name:'Flawless',            icon:'🛡', desc:'30 days without a penalty',       reward:'1500 XP',   check: s => s.stats.daysSincePenalty >= 30 },
  { id:'all_stats_50',  name:'Balanced Soul',       icon:'☯', desc:'All stats above 50',              reward:'5000 XP',   check: s => Object.values(s.statValues).every(v => v >= 50) },
  { id:'subject_3',     name:'Scholar',             icon:'📚', desc:'Complete 3 study sessions',       reward:'200 XP',    check: s => s.stats.studySessions >= 3 },
  { id:'subject_50',    name:'Academic',            icon:'🎓', desc:'Complete 50 study sessions',      reward:'2000 XP',   check: s => s.stats.studySessions >= 50 },
];

const DEFAULT_PLAYER = {
  name: '',
  title: 'The Awakened',
  level: 1,
  xp: 0,
  gold: 0,
  rank: 'E',
  totalGoldEarned: 0,
  statValues: {
    strength:1, stamina:1, agility:1, intelligence:1, wisdom:1,
    charisma:1, discipline:1, creativity:1, reputation:1, wealth:1
  },
  stats: {
    questsCompleted: 0,
    questsFailed: 0,
    streak: 0,
    maxStreak: 0,
    lastLogin: null,
    daysSincePenalty: 0,
    studySessions: 0,
    totalXpEarned: 0,
  },
  quests: [],
  skills: [],
  academics: {
    subjects: [],
    sessions: [],
  },
  achievements: [],
  unlockedAchievements: [],
  notifications: [],
  createdAt: null,
};
