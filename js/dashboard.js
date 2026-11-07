/**
 * Dashboard Controller
 * Computes productivity score, formats greetings, renders today's items,
 * upcoming deadlines, and quotes.
 */
const Dashboard = (() => {
  let quoteIndex = 0;

  function calculateDailyScore(state) {
    const today = Storage.getTodayStr();

    // 1. Task factor (up to 35 pts)
    const todayTasks = state.tasks.filter(t => t.dueDate === today);
    let taskScore = 0;
    if (todayTasks.length > 0) {
      const completedCount = todayTasks.filter(t => t.completed).length;
      taskScore = Math.round((completedCount / todayTasks.length) * 35);
    }

    // 2. Habit factor (up to 35 pts)
    const activeHabits = state.habits;
    let habitScore = 0;
    if (activeHabits.length > 0) {
      const doneHabits = activeHabits.filter(h => h.history && h.history[today]).length;
      habitScore = Math.round((doneHabits / activeHabits.length) * 35);
    }

    // 3. Focus factor (up to 20 pts)
    const todayFocusSessions = state.focusSessions.filter(fs => fs.date === today);
    const totalFocusMinutes = todayFocusSessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    const targetMinutes = (state.settings.dailyTargetHours || 4) * 60;
    const focusScore = Math.min(20, Math.round((totalFocusMinutes / targetMinutes) * 20));

    // 4. Journal factor (up to 10 pts)
    const hasJournal = state.journalEntries.some(j => j.date === today);
    const journalScore = hasJournal ? 10 : 0;

    const total = Math.min(100, Math.max(0, taskScore + habitScore + focusScore + journalScore));
    return {
      total,
      taskScore,
      habitScore,
      focusScore,
      journalScore,
      totalFocusMinutes,
      doneHabitsCount: activeHabits.filter(h => h.history && h.history[today]).length,
      totalHabitsCount: activeHabits.length
    };
  }

  function getGreetingMessage() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function render() {
    const state = Storage.getState();
    const todayStr = Storage.getTodayStr();
    const container = document.getElementById('dashboard-view');
    if (!container) return;

    const scoreData = calculateDailyScore(state);
    const greeting = getGreetingMessage();
    const userName = state.settings.userName || 'Sara';

    // Motivational Quote
    const quotes = state.settings.motivationalQuotes || [];
    const currentQuote = quotes[quoteIndex % (quotes.length || 1)] || {
      quote: "Small daily improvements over time lead to stunning results.",
      author: "Robin Sharma"
    };

    // Calculate quick stats
    const completedTasksToday = state.tasks.filter(t => t.completed && t.completedAt === todayStr).length;
    const activeGoals = state.goals.filter(g => g.current < g.target).length;
    const focusHoursFormatted = (scoreData.totalFocusMinutes / 60).toFixed(1);
    const habitPercentToday = scoreData.totalHabitsCount > 0
      ? Math.round((scoreData.doneHabitsCount / scoreData.totalHabitsCount) * 100)
      : 0;

    // Upcoming deadlines (next 7 days)
    const upcomingTasks = state.tasks
      .filter(t => !t.completed && t.dueDate >= todayStr)
      .sort((a, b) => (a.dueDate + a.dueTime).localeCompare(b.dueDate + b.dueTime))
      .slice(0, 4);

    // Filter today's tasks
    const todayTasks = state.tasks
      .filter(t => t.dueDate === todayStr)
      .slice(0, 4);

    const pendingTasksCount = state.tasks.filter(t => !t.completed).length;
    const rewards = state.rewards || { xp: 0 };
    const level = Math.floor(Math.sqrt((rewards.xp || 0) / 100)) + 1;
    const lifeHarmony = (state.lifeBalance && state.lifeBalance.history && state.lifeBalance.history[0]) ? state.lifeBalance.history[0].balanceScore : 84;

    // SVG stroke dash math for circle of radius 30 (circumference ~ 188.5)
    const circumference = 2 * Math.PI * 30;
    const strokeOffset = circumference - (scoreData.total / 100) * circumference;

    container.innerHTML = `
      <div class="dashboard-grid">
        <!-- 0. Overwhelmed Rescue Alert (if 5+ tasks pending or user wants decompression) -->
        ${pendingTasksCount >= 5 ? `
          <div class="card" style="background:var(--pastel-teal-bg); border-color:var(--pastel-teal-border); padding:16px 22px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size:1.6rem;">🍃</span>
              <div>
                <div style="font-weight:700; color:var(--pastel-teal-text); font-size:0.95rem;">Feeling overloaded? You have ${pendingTasksCount} pending tasks.</div>
                <div style="font-size:0.8rem; color:var(--text-muted);">Activate Overwhelmed Mode to hide distractions and spotlight your top 3 vital priorities.</div>
              </div>
            </div>
            <button class="btn-primary" style="background:var(--pastel-teal-text); font-size:0.84rem; padding:8px 18px;" onclick="App.navigateTo('overwhelmed')">
              ⚡ Open Overwhelmed Mode
            </button>
          </div>
        ` : ''}

        <!-- 1. Greeting & Productivity Score Banner -->
        <div class="greeting-banner">
          <div class="greeting-text">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
              <span class="badge badge-sage">Level ${level} • ${rewards.xp || 0} XP</span>
              <span class="badge badge-teal">Wheel Harmony: ${lifeHarmony}%</span>
            </div>
            <h2>${greeting}, ${userName} 🌿</h2>
            <p>Here is your daily command center overview. You are on track with your consistency benchmarks today.</p>
          </div>
          <div class="greeting-score-box">
            <div class="score-ring-wrap">
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle class="score-ring-bg" cx="36" cy="36" r="30" stroke-width="6" fill="transparent" />
                <circle class="score-ring-fill" cx="36" cy="36" r="30" stroke-width="6" fill="transparent"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${strokeOffset}" />
              </svg>
              <div class="score-ring-text">${scoreData.total}%</div>
            </div>
            <div class="score-info">
              <h4>Productivity Score</h4>
              <p>${scoreData.total >= 80 ? '🌟 Peak Flow' : scoreData.total >= 50 ? '🌱 Steady Momentum' : '⚡ Ready to Begin'}</p>
            </div>
          </div>
        </div>

        <!-- Advanced Life Management Shortcuts -->
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn-secondary" style="font-size:0.82rem; padding:8px 14px; border-radius:var(--radius-full); display:flex; align-items:center; gap:6px;" onclick="App.navigateTo('planner')">
            <span>🧭</span> <strong>Smart Daily Planner</strong>
          </button>
          <button class="btn-secondary" style="font-size:0.82rem; padding:8px 14px; border-radius:var(--radius-full); display:flex; align-items:center; gap:6px;" onclick="App.navigateTo('balance')">
            <span>☸️</span> <strong>Life Balance Wheel</strong>
          </button>
          <button class="btn-secondary" style="font-size:0.82rem; padding:8px 14px; border-radius:var(--radius-full); display:flex; align-items:center; gap:6px;" onclick="App.navigateTo('reset')">
            <span>🔄</span> <strong>Weekly Reset</strong>
          </button>
          <button class="btn-secondary" style="font-size:0.82rem; padding:8px 14px; border-radius:var(--radius-full); display:flex; align-items:center; gap:6px;" onclick="App.navigateTo('vision')">
            <span>🌌</span> <strong>Vision Board</strong>
          </button>
          <button class="btn-secondary" style="font-size:0.82rem; padding:8px 14px; border-radius:var(--radius-full); display:flex; align-items:center; gap:6px;" onclick="App.navigateTo('rewards')">
            <span>🏅</span> <strong>Achievements & XP</strong>
          </button>
          <button class="btn-secondary" style="font-size:0.82rem; padding:8px 14px; border-radius:var(--radius-full); display:flex; align-items:center; gap:6px; color:var(--pastel-teal-text);" onclick="App.navigateTo('overwhelmed')">
            <span>🍃</span> <strong>Overwhelmed Mode</strong>
          </button>
        </div>

        <!-- 2. Quick Stat Counters -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon tasks">✓</div>
            <div class="stat-info">
              <h3>${completedTasksToday}</h3>
              <span>Tasks Done Today</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon habits">🌱</div>
            <div class="stat-info">
              <h3>${habitPercentToday}%</h3>
              <span>Habit Completion</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon focus">⏱</div>
            <div class="stat-info">
              <h3>${focusHoursFormatted}h</h3>
              <span>Focus Logged</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon goals">🎯</div>
            <div class="stat-info">
              <h3>${activeGoals}</h3>
              <span>Active Goals</span>
            </div>
          </div>
        </div>

        <!-- 3. Motivational Quote Banner -->
        <div class="quote-card">
          <div class="quote-content">
            <blockquote>"${currentQuote.quote}"</blockquote>
            <cite>— ${currentQuote.author}</cite>
          </div>
          <button class="quote-refresh-btn" id="refresh-quote-btn" title="Next inspiring quote">↻</button>
        </div>

        <!-- 4. Two Column Operational Grid -->
        <div class="dashboard-columns">
          <!-- Left Column: Priority Tasks & Quick Habits -->
          <div style="display:flex; flex-direction:column; gap:24px;">
            <!-- Today's Priority Tasks -->
            <div class="card">
              <div class="card-header">
                <h3 class="card-title"><span>📋</span> Today's Priority Tasks</h3>
                <button class="badge badge-sage" onclick="App.navigateTo('tasks')">View All Tasks →</button>
              </div>
              <div class="mini-item-list">
                ${(state.tasks || []).length === 0 ? `
                  <div style="text-align:center; padding: 28px 16px; color: var(--text-muted); font-size: 0.9rem;">
                    <div style="font-size:2rem; margin-bottom:8px;">📋</div>
                    <p style="margin-bottom:6px; color:var(--text-main); font-weight:600; font-size:0.96rem;">What is your priority today?</p>
                    <p style="font-size:0.83rem; margin-bottom:14px; max-width:320px; margin-left:auto; margin-right:auto; line-height:1.4;">You haven't added any tasks yet. Create your first task to start organizing your day.</p>
                    <button class="btn-primary" style="font-size:0.84rem; padding:8px 18px;" onclick="Tasks.openAddTaskModal()">+ Add Your First Task</button>
                  </div>
                ` : todayTasks.length === 0 ? `
                  <div style="text-align:center; padding: 22px 16px; color: var(--text-muted); font-size: 0.88rem;">
                    No tasks scheduled for today.
                    <div style="margin-top:8px;">
                      <button class="btn-secondary" style="font-size:0.8rem; padding:5px 12px;" onclick="Tasks.openAddTaskModal()">+ Add Today's Task</button>
                    </div>
                  </div>
                ` : todayTasks.map(task => `
                  <div class="mini-task-item">
                    <div class="mini-task-left">
                      <div class="custom-checkbox ${task.completed ? 'checked' : ''}" onclick="Dashboard.toggleTask('${task.id}')">
                        ${task.completed ? '✓' : ''}
                      </div>
                      <span class="mini-task-title ${task.completed ? 'completed' : ''}">${task.title}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="badge ${task.priority === 'High' ? 'badge-rose' : task.priority === 'Medium' ? 'badge-amber' : 'badge-blue'}">${task.priority}</span>
                      <span style="font-size:0.75rem; color:var(--text-muted);">${task.dueTime}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Today's Habits Check-off -->
            <div class="card">
              <div class="card-header">
                <h3 class="card-title"><span>🌱</span> Daily Habits</h3>
                <button class="badge badge-teal" onclick="App.navigateTo('habits')">Habits Matrix →</button>
              </div>
              <div class="mini-item-list">
                ${state.habits.slice(0, 5).map(habit => {
                  const isChecked = habit.history && habit.history[todayStr];
                  return `
                    <div class="mini-habit-chip">
                      <div class="habit-chip-info">
                        <span style="font-size: 1.2rem;">${habit.icon}</span>
                        <div>
                          <div style="font-size:0.92rem; font-weight:600; color:var(--text-main);">${habit.name}</div>
                          <span style="font-size:0.75rem; color:var(--text-muted);">${habit.targetFrequency}</span>
                        </div>
                      </div>
                      <div style="display:flex; align-items:center; gap:10px;">
                        <span class="habit-streak-pill">🔥 ${habit.streak || 0} streak</span>
                        <div class="custom-checkbox ${isChecked ? 'checked' : ''}" onclick="Dashboard.toggleHabit('${habit.id}')">
                          ${isChecked ? '✓' : ''}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Right Column: Upcoming Deadlines & Goals Snapshot -->
          <div style="display:flex; flex-direction:column; gap:24px;">
            <!-- Upcoming Deadlines -->
            <div class="card">
              <div class="card-header">
                <h3 class="card-title"><span>⏳</span> Upcoming Deadlines</h3>
                <button class="badge badge-amber" onclick="App.navigateTo('calendar')">Calendar →</button>
              </div>
              <div class="mini-item-list">
                ${(state.tasks || []).length === 0 ? `
                  <div style="text-align:center; padding: 28px 16px; color: var(--text-muted); font-size: 0.88rem;">
                    <div style="font-size:2rem; margin-bottom:8px;">⏳</div>
                    <p style="margin-bottom:6px; color:var(--text-main); font-weight:600; font-size:0.96rem;">No upcoming deadlines</p>
                    <p style="font-size:0.82rem; margin-bottom:14px; max-width:300px; margin-left:auto; margin-right:auto; line-height:1.4;">Tasks with due dates will appear here automatically.</p>
                    <button class="btn-secondary" style="font-size:0.82rem; padding:6px 14px;" onclick="Tasks.openAddTaskModal()">+ Schedule A Task</button>
                  </div>
                ` : upcomingTasks.length === 0 ? `
                  <div style="text-align:center; padding: 20px; color: var(--text-muted); font-size: 0.9rem;">
                    All caught up! No pending upcoming deadlines.
                  </div>
                ` : upcomingTasks.map(t => `
                  <div class="mini-task-item">
                    <div style="display:flex; flex-direction:column; gap:2px;">
                      <div style="font-size:0.9rem; font-weight:600; color:var(--text-main);">${t.title}</div>
                      <span style="font-size:0.75rem; color:var(--text-muted);">${t.category}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px;">
                      <span class="badge ${t.dueDate === todayStr ? 'badge-rose' : 'badge-blue'}">${t.dueDate === todayStr ? 'Today' : t.dueDate}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Active Goals Progress Preview -->
            <div class="card">
              <div class="card-header">
                <h3 class="card-title"><span>🎯</span> Target Progress</h3>
                <button class="badge badge-purple" onclick="App.navigateTo('goals')">All Goals →</button>
              </div>
              <div style="display:flex; flex-direction:column; gap:16px;">
                ${state.goals.length === 0 ? `
                  <div style="text-align:center; padding: 24px 16px; color: var(--text-muted); font-size: 0.88rem;">
                    <div style="font-size:1.8rem; margin-bottom:6px;">🎯</div>
                    <p style="margin-bottom:10px;">No goals set yet. Define what you want to achieve!</p>
                    <button class="btn-primary" style="font-size:0.8rem; padding:6px 14px;" onclick="Goals.openAddGoalModal()">+ Set Your First Goal</button>
                  </div>
                ` : state.goals.slice(0, 3).map(goal => {
                  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
                  return `
                    <div style="display:flex; flex-direction:column; gap:6px;">
                      <div style="display:flex; justify-content:space-between; font-size:0.86rem; font-weight:600;">
                        <span style="color:var(--text-main);">${goal.title}</span>
                        <span style="color:var(--sage-600);">${goal.current}/${goal.target} ${goal.unit}</span>
                      </div>
                      <div class="progress-track">
                        <div class="progress-bar-fill" style="width: ${pct}%;"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Event listener for quote shuffle
    const refreshBtn = document.getElementById('refresh-quote-btn');
    if (refreshBtn) {
      refreshBtn.onclick = () => {
        quoteIndex++;
        AudioEngine.playPop();
        render();
      };
    }
  }

  function toggleTask(id) {
    AudioEngine.playPop();
    Storage.toggleTask(id);
    render();
    App.showToast('Task updated');
  }

  function toggleHabit(id) {
    const todayStr = Storage.getTodayStr();
    AudioEngine.playChime();
    Storage.toggleHabitDate(id, todayStr);
    render();
    App.showToast('Habit recorded');
  }

  return {
    render,
    toggleTask,
    toggleHabit
  };
})();

