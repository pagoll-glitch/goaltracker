/**
 * Goals & Target Planner Controller
 * Short-term & Long-term goals, measurable targets (numeric vs percentage),
 * interactive milestone checklists, manual progress increment/decrement, and visual indicators.
 */
const Goals = (() => {
  let activeTab = 'all'; // 'all', 'Short-term', 'Long-term', 'completed'

  function render() {
    const container = document.getElementById('goals-view');
    if (!container) return;
    const state = Storage.getState();
    const goals = state.goals || [];

    // Filter goals
    const filteredGoals = goals.filter(g => {
      const isDone = g.current >= g.target;
      if (activeTab === 'completed') return isDone;
      if (activeTab === 'Short-term') return g.timeframe === 'Short-term' && !isDone;
      if (activeTab === 'Long-term') return g.timeframe === 'Long-term' && !isDone;
      return true; // 'all'
    });

    const ongoingCount = goals.filter(g => g.current < g.target).length;
    const completedCount = goals.filter(g => g.current >= g.target).length;

    container.innerHTML = `
      <!-- View Controls & Tabs -->
      <div class="view-header-bar">
        <div class="filter-pills">
          <button class="filter-pill ${activeTab === 'all' ? 'active' : ''}" onclick="Goals.setTab('all')">All Goals (${goals.length})</button>
          <button class="filter-pill ${activeTab === 'Short-term' ? 'active' : ''}" onclick="Goals.setTab('Short-term')">Short-term</button>
          <button class="filter-pill ${activeTab === 'Long-term' ? 'active' : ''}" onclick="Goals.setTab('Long-term')">Long-term</button>
          <button class="filter-pill ${activeTab === 'completed' ? 'active' : ''}" onclick="Goals.setTab('completed')">Completed (${completedCount})</button>
        </div>

        <button class="btn-primary" onclick="Goals.openAddGoalModal()">+ New Goal</button>
      </div>

      <!-- Goals Grid Cards -->
      <div class="goals-grid">
        ${goals.length === 0 ? `
          <div class="card" style="grid-column: 1 / -1; text-align:center; padding: 52px 24px; background: linear-gradient(135deg, var(--sage-50), var(--bg-card)); border: 2px dashed var(--sage-300);">
            <div style="font-size:3rem; margin-bottom:12px;">🎯</div>
            <h3 style="font-family:var(--font-serif); font-size:1.6rem; color:var(--text-main); margin-bottom:8px;">
              Welcome to Goals & Targets
            </h3>
            <p style="font-size:0.95rem; color:var(--text-muted); max-width:540px; margin:0 auto 22px; line-height:1.5;">
              You have a fresh slate! Set whatever goal, milestone, or target matters most to your life.
            </p>

            <button class="btn-primary" style="padding:12px 26px; font-size:0.95rem; border-radius:var(--radius-full); margin-bottom:24px;" onclick="Goals.openAddGoalModal()">
              + Add Your First Goal
            </button>

            <!-- Optional Starter Ideas -->
            <div style="border-top:1px solid var(--border-light); padding-top:18px; max-width:580px; margin:0 auto;">
              <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; letter-spacing:0.04em; display:block; margin-bottom:10px;">
                Or Start with an Idea:
              </span>
              <div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center;">
                <button class="filter-pill" style="background:var(--bg-card);" onclick="Goals.openAddGoalModal({ title: 'Read 12 Books This Year', category: 'Learning', target: 12, unit: 'books', timeframe: 'Long-term' })">
                  📚 Read 12 Books
                </button>
                <button class="filter-pill" style="background:var(--bg-card);" onclick="Goals.openAddGoalModal({ title: 'Learn Python & System Design', category: 'Skill', target: 100, unit: '%', timeframe: 'Short-term' })">
                  💻 Learn a Skill
                </button>
                <button class="filter-pill" style="background:var(--bg-card);" onclick="Goals.openAddGoalModal({ title: 'Emergency Fund: Save $10,000', category: 'Finance', target: 10000, unit: '$', timeframe: 'Long-term' })">
                  💰 Savings Target
                </button>
                <button class="filter-pill" style="background:var(--bg-card);" onclick="Goals.openAddGoalModal({ title: 'Run a 10K / Fitness Habit', category: 'Health', target: 10, unit: 'km', timeframe: 'Short-term' })">
                  🏃 Fitness Target
                </button>
              </div>
            </div>
          </div>
        ` : filteredGoals.length === 0 ? `
          <div class="card" style="grid-column: 1 / -1; text-align:center; padding: 48px; color:var(--text-muted);">
            <div style="font-size:2.5rem; margin-bottom:12px;">🎯</div>
            <h4 style="font-family:var(--font-serif); font-size:1.25rem; color:var(--text-main);">No goals in this section</h4>
            <p style="margin-top:6px;">Create a new milestone or switch tabs.</p>
          </div>
        ` : filteredGoals.map(goal => {
          const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
          const isDone = goal.current >= goal.target;

          return `
            <div class="goal-card">
              <div>
                <div class="goal-card-header">
                  <div class="goal-title-wrap">
                    <span class="badge ${getCategoryBadge(goal.category)}" style="margin-bottom:6px;">${goal.category} • ${goal.timeframe}</span>
                    <h4>${escapeHtml(goal.title)}</h4>
                  </div>
                  <div class="task-actions">
                    <button class="action-icon-btn delete" onclick="Goals.deleteGoal('${goal.id}')" title="Delete">🗑</button>
                  </div>
                </div>

                ${goal.description ? `<p class="goal-card-desc">${escapeHtml(goal.description)}</p>` : ''}

                <!-- Progress Bar & Target Display -->
                <div class="goal-progress-section">
                  <div class="goal-progress-numbers">
                    <span style="color:var(--text-muted);">Progress: ${pct}%</span>
                    <span style="color:var(--sage-700); font-weight:700;">
                      ${goal.unit === '$' ? '$' + goal.current.toLocaleString() : goal.current} / 
                      ${goal.unit === '$' ? '$' + goal.target.toLocaleString() : goal.target} ${goal.unit !== '$' ? goal.unit : ''}
                    </span>
                  </div>
                  <div class="progress-track" style="height:10px;">
                    <div class="progress-bar-fill" style="width: ${pct}%; background: ${isDone ? 'var(--pastel-teal-text)' : 'linear-gradient(90deg, var(--sage-500), var(--sage-600))'};"></div>
                  </div>
                </div>

                <!-- Sub-Milestones Checklist -->
                ${goal.milestones && goal.milestones.length > 0 ? `
                  <div class="milestones-list">
                    <div style="font-size:0.76rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px;">
                      Key Milestones (${goal.milestones.filter(m => m.completed).length}/${goal.milestones.length})
                    </div>
                    ${goal.milestones.map(m => `
                      <div class="milestone-item ${m.completed ? 'completed' : ''}" onclick="Goals.toggleMilestone('${goal.id}', '${m.id}')">
                        <div class="custom-checkbox ${m.completed ? 'checked' : ''}" style="width:16px; height:16px; font-size:0.7rem;">
                          ${m.completed ? '✓' : ''}
                        </div>
                        <span>${escapeHtml(m.title)}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>

              <!-- Goal Footer & Adjustment Buttons -->
              <div class="goal-card-footer">
                <span class="target-date-badge">
                  🎯 Due: ${goal.targetDate || 'No deadline'}
                </span>

                <div class="goal-adjust-btns">
                  <button class="adjust-btn" onclick="Goals.adjustGoal('${goal.id}', -1)" title="Decrement progress">-</button>
                  <button class="adjust-btn" onclick="Goals.adjustGoal('${goal.id}', 1)" title="Increment progress">+</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function getCategoryBadge(cat) {
    switch (cat) {
      case 'Career': return 'badge-amber';
      case 'Skill': return 'badge-purple';
      case 'Learning': return 'badge-teal';
      case 'Finance': return 'badge-sage';
      default: return 'badge-blue';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function setTab(tab) {
    activeTab = tab;
    render();
  }

  function adjustGoal(id, delta) {
    const state = Storage.getState();
    const goal = state.goals.find(g => g.id === id);
    if (goal) {
      const step = goal.unit === '$' ? 500 : (goal.target > 50 ? 5 : 1);
      const newCurrent = Math.max(0, Math.min(goal.target, goal.current + (delta * step)));
      Storage.updateGoal(id, { current: newCurrent });
      AudioEngine.playPop();
      render();
      Dashboard.render();
    }
  }

  function toggleMilestone(goalId, milestoneId) {
    AudioEngine.playChime();
    Storage.toggleMilestone(goalId, milestoneId);
    render();
    Dashboard.render();
  }

  function deleteGoal(id) {
    if (confirm('Delete this goal and its milestones?')) {
      Storage.deleteGoal(id);
      render();
      Dashboard.render();
      App.showToast('Goal removed');
    }
  }

  function openAddGoalModal(prefill = {}) {
    const title = prefill.title || '';
    const category = prefill.category || 'Career';
    const timeframe = prefill.timeframe || 'Short-term';
    const target = prefill.target || (prefill.unit === '%' ? 100 : 10);
    const unit = prefill.unit || 'units';

    App.showModal('Create New Goal', `
      <form id="add-goal-form" onsubmit="Goals.handleCreateGoal(event)">
        <div class="form-group">
          <label>Goal Title *</label>
          <input type="text" id="goal-title-input" required value="${escapeHtml(title)}" placeholder="e.g., Read 12 non-fiction books, Learn Python" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Timeframe</label>
            <select id="goal-timeframe-input">
              <option value="Short-term" ${timeframe === 'Short-term' ? 'selected' : ''}>Short-term (< 6 months)</option>
              <option value="Long-term" ${timeframe === 'Long-term' ? 'selected' : ''}>Long-term (1+ year)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Category</label>
            <select id="goal-category-input">
              <option value="Skill" ${category === 'Skill' ? 'selected' : ''}>Skill & Mastery</option>
              <option value="Career" ${category === 'Career' ? 'selected' : ''}>Career & Work</option>
              <option value="Learning" ${category === 'Learning' ? 'selected' : ''}>Learning & Reading</option>
              <option value="Finance" ${category === 'Finance' ? 'selected' : ''}>Finance & Savings</option>
              <option value="Health" ${category === 'Health' ? 'selected' : ''}>Health & Wellness</option>
              <option value="Personal" ${category === 'Personal' ? 'selected' : ''}>Personal Life</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Target Value</label>
            <input type="number" id="goal-target-val" value="${target}" min="1" required />
          </div>
          <div class="form-group">
            <label>Measurement Unit</label>
            <input type="text" id="goal-unit-val" value="${unit}" placeholder="books, km, $, %, problems" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Current Progress</label>
            <input type="number" id="goal-curr-val" value="0" min="0" />
          </div>
          <div class="form-group">
            <label>Target Completion Date</label>
            <input type="date" id="goal-date-val" value="${Storage.getFutureStr(90)}" />
          </div>
        </div>
        <div class="form-group">
          <label>Why this goal matters (Description)</label>
          <textarea id="goal-desc-val" rows="2" placeholder="Purpose, clarity and motivation..."></textarea>
        </div>
        <div class="modal-footer" style="margin-top: 16px; padding: 16px 0 0;">
          <button type="button" class="btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn-primary">Create Goal</button>
        </div>
      </form>
    `);
  }

  function handleCreateGoal(e) {
    e.preventDefault();
    const title = document.getElementById('goal-title-input').value.trim();
    if (!title) return;

    Storage.addGoal({
      title,
      timeframe: document.getElementById('goal-timeframe-input').value,
      category: document.getElementById('goal-category-input').value,
      target: Number(document.getElementById('goal-target-val').value) || 100,
      current: Number(document.getElementById('goal-curr-val').value) || 0,
      unit: document.getElementById('goal-unit-val').value || 'units',
      targetDate: document.getElementById('goal-date-val').value,
      description: document.getElementById('goal-desc-val').value,
      milestones: [
        { id: 'm-' + Date.now() + '-1', title: 'Phase 1 Foundations', completed: false },
        { id: 'm-' + Date.now() + '-2', title: 'Phase 2 Execution Sprint', completed: false },
        { id: 'm-' + Date.now() + '-3', title: 'Phase 3 Final Review & Polish', completed: false }
      ]
    });

    AudioEngine.playPop();
    App.closeModal();
    render();
    Dashboard.render();
    App.showToast('Goal created with milestone roadmap');
  }

  return {
    render,
    setTab,
    adjustGoal,
    toggleMilestone,
    deleteGoal,
    openAddGoalModal,
    handleCreateGoal
  };
})();

