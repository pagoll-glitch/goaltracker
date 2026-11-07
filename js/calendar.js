/**
 * Calendar & Daily Planner Controller
 * Monthly grid, Weekly planner, and Daily hourly time-blocking schedule.
 * Integrates scheduled events with due tasks.
 */
const Calendar = (() => {
  let viewMode = 'month'; // 'month', 'week', 'day'
  let currentDisplayDate = new Date(); // anchor date

  function render() {
    const container = document.getElementById('calendar-view');
    if (!container) return;
    const state = Storage.getState();

    container.innerHTML = `
      <div class="calendar-layout">
        <!-- Main Calendar Area -->
        <div class="calendar-main-card">
          <div class="calendar-nav-bar">
            <h3 class="calendar-month-title">${formatMonthTitle(currentDisplayDate)}</h3>
            <div class="calendar-nav-actions">
              <div class="filter-pills" style="margin-right:12px;">
                <button class="filter-pill ${viewMode === 'month' ? 'active' : ''}" onclick="Calendar.setViewMode('month')">Month</button>
                <button class="filter-pill ${viewMode === 'week' ? 'active' : ''}" onclick="Calendar.setViewMode('week')">Week</button>
                <button class="filter-pill ${viewMode === 'day' ? 'active' : ''}" onclick="Calendar.setViewMode('day')">Day</button>
              </div>
              <button class="action-icon-btn" onclick="Calendar.navigateTime(-1)">‹</button>
              <button class="btn-secondary" style="padding:6px 12px; font-size:0.8rem;" onclick="Calendar.jumpToToday()">Today</button>
              <button class="action-icon-btn" onclick="Calendar.navigateTime(1)">›</button>
              <button class="btn-primary" style="margin-left:8px;" onclick="Calendar.openAddEventModal()">+ Event</button>
            </div>
          </div>

          <!-- Dynamic View: Month vs Week vs Day -->
          ${viewMode === 'month' ? renderMonthView(state) : viewMode === 'week' ? renderWeekView(state) : renderDayView(state)}
        </div>

        <!-- Sidebar: Today's Schedule & Reminders -->
        <div style="display:flex; flex-direction:column; gap:20px;">
          <!-- Upcoming Reminders -->
          <div class="card">
            <div class="card-header">
              <h4 class="card-title"><span>⏰</span> Reminders & Events</h4>
            </div>
            <div class="mini-item-list">
              ${(state.calendarEvents || []).length === 0 ? `
                <div style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:20px 12px;">
                  <p style="margin-bottom:8px;">No upcoming scheduled events</p>
                  <button class="btn-secondary" style="font-size:0.78rem; padding:4px 10px;" onclick="Calendar.openAddEventModal()">+ Add Event</button>
                </div>
              ` : (state.calendarEvents || []).slice(0, 4).map(e => `
                <div class="mini-task-item">
                  <div style="display:flex; flex-direction:column; gap:2px;">
                    <div style="font-size:0.88rem; font-weight:600; color:var(--text-main);">${escapeHtml(e.title)}</div>
                    <span style="font-size:0.75rem; color:var(--text-muted);">${e.date} • ${e.startTime} - ${e.endTime}</span>
                  </div>
                  <button class="action-icon-btn delete" onclick="Calendar.deleteEvent('${e.id}')" title="Delete">🗑</button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Quick Tip -->
          <div class="card" style="background-color:var(--sage-50); border-color:var(--sage-200);">
            <h4 style="font-family:var(--font-serif); font-size:1rem; color:var(--text-main); margin-bottom:6px;">Time Blocking Tip</h4>
            <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.45;">
              Protect your highest energy window (typically morning 9 AM - 12 PM) for deep focus tasks, and reserve afternoons for coordination and review.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  function formatMonthTitle(date) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function renderMonthView(state) {
    const year = currentDisplayDate.getFullYear();
    const month = currentDisplayDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const dayShift = firstDay === 0 ? 6 : firstDay - 1; // Mon as 0
    const cells = [];
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Header Row
    const headerRow = weekdays.map(w => `<div class="weekday-header">${w}</div>`).join('');

    // Previous month filler days
    for (let i = dayShift - 1; i >= 0; i--) {
      cells.push(`
        <div class="calendar-day-cell other-month">
          <span class="cell-day-num">${daysInPrevMonth - i}</span>
        </div>
      `);
    }

    const todayStr = Storage.getTodayStr();

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;
      const isToday = dateStr === todayStr;

      // Find events & tasks for this date
      const events = (state.calendarEvents || []).filter(e => e.date === dateStr);
      const tasks = (state.tasks || []).filter(t => t.dueDate === dateStr);

      cells.push(`
        <div class="calendar-day-cell ${isToday ? 'today' : ''}" onclick="Calendar.selectDay('${dateStr}')">
          <span class="cell-day-num">${day}</span>
          ${events.map(ev => `
            <div class="calendar-event-tag badge-amber" title="${escapeHtml(ev.title)}">
              ${ev.startTime} ${escapeHtml(ev.title)}
            </div>
          `).join('')}
          ${tasks.map(t => `
            <div class="calendar-event-tag ${t.completed ? 'badge-sage' : 'badge-rose'}" title="Task: ${escapeHtml(t.title)}">
              ${t.completed ? '✓' : '•'} ${escapeHtml(t.title)}
            </div>
          `).join('')}
        </div>
      `);
    }

    // Trailing days
    const totalRendered = cells.length;
    const remaining = 35 - totalRendered > 0 ? 35 - totalRendered : (42 - totalRendered);
    for (let i = 1; i <= remaining; i++) {
      cells.push(`
        <div class="calendar-day-cell other-month">
          <span class="cell-day-num">${i}</span>
        </div>
      `);
    }

    return `
      <div class="month-grid">
        ${headerRow}
        ${cells.join('')}
      </div>
    `;
  }

  function renderWeekView(state) {
    const today = new Date(currentDisplayDate);
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const columns = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;
      const isToday = dateStr === Storage.getTodayStr();

      const events = (state.calendarEvents || []).filter(e => e.date === dateStr);
      const tasks = (state.tasks || []).filter(t => t.dueDate === dateStr);

      columns.push(`
        <div class="kanban-column" style="background-color:var(--bg-card); min-height:420px;">
          <div class="kanban-col-header" style="text-align:center; display:block;">
            <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted);">${weekdays[i]}</div>
            <div style="font-family:var(--font-serif); font-size:1.2rem; font-weight:700; color:${isToday ? 'var(--sage-600)' : 'var(--text-main)'};">
              ${d.getDate()}
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
            ${events.map(e => `
              <div class="calendar-event-tag badge-teal" style="padding:6px 8px; white-space:normal;">
                <strong>${e.startTime}</strong> ${escapeHtml(e.title)}
              </div>
            `).join('')}
            ${tasks.map(t => `
              <div class="calendar-event-tag ${t.completed ? 'badge-sage' : 'badge-blue'}" style="padding:6px 8px; white-space:normal;">
                ${t.completed ? '✓' : '•'} ${escapeHtml(t.title)}
              </div>
            `).join('')}
          </div>
        </div>
      `);
    }

    return `
      <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:8px; overflow-x:auto;">
        ${columns.join('')}
      </div>
    `;
  }

  function renderDayView(state) {
    const y = currentDisplayDate.getFullYear();
    const m = String(currentDisplayDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDisplayDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const events = (state.calendarEvents || []).filter(e => e.date === dateStr);
    const tasks = (state.tasks || []).filter(t => t.dueDate === dateStr);

    const hours = [
      '07:00', '08:00', '09:00', '10:00', '11:00',
      '12:00', '13:00', '14:00', '15:00', '16:00',
      '17:00', '18:00', '19:00', '20:00', '21:00'
    ];

    return `
      <div class="timeline-schedule">
        <div style="padding-bottom:12px; font-weight:600; color:var(--sage-700);">
          Daily Plan for ${currentDisplayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        ${hours.map(h => {
          const matchedEvent = events.find(e => (e.startTime || '').startsWith(h.slice(0, 2)));
          const matchedTask = tasks.find(t => (t.dueTime || '').startsWith(h.slice(0, 2)));

          return `
            <div class="timeline-hour-slot">
              <span class="timeline-time">${h}</span>
              <div>
                ${matchedEvent ? `
                  <div class="timeline-event-card" style="border-left-color: var(--pastel-teal-text);">
                    <div style="font-weight:600; font-size:0.9rem;">${escapeHtml(matchedEvent.title)}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${matchedEvent.startTime} - ${matchedEvent.endTime} • ${matchedEvent.category}</div>
                  </div>
                ` : ''}
                ${matchedTask ? `
                  <div class="timeline-event-card" style="margin-top:6px; border-left-color: var(--sage-500);">
                    <div style="font-weight:600; font-size:0.9rem;">${matchedTask.completed ? '✓ ' : ''}${escapeHtml(matchedTask.title)}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${matchedTask.priority} Priority Task</div>
                  </div>
                ` : ''}
                ${!matchedEvent && !matchedTask ? `
                  <div style="font-size:0.76rem; color:var(--text-subtle); padding-top:4px;">Available block</div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function setViewMode(mode) {
    viewMode = mode;
    render();
  }

  function navigateTime(direction) {
    if (viewMode === 'month') {
      currentDisplayDate.setMonth(currentDisplayDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      currentDisplayDate.setDate(currentDisplayDate.getDate() + (direction * 7));
    } else {
      currentDisplayDate.setDate(currentDisplayDate.getDate() + direction);
    }
    render();
  }

  function jumpToToday() {
    currentDisplayDate = new Date();
    render();
  }

  function selectDay(dateStr) {
    const parts = dateStr.split('-');
    currentDisplayDate = new Date(parts[0], parts[1] - 1, parts[2]);
    viewMode = 'day';
    render();
  }

  function deleteEvent(id) {
    if (confirm('Delete this event?')) {
      Storage.deleteCalendarEvent(id);
      render();
      App.showToast('Event deleted');
    }
  }

  function openAddEventModal() {
    App.showModal('Schedule Calendar Event', `
      <form id="add-event-form" onsubmit="Calendar.handleCreateEvent(event)">
        <div class="form-group">
          <label>Event Title *</label>
          <input type="text" id="event-title-input" required placeholder="e.g., Deep Focus Coding Session, Team Sync" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date</label>
            <input type="date" id="event-date-input" value="${Storage.getTodayStr()}" required />
          </div>
          <div class="form-group">
            <label>Category</label>
            <select id="event-cat-input">
              <option value="Work">Work</option>
              <option value="Study">Study</option>
              <option value="Personal">Personal</option>
              <option value="Health">Health</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Start Time</label>
            <input type="time" id="event-start-input" value="10:00" required />
          </div>
          <div class="form-group">
            <label>End Time</label>
            <input type="time" id="event-end-input" value="11:00" required />
          </div>
        </div>
        <div class="form-group">
          <label>Description / Notes</label>
          <textarea id="event-desc-input" rows="2" placeholder="Agendas, zoom links, objectives..."></textarea>
        </div>
        <div class="modal-footer" style="margin-top: 16px; padding: 16px 0 0;">
          <button type="button" class="btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn-primary">Schedule Event</button>
        </div>
      </form>
    `);
  }

  function handleCreateEvent(e) {
    e.preventDefault();
    const title = document.getElementById('event-title-input').value.trim();
    if (!title) return;

    Storage.addCalendarEvent({
      title,
      date: document.getElementById('event-date-input').value,
      category: document.getElementById('event-cat-input').value,
      startTime: document.getElementById('event-start-input').value,
      endTime: document.getElementById('event-end-input').value,
      description: document.getElementById('event-desc-input').value
    });

    AudioEngine.playPop();
    App.closeModal();
    render();
    App.showToast('Event scheduled');
  }

  return {
    render,
    setViewMode,
    navigateTime,
    jumpToToday,
    selectDay,
    deleteEvent,
    openAddEventModal,
    handleCreateEvent
  };
})();

