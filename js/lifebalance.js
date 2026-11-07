/**
 * Life Balance Dashboard Controller
 * Interactive 7-Dimension Wheel of Life using mathematical SVG radar chart
 * Tracks: Academics, Career, Health, Fitness, Relationships, Personal development, Hobbies
 * Saves historical reviews and calculates balance harmony scores over time.
 */
const LifeBalance = (() => {
  const DIMENSIONS = [
    'Academics',
    'Career',
    'Health',
    'Fitness',
    'Relationships',
    'Personal development',
    'Hobbies'
  ];

  let currentRatings = {};

  function initRatings() {
    const state = Storage.getState();
    const saved = (state.lifeBalance && state.lifeBalance.dimensions) || {};
    DIMENSIONS.forEach(d => {
      currentRatings[d] = saved[d] !== undefined ? saved[d] : 7;
    });
  }

  // Generates SVG coordinates for the 7-dimension polygon
  function calculateRadarPoints(ratings, cx = 180, cy = 180, maxR = 130) {
    const total = DIMENSIONS.length;
    const points = [];
    const axisLines = [];

    DIMENSIONS.forEach((dim, idx) => {
      const angle = (idx * 2 * Math.PI / total) - (Math.PI / 2);
      const val = ratings[dim] || 5;
      const r = (val / 10) * maxR;

      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      points.push(`${px.toFixed(1)},${py.toFixed(1)}`);

      // Outer end of axis
      const endX = cx + maxR * Math.cos(angle);
      const endY = cy + maxR * Math.sin(angle);
      axisLines.push({
        x1: cx, y1: cy,
        x2: endX.toFixed(1), y2: endY.toFixed(1),
        label: dim,
        labelX: (cx + (maxR + 24) * Math.cos(angle)).toFixed(1),
        labelY: (cy + (maxR + 24) * Math.sin(angle)).toFixed(1),
        val
      });
    });

    return {
      polygonPoints: points.join(' '),
      axisLines
    };
  }

  function renderConcentricWeb(cx = 180, cy = 180, maxR = 130) {
    const levels = [2, 4, 6, 8, 10];
    const total = DIMENSIONS.length;

    return levels.map(lvl => {
      const r = (lvl / 10) * maxR;
      const pts = [];
      for (let i = 0; i < total; i++) {
        const angle = (i * 2 * Math.PI / total) - (Math.PI / 2);
        pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
      }
      return `
        <polygon points="${pts.join(' ')}"
          fill="none"
          stroke="var(--border-medium)"
          stroke-dasharray="${lvl === 10 ? 'none' : '3,3'}"
          stroke-width="1"
        />
      `;
    }).join('');
  }

  function render() {
    const container = document.getElementById('balance-view');
    if (!container) return;
    initRatings();

    const state = Storage.getState();
    const history = (state.lifeBalance && state.lifeBalance.history) || [];

    // Calculate Balance Harmony Score: 100 - (stdDev * 12)
    const values = Object.values(currentRatings);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const balanceScore = Math.max(20, Math.min(100, Math.round(100 - (stdDev * 12))));

    // Identify lowest dimension and highest dimension
    let lowest = DIMENSIONS[0];
    let highest = DIMENSIONS[0];
    DIMENSIONS.forEach(d => {
      if (currentRatings[d] < currentRatings[lowest]) lowest = d;
      if (currentRatings[d] > currentRatings[highest]) highest = d;
    });

    const radar = calculateRadarPoints(currentRatings);

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:24px;">
        <!-- Header -->
        <div class="card" style="background: linear-gradient(135deg, var(--sage-50), var(--bg-card)); border-color:var(--sage-200);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span style="font-size:1.4rem;">☸️</span>
                <h3 style="font-family:var(--font-serif); font-size:1.35rem; color:var(--text-main);">Life Balance Dashboard</h3>
              </div>
              <p style="font-size:0.88rem; color:var(--text-muted); max-width:640px;">
                Evaluate your equilibrium across 7 life dimensions. A balanced wheel rolls smoothly through life; sharp spikes and valleys create friction.
              </p>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Balance Harmony Score</div>
              <div style="font-family:var(--font-serif); font-size:2.2rem; font-weight:700; color:var(--sage-700); line-height:1.1;">
                ${balanceScore}%
              </div>
              <span class="badge ${balanceScore >= 80 ? 'badge-teal' : balanceScore >= 60 ? 'badge-amber' : 'badge-rose'}">
                ${balanceScore >= 80 ? 'Harmonious Equilibrium' : balanceScore >= 60 ? 'Moderate Variance' : 'Needs Realignment'}
              </span>
            </div>
          </div>
        </div>

        <!-- Two Column Wheel & Sliders -->
        <div class="dashboard-columns">
          <!-- Left: SVG Wheel -->
          <div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:28px 16px;">
            <h4 style="font-family:var(--font-serif); font-size:1.1rem; color:var(--text-main); margin-bottom:12px;">Visual Wheel of Life</h4>
            <div style="position:relative; width:380px; height:380px; max-width:100%;">
              <svg width="380" height="380" viewBox="0 0 360 360" style="overflow:visible; display:block; margin:auto;">
                <!-- Concentric Webs -->
                ${renderConcentricWeb()}

                <!-- Axis Lines -->
                ${radar.axisLines.map(line => `
                  <line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="var(--border-medium)" stroke-width="1.2" />
                  <text x="${line.labelX}" y="${line.labelY}"
                    font-size="10.5"
                    font-family="system-ui, sans-serif"
                    font-weight="600"
                    fill="var(--text-muted)"
                    text-anchor="middle"
                    dominant-baseline="central">
                    ${line.label} (${line.val})
                  </text>
                `).join('')}

                <!-- Active Polygon Area -->
                <polygon points="${radar.polygonPoints}"
                  fill="rgba(77, 107, 83, 0.28)"
                  stroke="var(--sage-500)"
                  stroke-width="2.5"
                  stroke-linejoin="round"
                />

                <!-- Data Vertex Dots -->
                ${radar.polygonPoints.split(' ').map(pt => {
                  const [px, py] = pt.split(',');
                  return `<circle cx="${px}" cy="${py}" r="4.5" fill="var(--sage-600)" stroke="white" stroke-width="1.5" />`;
                }).join('')}
              </svg>
            </div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-top:16px; text-align:center;">
              Strongest: <strong style="color:var(--sage-600);">${highest} (${currentRatings[highest]}/10)</strong> • 
              Attention Needed: <strong style="color:var(--pastel-rose-text);">${lowest} (${currentRatings[lowest]}/10)</strong>
            </div>
          </div>

          <!-- Right: Interactive Sliders Form -->
          <div class="card">
            <div class="card-header">
              <h4 class="card-title"><span>🎚</span> Rate Satisfaction (1 - 10)</h4>
              <button class="btn-primary" onclick="LifeBalance.saveSnapshot()">Save Review (+50 XP)</button>
            </div>
            <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:16px;">
              Move the sliders to reflect how fulfilled you feel in each dimension today.
            </p>

            <div style="display:flex; flex-direction:column; gap:14px;">
              ${DIMENSIONS.map(dim => {
                const val = currentRatings[dim] || 5;
                return `
                  <div style="display:flex; flex-direction:column; gap:4px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.86rem; font-weight:600;">
                      <span>${dim}</span>
                      <span id="label-dim-${dim.replace(/\s+/g, '-')}" style="color:var(--sage-600); font-weight:700;">${val}/10</span>
                    </div>
                    <input type="range" min="1" max="10" step="1" value="${val}"
                      oninput="LifeBalance.onSliderInput('${dim}', this.value)"
                      style="accent-color:var(--sage-500);" />
                  </div>
                `;
              }).join('')}
            </div>

            <div class="form-group" style="margin-top:16px;">
              <label>Reflections & Notes for this snapshot</label>
              <textarea id="balance-review-notes" rows="2" placeholder="What factors shaped your ratings this period?"></textarea>
            </div>
          </div>
        </div>

        <!-- Balance History Over Time -->
        <div class="card">
          <div class="card-header">
            <h4 class="card-title"><span>📜</span> Balance Evaluations Over Time</h4>
            <span class="badge badge-sage">${history.length} Reviews Logged</span>
          </div>
          <div class="mini-item-list">
            ${history.length === 0 ? `
              <div style="text-align:center; padding:24px; color:var(--text-muted);">No historical evaluations yet. Save your first review above!</div>
            ` : history.map(snap => `
              <div class="mini-task-item" style="padding:14px 18px;">
                <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <span class="badge badge-teal">Harmony: ${snap.balanceScore}%</span>
                    <span style="font-size:0.82rem; color:var(--text-muted);">${snap.date}</span>
                  </div>
                  ${snap.notes ? `<p style="font-size:0.84rem; color:var(--text-main); margin-top:2px;">"${escapeHtml(snap.notes)}"</p>` : ''}
                  <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:4px;">
                    ${Object.entries(snap.ratings || {}).map(([d, r]) => `
                      <span style="font-size:0.72rem; background:var(--bg-card); border:1px solid var(--border-light); padding:2px 6px; border-radius:4px;">
                        ${d}: <strong>${r}</strong>
                      </span>
                    `).join('')}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function onSliderInput(dimension, val) {
    currentRatings[dimension] = parseInt(val);
    const label = document.getElementById(`label-dim-${dimension.replace(/\s+/g, '-')}`);
    if (label) label.textContent = `${val}/10`;

    // Re-render radar points dynamically
    const radar = calculateRadarPoints(currentRatings);
    const poly = document.querySelector('#balance-view polygon[fill*="rgba"]');
    if (poly) poly.setAttribute('points', radar.polygonPoints);
  }

  function saveSnapshot() {
    const notes = document.getElementById('balance-review-notes') ? document.getElementById('balance-review-notes').value : '';
    Storage.saveLifeBalance(currentRatings, notes);
    AudioEngine.playChime();
    if (App.launchConfetti) App.launchConfetti();
    App.showToast('Life balance review recorded (+50 XP)');
    render();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return {
    render,
    onSliderInput,
    saveSnapshot
  };
})();

