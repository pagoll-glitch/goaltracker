/**
 * Habit Tracker Controller
 * Handles 7-day weekly matrix, streak calculation, monthly consistency,
 * colorful completion charts, and habits CRUD.
 */
const Habits = (() => {
  // Helper to get array of dates for current week (Monday to Sunday)
  function getCurrentWeekDates() {
    const now = new Date();
    const day = now.getDay();
    // Monday as start of week: day 1 is Monday, day 0 is Sunday
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const week = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;

      week.push({
        name: dayNames[i],
        dayNum: d.getDate(),
        dateStr: dateStr,
        isToday: dateStr === Storage.getTodayStr()
      });
    }
    return week;
  }

  function render() {
    const container = document.getElementById('habits-view');
    if (!container) return;
    const state = Storage.getState();
    const habits = state.habits || [];
    const weekDates = getCurrentWeekDates();
    const todayStr = Storage.getTodayStr();

    // Calculate weekly completion totals
    let totalExpectedChecks = habits.length * 7;
    let actualChecks = 0;
    habits.forEach(h => {
      if (h.history) {
        weekDates.forEach(w => {
          if (h.history[w.dateStr]) actualChecks++;
        });
      }
    });

    const weeklyConsistency = totalExpectedChecks > 0
      ? Math.round((actualChecks / totalExpectedChecks) * 100)
      : 0;

    // Find habit with highest streak
    const topStreakHabit = habits.length > 0
      ? [...habits].sort((a, b) => (b.streak || 0) - (a.streak || 0))[0]
      : null;

    container.innerHTML = `
      <!-- Habits Summary Overview -->
      <div class="habits-summary-row">
        <div class="card" style="display:flex; align-items:center; justify-content:space-between; gap:20px;">
          <div>
            <div style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); font-weight:600; letter-spacing:0.04em;">Weekly Consistency Rate</div>
            <div style="font-family:var(--font-serif); font-size:2.2rem; font-weight:700; color:var(--text-main); margin:4px 0;">
              ${weeklyConsistency}%
            </div>
            <p style="font-size:0.84rem; color:var(--text-muted);">
              ${actualChecks} completed checks out of ${totalExpectedChecks} across ${habits.length} daily habits this week.
            </p>
          </div>
          <div style="min-width: 140px; display:flex; flex-direction:column; gap:6px;">
            <div class="progress-track" style="height:12px;">
              <div class="progress-bar-fill" style="width: ${weeklyConsistency}%;"></div>
            </div>
            <span style="font-size:0.75rem; color:var(--sage-600); font-weight:600; text-align:right;">Weekly Target: 80%</span>
          </div>
        </div>

        <div class="card" style="display:flex; align-items:center; gap:16px;">
          <div style="font-size:2.4rem;">🔥</div>
          <div>
            <div style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); font-weight:600;">Current Streak Champion</div>
            <div style="font-size:1.15rem; font-weight:700; color:var(--text-main); line-height:1.2;">
              ${topStreakHabit ? topStreakHabit.name : 'No active streak'}
            </div>
            <span class="habit-streak-pill" style="margin-top:4px; display:inline-block;">
              ${topStreakHabit ? `${topStreakHabit.streak || 0} consecutive days` : 'Start today'}
            </span>
          </div>
        </div>
      </div>

      <!-- Habits Weekly Matrix Table Card -->
      <div class="habit-matrix-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <div>
            <h3 class="card-title"><span>📅</span> Weekly Habit Matrix</h3>
            <p style="font-size:0.82rem; color:var(--text-muted); margin-top:2px;">Track and check off your daily practices for the week.</p>
          </div>
          <button class="btn-primary" onclick="Habits.openAddHabitModal()">+ New Habit</button>
        </div>

        <table class="habit-table">
          <thead>
            <tr>
              <th class="habit-name-col">Habit</th>
              ${weekDates.map(w => `
                <th>
                  <div>${w.name}</div>
                  <div style="font-size:0.85rem; color:${w.isToday ? 'var(--sage-600)' : 'var(--text-main)'}; font-weight:${w.isToday ? '700' : '500'};">
                    ${w.dayNum} ${w.isToday ? '•' : ''}
                  </div>
                </th>
              `).join('')}
              <th>Streak</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${habits.map(habit => {
              return `
                <tr class="habit-row">
                  <td>
                    <div class="habit-info-cell">
                      <div class="habit-icon">${habit.icon || '🌱'}</div>
                      <div class="habit-name-details">
                        <h4>${escapeHtml(habit.name)}</h4>
                        <span>${habit.category} • ${habit.targetFrequency}</span>
                      </div>
                    </div>
                  </td>
                  ${weekDates.map(w => {
                    const checked = habit.history && habit.history[w.dateStr];
                    return `
                      <td>
                        <button class="day-circle-btn ${checked ? 'checked' : ''} ${w.isToday ? 'is-today' : ''}"
                          onclick="Habits.toggleHabit('${habit.id}', '${w.dateStr}')"
                          title="${checked ? 'Completed' : 'Not completed'} on ${w.dateStr}">
                          ${checked ? '✓' : ''}
                        </button>
                      </td>
                    `;
                  }).join('')}
                  <td>
                    <span class="habit-streak-pill">🔥 ${habit.streak || 0}</span>
                  </td>
                  <td>
                    <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
                      <button class="action-icon-btn" onclick="Habits.openEditHabitModal('${habit.id}')" title="Edit">✎</button>
                      <button class="action-icon-btn delete" onclick="Habits.deleteHabit('${habit.id}')" title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Consistency Heatmap Grid -->
      <div class="card" style="margin-top: 24px;">
        <div class="card-header">
          <h3 class="card-title"><span>📊</span> 30-Day Consistency Overview</h3>
          <span style="font-size:0.8rem; color:var(--text-muted);">Each dot represents daily aggregate habit completion</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:8px; padding:12px 0;">
          ${renderPastDaysHeatmap(habits)}
        </div>
      </div>
    `;
  }

  function renderPastDaysHeatmap(habits) {
    const days = [];
    const totalHabits = Math.max(1, habits.length);

    for (let i = 29; i >= 0; i--) {
      const dateStr = Storage.getPastStr(i);
      let count = 0;
      habits.forEach(h => {
        if (h.history && h.history[dateStr]) count++;
      });
      const ratio = count / totalHabits;
      let bg = 'var(--bg-card-subtle)';
      let border = 'var(--border-light)';
      if (ratio > 0.75) {
        bg = 'var(--sage-500)';
        border = 'var(--sage-600)';
      } else if (ratio > 0.4) {
        bg = 'var(--sage-300)';
        border = 'var(--sage-500)';
      } else if (ratio > 0) {
        bg = 'var(--sage-100)';
        border = 'var(--sage-200)';
      }

      days.push(`
        <div style="width:28px; height:28px; border-radius:6px; background-color:${bg}; border:1px solid ${border}; display:flex; align-items:center; justify-content:center; font-size:0.7rem; color: ${ratio > 0.4 ? 'white' : 'var(--text-muted)'};"
          title="${dateStr}: ${count}/${totalHabits} completed">
          ${new Date(dateStr).getDate()}
        </div>
      `);
    }
    return days.join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toggleHabit(id, dateStr) {
    AudioEngine.playChime();
    Storage.toggleHabitDate(id, dateStr);
    render();
    Dashboard.render();
    App.showToast('Habit recorded');
  }

  function deleteHabit(id) {
    if (confirm('Delete this habit and all its history?')) {
      Storage.deleteHabit(id);
      render();
      Dashboard.render();
      App.showToast('Habit removed');
    }
  }

  function openAddHabitModal() {
    App.showModal('Create Daily Habit', `
      <form id="add-habit-form" onsubmit="Habits.handleCreateHabit(event)">
        <div class="form-group">
          <label>Habit Name *</label>
          <input type="text" id="habit-name-input" required placeholder="e.g., Read 10 pages, Meditate, Drink water" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Icon Emoji</label>
            <input type="text" id="habit-icon-input" value="📖" maxlength="3" style="text-align:center; font-size:1.3rem;" />
          </div>
          <div class="form-group">
            <label>Category</label>
            <select id="habit-cat-input">
              <option value="Health">Health</option>
              <option value="Study">Study</option>
              <option value="Work">Work</option>
              <option value="Mindfulness">Mindfulness</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Frequency</label>
            <select id="habit-freq-input">
              <option value="Daily">Daily</option>
              <option value="Weekdays">Weekdays</option>
              <option value="Weekends">Weekends</option>
            </select>
          </div>
          <div class="form-group">
            <label>Color Theme</label>
            <select id="habit-color-input">
              <option value="teal">Mint Teal</option>
              <option value="rose">Soft Rose</option>
              <option value="blue">Sky Blue</option>
              <option value="amber">Warm Amber</option>
              <option value="purple">Lilac Purple</option>
            </select>
          </div>
        </div>
        <div class="modal-footer" style="margin-top: 16px; padding: 16px 0 0;">
          <button type="button" class="btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn-primary">Create Habit</button>
        </div>
      </form>
    `);
  }

  function handleCreateHabit(e) {
    e.preventDefault();
    const name = document.getElementById('habit-name-input').value.trim();
    if (!name) return;

    Storage.addHabit({
      name,
      icon: document.getElementById('habit-icon-input').value || '🌱',
      category: document.getElementById('habit-cat-input').value,
      targetFrequency: document.getElementById('habit-freq-input').value,
      color: document.getElementById('habit-color-input').value
    });

    AudioEngine.playPop();
    App.closeModal();
    render();
    Dashboard.render();
    App.showToast('New habit created');
  }

  function openEditHabitModal(id) {
    const state = Storage.getState();
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;

    App.showModal('Edit Habit', `
      <form id="edit-habit-form" onsubmit="Habits.handleEditHabit(event, '${id}')">
        <div class="form-group">
          <label>Habit Name *</label>
          <input type="text" id="habit-edit-name" required value="${escapeHtml(habit.name)}" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Icon Emoji</label>
            <input type="text" id="habit-edit-icon" value="${habit.icon || '🌱'}" maxlength="3" style="text-align:center; font-size:1.3rem;" />
          </div>
          <div class="form-group">
            <label>Category</label>
            <select id="habit-edit-cat">
              <option value="Health" ${habit.category === 'Health' ? 'selected' : ''}>Health</option>
              <option value="Study" ${habit.category === 'Study' ? 'selected' : ''}>Study</option>
              <option value="Work" ${habit.category === 'Work' ? 'selected' : ''}>Work</option>
              <option value="Mindfulness" ${habit.category === 'Mindfulness' ? 'selected' : ''}>Mindfulness</option>
              <option value="Personal" ${habit.category === 'Personal' ? 'selected' : ''}>Personal</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Frequency</label>
          <select id="habit-edit-freq">
            <option value="Daily" ${habit.targetFrequency === 'Daily' ? 'selected' : ''}>Daily</option>
            <option value="Weekdays" ${habit.targetFrequency === 'Weekdays' ? 'selected' : ''}>Weekdays</option>
            <option value="Weekends" ${habit.targetFrequency === 'Weekends' ? 'selected' : ''}>Weekends</option>
          </select>
        </div>
        <div class="modal-footer" style="margin-top: 16px; padding: 16px 0 0;">
          <button type="button" class="btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn-primary">Save Changes</button>
        </div>
      </form>
    `);
  }

  function handleEditHabit(e, id) {
    e.preventDefault();
    Storage.updateHabit(id, {
      name: document.getElementById('habit-edit-name').value.trim(),
      icon: document.getElementById('habit-edit-icon').value,
      category: document.getElementById('habit-edit-cat').value,
      targetFrequency: document.getElementById('habit-edit-freq').value
    });

    AudioEngine.playPop();
    App.closeModal();
    render();
    Dashboard.render();
    App.showToast('Habit updated');
  }

  return {
    render,
    toggleHabit,
    deleteHabit,
    openAddHabitModal,
    handleCreateHabit,
    openEditHabitModal,
    handleEditHabit
  };
})();

