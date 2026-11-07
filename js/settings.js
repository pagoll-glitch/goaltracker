/**
 * Settings & Profile Controller
 * Profile preferences, light/dark mode switch, timer custom durations,
 * sound effects toggle, JSON export/import and demo data reset.
 */
const Settings = (() => {
  function render() {
    const container = document.getElementById('settings-view');
    if (!container) return;
    const state = Storage.getState();
    const settings = state.settings || {};

    container.innerHTML = `
      <div class="settings-container">
        <!-- Profile Customization -->
        <div class="settings-card">
          <h3>Personal Profile</h3>
          <p>Customize how your productivity operating system addresses you.</p>

          <form id="profile-form" onsubmit="Settings.saveProfile(event)">
            <div class="settings-grid-form">
              <div class="form-group">
                <label>Your Name</label>
                <input type="text" id="setting-name" value="${escapeHtml(settings.userName || 'Sara')}" required />
              </div>
              <div class="form-group">
                <label>Tagline / Title</label>
                <input type="text" id="setting-title" value="${escapeHtml(settings.userTitle || 'Lifelong Learner & Architect')}" />
              </div>
              <div class="form-group">
                <label>Avatar Emoji</label>
                <select id="setting-avatar">
                  <option value="🌿" ${settings.avatar === '🌿' ? 'selected' : ''}>🌿 Sage Leaves</option>
                  <option value="🌱" ${settings.avatar === '🌱' ? 'selected' : ''}>🌱 Sprout</option>
                  <option value="⚡" ${settings.avatar === '⚡' ? 'selected' : ''}>⚡ High Energy</option>
                  <option value="🎯" ${settings.avatar === '🎯' ? 'selected' : ''}>🎯 Target</option>
                  <option value="🧘" ${settings.avatar === '🧘' ? 'selected' : ''}>🧘 Calm Zen</option>
                  <option value="✨" ${settings.avatar === '✨' ? 'selected' : ''}>✨ Sparkle</option>
                </select>
              </div>
              <div class="form-group">
                <label>Daily Target Focus (Hours)</label>
                <input type="number" id="setting-target-hours" value="${settings.dailyTargetHours || 6}" min="1" max="16" />
              </div>
            </div>
            <div style="margin-top:16px; display:flex; justify-content:flex-end;">
              <button type="submit" class="btn-primary">Save Profile</button>
            </div>
          </form>
        </div>

        <!-- Appearance & Audio -->
        <div class="settings-card">
          <h3>Appearance & Audio</h3>
          <p>Theme aesthetic, chimes, and ambient noise preferences.</p>

          <div class="settings-grid-form">
            <div class="form-group">
              <label>Interface Theme</label>
              <select id="setting-theme" onchange="Settings.changeTheme(this.value)">
                <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Cream & Sage (Light Mode)</option>
                <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark Slate & Sage (Dark Mode)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Sound Effects (Web Audio API)</label>
              <select id="setting-sound" onchange="Settings.changeSound(this.value)">
                <option value="true" ${settings.soundEnabled !== false ? 'selected' : ''}>Enabled (Chimes & Clicks)</option>
                <option value="false" ${settings.soundEnabled === false ? 'selected' : ''}>Muted</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Focus Timer Defaults -->
        <div class="settings-card">
          <h3>Pomodoro Timer Customization</h3>
          <p>Configure default session and break intervals.</p>

          <div class="settings-grid-form">
            <div class="form-group">
              <label>Focus Duration (Minutes)</label>
              <input type="number" id="setting-pomo-work" value="${settings.pomodoroWork || 25}" min="5" max="120" onchange="Settings.updateTimerSetting('pomodoroWork', this.value)" />
            </div>
            <div class="form-group">
              <label>Short Break Duration (Minutes)</label>
              <input type="number" id="setting-pomo-break" value="${settings.pomodoroBreak || 5}" min="1" max="30" onchange="Settings.updateTimerSetting('pomodoroBreak', this.value)" />
            </div>
          </div>
        </div>

        <!-- Data Persistence & Management -->
        <div class="settings-card">
          <h3>Data Management & Persistence</h3>
          <p>Export your life OS data backup as JSON, import previous archives, or reset demo state.</p>

          <div style="display:flex; flex-wrap:wrap; gap:12px; margin-top:12px;">
            <button class="btn-primary" onclick="Settings.exportBackup()">📥 Export JSON Backup</button>
            
            <label class="btn-secondary" style="cursor:pointer; display:inline-flex; align-items:center;">
              📤 Import JSON File
              <input type="file" id="import-json-file" accept=".json" style="display:none;" onchange="Settings.importBackup(event)" />
            </label>

            <button class="btn-secondary" onclick="Settings.resetDemo()">↺ Reset to Demo Data</button>
            <button class="btn-danger" onclick="Settings.clearAll()">🗑 Clear All Data</button>
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function saveProfile(e) {
    e.preventDefault();
    const name = document.getElementById('setting-name').value.trim();
    const title = document.getElementById('setting-title').value.trim();
    const avatar = document.getElementById('setting-avatar').value;
    const hours = Number(document.getElementById('setting-target-hours').value) || 6;

    Storage.updateSettings({
      userName: name,
      userTitle: title,
      avatar: avatar,
      dailyTargetHours: hours
    });

    AudioEngine.playPop();
    App.updateSidebarProfile();
    Dashboard.render();
    App.showToast('Profile preferences saved');
  }

  function changeTheme(theme) {
    Storage.updateSettings({ theme });
    document.documentElement.setAttribute('data-theme', theme);
    App.showToast(`Switched to ${theme} theme`);
  }

  function changeSound(val) {
    const enabled = val === 'true';
    Storage.updateSettings({ soundEnabled: enabled });
    AudioEngine.setMuted(!enabled);
    if (enabled) AudioEngine.playPop();
    App.showToast(enabled ? 'Sound enabled' : 'Sound muted');
  }

  function updateTimerSetting(key, val) {
    const num = Number(val);
    if (num > 0) {
      Storage.updateSettings({ [key]: num });
      Focus.initTimesFromSettings();
      Focus.render();
    }
  }

  function exportBackup() {
    const jsonStr = Storage.exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goal_it_up_backup_${Storage.getTodayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.showToast('Backup JSON exported successfully');
  }

  function importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = Storage.importJSON(event.target.result);
      if (res.success) {
        AudioEngine.playChime();
        App.refreshAll();
        App.showToast('Data restored successfully!');
      } else {
        alert('Failed to import backup: ' + res.error);
      }
    };
    reader.readAsText(file);
  }

  function resetDemo() {
    if (confirm('Reset all tasks, habits, and goals to realistic demo data? Your custom additions will be replaced.')) {
      Storage.resetToDemo();
      App.refreshAll();
      AudioEngine.playChime();
      App.showToast('Reset to demo state');
    }
  }

  function clearAll() {
    if (confirm('CAUTION: Are you sure you want to erase all tasks, habits, goals and journal entries?')) {
      Storage.clearAll();
      App.refreshAll();
      App.showToast('All data cleared');
    }
  }

  return {
    render,
    saveProfile,
    changeTheme,
    changeSound,
    updateTimerSetting,
    exportBackup,
    importBackup,
    resetDemo,
    clearAll
  };
})();

