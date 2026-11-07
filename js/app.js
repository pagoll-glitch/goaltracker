/**
 * Goal It Up - Productivity OS - Main App Orchestrator
 * View routing, modal controller, toast notifications, theme bootstrap.
 */
const App = (() => {
  let currentView = 'dashboard';

  const viewTitles = {
    dashboard: '🌿 Daily Command Center',
    tasks: '✓ Task & Priority Manager',
    habits: '🌱 Daily Habit Consistency Matrix',
    goals: '🎯 Targets & Milestones Planner',
    calendar: '📅 Interactive Calendar & Timeline',
    focus: '⏱ Deep Focus & Pomodoro',
    planner: '🧭 Smart Daily Planner & Scheduler',
    balance: '☸️ Life Balance Dashboard & Wheel',
    reset: '🔄 Guided Weekly Reset & Reflection',
    rewards: '🏅 Achievements, XP & Challenges',
    vision: '🌌 Future Self & Vision Board',
    overwhelmed: '🍃 Overwhelmed Mode • Single-Task Spotlight',
    analytics: '📊 Productivity Trends & Analytics',
    journal: '💭 Daily Journal & Notes',
    settings: '⚙️ Settings & System Profile'
  };

  function init() {
    // 1. Apply theme
    const state = Storage.getState();
    const theme = state.settings.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);

    // 2. Sound state
    AudioEngine.setMuted(state.settings.soundEnabled === false);

    // 3. Update header date
    updateLiveClock();
    setInterval(updateLiveClock, 60000);

    // 4. Update sidebar profile
    updateSidebarProfile();

    // 5. Setup navigation listeners
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const targetView = item.getAttribute('data-view');
        if (targetView) {
          navigateTo(targetView);
          // Auto close mobile drawer if open
          closeMobileSidebar();
        }
      });
    });

    // 6. Quick action button
    const quickAddBtn = document.getElementById('global-add-btn');
    if (quickAddBtn) {
      quickAddBtn.onclick = openQuickActionModal;
    }

    // 7. Theme toggle button in sidebar
    const quickThemeBtn = document.getElementById('quick-theme-btn');
    if (quickThemeBtn) {
      quickThemeBtn.onclick = () => {
        const curr = document.documentElement.getAttribute('data-theme') || 'light';
        const next = curr === 'light' ? 'dark' : 'light';
        Settings.changeTheme(next);
      };
    }

    // 8. Mobile drawer toggle
    const mobileBtn = document.getElementById('mobile-menu-toggle');
    if (mobileBtn) {
      mobileBtn.onclick = toggleMobileSidebar;
    }

    // 9. Keyboard shortcuts
    setupKeyboardShortcuts();

    // 10. Initial Render
    navigateTo('dashboard');
  }

  function updateLiveClock() {
    const dateEl = document.getElementById('header-live-date');
    if (dateEl) {
      const now = new Date();
      const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('en-US', options);
    }
  }

  function updateSidebarProfile() {
    const state = Storage.getState();
    const avatarEl = document.getElementById('user-avatar-display');
    const nameEl = document.getElementById('user-name-display');
    const titleEl = document.getElementById('user-title-display');

    if (avatarEl) avatarEl.textContent = state.settings.avatar || '🌿';
    if (nameEl) nameEl.textContent = state.settings.userName || 'Sara';
    if (titleEl) {
      const rewards = state.rewards || { xp: 0 };
      const level = Math.floor(Math.sqrt((rewards.xp || 0) / 100)) + 1;
      titleEl.textContent = `Lvl ${level} • ${rewards.xp || 0} XP`;
    }

    // Update pending tasks badge on sidebar
    const pendingCount = (state.tasks || []).filter(t => !t.completed).length;
    const taskBadge = document.getElementById('nav-task-badge');
    if (taskBadge) {
      taskBadge.textContent = pendingCount;
      taskBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }
  }

  function navigateTo(viewName) {
    currentView = viewName;

    // Update nav active classes
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update header title
    const titleEl = document.getElementById('view-title-display');
    if (titleEl) {
      titleEl.textContent = viewTitles[viewName] || 'Goal It Up OS';
    }

    // Show/hide sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`${viewName}-view`);
    if (targetSec) {
      targetSec.classList.add('active');
    }

    // Render corresponding view
    switch (viewName) {
      case 'dashboard': Dashboard.render(); break;
      case 'tasks': Tasks.render(); break;
      case 'habits': Habits.render(); break;
      case 'goals': Goals.render(); break;
      case 'calendar': Calendar.render(); break;
      case 'focus': Focus.render(); break;
      case 'planner': SmartPlanner.render(); break;
      case 'balance': LifeBalance.render(); break;
      case 'reset': WeeklyReset.render(); break;
      case 'rewards': Rewards.render(); break;
      case 'vision': VisionBoard.render(); break;
      case 'overwhelmed': OverwhelmedMode.render(); break;
      case 'analytics': Analytics.render(); break;
      case 'journal': Journal.render(); break;
      case 'settings': Settings.render(); break;
    }

    updateSidebarProfile();
  }

  function refreshAll() {
    updateSidebarProfile();
    navigateTo(currentView);
  }

  function toggleMobileSidebar() {
    const sidebar = document.querySelector('.app-sidebar');
    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    if (sidebar) sidebar.classList.toggle('mobile-open');
    if (backdrop) backdrop.classList.toggle('active');
  }

  function closeMobileSidebar() {
    const sidebar = document.querySelector('.app-sidebar');
    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
  }

  // Keyboard Shortcuts Setup
  function setupKeyboardShortcuts() {
    const viewList = ['dashboard', 'tasks', 'habits', 'goals', 'calendar', 'focus', 'analytics', 'journal', 'settings'];

    window.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts if typing inside an input, textarea or select
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        if (e.key === 'Escape') closeModal();
        return;
      }

      if (e.key === 'Escape') {
        closeModal();
        closeMobileSidebar();
      } else if (e.key >= '1' && e.key <= '9') {
        const targetView = viewList[parseInt(e.key) - 1];
        if (targetView) navigateTo(targetView);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openQuickActionModal();
      } else if (e.key === 't' || e.key === 'T') {
        const curr = document.documentElement.getAttribute('data-theme') || 'light';
        Settings.changeTheme(curr === 'light' ? 'dark' : 'light');
      } else if (e.key === 'o' || e.key === 'O') {
        navigateTo('overwhelmed');
      } else if (e.key === ' ' && currentView === 'focus') {
        e.preventDefault();
        Focus.toggleTimer();
      } else if (e.key === '?') {
        showShortcutsModal();
      }
    });
  }

  function showShortcutsModal() {
    showModal('Keyboard Shortcuts', `
      <div style="display:flex; flex-direction:column; gap:10px; font-size:0.88rem; padding: 6px 0;">
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-light); padding-bottom:6px;">
          <span>Navigate Sections (1-9)</span>
          <span class="badge badge-sage">1 - 9</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-light); padding-bottom:6px;">
          <span>Quick Add Modal</span>
          <span class="badge badge-sage">N</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-light); padding-bottom:6px;">
          <span>Toggle Light / Dark Mode</span>
          <span class="badge badge-sage">T</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-light); padding-bottom:6px;">
          <span>Start / Pause Focus Timer</span>
          <span class="badge badge-sage">Space</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding-bottom:6px;">
          <span>Close Modal / Drawer</span>
          <span class="badge badge-sage">Esc</span>
        </div>
      </div>
    `);
  }

  // Celebratory Canvas Confetti
  function launchConfetti() {
    try {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      document.body.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles = [];
      const colors = ['#4D6B53', '#B83050', '#216298', '#AA6507', '#663AC4', '#0E7B68'];

      for (let i = 0; i < 70; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.7) * 18,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          tilt: Math.random() * 10,
          tiltAngle: 0,
          tiltAngleInc: Math.random() * 0.08 + 0.04
        });
      }

      let frames = 0;
      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.4; // gravity
          p.tiltAngle += p.tiltAngleInc;
          p.tilt = Math.sin(p.tiltAngle) * 12;

          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.fillRect(p.x, p.y, p.size, p.size + p.tilt);
        });

        frames++;
        if (frames < 75) {
          requestAnimationFrame(animate);
        } else {
          canvas.remove();
        }
      }
      animate();
    } catch (e) {
      console.warn('Confetti error', e);
    }
  }

  // Modal Dialog System
  function showModal(title, bodyHtml) {
    const overlay = document.getElementById('global-modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body-container');

    if (!overlay || !titleEl || !bodyEl) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    overlay.classList.add('active');
  }

  function closeModal() {
    const overlay = document.getElementById('global-modal-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  function openQuickActionModal() {
    AudioEngine.playPop();
    showModal('Quick Action', `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; padding: 12px 0;">
        <button class="card" style="cursor:pointer; text-align:left; padding:16px;" onclick="App.closeModal(); Tasks.openAddTaskModal();">
          <div style="font-size:1.5rem; margin-bottom:6px;">📋</div>
          <div style="font-weight:600; color:var(--text-main);">Add New Task</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Set priority, deadline and category</div>
        </button>

        <button class="card" style="cursor:pointer; text-align:left; padding:16px;" onclick="App.closeModal(); Habits.openAddHabitModal();">
          <div style="font-size:1.5rem; margin-bottom:6px;">🌱</div>
          <div style="font-weight:600; color:var(--text-main);">Create Habit</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Add new daily or weekly practice</div>
        </button>

        <button class="card" style="cursor:pointer; text-align:left; padding:16px;" onclick="App.closeModal(); Goals.openAddGoalModal();">
          <div style="font-size:1.5rem; margin-bottom:6px;">🎯</div>
          <div style="font-weight:600; color:var(--text-main);">Create Goal</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Define target and key milestones</div>
        </button>

        <button class="card" style="cursor:pointer; text-align:left; padding:16px;" onclick="App.closeModal(); Calendar.openAddEventModal();">
          <div style="font-size:1.5rem; margin-bottom:6px;">📅</div>
          <div style="font-weight:600; color:var(--text-main);">Schedule Event</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">Block time on calendar</div>
        </button>
      </div>
    `);
  }

  // Toast Notification System
  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>🌿</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 240ms ease';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  return {
    init,
    navigateTo,
    refreshAll,
    showModal,
    closeModal,
    showToast,
    updateSidebarProfile
  };
})();

// Bootstrap when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

