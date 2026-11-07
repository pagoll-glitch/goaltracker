/**
 * Overwhelmed Mode Controller
 * Cognitive Rescue & De-cluttering Engine:
 * 1. Automatically filters noise down to EXACTLY 3 crucial priorities
 * 2. Provides single-task spotlighting with distraction-free focus timer
 * 3. Incorporates visual box breathing exercise (4s Inhale, 4s Hold, 4s Exhale, 4s Hold)
 * 4. Provides gentle transition back to the main operating system
 */
const OverwhelmedMode = (() => {
  let activeIndex = 0;
  let timerInterval = null;
  let secondsRemaining = 25 * 60;
  let isTimerRunning = false;
  let breathingPhase = 'Inhale'; // 'Inhale', 'Hold', 'Exhale', 'Hold'
  let breathingInterval = null;

  // Calculates the 3 most crucial priority tasks using deterministic criteria
  function getTopThreePriorities(state) {
    const todayStr = Storage.getTodayStr();
    const pending = (state.tasks || []).filter(t => !t.completed);

    const scored = pending.map(t => {
      let score = 0;
      if (t.dueDate < todayStr) score += 60; // Overdue
      else if (t.dueDate === todayStr) score += 40; // Due today
      if (t.priority === 'High') score += 35;
      else if (t.priority === 'Medium') score += 20;
      return { task: t, score };
    }).sort((a, b) => b.score - a.score);

    return scored.slice(0, 3).map(s => s.task);
  }

  function startBreathing() {
    if (breathingInterval) clearInterval(breathingInterval);
    const phases = ['Inhale slowly...', 'Hold breath...', 'Exhale gently...', 'Hold calm...'];
    let idx = 0;
    breathingInterval = setInterval(() => {
      idx = (idx + 1) % phases.length;
      breathingPhase = phases[idx];
      const el = document.getElementById('breathing-guide-text');
      if (el) el.textContent = breathingPhase;
    }, 4000);
  }

  function render() {
    const container = document.getElementById('overwhelmed-view');
    if (!container) return;
    const state = Storage.getState();
    const priorities = getTopThreePriorities(state);

    if (priorities.length === 0) {
      container.innerHTML = `
        <div class="card" style="max-width:680px; margin:40px auto; text-align:center; padding:48px 32px;">
          <div style="font-size:3rem; margin-bottom:12px;">🌿</div>
          <h3 style="font-family:var(--font-serif); font-size:1.6rem; color:var(--text-main);">Mind is Calm & Clear</h3>
          <p style="font-size:0.95rem; color:var(--text-muted); margin:12px 0 24px;">
            You have no pending tasks right now. Take a deep restorative breath or return to your dashboard.
          </p>
          <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
            <button class="btn-primary" onclick="App.navigateTo('dashboard')">Return to Dashboard</button>
            <button class="btn-secondary" onclick="Tasks.openAddTaskModal()">+ Add A Task</button>
          </div>
        </div>
      `;
      return;
    }

    if (activeIndex >= priorities.length) activeIndex = 0;
    const currentTask = priorities[activeIndex];

    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    container.innerHTML = `
      <div style="max-width:780px; margin:0 auto; display:flex; flex-direction:column; gap:24px;">
        <!-- Zen Rescue Header -->
        <div style="text-align:center; padding:16px 0;">
          <div style="display:inline-flex; align-items:center; gap:8px; background:var(--pastel-teal-bg); border:1px solid var(--pastel-teal-border); padding:6px 16px; border-radius:var(--radius-full); margin-bottom:12px;">
            <span>🍃</span>
            <span style="font-size:0.84rem; font-weight:700; color:var(--pastel-teal-text);">Overwhelmed Mode Active • Distraction Filter</span>
          </div>
          <h2 style="font-family:var(--font-serif); font-size:2rem; color:var(--text-main); margin-bottom:6px;">
            Pause. You don't have to do everything today.
          </h2>
          <p style="font-size:0.92rem; color:var(--text-muted);">
            We hid the noise and isolated your top 3 vital priorities. Focus exclusively on <strong>ONE</strong> task right now.
          </p>
        </div>

        <!-- Box Breathing Widget -->
        <div class="card" style="background:var(--sage-50); border-color:var(--sage-200); display:flex; align-items:center; justify-content:center; gap:20px; padding:16px;">
          <div style="width:36px; height:36px; border-radius:var(--radius-full); background:var(--sage-500); animation:pulse 4s ease-in-out infinite;"></div>
          <div style="display:flex; flex-direction:column;">
            <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Box Breathing (4-4-4-4)</span>
            <span id="breathing-guide-text" style="font-family:var(--font-serif); font-size:1.15rem; font-weight:600; color:var(--sage-700);">
              ${breathingPhase}
            </span>
          </div>
        </div>

        <!-- 3 Priorities Stepper Bar -->
        <div style="display:flex; gap:12px;">
          ${priorities.map((t, idx) => `
            <div style="flex:1; cursor:pointer; padding:12px; border-radius:var(--radius-md); background:${idx === activeIndex ? 'var(--bg-card)' : 'var(--bg-card-subtle)'}; border:2px solid ${idx === activeIndex ? 'var(--sage-500)' : 'var(--border-light)'}; box-shadow:${idx === activeIndex ? 'var(--shadow-md)' : 'none'}; transition:all 0.2s ease;"
              onclick="OverwhelmedMode.selectPriority(${idx})">
              <div style="font-size:0.75rem; font-weight:700; color:${idx === activeIndex ? 'var(--sage-700)' : 'var(--text-muted)'}; margin-bottom:2px;">
                Priority ${idx + 1} of 3
              </div>
              <div style="font-size:0.86rem; font-weight:600; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${escapeHtml(t.title)}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Single-Task Spotlight Card -->
        <div class="card" style="padding:36px; display:flex; flex-direction:column; align-items:center; text-align:center; border:2px solid var(--sage-300); box-shadow:var(--shadow-lg);">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
            <span class="badge ${currentTask.priority === 'High' ? 'badge-rose' : 'badge-amber'}">${currentTask.priority} Priority</span>
            <span class="badge badge-sage">${currentTask.category}</span>
            <span class="badge badge-blue">Due ${currentTask.dueDate}</span>
          </div>

          <h3 style="font-family:var(--font-serif); font-size:1.75rem; font-weight:700; color:var(--text-main); max-width:580px; margin-bottom:12px; line-height:1.25;">
            ${escapeHtml(currentTask.title)}
          </h3>

          ${currentTask.notes ? `
            <p style="font-size:0.92rem; color:var(--text-muted); max-width:540px; margin-bottom:24px; line-height:1.5;">
              ${escapeHtml(currentTask.notes)}
            </p>
          ` : ''}

          <!-- Built-in Mini Pomodoro Display -->
          <div style="margin:16px 0 24px; display:flex; flex-direction:column; align-items:center; gap:8px;">
            <div style="font-family:var(--font-serif); font-size:3rem; font-weight:700; color:var(--sage-700); letter-spacing:0.02em;" id="overwhelmed-clock">
              ${timeDisplay}
            </div>
            <div style="display:flex; gap:10px;">
              <button class="btn-secondary" style="border-radius:var(--radius-full); padding:8px 20px;" onclick="OverwhelmedMode.toggleTimer()">
                ${isTimerRunning ? '❚❚ Pause' : '▶ Start Focus'}
              </button>
              <button class="btn-secondary" style="border-radius:var(--radius-full); padding:8px 16px;" onclick="OverwhelmedMode.resetTimer()">
                ↺ Reset
              </button>
            </div>
          </div>

          <!-- Mark Complete & Action -->
          <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
            <button class="btn-primary" style="padding:14px 28px; font-size:1rem; border-radius:var(--radius-full);" onclick="OverwhelmedMode.completeCurrentTask('${currentTask.id}')">
              ✓ Complete Task & Advance
            </button>
          </div>
        </div>

        <!-- Gentle Exit -->
        <div style="text-align:center; margin-top:12px;">
          <button class="btn-secondary" style="border-radius:var(--radius-full); padding:10px 24px;" onclick="OverwhelmedMode.exit()">
            🌿 I feel centered — Return to Full OS
          </button>
        </div>
      </div>
    `;

    startBreathing();
  }

  function selectPriority(idx) {
    activeIndex = idx;
    secondsRemaining = 25 * 60;
    if (isTimerRunning) {
      clearInterval(timerInterval);
      isTimerRunning = false;
    }
    render();
  }

  function toggleTimer() {
    AudioEngine.playPop();
    if (isTimerRunning) {
      clearInterval(timerInterval);
      timerInterval = null;
      isTimerRunning = false;
    } else {
      isTimerRunning = true;
      timerInterval = setInterval(() => {
        if (secondsRemaining > 0) {
          secondsRemaining--;
          const el = document.getElementById('overwhelmed-clock');
          if (el) {
            const m = Math.floor(secondsRemaining / 60);
            const s = secondsRemaining % 60;
            el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
          }
        } else {
          clearInterval(timerInterval);
          isTimerRunning = false;
          AudioEngine.playBell();
          App.showToast('Focus sprint completed! Well done.');
        }
      }, 1000);
    }
    render();
  }

  function resetTimer() {
    if (timerInterval) clearInterval(timerInterval);
    isTimerRunning = false;
    secondsRemaining = 25 * 60;
    render();
  }

  function completeCurrentTask(id) {
    AudioEngine.playChime();
    if (App.launchConfetti) App.launchConfetti();
    Storage.toggleTask(id);
    App.showToast('Priority task completed! +40 XP');

    // Move to next priority or exit if done
    const state = Storage.getState();
    const remaining = getTopThreePriorities(state);
    if (remaining.length === 0) {
      App.showToast('🎉 All top priorities cleared! You conquered the overwhelm.');
      exit();
    } else {
      activeIndex = 0;
      secondsRemaining = 25 * 60;
      render();
    }
  }

  function exit() {
    if (timerInterval) clearInterval(timerInterval);
    if (breathingInterval) clearInterval(breathingInterval);
    App.navigateTo('dashboard');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return {
    render,
    selectPriority,
    toggleTimer,
    resetTimer,
    completeCurrentTask,
    exit
  };
})();

