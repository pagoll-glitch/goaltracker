/**
 * Tasks Controller
 * CRUD, search, filter (pending, completed, overdue, today),
 * sort, view mode (List vs Kanban board), and progress bar.
 */
const Tasks = (() => {
  let currentFilter = 'all'; // 'all', 'today', 'pending', 'completed', 'overdue'
  let currentCategory = 'all'; // 'all', 'Personal', 'Work', 'Study', 'Health', 'Other'
  let currentViewMode = 'list'; // 'list' or 'kanban'
  let searchQuery = '';
  let sortBy = 'dueDate'; // 'dueDate', 'priority', 'title'

  function getFilteredTasks(tasks) {
    const today = Storage.getTodayStr();

    return tasks.filter(task => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesNotes = (task.notes || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesNotes) return false;
      }

      // Category
      if (currentCategory !== 'all' && task.category !== currentCategory) {
        return false;
      }

      // Filter status
      if (currentFilter === 'pending' && task.completed) return false;
      if (currentFilter === 'completed' && !task.completed) return false;
      if (currentFilter === 'today' && task.dueDate !== today) return false;
      if (currentFilter === 'overdue' && (task.completed || task.dueDate >= today)) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'dueDate') {
        return (a.dueDate + (a.dueTime || '')).localeCompare(b.dueDate + (b.dueTime || ''));
      }
      if (sortBy === 'priority') {
        const pOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        return (pOrder[a.priority] || 4) - (pOrder[b.priority] || 4);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }

  function render() {
    const container = document.getElementById('tasks-view');
    if (!container) return;
    const state = Storage.getState();
    const allTasks = state.tasks || [];
    const filteredTasks = getFilteredTasks(allTasks);

    // Summary calculation
    const totalCount = allTasks.length;
    const completedCount = allTasks.filter(t => t.completed).length;
    const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    container.innerHTML = `
      <!-- Header Controls -->
      <div class="view-header-bar">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" id="task-search-input" placeholder="Search tasks or notes..." value="${escapeHtml(searchQuery)}" />
        </div>

        <div class="view-controls">
          <div class="filter-pills">
            <button class="filter-pill ${currentFilter === 'all' ? 'active' : ''}" onclick="Tasks.setFilter('all')">All</button>
            <button class="filter-pill ${currentFilter === 'today' ? 'active' : ''}" onclick="Tasks.setFilter('today')">Today</button>
            <button class="filter-pill ${currentFilter === 'pending' ? 'active' : ''}" onclick="Tasks.setFilter('pending')">Pending</button>
            <button class="filter-pill ${currentFilter === 'completed' ? 'active' : ''}" onclick="Tasks.setFilter('completed')">Done</button>
            <button class="filter-pill ${currentFilter === 'overdue' ? 'active' : ''}" onclick="Tasks.setFilter('overdue')">Overdue</button>
          </div>

          <select id="task-category-filter" onchange="Tasks.setCategory(this.value)">
            <option value="all" ${currentCategory === 'all' ? 'selected' : ''}>All Categories</option>
            <option value="Personal" ${currentCategory === 'Personal' ? 'selected' : ''}>Personal</option>
            <option value="Work" ${currentCategory === 'Work' ? 'selected' : ''}>Work</option>
            <option value="Study" ${currentCategory === 'Study' ? 'selected' : ''}>Study</option>
            <option value="Health" ${currentCategory === 'Health' ? 'selected' : ''}>Health</option>
            <option value="Other" ${currentCategory === 'Other' ? 'selected' : ''}>Other</option>
          </select>

          <select id="task-sort-by" onchange="Tasks.setSortBy(this.value)">
            <option value="dueDate" ${sortBy === 'dueDate' ? 'selected' : ''}>Sort: Due Date</option>
            <option value="priority" ${sortBy === 'priority' ? 'selected' : ''}>Sort: Priority</option>
            <option value="title" ${sortBy === 'title' ? 'selected' : ''}>Sort: Title</option>
          </select>

          <div class="view-mode-toggle">
            <button class="mode-btn ${currentViewMode === 'list' ? 'active' : ''}" onclick="Tasks.setViewMode('list')" title="List View">☰ List</button>
            <button class="mode-btn ${currentViewMode === 'kanban' ? 'active' : ''}" onclick="Tasks.setViewMode('kanban')" title="Kanban Board">☷ Board</button>
          </div>

          <button class="btn-primary" onclick="Tasks.openAddTaskModal()">+ New Task</button>
        </div>
      </div>

      <!-- Completion Progress Bar -->
      <div class="progress-summary-card">
        <div class="progress-header">
          <span>Overall Task Completion</span>
          <span>${completedCount} of ${totalCount} completed (${completionPercent}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar-fill" style="width: ${completionPercent}%;"></div>
        </div>
      </div>

      <!-- Main Tasks Content: List View or Kanban View -->
      ${currentViewMode === 'list' ? renderListView(filteredTasks, allTasks.length) : renderKanbanView(allTasks)}
    `;

    // Bind search event
    const searchInput = document.getElementById('task-search-input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        searchQuery = e.target.value;
        render();
        // Restore focus and cursor position
        const updatedInput = document.getElementById('task-search-input');
        if (updatedInput) {
          updatedInput.focus();
          updatedInput.setSelectionRange(searchQuery.length, searchQuery.length);
        }
      };
    }
  }

  function renderListView(tasks, totalAllTasks = 0) {
    if (totalAllTasks === 0) {
      return `
        <div class="card empty-state-card" style="text-align:center; padding: 56px 24px; border: 2px dashed var(--border-medium); background: var(--bg-surface);">
          <div style="font-size: 3rem; margin-bottom: 14px;">📝</div>
          <h3 style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--text-main); margin-bottom: 8px;">
            Start with a Clean Slate
          </h3>
          <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto 24px; line-height: 1.6; font-size: 0.95rem;">
            You don't have any tasks scheduled yet. Goal It Up gives you complete freedom to add whatever you want to get done today or this week!
          </p>
          <button class="btn-primary" onclick="Tasks.openAddTaskModal()" style="font-size: 1rem; padding: 12px 28px; margin-bottom: 24px;">
            ✨ + Add Your First Task
          </button>
          
          <div style="border-top: 1px solid var(--border-light); max-width: 540px; margin: 0 auto; padding-top: 20px;">
            <p style="font-size: 0.82rem; color: var(--text-subtle); margin-bottom: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
              Quick Starter Ideas
            </p>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
              <button class="filter-pill" onclick="Tasks.openAddTaskModal({ title: 'Plan my weekly schedule', category: 'Work', priority: 'High' })">💼 Plan weekly schedule</button>
              <button class="filter-pill" onclick="Tasks.openAddTaskModal({ title: 'Complete study session for 1 hour', category: 'Study', priority: 'Medium' })">🧠 1-hr study session</button>
              <button class="filter-pill" onclick="Tasks.openAddTaskModal({ title: 'Go for a 30-min walk / workout', category: 'Health', priority: 'Medium' })">🏃 30-min workout</button>
              <button class="filter-pill" onclick="Tasks.openAddTaskModal({ title: 'Call family or friend', category: 'Personal', priority: 'Low' })">🌿 Personal catch-up</button>
            </div>
          </div>
        </div>
      `;
    }

    if (tasks.length === 0) {
      return `
        <div class="card" style="text-align:center; padding: 48px; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
          <h4 style="font-family: var(--font-serif); font-size: 1.25rem; color: var(--text-main);">No tasks match this filter</h4>
          <p style="margin-top: 6px;">Try switching to "All" tasks or clear your search query.</p>
          <button class="btn-secondary" style="margin-top: 14px;" onclick="Tasks.setFilter('all'); Tasks.setCategory('all');">Clear Filters</button>
        </div>
      `;
    }

    const todayStr = Storage.getTodayStr();

    return `
      <div class="tasks-container">
        ${tasks.map(t => {
          const isOverdue = !t.completed && t.dueDate < todayStr;
          return `
            <div class="task-item ${t.completed ? 'completed' : ''}">
              <div class="task-main-col">
                <div class="custom-checkbox ${t.completed ? 'checked' : ''}" onclick="Tasks.toggleTask('${t.id}')">
                  ${t.completed ? '✓' : ''}
                </div>
                <div class="task-content">
                  <h4 style="${t.completed ? 'text-decoration: line-through; color: var(--text-subtle);' : ''}">${escapeHtml(t.title)}</h4>
                  ${t.notes ? `<p>${escapeHtml(t.notes)}</p>` : ''}
                  <div class="task-meta" style="margin-top: 8px;">
                    <span class="badge ${getCategoryBadgeClass(t.category)}">${t.category}</span>
                    <span class="badge ${getPriorityBadgeClass(t.priority)}">${t.priority} Priority</span>
                    <span class="badge ${isOverdue ? 'badge-rose' : 'badge-sage'}">
                      📅 ${t.dueDate} at ${t.dueTime || '12:00'} ${isOverdue ? '(Overdue)' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div class="task-actions">
                <button class="action-icon-btn" onclick="Tasks.openEditTaskModal('${t.id}')" title="Edit task">✎</button>
                <button class="action-icon-btn delete" onclick="Tasks.deleteTask('${t.id}')" title="Delete task">🗑</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderKanbanView(allTasks) {
    if (allTasks.length === 0) {
      return `
        <div class="card empty-state-card" style="text-align:center; padding: 56px 24px; border: 2px dashed var(--border-medium); background: var(--bg-surface);">
          <div style="font-size: 3rem; margin-bottom: 14px;">☷</div>
          <h3 style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--text-main); margin-bottom: 8px;">
            Your Kanban Board is Ready
          </h3>
          <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto 24px; line-height: 1.6; font-size: 0.95rem;">
            You have no tasks yet. Add your first task and it will automatically be organized across To Do, In Progress, and Done!
          </p>
          <button class="btn-primary" onclick="Tasks.openAddTaskModal()" style="font-size: 1rem; padding: 12px 28px;">
            ✨ + Add Your First Task
          </button>
        </div>
      `;
    }

    const todayStr = Storage.getTodayStr();

    // Group tasks: To Do, In Progress (tasks due today not done), Done
    const todoTasks = allTasks.filter(t => !t.completed && t.dueDate > todayStr);
    const inProgressTasks = allTasks.filter(t => !t.completed && t.dueDate <= todayStr);
    const doneTasks = allTasks.filter(t => t.completed);

    const renderColumn = (title, count, tasks, colColor) => `
      <div class="kanban-column">
        <div class="kanban-col-header">
          <h4><span class="badge ${colColor}">${count}</span> ${title}</h4>
        </div>
        <div class="kanban-tasks-list">
          ${tasks.length === 0 ? `
            <div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding: 20px;">No items</div>
          ` : tasks.map(t => `
            <div class="kanban-card">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <span class="badge ${getCategoryBadgeClass(t.category)}">${t.category}</span>
                <span class="badge ${getPriorityBadgeClass(t.priority)}">${t.priority}</span>
              </div>
              <div style="font-size:0.92rem; font-weight:600; color:var(--text-main); ${t.completed ? 'text-decoration: line-through;' : ''}">${escapeHtml(t.title)}</div>
              ${t.notes ? `<div style="font-size:0.78rem; color:var(--text-muted);">${escapeHtml(t.notes)}</div>` : ''}
              <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-light); padding-top:8px; margin-top:4px;">
                <span style="font-size:0.74rem; color:var(--text-muted);">Due ${t.dueDate}</span>
                <button class="action-icon-btn" onclick="Tasks.toggleTask('${t.id}')" title="Toggle status">
                  ${t.completed ? '↩' : '✓'}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    return `
      <div class="kanban-board">
        ${renderColumn('Upcoming / Backlog', todoTasks.length, todoTasks, 'badge-blue')}
        ${renderColumn('In Progress / Due Today', inProgressTasks.length, inProgressTasks, 'badge-amber')}
        ${renderColumn('Completed', doneTasks.length, doneTasks, 'badge-teal')}
      </div>
    `;
  }

  function getCategoryBadgeClass(cat) {
    switch (cat) {
      case 'Work': return 'badge-amber';
      case 'Study': return 'badge-purple';
      case 'Health': return 'badge-teal';
      case 'Personal': return 'badge-blue';
      default: return 'badge-sage';
    }
  }

  function getPriorityBadgeClass(priority) {
    switch (priority) {
      case 'High': return 'badge-rose';
      case 'Medium': return 'badge-amber';
      default: return 'badge-blue';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function toggleTask(id) {
    AudioEngine.playPop();
    Storage.toggleTask(id);
    render();
    Dashboard.render();
  }

  function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
      Storage.deleteTask(id);
      render();
      Dashboard.render();
      App.showToast('Task deleted');
    }
  }

  function openAddTaskModal(prefill = {}) {
    const defaultTitle = prefill.title || '';
    const defaultCat = prefill.category || 'Personal';
    const defaultPriority = prefill.priority || 'Medium';
    const defaultDate = prefill.dueDate || Storage.getTodayStr();
    const defaultTime = prefill.dueTime || '12:00';
    const defaultNotes = prefill.notes || '';

    App.showModal('Create New Task', `
      <form id="add-task-form" onsubmit="Tasks.handleCreateTaskSubmit(event)">
        <div class="form-group">
          <label>Task Title *</label>
          <input type="text" id="task-title-input" required placeholder="e.g., Complete System Architecture specification" value="${escapeHtml(defaultTitle)}" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Category</label>
            <select id="task-cat-input">
              <option value="Personal" ${defaultCat === 'Personal' ? 'selected' : ''}>Personal</option>
              <option value="Work" ${defaultCat === 'Work' ? 'selected' : ''}>Work</option>
              <option value="Study" ${defaultCat === 'Study' ? 'selected' : ''}>Study</option>
              <option value="Health" ${defaultCat === 'Health' ? 'selected' : ''}>Health</option>
              <option value="Other" ${defaultCat === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select id="task-prio-input">
              <option value="High" ${defaultPriority === 'High' ? 'selected' : ''}>High</option>
              <option value="Medium" ${defaultPriority === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="Low" ${defaultPriority === 'Low' ? 'selected' : ''}>Low</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Due Date</label>
            <input type="date" id="task-date-input" value="${defaultDate}" />
          </div>
          <div class="form-group">
            <label>Due Time</label>
            <input type="time" id="task-time-input" value="${defaultTime}" />
          </div>
        </div>
        <div class="form-group">
          <label>Description & Notes</label>
          <textarea id="task-notes-input" rows="3" placeholder="Context, details, checklists...">${escapeHtml(defaultNotes)}</textarea>
        </div>
        <div class="modal-footer" style="margin-top: 16px; padding: 16px 0 0;">
          <button type="button" class="btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn-primary">Create Task</button>
        </div>
      </form>
    `);
    setTimeout(() => {
      const input = document.getElementById('task-title-input');
      if (input) {
        input.focus();
        if (defaultTitle) input.select();
      }
    }, 50);
  }

  function handleCreateTaskSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('task-title-input').value.trim();
    if (!title) return;

    Storage.addTask({
      title,
      category: document.getElementById('task-cat-input').value,
      priority: document.getElementById('task-prio-input').value,
      dueDate: document.getElementById('task-date-input').value,
      dueTime: document.getElementById('task-time-input').value,
      notes: document.getElementById('task-notes-input').value
    });

    AudioEngine.playPop();
    App.closeModal();
    render();
    Dashboard.render();
    App.showToast('New task added successfully');
  }

  function openEditTaskModal(id) {
    const state = Storage.getState();
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    App.showModal('Edit Task', `
      <form id="edit-task-form" onsubmit="Tasks.handleEditTaskSubmit(event, '${id}')">
        <div class="form-group">
          <label>Task Title *</label>
          <input type="text" id="task-edit-title" required value="${escapeHtml(task.title)}" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Category</label>
            <select id="task-edit-cat">
              <option value="Personal" ${task.category === 'Personal' ? 'selected' : ''}>Personal</option>
              <option value="Work" ${task.category === 'Work' ? 'selected' : ''}>Work</option>
              <option value="Study" ${task.category === 'Study' ? 'selected' : ''}>Study</option>
              <option value="Health" ${task.category === 'Health' ? 'selected' : ''}>Health</option>
              <option value="Other" ${task.category === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select id="task-edit-prio">
              <option value="High" ${task.priority === 'High' ? 'selected' : ''}>High</option>
              <option value="Medium" ${task.priority === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="Low" ${task.priority === 'Low' ? 'selected' : ''}>Low</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Due Date</label>
            <input type="date" id="task-edit-date" value="${task.dueDate}" />
          </div>
          <div class="form-group">
            <label>Due Time</label>
            <input type="time" id="task-edit-time" value="${task.dueTime || '12:00'}" />
          </div>
        </div>
        <div class="form-group">
          <label>Description & Notes</label>
          <textarea id="task-edit-notes" rows="3">${escapeHtml(task.notes || '')}</textarea>
        </div>
        <div class="modal-footer" style="margin-top: 16px; padding: 16px 0 0;">
          <button type="button" class="btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn-primary">Save Changes</button>
        </div>
      </form>
    `);
  }

  function handleEditTaskSubmit(e, id) {
    e.preventDefault();
    Storage.updateTask(id, {
      title: document.getElementById('task-edit-title').value.trim(),
      category: document.getElementById('task-edit-cat').value,
      priority: document.getElementById('task-edit-prio').value,
      dueDate: document.getElementById('task-edit-date').value,
      dueTime: document.getElementById('task-edit-time').value,
      notes: document.getElementById('task-edit-notes').value
    });

    AudioEngine.playPop();
    App.closeModal();
    render();
    Dashboard.render();
    App.showToast('Task updated');
  }

  return {
    render,
    setFilter(filter) { currentFilter = filter; render(); },
    setCategory(cat) { currentCategory = cat; render(); },
    setSortBy(s) { sortBy = s; render(); },
    setViewMode(mode) { currentViewMode = mode; render(); },
    toggleTask,
    deleteTask,
    openAddTaskModal,
    handleCreateTaskSubmit,
    openEditTaskModal,
    handleEditTaskSubmit
  };
})();

