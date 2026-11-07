/**
 * Weekly Reset Controller
 * Guided 5-question weekly reflection experience:
 * 1. Accomplishments (auto-pulled from actual completed tasks & focus hours)
 * 2. Missed items (auto-pulled from overdue tasks)
 * 3. Habit consistency & improvements
 * 4. Distractions & friction points
 * 5. Next week focus & goal commitment
 */
const WeeklyReset = (() => {
  function getWeekMetrics(state) {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      weekDates.push(`${y}-${m}-${dayNum}`);
    }

    // Completed tasks this week
    const completedTasks = (state.tasks || []).filter(t => t.completed && t.completedAt && weekDates.includes(t.completedAt));

    // Overdue/missed tasks
    const todayStr = Storage.getTodayStr();
    const missedTasks = (state.tasks || []).filter(t => !t.completed && t.dueDate < todayStr);

    // Focus hours this week
    const focusMins = (state.focusSessions || []).filter(s => weekDates.includes(s.date)).reduce((a, b) => a + (b.durationMinutes || 0), 0);

    // Habits analysis
    const habitStats = (state.habits || []).map(h => {
      let checks = 0;
      weekDates.forEach(dStr => {
        if (h.history && h.history[dStr]) checks++;
      });
      return { name: h.name, icon: h.icon, checks, rate: Math.round((checks / 7) * 100), streak: h.streak || 0 };
    });

    const topHabit = [...habitStats].sort((a, b) => b.rate - a.rate)[0];
    const lowHabit = [...habitStats].sort((a, b) => a.rate - b.rate)[0];

    return {
      completedTasks,
      missedTasks,
      focusHours: (focusMins / 60).toFixed(1),
      habitStats,
      topHabit,
      lowHabit
    };
  }

  function render() {
    const container = document.getElementById('reset-view');
    if (!container) return;
    const state = Storage.getState();
    const metrics = getWeekMetrics(state);
    const pastResets = state.weeklyResets || [];

    // Pre-filled defaults based on actual activity
    const defaultAccomplishments = metrics.completedTasks.length > 0
      ? `Completed ${metrics.completedTasks.length} tasks (including: ${metrics.completedTasks.slice(0, 3).map(t => t.title).join(', ')}) and logged ${metrics.focusHours} hours of deep focus.`
      : Number(metrics.focusHours) > 0
      ? `Logged ${metrics.focusHours} hours of focused work sprints.`
      : 'Setting intentions, establishing daily routines, and organizing workspace priorities.';

    const defaultMissed = metrics.missedTasks.length > 0
      ? `Postponed ${metrics.missedTasks.length} overdue tasks: ${metrics.missedTasks.slice(0, 2).map(t => t.title).join(', ')}.`
      : 'No overdue tasks lingering!';

    const defaultHabits = metrics.topHabit
      ? `Strongest habit: ${metrics.topHabit.icon} ${metrics.topHabit.name} (${metrics.topHabit.rate}% consistency, ${metrics.topHabit.streak}-day streak).`
      : 'Habit consistency maintained across daily practices.';

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:24px;">
        <!-- Header Banner -->
        <div class="card" style="background: linear-gradient(135deg, var(--sage-50), var(--bg-card)); border-color:var(--sage-200);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="font-size:1.4rem;">🔄</span>
                <h3 style="font-family:var(--font-serif); font-size:1.35rem; color:var(--text-main);">Weekly Reset & Reflection</h3>
              </div>
              <p style="font-size:0.88rem; color:var(--text-muted); max-width:640px;">
                Close the loop on the past 7 days, celebrate real accomplishments, clear mental baggage, and align your commitments for the week ahead.
              </p>
            </div>
            <span class="badge badge-sage">Earn +100 XP on Completion</span>
          </div>
        </div>

        <!-- Guided Reset Form -->
        <div class="card">
          <form id="weekly-reset-form" onsubmit="WeeklyReset.handleSubmit(event)">
            <div style="display:flex; flex-direction:column; gap:20px;">
              <!-- Step 1: Accomplishments -->
              <div class="form-group">
                <label style="font-family:var(--font-serif); font-size:1.05rem; color:var(--text-main); text-transform:none;">
                  1. What did I accomplish this week?
                </label>
                <div style="font-size:0.78rem; color:var(--sage-600); margin-bottom:4px;">
                  ✓ Auto-detected from your workspace: ${metrics.completedTasks.length} completed tasks, ${metrics.focusHours} focus hours
                </div>
                <textarea id="reset-accomplishments" rows="3" required>${escapeHtml(defaultAccomplishments)}</textarea>
              </div>

              <!-- Step 2: Missed Items -->
              <div class="form-group">
                <label style="font-family:var(--font-serif); font-size:1.05rem; color:var(--text-main); text-transform:none;">
                  2. What did I miss or postpone?
                </label>
                <div style="font-size:0.78rem; color:var(--pastel-rose-text); margin-bottom:4px;">
                  ⚠️ Found ${metrics.missedTasks.length} overdue tasks pending in your backlog
                </div>
                <textarea id="reset-missed" rows="2" placeholder="Tasks that slipped or habits that weren't met...">${escapeHtml(defaultMissed)}</textarea>
              </div>

              <!-- Step 3: Habits Progress -->
              <div class="form-group">
                <label style="font-family:var(--font-serif); font-size:1.05rem; color:var(--text-main); text-transform:none;">
                  3. Which habits improved or maintained consistency?
                </label>
                <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:4px;">
                  🌱 Top performer: ${metrics.topHabit ? `${metrics.topHabit.name} (${metrics.topHabit.rate}%)` : 'N/A'}
                </div>
                <textarea id="reset-habits" rows="2">${escapeHtml(defaultHabits)}</textarea>
              </div>

              <!-- Step 4: Distractions -->
              <div class="form-group">
                <label style="font-family:var(--font-serif); font-size:1.05rem; color:var(--text-main); text-transform:none;">
                  4. What distracted me or drained my energy?
                </label>
                <textarea id="reset-distractions" rows="2" placeholder="e.g., Unplanned context switching, late screen time, friction in morning routine..."></textarea>
              </div>

              <!-- Step 5: Next Week Focus -->
              <div class="form-group">
                <label style="font-family:var(--font-serif); font-size:1.05rem; color:var(--text-main); text-transform:none;">
                  5. What is my primary focus for next week?
                </label>
                <textarea id="reset-focus" rows="2" required placeholder="The single most important objective that makes next week a triumph..."></textarea>
              </div>

              <!-- Next Week Committed Tasks -->
              <div class="form-group">
                <label style="font-family:var(--font-serif); font-size:0.95rem; color:var(--text-main); text-transform:none;">
                  Key Commitments for Next Week (automatically added to Tasks):
                </label>
                <input type="text" id="reset-task-1" placeholder="Commitment 1 (e.g., Complete Chapter 5 system analysis)" style="margin-bottom:8px;" />
                <input type="text" id="reset-task-2" placeholder="Commitment 2 (e.g., Ship high-priority portfolio sprint)" />
              </div>

              <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:12px;">
                <button type="submit" class="btn-primary" style="padding:12px 28px; font-size:0.95rem;">
                  Complete Reset & Commit (+100 XP)
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Past Weekly Resets Archive -->
        <div class="card">
          <div class="card-header">
            <h4 class="card-title"><span>📜</span> Past Weekly Reset Summaries</h4>
            <span class="badge badge-sage">${pastResets.length} Resets Completed</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:14px; margin-top:8px;">
            ${pastResets.length === 0 ? `
              <div style="text-align:center; padding:24px; color:var(--text-muted);">No past weekly resets completed yet. Complete your first reset above!</div>
            ` : pastResets.map(r => `
              <div class="mini-task-item" style="padding:16px 20px; align-items:flex-start;">
                <div style="display:flex; flex-direction:column; gap:6px; flex:1;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span class="badge badge-teal">Reset • Week ${r.weekNumber || ''}</span>
                    <span style="font-size:0.8rem; color:var(--text-muted);">${r.date}</span>
                  </div>
                  <div style="font-size:0.88rem; color:var(--text-main);">
                    <strong>Accomplishments:</strong> ${escapeHtml(r.accomplishments)}
                  </div>
                  <div style="font-size:0.84rem; color:var(--sage-700);">
                    <strong>Primary Focus:</strong> ${escapeHtml(r.nextWeekFocus)}
                  </div>
                  ${r.distractions ? `
                    <div style="font-size:0.78rem; color:var(--text-muted);">
                      <em>Friction noted:</em> ${escapeHtml(r.distractions)}
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const accomplishments = document.getElementById('reset-accomplishments').value;
    const missedItems = document.getElementById('reset-missed').value;
    const improvedHabits = document.getElementById('reset-habits').value;
    const distractions = document.getElementById('reset-distractions').value;
    const nextWeekFocus = document.getElementById('reset-focus').value;

    const task1 = document.getElementById('reset-task-1') ? document.getElementById('reset-task-1').value : '';
    const task2 = document.getElementById('reset-task-2') ? document.getElementById('reset-task-2').value : '';
    const createdTasks = [task1, task2].filter(t => t.trim().length > 0);

    Storage.saveWeeklyReset({
      accomplishments,
      missedItems,
      improvedHabits,
      distractions,
      nextWeekFocus,
      createdTasks
    });

    AudioEngine.playBell();
    if (App.launchConfetti) App.launchConfetti();
    App.showToast('🎉 Weekly Reset Completed! +100 XP awarded.');
    render();
    if (Tasks && Tasks.render) Tasks.render();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return {
    render,
    handleSubmit
  };
})();

