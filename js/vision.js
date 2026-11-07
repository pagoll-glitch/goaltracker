/**
 * Future Self & Vision Board Controller
 * Life vision statement, 1-year / 3-year / 5-year horizons,
 * aspiration cards with image uploads / presets, and direct link to measurable goals.
 */
const VisionBoard = (() => {
  function render() {
    const container = document.getElementById('vision-view');
    if (!container) return;
    const state = Storage.getState();
    const vision = state.visionBoard || { visionStatement: '', horizons: {}, aspirations: [] };
    const aspirations = vision.aspirations || [];
    const goals = state.goals || [];

    // Calculate overall vision realization score from linked goals
    let linkedGoalCount = 0;
    let totalProgressSum = 0;
    aspirations.forEach(asp => {
      (asp.linkedGoalIds || []).forEach(gId => {
        const goal = goals.find(g => g.id === gId);
        if (goal) {
          linkedGoalCount++;
          totalProgressSum += Math.min(100, (goal.current / goal.target) * 100);
        }
      });
    });

    const aggregateVisionProgress = linkedGoalCount > 0
      ? Math.round(totalProgressSum / linkedGoalCount)
      : 55;

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:24px;">
        <!-- Vision Statement & Horizons Banner -->
        <div class="card" style="background: linear-gradient(135deg, var(--sage-50), var(--bg-card)); border-color:var(--sage-200);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
            <div style="flex:1;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="font-size:1.4rem;">🌌</span>
                <h3 style="font-family:var(--font-serif); font-size:1.45rem; color:var(--text-main);">Future Self & Vision Board</h3>
              </div>
              <p style="font-family:var(--font-serif); font-size:1.1rem; font-style:italic; color:var(--text-main); margin-top:8px; line-height:1.5;">
                "${escapeHtml(vision.visionStatement || 'To architect elegant systems, cultivate vitality, and live with deep purpose.')}"
              </p>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
              <button class="btn-secondary" style="font-size:0.8rem; padding:6px 14px;" onclick="VisionBoard.openEditVisionModal()">
                ✎ Edit Vision Statement
              </button>
              <div style="text-align:right;">
                <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Vision Realization</span>
                <div style="font-family:var(--font-serif); font-size:1.6rem; font-weight:700; color:var(--sage-700);">${aggregateVisionProgress}%</div>
              </div>
            </div>
          </div>

          <!-- 3 Horizon Cards -->
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; margin-top:20px; padding-top:18px; border-top:1px solid var(--border-light);">
            <div class="card" style="background-color:var(--bg-card); padding:16px;">
              <span class="badge badge-teal" style="margin-bottom:6px;">1-Year Horizon</span>
              <div style="font-size:0.86rem; color:var(--text-main); line-height:1.45;">
                ${escapeHtml((vision.horizons && vision.horizons.oneYear) || 'Build core foundations and complete master certifications.')}
              </div>
            </div>

            <div class="card" style="background-color:var(--bg-card); padding:16px;">
              <span class="badge badge-blue" style="margin-bottom:6px;">3-Year Horizon</span>
              <div style="font-size:0.86rem; color:var(--text-main); line-height:1.45;">
                ${escapeHtml((vision.horizons && vision.horizons.threeYear) || 'Scale architectural leadership and attain location freedom.')}
              </div>
            </div>

            <div class="card" style="background-color:var(--bg-card); padding:16px;">
              <span class="badge badge-purple" style="margin-bottom:6px;">5-Year Horizon</span>
              <div style="font-size:0.86rem; color:var(--text-main); line-height:1.45;">
                ${escapeHtml((vision.horizons && vision.horizons.fiveYear) || 'Establish an independent creative studio and mentor next-gen builders.')}
              </div>
            </div>
          </div>
        </div>

        <!-- Aspirations & Inspiration Board -->
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
            <div>
              <h4 style="font-family:var(--font-serif); font-size:1.25rem; color:var(--text-main);">Aspirations & Visual Anchors</h4>
              <p style="font-size:0.82rem; color:var(--text-muted);">Each aspiration is anchored to your measurable goals.</p>
            </div>
            <button class="btn-primary" onclick="VisionBoard.openAddAspirationModal()">+ New Aspiration</button>
          </div>

          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">
            ${aspirations.map(asp => {
              // Find connected goals
              const linkedGoals = (asp.linkedGoalIds || []).map(id => goals.find(g => g.id === id)).filter(Boolean);
              const avgProgress = linkedGoals.length > 0
                ? Math.round(linkedGoals.reduce((a, b) => a + Math.min(100, (b.current / b.target) * 100), 0) / linkedGoals.length)
                : null;

              return `
                <div class="card" style="padding:0; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between;">
                  <!-- Image Banner -->
                  <div style="height:150px; width:100%; position:relative; overflow:hidden; background-color:var(--sage-100);">
                    <img src="${escapeHtml(asp.imageUrl)}" alt="${escapeHtml(asp.title)}"
                      style="width:100%; height:100%; object-fit:cover; transition:transform 0.4s ease;"
                      onerror="this.src='https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80'" />
                    <div style="position:absolute; top:12px; left:12px; display:flex; gap:6px;">
                      <span class="badge badge-sage" style="background:rgba(255,255,255,0.92);">${asp.category}</span>
                      <span class="badge badge-blue" style="background:rgba(255,255,255,0.92);">${asp.horizon}</span>
                    </div>
                    <div style="position:absolute; top:10px; right:10px;">
                      <button class="action-icon-btn delete" style="background:rgba(255,255,255,0.9); border-radius:var(--radius-full);" onclick="VisionBoard.deleteAspiration('${asp.id}')" title="Delete">🗑</button>
                    </div>
                  </div>

                  <!-- Content Body -->
                  <div style="padding:18px; display:flex; flex-direction:column; gap:8px; flex:1;">
                    <h5 style="font-family:var(--font-serif); font-size:1.1rem; font-weight:600; color:var(--text-main);">${escapeHtml(asp.title)}</h5>
                    <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.45;">${escapeHtml(asp.description)}</p>

                    <!-- Connected Goals -->
                    <div style="margin-top:auto; padding-top:12px; border-top:1px solid var(--border-light);">
                      <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px;">
                        <span>Connected Goals (${linkedGoals.length})</span>
                        ${avgProgress !== null ? `<span style="color:var(--sage-700);">${avgProgress}% Realized</span>` : ''}
                      </div>

                      ${linkedGoals.length === 0 ? `
                        <div style="font-size:0.75rem; color:var(--text-subtle);">No linked goals. Link a goal to track progress.</div>
                      ` : linkedGoals.map(g => `
                        <div style="font-size:0.78rem; color:var(--text-main); display:flex; justify-content:space-between; margin-top:2px;">
                          <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">🎯 ${escapeHtml(g.title)}</span>
                          <span style="font-weight:600; color:var(--sage-600);">${Math.round((g.current / g.target) * 100)}%</span>
                        </div>
                      `).join('')}

                      ${avgProgress !== null ? `
                        <div class="progress-track" style="height:6px; margin-top:6px;">
                          <div class="progress-bar-fill" style="width: ${avgProgress}%;"></div>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function openEditVisionModal() {
    const state = Storage.getState();
    const vision = state.visionBoard || {};
    const horizons = vision.horizons || {};

    App.showModal('Refine Ideal Future Vision', `
      <form id="edit-vision-form" onsubmit="VisionBoard.handleSaveVision(event)">
        <div class="form-group">
          <label>Overarching Life Vision Statement *</label>
          <textarea id="vision-statement-input" rows="3" required placeholder="Describe your ideal state of life, craft and being...">${escapeHtml(vision.visionStatement || '')}</textarea>
        </div>
        <div class="form-group">
          <label>1-Year Horizon Focus</label>
          <input type="text" id="horizon-1-input" value="${escapeHtml(horizons.oneYear || '')}" placeholder="Key milestone within 12 months..." />
        </div>
        <div class="form-group">
          <label>3-Year Horizon Focus</label>
          <input type="text" id="horizon-3-input" value="${escapeHtml(horizons.threeYear || '')}" placeholder="Where you stand in 3 years..." />
        </div>
        <div class="form-group">
          <label>5-Year Horizon Focus</label>
          <input type="text" id="horizon-5-input" value="${escapeHtml(horizons.fiveYear || '')}" placeholder="The ultimate multi-year picture..." />
        </div>
        <div class="modal-footer" style="margin-top:16px; padding:16px 0 0;">
          <button type="button" class="btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn-primary">Save Vision</button>
        </div>
      </form>
    `);
  }

  function handleSaveVision(e) {
    e.preventDefault();
    Storage.saveVisionStatement({
      visionStatement: document.getElementById('vision-statement-input').value.trim(),
      horizons: {
        oneYear: document.getElementById('horizon-1-input').value.trim(),
        threeYear: document.getElementById('horizon-3-input').value.trim(),
        fiveYear: document.getElementById('horizon-5-input').value.trim()
      }
    });

    AudioEngine.playPop();
    App.closeModal();
    render();
    App.showToast('Vision statement saved');
  }

  function openAddAspirationModal() {
    const state = Storage.getState();
    const goals = state.goals || [];

    const presetImages = [
      { label: 'Minimalist Workspace', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80' },
      { label: 'Calm Library', url: 'https://images.unsplash.com/photo-1507842229451-7f01be44c067?w=600&auto=format&fit=crop&q=80' },
      { label: 'Sunrise Trail & Vitality', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=80' },
      { label: 'Financial Security', url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&auto=format&fit=crop&q=80' },
      { label: 'Alpine Horizon & Zen', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80' }
    ];

    App.showModal('Create Personal Aspiration', `
      <form id="add-aspiration-form" onsubmit="VisionBoard.handleAddAspiration(event)">
        <div class="form-group">
          <label>Aspiration Title *</label>
          <input type="text" id="asp-title-input" required placeholder="e.g., Publish 3 Technical Essays, Run 10K" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Category</label>
            <select id="asp-cat-input">
              <option value="Career">Career & Mastery</option>
              <option value="Personal development">Personal development</option>
              <option value="Health">Health & Wellness</option>
              <option value="Fitness">Fitness & Vitality</option>
              <option value="Finance">Finance & Freedom</option>
              <option value="Relationships">Relationships</option>
              <option value="Hobbies">Hobbies & Creativity</option>
            </select>
          </div>
          <div class="form-group">
            <label>Time Horizon</label>
            <select id="asp-horizon-input">
              <option value="1-Year">1-Year Horizon</option>
              <option value="3-Year">3-Year Horizon</option>
              <option value="5-Year">5-Year Horizon</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Description & Meaning</label>
          <textarea id="asp-desc-input" rows="2" placeholder="Why does this anchor your ideal future self?"></textarea>
        </div>

        <div class="form-group">
          <label>Inspiration Image Preset</label>
          <select id="asp-preset-select" onchange="document.getElementById('asp-img-url').value = this.value">
            ${presetImages.map(p => `<option value="${p.url}">${p.label}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label>Or Custom Image URL / Upload File</label>
          <input type="text" id="asp-img-url" value="${presetImages[0].url}" placeholder="https://..." />
          <input type="file" id="asp-file-upload" accept="image/*" style="margin-top:6px; font-size:0.8rem;" onchange="VisionBoard.handleFileUpload(event)" />
        </div>

        <div class="form-group">
          <label>Connect to Measurable Goals</label>
          <div style="display:flex; flex-direction:column; gap:6px; max-height:120px; overflow-y:auto; padding:6px; background:var(--bg-card-subtle); border-radius:var(--radius-sm); border:1px solid var(--border-light);">
            ${goals.map(g => `
              <label style="display:flex; align-items:center; gap:8px; font-size:0.84rem; cursor:pointer;">
                <input type="checkbox" name="linkedGoals" value="${g.id}" />
                <span>🎯 ${escapeHtml(g.title)} (${g.current}/${g.target} ${g.unit})</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="modal-footer" style="margin-top:16px; padding:16px 0 0;">
          <button type="button" class="btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn-primary">Create Aspiration</button>
        </div>
      </form>
    `);
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const urlInput = document.getElementById('asp-img-url');
      if (urlInput) urlInput.value = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handleAddAspiration(e) {
    e.preventDefault();
    const title = document.getElementById('asp-title-input').value.trim();
    if (!title) return;

    const checkedGoalBoxes = document.querySelectorAll('input[name="linkedGoals"]:checked');
    const linkedGoalIds = Array.from(checkedGoalBoxes).map(cb => cb.value);

    Storage.addAspiration({
      title,
      category: document.getElementById('asp-cat-input').value,
      horizon: document.getElementById('asp-horizon-input').value,
      description: document.getElementById('asp-desc-input').value,
      imageUrl: document.getElementById('asp-img-url').value,
      linkedGoalIds
    });

    AudioEngine.playPop();
    App.closeModal();
    render();
    App.showToast('Aspiration anchored to vision board');
  }

  function deleteAspiration(id) {
    if (confirm('Delete this aspiration card?')) {
      Storage.deleteAspiration(id);
      render();
      App.showToast('Aspiration removed');
    }
  }

  return {
    render,
    openEditVisionModal,
    handleSaveVision,
    openAddAspirationModal,
    handleFileUpload,
    handleAddAspiration,
    deleteAspiration
  };
})();

