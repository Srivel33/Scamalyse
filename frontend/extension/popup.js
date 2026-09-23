document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tabPasted = document.getElementById('tab-pasted');
  const tabPage = document.getElementById('tab-page');
  const panelPasted = document.getElementById('panel-pasted');
  const panelPage = document.getElementById('panel-page');

  const manualInput = document.getElementById('manual-input');
  // try-sample-btn removed (no demo text in production)
  const clearInputBtn = document.getElementById('clear-input-btn');
  const scanPastedBtn = document.getElementById('scan-pasted-btn');
  const scanPageBtn = document.getElementById('scan-page-btn');

  const inputView = document.getElementById('input-view');
  const loadingView = document.getElementById('loading-view');
  const loadingStep = document.getElementById('loading-step');
  const resultsView = document.getElementById('results-view');
  const errorContainer = document.getElementById('error-container');
  const errorText = document.getElementById('error-text');

  const riskScoreNum = document.getElementById('risk-score-num');
  const riskLevelBadge = document.getElementById('risk-level-badge');
  const riskSummaryText = document.getElementById('risk-summary-text');
  const meterBarFill = document.getElementById('meter-bar-fill');

  const filterAll = document.getElementById('filter-all');
  const filterWarnings = document.getElementById('filter-warnings');
  const filterSafe = document.getElementById('filter-safe');
  const countAll = document.getElementById('count-all');
  const countWarn = document.getElementById('count-warn');
  const countSafe = document.getElementById('count-safe');

  const signalsContainer = document.getElementById('signals-container');
  const copyReportBtn = document.getElementById('copy-report-btn');
  const copyBtnText = document.getElementById('copy-btn-text');
  const resetBtn = document.getElementById('reset-btn');

  // In-memory data store for tab switching
  let currentReport = null;
  let currentFilter = 'all';

  // ── Tab Switching (Input Mode) ──
  tabPasted.addEventListener('click', () => {
    tabPasted.classList.add('is-active');
    tabPage.classList.remove('is-active');
    panelPasted.classList.remove('hidden');
    panelPage.classList.add('hidden');
    hideError();
  });

  tabPage.addEventListener('click', () => {
    tabPage.classList.add('is-active');
    tabPasted.classList.remove('is-active');
    panelPage.classList.remove('hidden');
    panelPasted.classList.add('hidden');
    hideError();
  });

  // ── Clear Input ──
  clearInputBtn.addEventListener('click', () => {
    manualInput.value = '';
    manualInput.focus();
  });

  // ── Scan Triggers ──
  scanPastedBtn.addEventListener('click', () => initiateScan('pasted'));
  scanPageBtn.addEventListener('click', () => initiateScan('page'));
  resetBtn.addEventListener('click', resetUI);

  // ── Filter Chips ──
  filterAll.addEventListener('click', () => setFilter('all'));
  filterWarnings.addEventListener('click', () => setFilter('warnings'));
  filterSafe.addEventListener('click', () => setFilter('safe'));

  function setFilter(filter) {
    currentFilter = filter;
    filterAll.classList.toggle('is-active', filter === 'all');
    filterWarnings.classList.toggle('is-active', filter === 'warnings');
    filterSafe.classList.toggle('is-active', filter === 'safe');
    renderSignalsList();
  }

  // ── Initiate Scan ──
  async function initiateScan(type) {
    hideError();
    inputView.classList.add('hidden');
    resultsView.classList.add('hidden');
    loadingView.classList.remove('hidden');

    // Progressive loading indicator text
    const steps = [
      'Extracting clauses and claims...',
      'Verifying company & domain registry...',
      'Evaluating 20+ fraud rule engines...',
      'Finalizing threat report...'
    ];
    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      if (loadingStep) loadingStep.textContent = steps[stepIndex];
    }, 700);

    try {
      let textToScan = '';
      let sourceUrl = '';

      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) sourceUrl = tab.url;

        if (type === 'page') {
          if (!tab) throw new Error('Could not access active tab.');
          const injection = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => document.body.innerText.substring(0, 4000)
          });
          textToScan = injection?.[0]?.result || '';
        }
      }

      if (type === 'pasted') {
        textToScan = manualInput.value.trim();
      }

      if (!textToScan || textToScan.length < 10) {
        throw new Error('Please enter or paste at least 10 characters to analyze.');
      }

      const report = await callAnalysisApi(textToScan, sourceUrl);
      clearInterval(stepInterval);
      renderResults(report);

    } catch (err) {
      clearInterval(stepInterval);
      showError(err.message || 'An unexpected scan error occurred.');
    }
  }

  // ── API Caller ──
  async function callAnalysisApi(text, url) {
    const formData = new FormData();
    formData.append('opportunity_text', text);
    if (url) formData.append('sender_website', url);

    // Use VITE env var if available (dev), otherwise use production backend
    const BASE = (typeof SCAMALYSE_API_URL !== 'undefined' && SCAMALYSE_API_URL)
      ? SCAMALYSE_API_URL
      : 'https://scamalyse-api.onrender.com';

    const response = await fetch(`${BASE}/api/v1/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Scan server error (HTTP ${response.status}).`);
    }

    return await response.json();
  }

  // ── Render Results ──
  function renderResults(report) {
    currentReport = report;
    loadingView.classList.add('hidden');
    resultsView.classList.remove('hidden');

    const score = report.risk_indicator?.score ?? 0;
    const level = (report.risk_indicator?.level || 'LOW').toUpperCase();

    // 1. Score number
    riskScoreNum.textContent = score;

    // 2. Risk Badge & Meter Color
    riskLevelBadge.className = 'level-badge';
    meterBarFill.style.width = `${Math.min(Math.max(score, 4), 100)}%`;

    if (score >= 70 || level === 'VERY HIGH') {
      riskLevelBadge.textContent = '🚨 VERY HIGH RISK';
      riskLevelBadge.classList.add('badge-danger');
      meterBarFill.style.backgroundColor = '#DC2626';
      riskSummaryText.textContent = 'Strong scam evidence detected. Do not engage or pay.';
    } else if (score >= 50 || level === 'HIGH') {
      riskLevelBadge.textContent = '🔴 HIGH RISK';
      riskLevelBadge.classList.add('badge-danger');
      meterBarFill.style.backgroundColor = '#EF4444';
      riskSummaryText.textContent = 'Multiple serious fraud indicators. Extreme caution advised.';
    } else if (score >= 20 || level === 'MODERATE') {
      riskLevelBadge.textContent = '⚠️ MODERATE RISK';
      riskLevelBadge.classList.add('badge-warning');
      meterBarFill.style.backgroundColor = '#F59E0B';
      riskSummaryText.textContent = 'Warning signals found. Verify claims independently.';
    } else {
      riskLevelBadge.textContent = '🛡️ LOW RISK';
      riskLevelBadge.classList.add('badge-safe');
      meterBarFill.style.backgroundColor = '#10B981';
      riskSummaryText.textContent = 'Standard recruitment language. Proceed with normal caution.';
    }

    // 3. Counts
    const warnings = report.triggered_risk_signals || [];
    const safe = report.safe_signals || [];
    const total = warnings.length + safe.length;

    countAll.textContent = total;
    countWarn.textContent = warnings.length;
    countSafe.textContent = safe.length;

    // Reset filter to 'all' or 'warnings'
    currentFilter = warnings.length > 0 ? 'warnings' : 'all';
    filterAll.classList.toggle('is-active', currentFilter === 'all');
    filterWarnings.classList.toggle('is-active', currentFilter === 'warnings');
    filterSafe.classList.toggle('is-active', currentFilter === 'safe');

    renderSignalsList();
  }

  // ── Render Filtered Signals Feed ──
  function renderSignalsList() {
    if (!currentReport) return;
    signalsContainer.innerHTML = '';

    const warnings = currentReport.triggered_risk_signals || [];
    const safe = currentReport.safe_signals || [];

    let itemsToRender = [];
    if (currentFilter === 'warnings') {
      itemsToRender = warnings.map(w => ({ ...w, isSafe: false }));
    } else if (currentFilter === 'safe') {
      itemsToRender = safe.map(s => ({ ...s, isSafe: true }));
    } else {
      itemsToRender = [
        ...warnings.map(w => ({ ...w, isSafe: false })),
        ...safe.map(s => ({ ...s, isSafe: true }))
      ];
    }

    if (itemsToRender.length === 0) {
      signalsContainer.innerHTML = '<p style="text-align:center; padding: 20px; font-size: 0.78rem; color: rgba(255,255,255,0.4);">No indicators in this view.</p>';
      return;
    }

    itemsToRender.forEach(item => {
      const card = document.createElement('div');
      card.className = `ext-signal-card ${item.isSafe ? 'card-safe' : ''}`;

      const ptsClass = item.isSafe ? 'pts-green' : 'pts-red';
      const ptsPrefix = item.isSafe ? '−' : '+';
      const ptsVal = item.points || (item.isSafe ? 10 : 15);

      let quoteHtml = '';
      if (item.evidence_quote) {
        quoteHtml = `<div class="sig-quote">“${escapeHtml(item.evidence_quote)}”</div>`;
      }

      card.innerHTML = `
        <div class="sig-header-row">
          <h4 class="sig-title">${item.isSafe ? '🛡️' : '⚠️'} ${escapeHtml(item.title)}</h4>
          <span class="sig-points-badge ${ptsClass}">${ptsPrefix}${ptsVal} pts</span>
        </div>
        ${quoteHtml}
        <p class="sig-desc">${escapeHtml(item.explanation || '')}</p>
      `;

      signalsContainer.appendChild(card);
    });
  }

  // ── Copy Summary Report ──
  copyReportBtn.addEventListener('click', () => {
    if (!currentReport) return;
    const score = currentReport.risk_indicator?.score ?? 0;
    const level = currentReport.risk_indicator?.level ?? 'UNKNOWN';
    const warnings = currentReport.triggered_risk_signals || [];
    const safe = currentReport.safe_signals || [];

    const summaryText = `[Scamalyse Shield Report]
Risk Score: ${score}/100 (${level})
Warnings Detected: ${warnings.length}
Safe Markers: ${safe.length}
Key Findings: ${warnings.map(w => w.title).slice(0, 3).join(', ') || 'None'}
Generated via Scamalyse Shield Extension`;

    navigator.clipboard?.writeText(summaryText).then(() => {
      copyBtnText.textContent = 'Copied!';
      setTimeout(() => {
        copyBtnText.textContent = 'Copy Summary';
      }, 2000);
    });
  });

  // ── Helpers ──
  function showError(msg) {
    loadingView.classList.add('hidden');
    resultsView.classList.add('hidden');
    inputView.classList.remove('hidden');

    errorText.textContent = msg;
    errorContainer.classList.remove('hidden');
  }

  function hideError() {
    errorContainer.classList.add('hidden');
  }

  function resetUI() {
    currentReport = null;
    hideError();
    resultsView.classList.add('hidden');
    loadingView.classList.add('hidden');
    inputView.classList.remove('hidden');
    manualInput.focus();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
