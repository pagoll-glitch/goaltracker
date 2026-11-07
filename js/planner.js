/**
 * Smart Daily Planner Controller
 * Deterministic Algorithmic Scheduling Engine
 * Evaluates pending tasks, deadline urgency, priority weights, and active goals
 * to build an optimized daily schedule fitting within user-specified hours.
 */
const SmartPlanner = (() => {
  let availableHours = 6;
  let startTime = '09:00';
  let includeHabits = true;
  let includeFocus = true;

  // Real deterministic scoring algorithm for tasks
  function scoreTask(task, todayStr, tomorrowStr, goals) {
    let score = 0;
    let reasons = [];

    // 1. Deadline Urgency
    if (task.dueDate < todayStr) {
      score += 60;
      reasons.push('Overdue deadline');
    } else if (task.dueDate === todayStr) {
      score += 45;
      reasons.push('Due today');
    } else if (task.dueDate === tomorrowStr) {
      score += 20;
      reasons.push('Due tomorrow');
    }

    // 2. Priority Weight
    if (task.priority === 'High') {
      score += 40;
      reasons.push('High priority');
    } else if (task.priority === 'Medium') {
      score += 25;
      reasons.push('Medium priority');
    } else {
      score += 10;
      reasons.push('Low priority');
    }

    // 3. Goal Alignment
    const relatedGoal = goals.find(g =>
      (task.category && g.category && task.category.toLowerCase() === g.category.toLowerCase()) ||
      (task.title && g.title && task.title.toLowerCase().includes(g.title.toLowerCase().split(' ')[0]))
    );
    if (relatedGoal) {
      score += 20;
      reasons.push(`Directly advances goal: "${relatedGoal.title}"`);
    }

    return { score, reasons };
  }

  // Generates timeline slots based on available hours
  function generateSchedule() {
    const state = Storage.getState();
    const todayStr = Storage.getTodayStr();
    const tomorrowStr = Storage.getFutureStr(1);
    const goals = state.goals || [];
    const pendingTasks = (state.tasks || []).filter(t => !t.completed);

    // Score all pending tasks
    const scoredTasks = pendingTasks.map(t => {
      const { score, reasons } = scoreTask(t, todayStr, tomorrowStr, goals);
      return { task: t, score, reasons };
    }).sort((a, b) => b.score - a.score);

    const totalMinutesAvailable = Math.round(availableHours * 60);
    let minutesAllocated = 0;
    const schedule = [];

    // Helper for formatting HH:MM
    let [currH, currM] = startTime.split(':').map(Number);
    function formatTime(h, m) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    function addMinutes(h, m, mins) {
      let totalM = h * 60 + m + mins;
      let newH = Math.floor(totalM / 60) % 24;
      let newM = totalM % 60;
      return [newH, newM];
    }

    // 1. Morning Kickoff / Daily Habit review block (if enabled)
    if (includeHabits && minutesAllocated + 20 <= totalMinutesAvailable) {
      const habitsDue = (state.habits || []).filter(h => !h.history || !h.history[todayStr]);
      if (habitsDue.length > 0) {
        const [nextH, nextM] = addMinutes(currH, currM, 20);
        schedule.push({
          id: 'slot-h-1',
          type: 'habit',
          title: `Daily Habit Sprint (${habitsDue.slice(0, 3).map(h => h.name).join(', ')})`,
          startTime: formatTime(currH, currM),
          endTime: formatTime(nextH, nextM),
          durationMinutes: 20,
          category: 'Health',
          priority: 'Medium',
          reason: 'Early morning momentum building with consistent daily practices',
          status: 'suggested'
        });
        [currH, currM] = [nextH, nextM];
        minutesAllocated += 20;
      }
    }

    // 2. High & Medium Priority Tasks allocation with realistic intervals
    for (const item of scoredTasks) {
      if (minutesAllocated >= totalMinutesAvailable) break;

      const duration = item.task.priority === 'High' ? 50 : 35;
      if (minutesAllocated + duration > totalMinutesAvailable) {
        const remaining = totalMinutesAvailable - minutesAllocated;
        if (remaining >= 20) {
          const [nextH, nextM] = addMinutes(currH, currM, remaining);
          schedule.push({
            id: 'slot-' + item.task.id,
            taskId: item.task.id,
            type: 'task',
            title: item.task.title,
            startTime: formatTime(currH, currM),
            endTime: formatTime(nextH, nextM),
            durationMinutes: remaining,
            category: item.task.category,
            priority: item.task.priority,
            reason: item.reasons.join(' • '),
            status: 'suggested'
          });
          minutesAllocated += remaining;
        }
        break;
      }

      const [nextH, nextM] = addMinutes(currH, currM, duration);
      schedule.push({
        id: 'slot-' + item.task.id,
        taskId: item.task.id,
        type: 'task',
        title: item.task.title,
        startTime: formatTime(currH, currM),
        endTime: formatTime(nextH, nextM),
        durationMinutes: duration,
        category: item.task.category,
        priority: item.task.priority,
        reason: item.reasons.join(' • '),
        status: 'suggested'
      });
      [currH, currM] = [nextH, nextM];
      minutesAllocated += duration;

      // Add a 10-minute rest / buffer after 45+ minute blocks if time permits
      if (duration >= 45 && minutesAllocated + 10 <= totalMinutesAvailable) {
        const [breakH, breakM] = addMinutes(currH, currM, 10);
        schedule.push({
          id: 'slot-break-' + Date.now() + Math.random(),
          type: 'break',
          title: 'Mindful Buffer & Rest',
          startTime: formatTime(currH, currM),
          endTime: formatTime(breakH, breakM),
          durationMinutes: 10,
          category: 'Health',
          priority: 'Low',
          reason: 'Cognitive recharge window prevents mental fatigue and preserves focus flow',
          status: 'suggested'
        });
        [currH, currM] = [breakH, breakM];
        minutesAllocated += 10;
      }
    }

    // 3. Deep Focus Block (if enabled and space remains)
    if (includeFocus && minutesAllocated + 30 <= totalMinutesAvailable) {
      const remainingFocus = Math.min(50, totalMinutesAvailable - minutesAllocated);
      const [nextH, nextM] = addMinutes(currH, currM, remainingFocus);
      schedule.push({
        id: 'slot-focus-' + Date.now(),
        type: 'focus',
        title: 'Deep Focus Sprint: Core Architecture & Projects',
        startTime: formatTime(currH, currM),
        endTime: formatTime(nextH, nextM),
        durationMinutes: remainingFocus,
        category: 'Study',
        priority: 'High',
        reason: 'Protected single-task flow state block for top-tier creative output',
        status: 'suggested'
      });
      minutesAllocated += remainingFocus;
    }

    // Persist to storage
    Storage.saveSmartSchedule({
      availableHours,
      startTime,
      suggestedSchedule: schedule
    });

    return schedule;
  }

  function render() {
    const container = document.getElementById('planner-view');
    if (!container) return;
    const state = Storage.getState();
    const plannerData = state.smartPlanner || {};
    availableHours = plannerData.availableHours || 6;
    startTime = plannerData.startTime || '09:00';

    let schedule = plannerData.suggestedSchedule || [];
    if (schedule.length === 0) {
      schedule = generateSchedule();
    }

    const pendingTasks = (state.tasks || []).filter(t => !t.completed);
    const urgentTasks = pendingTasks.filter(t => t.priority === 'High' || t.dueDate <= Storage.getTodayStr());

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:24px;">
        <!-- Header & Explanation Banner -->
        <div class="card" style="background: linear-gradient(135deg, var(--sage-50), var(--bg-card)); border-color:var(--sage-200);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="font-size:1.4rem;">🧭</span>
                <h3 style="font-family:var(--font-serif); font-size:1.35rem; color:var(--text-main);">Smart Daily Planner</h3>
              </div>
              <p style="font-size:0.88rem; color:var(--text-muted); max-width:680px; line-height:1.5;">
                Generates a realistic daily agenda based on your exact available time, urgency scoring, active goals, and cognitive energy rhythms.
              </p>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <button class="btn-primary" onclick="SmartPlanner.acceptAllSchedule()">✓ Accept & Add to Calendar</button>
            </div>
          </div>

          <!-- Configuration Controls -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-top:20px; padding-top:16px; border-top:1px solid var(--border-light);">
            <div class="form-group">
              <label>Available Daily Hours: <strong id="hours-val-display" style="color:var(--sage-600);">${availableHours}h</strong></label>
              <input type="range" min="1" max="12" step="0.5" value="${availableHours}" id="planner-hours-slider" oninput="SmartPlanner.onHoursChange(this.value)" />
            </div>

            <div class="form-group">
              <label>Work Day Start Time</label>
              <input type="time" id="planner-start-time" value="${startTime}" onchange="SmartPlanner.onStartTimeChange(this.value)" />
            </div>

            <div style="display:flex; align-items:flex-end;">
              <button class="btn-secondary" style="width:100%;" onclick="SmartPlanner.recalculate()">
                ↻ Recalculate Schedule
              </button>
            </div>
          </div>
        </div>

        <!-- Analytical Insights Bar -->
        <div class="stats-row" style="grid-template-columns: repeat(3, 1fr);">
          <div class="stat-card">
            <div class="stat-icon tasks">📋</div>
            <div class="stat-info">
              <h3>${pendingTasks.length}</h3>
              <span>Pending Tasks Assessed</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon focus">⚡</div>
            <div class="stat-info">
              <h3 style="color:var(--pastel-rose-text);">${urgentTasks.length}</h3>
              <span>Urgent & High Priority</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon habits">⏱</div>
            <div class="stat-info">
              <h3>${schedule.reduce((acc, s) => acc + (s.durationMinutes || 0), 0)} min</h3>
              <span>Total Scheduled Block</span>
            </div>
          </div>
        </div>

        <!-- Generated Schedule Timeline -->
        <div class="card">
          <div class="card-header">
            <div>
              <h4 class="card-title"><span>🗓</span> Suggested Daily Schedule Timeline</h4>
              <p style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">
                Review each time block. Accept individual items, adjust durations, or commit directly to your calendar.
              </p>
            </div>
            <span class="badge badge-sage">${schedule.length} Time Blocks</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:12px; margin-top:12px;">
            ${schedule.length === 0 ? `
              <div style="text-align:center; padding:44px 20px; color:var(--text-muted);">
                <div style="font-size:2.2rem; margin-bottom:8px;">🗓</div>
                <div style="font-weight:600; color:var(--text-main); font-size:1.05rem; margin-bottom:6px;">No pending tasks to schedule</div>
                <p style="font-size:0.88rem; margin-bottom:16px; max-width:400px; margin-left:auto; margin-right:auto;">Add your tasks in the Task Manager, and the Smart Planner will calculate an optimal daily itinerary.</p>
                <button class="btn-primary" onclick="Tasks.openAddTaskModal()">+ Add Your First Task</button>
              </div>
            ` : schedule.map((block, idx) => `
              <div class="task-item" style="border-left: 4px solid ${getBlockBorderColor(block.type, block.priority)};">
                <div style="display:flex; align-items:center; gap:16px; flex:1;">
                  <!-- Time Slot Badge -->
                  <div style="min-width:115px; text-align:center; background-color:var(--bg-card-subtle); padding:8px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-light);">
                    <div style="font-family:var(--font-serif); font-size:1.05rem; font-weight:700; color:var(--text-main);">${block.startTime}</div>
                    <span style="font-size:0.75rem; color:var(--text-muted);">to ${block.endTime} (${block.durationMinutes}m)</span>
                  </div>

                  <!-- Details -->
                  <div style="flex:1;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                      <span class="badge ${getCategoryBadge(block.category)}">${block.category || 'General'}</span>
                      <span class="badge ${block.type === 'break' ? 'badge-teal' : block.priority === 'High' ? 'badge-rose' : 'badge-blue'}">${block.type.toUpperCase()}</span>
                    </div>
                    <div style="font-size:0.96rem; font-weight:600; color:var(--text-main);">${escapeHtml(block.title)}</div>
                    <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">
                      💡 <em>${escapeHtml(block.reason)}</em>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div style="display:flex; align-items:center; gap:8px;">
                  <button class="btn-secondary" style="padding:6px 14px; font-size:0.8rem;" onclick="SmartPlanner.acceptBlock(${idx})" title="Add this item to calendar">
                    ✓ Add Event
                  </button>
                  <button class="action-icon-btn delete" onclick="SmartPlanner.removeBlock(${idx})" title="Dismiss from schedule">
                    ✕
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function getBlockBorderColor(type, priority) {
    if (type === 'break') return 'var(--pastel-teal-text)';
    if (type === 'habit') return 'var(--pastel-amber-text)';
    if (priority === 'High') return 'var(--pastel-rose-text)';
    return 'var(--sage-500)';
  }

  function getCategoryBadge(cat) {
    switch (cat) {
      case 'Work': return 'badge-amber';
      case 'Study': return 'badge-purple';
      case 'Health': return 'badge-teal';
      default: return 'badge-blue';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function onHoursChange(val) {
    availableHours = parseFloat(val);
    const label = document.getElementById('hours-val-display');
    if (label) label.textContent = `${availableHours}h`;
  }

  function onStartTimeChange(val) {
    startTime = val;
  }

  function recalculate() {
    AudioEngine.playPop();
    generateSchedule();
    render();
    App.showToast(`Schedule generated for ${availableHours} available hours`);
  }

  function acceptBlock(index) {
    const state = Storage.getState();
    const schedule = state.smartPlanner.suggestedSchedule || [];
    const block = schedule[index];
    if (block) {
      Storage.commitScheduleBlockToCalendar(block);
      AudioEngine.playChime();
      App.showToast(`Scheduled "${block.title}" on Calendar`);
      // Remove or mark as accepted
      schedule.splice(index, 1);
      Storage.saveSmartSchedule({ ...state.smartPlanner, suggestedSchedule: schedule });
      render();
    }
  }

  function removeBlock(index) {
    const state = Storage.getState();
    const schedule = state.smartPlanner.suggestedSchedule || [];
    schedule.splice(index, 1);
    Storage.saveSmartSchedule({ ...state.smartPlanner, suggestedSchedule: schedule });
    AudioEngine.playPop();
    render();
  }

  function acceptAllSchedule() {
    const state = Storage.getState();
    const schedule = state.smartPlanner.suggestedSchedule || [];
    if (schedule.length === 0) return;

    schedule.forEach(block => {
      Storage.commitScheduleBlockToCalendar(block);
    });

    AudioEngine.playBell();
    if (App.launchConfetti) App.launchConfetti();
    App.showToast(`✨ Committed all ${schedule.length} blocks to Calendar!`);
    Storage.saveSmartSchedule({ ...state.smartPlanner, suggestedSchedule: [] });
    render();
  }

  return {
    render,
    onHoursChange,
    onStartTimeChange,
    recalculate,
    acceptBlock,
    removeBlock,
    acceptAllSchedule
  };
})();

