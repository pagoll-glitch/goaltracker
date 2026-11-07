/**
 * Progress & Analytics Controller
 * Generates custom SVG and Canvas charts for productivity trends,
 * habit completion rates, focus time allocation, and goal statistics.
 */
const Analytics = (() => {
  function render() {
    const container = document.getElementById('analytics-view');
    if (!container) return;
    const state = Storage.getState();

    // 1. Weekly Productivity Scores (Last 7 days)
    const weekScores = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const dateStr = Storage.getPastStr(i);
      const d = new Date(dateStr);
      const name = dayNames[d.getDay()];

      // Compute score estimation for that day
      const tasksOnDay = state.tasks.filter(t => t.dueDate === dateStr);
      const completedTasks = tasksOnDay.filter(t => t.completed).length;
      const taskRatio = tasksOnDay.length > 0 ? (completedTasks / tasksOnDay.length) : 0;

      let habitCount = 0;
      state.habits.forEach(h => {
        if (h.history && h.history[dateStr]) habitCount++;
      });
      const habitRatio = state.habits.length > 0 ? habitCount / state.habits.length : 0;

      const score = Math.min(100, Math.round((taskRatio * 50) + (habitRatio * 50)));
      weekScores.push({ dateStr, name, score });
    }

    // 2. Focus Time breakdown by Tag
    const tagMinutes = {};
    (state.focusSessions || []).forEach(s => {
      tagMinutes[s.tag] = (tagMinutes[s.tag] || 0) + (s.durationMinutes || 0);
    });
    const totalFocusAll = Object.values(tagMinutes).reduce((a, b) => a + b, 0);

    // 3. Goal Progress Snapshot
    const goals = state.goals || [];
    const avgGoalProgress = goals.length > 0
      ? Math.round(goals.reduce((acc, g) => acc + Math.min(100, (g.current / g.target) * 100), 0) / goals.length)
      : 0;

    // 4. Task Breakdown
    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    container.innerHTML = `
      <div class="analytics-grid">
        <!-- 1. Weekly Productivity Score Trend Chart -->
        <div class="chart-card">
          <div class="card-header">
            <h3 class="card-title"><span>📈</span> 7-Day Productivity Trend</h3>
            <span class="badge badge-sage">Weekly Avg: ${Math.round(weekScores.reduce((a, b) => a + b.score, 0) / 7)}%</span>
          </div>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:12px;">Daily composite score based on tasks, habits, and focus hours.</p>

          <div class="chart-container">
            <div class="bar-chart-wrap">
              ${weekScores.map(w => `
                <div class="bar-col">
                  <span style="font-size:0.7rem; font-weight:700; color:var(--text-muted);">${w.score}%</span>
                  <div class="bar-track">
                    <div class="bar-fill" style="height: ${w.score}%;"></div>
                  </div>
                  <span class="bar-label">${w.name}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- 2. Focus Time Allocation by Tag -->
        <div class="chart-card">
          <div class="card-header">
            <h3 class="card-title"><span>⏱</span> Focus Time Distribution</h3>
            <span class="badge badge-amber">${(totalFocusAll / 60).toFixed(1)} Total Hours</span>
          </div>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:12px;">Distribution of deep work sprints across skill development and projects.</p>

          ${totalFocusAll === 0 ? `
            <div style="text-align:center; padding:36px 16px; color:var(--text-muted); font-size:0.88rem;">
              <div style="font-size:2rem; margin-bottom:8px;">⏱</div>
              <p style="margin-bottom:12px;">No focus sprints logged yet. Use the Pomodoro timer to record deep work.</p>
              <button class="btn-primary" style="font-size:0.82rem; padding:6px 14px;" onclick="App.navigateTo('focus')">Go to Focus Timer →</button>
            </div>
          ` : `
            <div class="donut-layout">
              <!-- Donut SVG -->
              <div style="position:relative; width:160px; height:160px;">
                ${renderDonutSvg(tagMinutes, totalFocusAll)}
                <div style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                  <span style="font-family:var(--font-serif); font-size:1.4rem; font-weight:700; color:var(--text-main);">${Math.round(totalFocusAll)}</span>
                  <span style="font-size:0.7rem; text-transform:uppercase; color:var(--text-muted);">Minutes</span>
                </div>
              </div>

              <!-- Legend -->
              <div class="donut-legend">
                ${Object.keys(tagMinutes).map((tag, idx) => {
                  const mins = tagMinutes[tag];
                  const pct = Math.round((mins / totalFocusAll) * 100);
                  const colors = ['#4D6B53', '#B83050', '#216298', '#AA6507', '#663AC4'];
                  return `
                    <div class="legend-item">
                      <span class="legend-dot" style="background-color: ${colors[idx % colors.length]};"></span>
                      <span style="font-weight:600; font-size:0.84rem;">${tag}</span>
                      <span style="color:var(--text-muted); font-size:0.78rem;">(${pct}%)</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `}
        </div>

        <!-- 3. Habits Consistency Breakdown -->
        <div class="chart-card">
          <div class="card-header">
            <h3 class="card-title"><span>🌱</span> Habit Consistency Breakdown</h3>
            <span class="badge badge-teal">${state.habits.length} Active Habits</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:14px; margin-top:8px;">
            ${state.habits.map(h => {
              // Calculate 7-day rate
              let checks = 0;
              for (let i = 0; i < 7; i++) {
                if (h.history && h.history[Storage.getPastStr(i)]) checks++;
              }
              const pct = Math.round((checks / 7) * 100);
              return `
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <div style="display:flex; justify-content:space-between; font-size:0.86rem; font-weight:600;">
                    <span>${h.icon} ${escapeHtml(h.name)}</span>
                    <span style="color:var(--sage-700);">${pct}% (${checks}/7 days)</span>
                  </div>
                  <div class="progress-track" style="height:8px;">
                    <div class="progress-bar-fill" style="width: ${pct}%;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 4. Goal Completion Progress Overview -->
        <div class="chart-card">
          <div class="card-header">
            <h3 class="card-title"><span>🎯</span> Long-Term Goal Progress</h3>
            <span class="badge badge-purple">Average: ${avgGoalProgress}%</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:14px; margin-top:8px;">
            ${goals.length === 0 ? `
              <div style="text-align:center; padding:28px 16px; color:var(--text-muted); font-size:0.86rem;">
                No goals defined yet. Head to Goals to set your targets!
              </div>
            ` : goals.map(g => {
              const pct = Math.min(100, Math.round((g.current / g.target) * 100));
              return `
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <div style="display:flex; justify-content:space-between; font-size:0.86rem; font-weight:600;">
                    <span>${escapeHtml(g.title)}</span>
                    <span style="color:var(--text-muted);">${pct}%</span>
                  </div>
                  <div class="progress-track" style="height:8px;">
                    <div class="progress-bar-fill" style="width: ${pct}%; background: var(--pastel-purple-text);"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderDonutSvg(tagMinutes, total) {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const colors = ['#4D6B53', '#B83050', '#216298', '#AA6507', '#663AC4'];
    let accumulatedOffset = 0;

    const circles = Object.keys(tagMinutes).map((tag, idx) => {
      const val = tagMinutes[tag];
      const ratio = val / total;
      const strokeLength = ratio * circumference;
      const circleSvg = `
        <circle cx="80" cy="80" r="${radius}"
          fill="transparent"
          stroke="${colors[idx % colors.length]}"
          stroke-width="18"
          stroke-dasharray="${strokeLength} ${circumference - strokeLength}"
          stroke-dashoffset="${-accumulatedOffset}"
        />
      `;
      accumulatedOffset += strokeLength;
      return circleSvg;
    });

    return `
      <svg width="160" height="160" viewBox="0 0 160 160" style="transform: rotate(-90deg);">
        ${circles.join('')}
      </svg>
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

