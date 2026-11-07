/**
 * Focus & Study Tracker Controller
 * Pomodoro timer, mode switcher (Pomodoro, Short Break, Long Break),
 * audio chime alerts, ambient focus noise, session history, and focus statistics.
 */
const Focus = (() => {
  let timerInterval = null;
  let isRunning = false;
  let currentMode = 'work'; // 'work', 'shortBreak', 'longBreak'
  let secondsRemaining = 25 * 60;
  let totalSessionSeconds = 25 * 60;
  let activeTag = 'Deep Work'; // 'Coding', 'Study', 'Deep Work', 'Writing', 'Reading'
  let isAmbientOn = false;

  function initTimesFromSettings() {
    const state = Storage.getState();
    const workMin = state.settings.pomodoroWork || 25;
    const shortMin = state.settings.pomodoroBreak || 5;
    const longMin = state.settings.pomodoroLongBreak || 15;

    if (currentMode === 'work') {
      totalSessionSeconds = workMin * 60;
    } else if (currentMode === 'shortBreak') {
      totalSessionSeconds = shortMin * 60;
    } else {
      totalSessionSeconds = longMin * 60;
    }
    if (!isRunning) {
      secondsRemaining = totalSessionSeconds;
    }
  }

  function render() {
    const container = document.getElementById('focus-view');
    if (!container) return;
    const state = Storage.getState();
    const sessions = state.focusSessions || [];
    const todayStr = Storage.getTodayStr();

    // Stats calculation
    const todaySessions = sessions.filter(s => s.date === todayStr);
    const todayMinutes = todaySessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    const totalMinutes = sessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    const targetMinutes = (state.settings.dailyTargetHours || 6) * 60;
    const dailyTargetPercent = Math.min(100, Math.round((todayMinutes / targetMinutes) * 100));

    // Formatted time
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // SVG stroke math for circle radius 110 (circumference ~ 691.15)
    const circumference = 2 * Math.PI * 110;
    const progressRatio = totalSessionSeconds > 0 ? (totalSessionSeconds - secondsRemaining) / totalSessionSeconds : 0;
    const strokeOffset = circumference - (progressRatio * circumference);

    const tags = ['Deep Work', 'Coding', 'Study', 'Writing', 'Reading'];

    container.innerHTML = `
      <div class="focus-container">
        <!-- Left: Pomodoro Timer Card -->
        <div class="pomodoro-card">
          <!-- Mode Tabs -->
          <div class="pomodoro-tabs">
            <button class="pomo-tab ${currentMode === 'work' ? 'active' : ''}" onclick="Focus.switchMode('work')">Focus (${state.settings.pomodoroWork || 25}m)</button>
            <button class="pomo-tab ${currentMode === 'shortBreak' ? 'active' : ''}" onclick="Focus.switchMode('shortBreak')">Short Break (${state.settings.pomodoroBreak || 5}m)</button>
            <button class="pomo-tab ${currentMode === 'longBreak' ? 'active' : ''}" onclick="Focus.switchMode('longBreak')">Long Break (${state.settings.pomodoroLongBreak || 15}m)</button>
          </div>

          <!-- Circular Timer Ring -->
          <div class="timer-circle-wrap">
            <svg width="260" height="260" viewBox="0 0 260 260">
              <circle class="timer-ring-bg" cx="130" cy="130" r="110" stroke-width="10" fill="transparent" />
              <circle class="timer-ring-progress" cx="130" cy="130" r="110" stroke-width="10" fill="transparent"
                stroke-dasharray="${circumference}" stroke-dashoffset="${strokeOffset}" />
            </svg>
            <div class="timer-center-content">
              <div class="timer-time-display" id="focus-clock-display">${timeDisplay}</div>
              <div class="timer-session-label">${activeTag}</div>
            </div>
          </div>

          <!-- Timer Action Controls -->
          <div class="timer-controls">
            <button class="timer-main-btn" onclick="Focus.toggleTimer()">
              ${isRunning ? '❚❚ Pause' : '▶ Start Focus'}
            </button>
            <button class="btn-secondary" onclick="Focus.resetTimer()" style="padding:12px 18px; border-radius:var(--radius-full);">
              ↺ Reset
            </button>
          </div>

          <!-- Activity Tag Selector -->
          <div style="margin-bottom:20px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center;">
            <span style="font-size:0.78rem; text-transform:uppercase; color:var(--text-muted); font-weight:600;">Activity:</span>
            ${tags.map(tag => `
              <button class="filter-pill ${activeTag === tag ? 'active' : ''}" onclick="Focus.setTag('${tag}')">
                ${tag}
              </button>
            `).join('')}
          </div>

          <!-- Ambient Sound Toggle -->
          <div class="timer-ambient-row">
            <span>🌧 Soft Ambient Noise:</span>
            <button class="btn-secondary" style="padding:4px 12px; font-size:0.8rem;" onclick="Focus.toggleAmbientSound()">
              ${isAmbientOn ? '🔊 Playing' : '🔇 Muted'}
            </button>
          </div>
        </div>

        <!-- Right: Daily & Weekly Focus Stats + Session History -->
        <div class="focus-sidebar-col">
          <!-- Stats Tiles -->
          <div class="focus-stat-box">
            <div class="focus-stat-tile">
              <h4>Today's Focus</h4>
              <p>${(todayMinutes / 60).toFixed(1)}h</p>
              <div style="font-size:0.75rem; color:var(--sage-600); margin-top:4px;">${todayMinutes} focused minutes</div>
            </div>
            <div class="focus-stat-tile">
              <h4>Daily Target</h4>
              <p>${dailyTargetPercent}%</p>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Target: ${state.settings.dailyTargetHours || 6} hours</div>
            </div>
          </div>

          <!-- Focus History Log -->
          <div class="card" style="flex:1;">
            <div class="card-header">
              <h4 class="card-title"><span>📜</span> Recent Sessions</h4>
              <span class="badge badge-sage">${sessions.length} sessions</span>
            </div>
            <div class="mini-item-list" style="max-height: 300px; overflow-y:auto;">
              ${sessions.length === 0 ? `
                <div style="text-align:center; padding:24px; color:var(--text-muted); font-size:0.88rem;">
                  No focus sessions logged yet. Complete a pomodoro to record your first sprint!
                </div>
              ` : sessions.slice(0, 6).map(s => `
                <div class="mini-task-item">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <span class="badge badge-teal">${s.tag}</span>
                    <span style="font-size:0.86rem; font-weight:600; color:var(--text-main);">${s.durationMinutes} min</span>
                  </div>
                  <span style="font-size:0.76rem; color:var(--text-muted);">${s.date}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function tick() {
    if (secondsRemaining > 0) {
      secondsRemaining--;
      // Update display text directly if present to avoid full re-render on every second
      const display = document.getElementById('focus-clock-display');
      if (display) {
        const m = Math.floor(secondsRemaining / 60);
        const s = secondsRemaining % 60;
        display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        // Update SVG circle stroke
        const circle = document.querySelector('.timer-ring-progress');
        if (circle) {
          const circumference = 2 * Math.PI * 110;
          const ratio = (totalSessionSeconds - secondsRemaining) / totalSessionSeconds;
          circle.style.strokeDashoffset = circumference - (ratio * circumference);
        }
      }
    } else {
      // Completed timer!
      clearInterval(timerInterval);
      timerInterval = null;
      isRunning = false;
      AudioEngine.playBell();

      if (currentMode === 'work') {
        const sessionMins = Math.round(totalSessionSeconds / 60);
        Storage.addFocusSession({
          durationMinutes: sessionMins,
          tag: activeTag,
          notes: `Completed ${activeTag} block`
        });
        App.showToast(`🎉 Focus session completed! Logged ${sessionMins} minutes.`);
        Dashboard.render();
      } else {
        App.showToast('🌿 Break complete! Ready for your next focus session.');
      }
      resetTimer();
    }
  }

  function toggleTimer() {
    AudioEngine.playPop();
    if (isRunning) {
      clearInterval(timerInterval);
      timerInterval = null;
      isRunning = false;
    } else {
      isRunning = true;
      timerInterval = setInterval(tick, 1000);
    }
    render();
  }

  function resetTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    isRunning = false;
    initTimesFromSettings();
    render();
  }

  function switchMode(mode) {
    AudioEngine.playPop();
    currentMode = mode;
    resetTimer();
  }

  function setTag(tag) {
    activeTag = tag;
    render();
  }

  function toggleAmbientSound() {
    isAmbientOn = !isAmbientOn;
    AudioEngine.toggleAmbient(isAmbientOn);
    render();
  }

  // Initialize
  initTimesFromSettings();

  return {
    render,
    toggleTimer,
    resetTimer,
    switchMode,
    setTag,
    toggleAmbientSound,
    initTimesFromSettings
  };
})();

