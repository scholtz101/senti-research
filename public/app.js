const API_BASE = '';
let network = null;
let currentData = null;

// --- DOM refs ---
const searchInput = document.getElementById('searchInput');
const searchBtn   = document.getElementById('searchBtn');
const mainContent = document.getElementById('mainContent');
const loadingPanel= document.getElementById('loadingPanel');
const errorPanel  = document.getElementById('errorPanel');
const errorMsg    = document.getElementById('errorMsg');
const statsBar    = document.getElementById('statsBar');
const resultsList = document.getElementById('resultsList');
const resultCount = document.getElementById('resultCount');
const detailPanel = document.getElementById('detailPanel');
const detailTitle = document.getElementById('detailTitle');
const detailBody  = document.getElementById('detailBody');
const graphContainer = document.getElementById('graphContainer');

// --- Event Listeners ---
searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
document.getElementById('fitBtn').addEventListener('click', () => network?.fit());
document.getElementById('closeDetail').addEventListener('click', () => {
  detailPanel.style.display = 'none';
});
document.getElementById('exportBtn').addEventListener('click', exportPNG);

// Parse URL on load
const urlParams = new URLSearchParams(window.location.search);
const initialQuery = urlParams.get('q');
if (initialQuery) {
  searchInput.value = initialQuery;
  doSearch();
}

async function doSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  // Update URL
  window.history.pushState({}, '', `?q=${encodeURIComponent(query)}`);

  show(loadingPanel);
  hide(mainContent);
  hide(errorPanel);
  hide(detailPanel);

  try {
    const resp = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    currentData = data;

    renderStats(data);
    renderResults(data.results);
    renderGraph(data.graph);

    hide(loadingPanel);
    show(mainContent);
  } catch (err) {
    hide(loadingPanel);
    errorMsg.textContent = `Fehler: ${err.message}`;
    show(errorPanel);
  }
}

function renderStats(data) {
  statsBar.innerHTML = '';
  const stats = [
    { number: data.results.length, label: 'Ergebnisse', color: '#ff6b35' },
    { number: data.graph.nodes.length, label: 'Graph-Knoten', color: '#4a90d9' },
    { number: data.graph.edges.length, label: 'Verbindungen', color: '#27ae60' },
    { number: `${data.durationMs}ms`, label: 'Ladezeit', color: '#7f8c8d' }
  ];
  for (const { number, label, color } of stats) {
    const col = document.createElement('div');
    col.className = 'col-6 col-md-3 mb-2';
    col.innerHTML = `
      <div class="stat-card">
        <div class="number" style="color:${color}">${number}</div>
        <div class="label">${label}</div>
      </div>`;
    statsBar.appendChild(col);
  }

  // Source breakdown
  const sourceRow = document.createElement('div');
  sourceRow.className = 'col-12 mb-2';
  const pills = data.sources.map(s =>
    `<span class="badge bg-secondary me-1">${s.name}: ${s.count}</span>`
  ).join('');
  sourceRow.innerHTML = `<div class="p-2">${pills}</div>`;
  statsBar.appendChild(sourceRow);
}

function renderResults(results) {
  resultCount.textContent = results.length;
  resultsList.innerHTML = '';

  if (!results.length) {
    resultsList.innerHTML = '<div class="p-4 text-muted text-center">Keine Ergebnisse gefunden.</div>';
    return;
  }

  for (const item of results) {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.dataset.id = item.id;

    const typeClass = {
      company: 'source-company',
      person: 'source-person',
      entity: 'source-entity',
      organization: 'source-org',
      info: 'source-info'
    }[item.type] || 'source-info';

    const subtitle = item.data?.location || item.data?.description?.slice(0, 60) ||
                     item.data?.jurisdiction || item.data?.country || '';

    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <div class="fw-semibold">${escapeHtml(item.label || '')}</div>
          ${subtitle ? `<div class="text-muted small">${escapeHtml(subtitle)}</div>` : ''}
        </div>
        <div class="ms-2 d-flex flex-column align-items-end gap-1">
          <span class="badge ${typeClass} text-white">${item.type}</span>
          <span class="badge bg-light text-dark border">${item.source}</span>
        </div>
      </div>`;

    div.addEventListener('click', () => showDetail(item, div));
    resultsList.appendChild(div);
  }
}

function showDetail(item, el) {
  // Deactivate others
  document.querySelectorAll('.result-item').forEach(d => d.classList.remove('active'));
  el.classList.add('active');

  detailTitle.textContent = item.label || 'Detail';
  detailBody.innerHTML = '';

  // Highlight node in graph
  if (network) {
    try { network.selectNodes([item.id]); } catch {}
    try { network.focus(item.id, { animation: true, scale: 1.2 }); } catch {}
  }

  const rows = Object.entries(item.data || {})
    .filter(([, v]) => v !== null && v !== undefined && v !== '');

  if (!rows.length) {
    detailBody.innerHTML = '<p class="text-muted">Keine Details verfügbar.</p>';
  } else {
    const table = document.createElement('div');
    for (const [k, v] of rows) {
      const row = document.createElement('div');
      row.className = 'detail-row';
      const isUrl = typeof v === 'string' && v.startsWith('http');
      row.innerHTML = `
        <div class="detail-key">${escapeHtml(k)}</div>
        <div class="detail-val">${isUrl
          ? `<a href="${escapeHtml(v)}" target="_blank" rel="noopener">${escapeHtml(v)}</a>`
          : escapeHtml(String(v))}</div>`;
      table.appendChild(row);
    }
    detailBody.appendChild(table);
  }

  detailPanel.style.display = '';
}

function renderGraph(graphData) {
  const nodes = new vis.DataSet(graphData.nodes);
  const edges = new vis.DataSet(graphData.edges);

  const options = {
    physics: {
      enabled: true,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -60,
        springLength: 120,
        springConstant: 0.05
      },
      stabilization: { iterations: 150 }
    },
    interaction: {
      hover: true,
      tooltipDelay: 100,
      navigationButtons: true,
      keyboard: true
    },
    nodes: {
      font: { color: '#ffffff', size: 12, strokeWidth: 3, strokeColor: '#000000' },
      borderWidth: 2
    },
    edges: {
      font: { color: '#cccccc', size: 10, strokeWidth: 2, strokeColor: '#000000' },
      arrows: { to: { enabled: true, scaleFactor: 0.6 } },
      smooth: { type: 'dynamic' }
    },
    layout: {
      improvedLayout: true
    }
  };

  if (network) network.destroy();
  network = new vis.Network(graphContainer, { nodes, edges }, options);

  // Click on node → show detail in list
  network.on('click', params => {
    if (!params.nodes.length || !currentData) return;
    const nodeId = params.nodes[0];
    const result = currentData.results.find(r => r.id === nodeId);
    if (!result) return;
    const el = document.querySelector(`.result-item[data-id="${nodeId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      showDetail(result, el);
    }
  });

  // Double-click: open URL if available
  network.on('doubleClick', params => {
    if (!params.nodes.length || !currentData) return;
    const nodeId = params.nodes[0];
    const result = currentData.results.find(r => r.id === nodeId);
    const url = result?.data?.url || result?.data?.opencorporates_url;
    if (url) window.open(url, '_blank');
  });
}

function exportPNG() {
  if (!network) return;
  const canvas = graphContainer.querySelector('canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `senti-research-graph.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function show(el) { el.style.display = ''; }
function hide(el) { el.style.display = 'none'; }
function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
