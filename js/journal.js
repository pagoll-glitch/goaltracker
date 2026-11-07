/**
 * Journal & Notes Controller
 * Daily reflections, gratitude prompts, daily wins, mood tracker,
 * and sticky notes board.
 */
const Journal = (() => {
  let selectedDate = Storage.getTodayStr();
  let currentMood = 'good';

  function render() {
    const container = document.getElementById('journal-view');
    if (!container) return;
    const state = Storage.getState();

    // Find entry for selected date
    const entry = state.journalEntries.find(j => j.date === selectedDate) || {
      date: selectedDate,
      mood: 'good',
      reflection: '',
      wins: '',
      gratitude: '',
      lessons: ''
    };

    currentMood = entry.mood || 'good';
    const notes = state.notes || [];

    container.innerHTML = `
      <div class="journal-layout">
        <!-- Left: Daily Journal Editor -->
        <div class="journal-editor-card">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div>
              <h3 style="font-family:var(--font-serif); font-size:1.35rem; color:var(--text-main);">Daily Journal & Reflection</h3>
              <p style="font-size:0.84rem; color:var(--text-muted);">Take five mindful minutes to review your day with gratitude.</p>
            </div>
            <div>
              <input type="date" id="journal-date-picker" value="${selectedDate}" onchange="Journal.onDateChange(this.value)" />
            </div>
          </div>

          <!-- Mood Selector -->
          <div style="display:flex; flex-direction:column; gap:8px;">
            <label style="font-size:0.8rem; text-transform:uppercase; font-weight:700; color:var(--text-muted);">How was your day?</label>
            <div class="mood-selector">
              <button type="button" class="mood-btn ${currentMood === 'great' ? 'active' : ''}" onclick="Journal.setMood('great')">✨ Great</button>
              <button type="button" class="mood-btn ${currentMood === 'good' ? 'active' : ''}" onclick="Journal.setMood('good')">🌿 Good</button>
              <button type="button" class="mood-btn ${currentMood === 'neutral' ? 'active' : ''}" onclick="Journal.setMood('neutral')">☁️ Neutral</button>
              <button type="button" class="mood-btn ${currentMood === 'tired' ? 'active' : ''}" onclick="Journal.setMood('tired')">🌙 Tired</button>
              <button type="button" class="mood-btn ${currentMood === 'stressed' ? 'active' : ''}" onclick="Journal.setMood('stressed')">⚡ Stressed</button>
            </div>
          </div>

          <!-- Structured Prompts -->
          <div class="journal-prompt-box">
            <label>💭 Daily Thoughts & Reflection</label>
            <textarea id="journal-reflection" rows="3" placeholder="What stood out today? How did your energy flow?">${escapeHtml(entry.reflection || '')}</textarea>
          </div>

          <div class="journal-prompt-box">
            <label>🏆 Daily Wins & Accomplishments</label>
            <textarea id="journal-wins" rows="2" placeholder="What are 1-3 victories you achieved today?">${escapeHtml(entry.wins || '')}</textarea>
          </div>

          <div class="journal-prompt-box">
            <label>🙏 Gratitude & Appreciation</label>
            <textarea id="journal-gratitude" rows="2" placeholder="Who or what are you deeply grateful for today?">${escapeHtml(entry.gratitude || '')}</textarea>
          </div>

          <div class="journal-prompt-box">
            <label>💡 Key Lesson / Insight</label>
            <textarea id="journal-lessons" rows="2" placeholder="What will you do better or differently tomorrow?">${escapeHtml(entry.lessons || '')}</textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
            <button class="btn-primary" onclick="Journal.saveEntry()">Save Journal Entry</button>
          </div>
        </div>

        <!-- Right: Standalone Quick Notes / Scratchpad -->
        <div style="display:flex; flex-direction:column; gap:20px;">
          <div class="card">
            <div class="card-header">
              <h4 class="card-title"><span>📝</span> Notes & Ideas</h4>
              <button class="btn-secondary" style="padding:6px 14px; font-size:0.8rem;" onclick="Journal.openAddNoteModal()">+ New Note</button>
            </div>
            <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:12px;">Quick thoughts, reading takeaways, and reminders.</p>

            <div style="display:flex; flex-direction:column; gap:12px; max-height: 540px; overflow-y:auto;">
              ${notes.length === 0 ? `
                <div style="text-align:center; padding:24px; color:var(--text-muted); font-size:0.85rem;">No notes yet. Create a note to pin ideas here!</div>
              ` : notes.map(n => `
                <div class="note-card ${n.pinned ? 'pinned' : ''}">
                  <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                      <span class="badge badge-sage">${escapeHtml(n.category || 'General')}</span>
                      <div class="task-actions">
                        <button class="action-icon-btn" onclick="Journal.togglePinNote('${n.id}')" title="${n.pinned ? 'Unpin' : 'Pin note'}">${n.pinned ? '📌' : '📍'}</button>
                        <button class="action-icon-btn delete" onclick="Journal.deleteNote('${n.id}')" title="Delete note">🗑</button>
                      </div>
                    </div>
                    <h4>${escapeHtml(n.title)}</h4>
                    <p>${escapeHtml(n.content)}</p>
                  </div>
                  <div style="font-size:0.72rem; color:var(--text-muted); border-top:1px solid var(--border-light); padding-top:6px; margin-top:8px;">
                    Updated ${n.updatedAt}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function onDateChange(date) {
    selectedDate = date;
    render();
  }

  function setMood(mood) {
    currentMood = mood;
    render();
  }

  function saveEntry() {
    const reflection = document.getElementById('journal-reflection').value;
    const wins = document.getElementById('journal-wins').value;
    const gratitude = document.getElementById('journal-gratitude').value;
    const lessons = document.getElementById('journal-lessons').value;

    Storage.saveJournalEntry({
      date: selectedDate,
      mood: currentMood,
      reflection,
      wins,
      gratitude,
      lessons
    });

    AudioEngine.playPop();
    App.showToast('Journal entry saved');
    Dashboard.render();
  }

  function openAddNoteModal() {
    App.showModal('Create Quick Note', `
      <form id="add-note-form" onsubmit="Journal.handleCreateNote(event)">
        <div class="form-group">
          <label>Note Title *</label>
          <input type="text" id="note-title-input" required placeholder="e.g., Ideas for Next Sprint" />
        </div>
        <div class="form-group">
          <label>Category / Tag</label>
          <input type="text" id="note-cat-input" value="Idea" placeholder="e.g., Reading, Mindset, Project" />
        </div>
        <div class="form-group">
          <label>Note Content</label>
          <textarea id="note-content-input" rows="4" placeholder="Write your thoughts, bullet points..."></textarea>
        </div>
        <div class="modal-footer" style="margin-top: 16px; padding: 16px 0 0;">
          <button type="button" class="btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn-primary">Save Note</button>
        </div>
      </form>
    `);
  }

  function handleCreateNote(e) {
    e.preventDefault();
    const title = document.getElementById('note-title-input').value.trim();
    if (!title) return;

    Storage.addNote({
      title,
      category: document.getElementById('note-cat-input').value || 'General',
      content: document.getElementById('note-content-input').value
    });

    AudioEngine.playPop();
    App.closeModal();
    render();
    App.showToast('Note saved');
  }

  function togglePinNote(id) {
    const state = Storage.getState();
    const note = state.notes.find(n => n.id === id);
    if (note) {
      Storage.updateNote(id, { pinned: !note.pinned });
      render();
    }
  }

  function deleteNote(id) {
    if (confirm('Delete this note?')) {
      Storage.deleteNote(id);
      render();
      App.showToast('Note deleted');
    }
  }

  return {
    render,
    onDateChange,
    setMood,
    saveEntry,
    openAddNoteModal,
    handleCreateNote,
    togglePinNote,
    deleteNote
  };
})();

