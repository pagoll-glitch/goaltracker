/**
 * Achievement & Rewards Controller
 * Real activity-based gamification engine:
 * XP points, Levels, Badges, Habit Streak Milestones, Weekly Challenges, Personal Records.
 */
const Rewards = (() => {
  const BADGES_CATALOG = [
    {
      id: 'first_task',
      name: 'First Spark',
      icon: '⚡',
      category: 'Tasks',
      desc: 'Complete your first task in Goal It Up',
      xpReward: 30
    },
    {
      id: 'task_master_25',
      name: 'Task Centurion',
      icon: '⚔️',
      category: 'Tasks',
      desc: 'Complete 25 total tasks across your projects',
      xpReward: 100
    },
    {
      id: 'habit_streak_7',
      name: 'Consistency Beast',
      icon: '🔥',
      category: 'Habits',
      desc: 'Achieve a 7-day streak on any daily habit',
      xpReward: 150
    },
    {
      id: 'habit_streak_14',
      name: 'Iron Will',
      icon: '🛡️',
      category: 'Habits',
      desc: 'Maintain a 14-day unbroken habit streak',
      xpReward: 250
    },
    {
      id: 'focus_centurion',
      name: 'Zen Centurion',
      icon: '⏱',
      category: 'Focus',
      desc: 'Accumulate 100+ minutes of deep focus sprints',
      xpReward: 120
    },
    {
      id: 'life_wheel',
      name: 'Wheel of Harmony',
      icon: '☸️',
      category: 'Balance',
      desc: 'Complete a full review on the Life Balance Dashboard',
      xpReward: 50
    },
    {
      id: 'weekly_reset_first',
      name: 'Sunday Architect',
      icon: '🔄',
      category: 'Reflection',
      desc: 'Conduct your first guided Weekly Reset',
      xpReward: 100
    },
    {
      id: 'vision_builder',
      name: 'Visionary Mind',
      icon: '🌌',
      category: 'Vision',
      desc: 'Formulate an ideal future vision statement and aspirations',
      xpReward: 80
    }
  ];

  const LEVEL_TITLES = [
    'Novice Architect',      // Level 1
    'Mindful Explorer',      // Level 2
    'Momentum Builder',      // Level 3
    'Flow Practitioner',     // Level 4
    'Focus Artisan',         // Level 5
    'Discipline Master',     // Level 6
    'Sovereign of Habit',    // Level 7
    'Goal It Up Virtuoso'    // Level 8+
  ];

  function getLevelInfo(xp) {
    const level = Math.floor(Math.sqrt((xp || 0) / 100)) + 1;
    const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

    // XP thresholds
    const currentLevelBaseXP = Math.pow(level - 1, 2) * 100;
    const nextLevelXP = Math.pow(level, 2) * 100;
    const progressXP = xp - currentLevelBaseXP;
    const neededXP = nextLevelXP - currentLevelBaseXP;
    const progressPercent = Math.min(100, Math.max(0, Math.round((progressXP / neededXP) * 100)));

    return { level, title, currentLevelBaseXP, nextLevelXP, progressXP, neededXP, progressPercent };
  }

  function render() {
    const container = document.getElementById('rewards-view');
    if (!container) return;
    const state = Storage.getState();
    const rewards = state.rewards || { xp: 0, unlockedBadgeIds: [], challenges: [], records: {} };
    const xp = rewards.xp || 0;
    const levelInfo = getLevelInfo(xp);
    const unlockedIds = rewards.unlockedBadgeIds || [];

    // Calculate personal records from actual state
    const currentMaxStreak = Math.max(0, ...state.habits.map(h => h.streak || 0));
    const totalFocusMinutes = (state.focusSessions || []).reduce((a, b) => a + (b.durationMinutes || 0), 0);
    const completedTasksCount = state.tasks.filter(t => t.completed).length;

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:24px;">
        <!-- Level & XP Hero Banner -->
        <div class="card" style="background: linear-gradient(135deg, var(--sage-50), var(--bg-card)); border-color:var(--sage-200); padding:32px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px;">
            <div style="display:flex; align-items:center; gap:20px;">
              <div style="width:72px; height:72px; border-radius:var(--radius-xl); background:linear-gradient(135deg, var(--sage-500), var(--sage-700)); display:flex; align-items:center; justify-content:center; color:white; font-family:var(--font-serif); font-size:2rem; font-weight:700; box-shadow:var(--shadow-md);">
                ${levelInfo.level}
              </div>
              <div>
                <div style="font-size:0.78rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; letter-spacing:0.04em;">Current Architecture Tier</div>
                <h3 style="font-family:var(--font-serif); font-size:1.8rem; font-weight:700; color:var(--text-main); line-height:1.2;">
                  Level ${levelInfo.level}: ${levelInfo.title}
                </h3>
                <span style="font-size:0.88rem; color:var(--sage-700); font-weight:600;">
                  ⚡ ${xp.toLocaleString()} Total XP Accumulated
                </span>
              </div>
            </div>

            <div style="min-width:240px; display:flex; flex-direction:column; gap:6px;">
              <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:600;">
                <span style="color:var(--text-muted);">Progress to Level ${levelInfo.level + 1}</span>
                <span style="color:var(--sage-600);">${levelInfo.progressXP} / ${levelInfo.neededXP} XP</span>
              </div>
              <div class="progress-track" style="height:12px;">
                <div class="progress-bar-fill" style="width: ${levelInfo.progressPercent}%;"></div>
              </div>
              <span style="font-size:0.75rem; color:var(--text-muted); text-align:right;">${levelInfo.progressPercent}% Completed</span>
            </div>
          </div>
        </div>

        <!-- Weekly Challenges -->
        <div class="card">
          <div class="card-header">
            <div>
              <h4 class="card-title"><span>🎯</span> Active Weekly Challenges</h4>
              <p style="font-size:0.82rem; color:var(--text-muted); margin-top:2px;">Complete challenges through genuine daily activity to claim bonus XP.</p>
            </div>
            <span class="badge badge-amber">Refreshes Weekly</span>
          </div>

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-top:12px;">
            ${(rewards.challenges || []).map(ch => {
              const pct = Math.min(100, Math.round((ch.current / ch.target) * 100));
              return `
                <div class="card" style="background-color:var(--bg-card-subtle); border-color:${ch.completed ? 'var(--pastel-teal-border)' : 'var(--border-light)'};">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                    <span class="badge ${ch.completed ? 'badge-teal' : 'badge-amber'}">${ch.completed ? '✓ Completed' : `+${ch.rewardXP} XP`}</span>
                    <span style="font-size:0.82rem; font-weight:700; color:var(--text-main);">${ch.current} / ${ch.target} ${ch.unit}</span>
                  </div>
                  <div style="font-size:0.94rem; font-weight:600; color:var(--text-main); margin-bottom:4px;">${escapeHtml(ch.title)}</div>
                  <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:12px;">${escapeHtml(ch.desc)}</div>
                  <div class="progress-track" style="height:8px;">
                    <div class="progress-bar-fill" style="width: ${pct}%; background: ${ch.completed ? 'var(--pastel-teal-text)' : 'linear-gradient(90deg, var(--sage-500), var(--sage-600))'};"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Achievement Badges -->
        <div class="card">
          <div class="card-header">
            <div>
              <h4 class="card-title"><span>🏅</span> Milestones & Badges</h4>
              <p style="font-size:0.82rem; color:var(--text-muted); margin-top:2px;">Earned automatically when you reach consistency benchmarks.</p>
            </div>
            <span class="badge badge-sage">${unlockedIds.length} / ${BADGES_CATALOG.length} Unlocked</span>
          </div>

          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:16px; margin-top:14px;">
            ${BADGES_CATALOG.map(b => {
              const isUnlocked = unlockedIds.includes(b.id);
              return `
                <div class="card" style="display:flex; flex-direction:column; justify-content:space-between; opacity:${isUnlocked ? '1' : '0.55'}; background-color:${isUnlocked ? 'var(--bg-card)' : 'var(--bg-card-subtle)'}; border-color:${isUnlocked ? 'var(--sage-300)' : 'var(--border-light)'};">
                  <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                      <span style="font-size:2rem;">${b.icon}</span>
                      <span class="badge ${isUnlocked ? 'badge-teal' : 'badge-blue'}">${isUnlocked ? 'Unlocked' : `+${b.xpReward} XP`}</span>
                    </div>
                    <h5 style="font-family:var(--font-serif); font-size:1.05rem; font-weight:600; color:var(--text-main); margin-bottom:4px;">${b.name}</h5>
                    <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.4;">${b.desc}</p>
                  </div>
                  <div style="margin-top:12px; font-size:0.74rem; font-weight:600; color:${isUnlocked ? 'var(--sage-600)' : 'var(--text-subtle)'};">
                    ${isUnlocked ? '✓ Benchmark Met' : '🔒 In Progress'}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Personal Records Summary -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon habits">🔥</div>
            <div class="stat-info">
              <h3>${currentMaxStreak} days</h3>
              <span>Longest Habit Streak</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon focus">⏱</div>
            <div class="stat-info">
              <h3>${totalFocusMinutes} min</h3>
              <span>Total Deep Focus Logged</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon tasks">✓</div>
            <div class="stat-info">
              <h3>${completedTasksCount}</h3>
              <span>All-Time Tasks Done</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon goals">🏆</div>
            <div class="stat-info">
              <h3>${rewards.records.highestProductivityScore || 92}%</h3>
              <span>Peak Productivity Score</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return {
    render
  };
})();

