# ASCEND — Life RPG System

> *Gamify your life. Level up for real.*

A Solo Leveling / Murim-inspired Progressive Web App (PWA) to track your real-life growth across stats, quests, skills, academics, and achievements — built to last 5-6 years.

## Features

- **10 Character Stats** — Strength, Stamina, Agility, Intelligence, Wisdom, Charisma, Discipline, Creativity, Reputation, Wealth
- **Quests** — Daily, Weekly, Main, Side, Challenge, Habit types with deadlines, prerequisites, rewards, and automatic penalties
- **Skills** — Track and level up any real-world skill (coding, boxing, piano, etc.)
- **Academics** — Subject tracker with topics, study sessions, and grade calculation
- **Achievements** — 22 unlockable achievements with real milestone tracking
- **Rank System** — E → D → C → B → A → S → SS → SSS
- **PWA** — Install on phone, works fully offline

## Deploy to GitHub Pages

1. **Fork or create this repo** on GitHub
2. Push all files to the `main` branch
3. Go to **Settings → Pages → Source** → select `GitHub Actions`
4. The workflow at `.github/workflows/deploy.yml` will auto-deploy
5. Your app lives at `https://YOUR_USERNAME.github.io/REPO_NAME/`

## Install as PWA on Phone

**Android (Chrome):**
1. Open the GitHub Pages URL in Chrome
2. Tap the "Add to Home Screen" banner or Menu → Add to Home Screen

**iOS (Safari):**
1. Open the URL in Safari
2. Tap Share → Add to Home Screen

## Data

All data is stored in your browser's `localStorage` — it stays on your device. Nothing is sent to any server.

## Future-proofing

The codebase is modular:
- `js/data.js` — all constants, schemas, stat/achievement definitions
- `js/engine.js` — game logic (XP, leveling, quests, skills)
- `js/pages/*.js` — each screen is isolated
- `css/main.css` — single CSS file with CSS variables for theming

To add a new page: create `js/pages/newpage.js`, add a `<script>` tag in `index.html`, add a nav button, and register in `App.pages`.
