/* ===== FORENSIQ DASHBOARD — MAIN JAVASCRIPT ===== */
'use strict';

// ============================================================
// MOCK DATA STORE
// ============================================================
const MOCK_DATA = {
  companies: {
    'INFY': {
      name: 'Infosys Ltd.',
      ticker: 'NSE: INFY',
      sector: 'IT Services',
      cap: '₹6.2T',
      cmp: '₹1,847',
      change: '+2.4%',
      changeDir: 'up',
      pe: '23.4x',
      rev: '₹153,670 Cr',
      pat: '₹26,248 Cr',
      debtStatus: 'Debt-Free',
      creditRating: 'A1+',
      qualityScore: 82
    }
  },

  // ---- SECTION 1 CHARTS ----
  // bizMix and geoMix are loaded from data/companies.json at startup
  // (see loadCompanyData below). Until the fetch resolves these are empty;
  // initBizMixChart/initGeoMixChart fall back to safe placeholders.
  bizMix: {},
  geoMix: {},

  // ---- SECTION 3 & 6 DATA ----
  // Financial metrics and ownership data loaded from data/companies.json
  financialMetrics: {},
  ownership: {},

  mktShare: {
    '3Y': {
      labels: ['FY23', 'FY24', 'FY25'],
      data: [2.6, 2.9, 3.2]
    },
    '5Y': {
      labels: ['FY21', 'FY22', 'FY23', 'FY24', 'FY25'],
      data: [2.1, 2.3, 2.6, 2.9, 3.2]
    },
    '10Y': {
      labels: ['FY16','FY17','FY18','FY19','FY20','FY21','FY22','FY23','FY24','FY25'],
      data: [1.2, 1.4, 1.6, 1.8, 1.9, 2.1, 2.3, 2.6, 2.9, 3.2]
    }
  },

  // ---- SECTION 2 CHARTS ----
  promoterHolding: {
    '3Y': {
      labels: ['Q1FY23','Q2FY23','Q3FY23','Q4FY23','Q1FY24','Q2FY24','Q3FY24','Q4FY24','Q1FY25','Q2FY25','Q3FY25','Q4FY25'],
      data: [15.7, 15.6, 15.5, 15.4, 15.3, 15.2, 15.1, 15.0, 15.0, 14.9, 14.9, 14.9]
    },
    '5Y': {
      labels: ['FY21','FY22','FY23','FY24','FY25'],
      data: [17.2, 16.4, 15.4, 15.0, 14.9]
    },
    '10Y': {
      labels: ['FY16','FY17','FY18','FY19','FY20','FY21','FY22','FY23','FY24','FY25'],
      data: [22.8, 21.4, 20.1, 18.9, 18.2, 17.2, 16.4, 15.4, 15.0, 14.9]
    }
  },

  capAlloc: {
    labels: ['Dividends', 'Buybacks', 'Acquisitions', 'Capex', 'R&D / Training'],
    data: [38000, 27600, 2800, 18000, 5200],
    colors: ['#6366f1','#8b5cf6','#f59e0b','#10b981','#3b82f6']
  },

  // ---- SECTION 3 CHARTS ----
  revPat: {
    '3Y': {
      labels: ['FY23', 'FY24', 'FY25'],
      revenue: [146767, 153670, 162410],
      pat: [24095, 26248, 28190]
    },
    '5Y': {
      labels: ['FY21', 'FY22', 'FY23', 'FY24', 'FY25'],
      revenue: [100472, 121641, 146767, 153670, 162410],
      pat: [19351, 22110, 24095, 26248, 28190]
    },
    '10Y': {
      labels: ['FY16','FY17','FY18','FY19','FY20','FY21','FY22','FY23','FY24','FY25'],
      revenue: [68484, 68484, 73126, 82675, 90791, 100472, 121641, 146767, 153670, 162410],
      pat: [13289, 14353, 16029, 15410, 16639, 19351, 22110, 24095, 26248, 28190]
    }
  },

  marginTrend: {
    '3Y': {
      labels: ['FY23', 'FY24', 'FY25'],
      ebitda: [24.8, 25.6, 26.7],
      pat: [16.4, 17.1, 17.4]
    },
    '5Y': {
      labels: ['FY21','FY22','FY23','FY24','FY25'],
      ebitda: [24.5, 24.2, 24.8, 25.6, 26.7],
      pat: [19.3, 18.2, 16.4, 17.1, 17.4]
    },
    '10Y': {
      labels: ['FY16','FY17','FY18','FY19','FY20','FY21','FY22','FY23','FY24','FY25'],
      ebitda: [27.4, 26.8, 24.3, 23.7, 23.4, 24.5, 24.2, 24.8, 25.6, 26.7],
      pat: [19.4, 21.0, 21.9, 18.6, 18.3, 19.3, 18.2, 16.4, 17.1, 17.4]
    }
  },

  cfoPat: {
    '3Y': {
      labels: ['FY23', 'FY24', 'FY25'],
      cfo: [26840, 28912, 29400],
      pat: [24095, 26248, 28190]
    },
    '5Y': {
      labels: ['FY21','FY22','FY23','FY24','FY25'],
      cfo: [20480, 23820, 26840, 28912, 29400],
      pat: [19351, 22110, 24095, 26248, 28190]
    }
  },

  wc: {
    '5Y': {
      labels: ['FY21','FY22','FY23','FY24','FY25'],
      dso: [72, 70, 69, 68, 67],
      dpo: [28, 30, 31, 32, 31],
      nwc: [44, 40, 38, 36, 36]
    },
    '10Y': {
      labels: ['FY16','FY17','FY18','FY19','FY20','FY21','FY22','FY23','FY24','FY25'],
      dso: [80, 78, 76, 75, 74, 72, 70, 69, 68, 67],
      dpo: [22, 23, 25, 26, 27, 28, 30, 31, 32, 31],
      nwc: [58, 55, 51, 49, 47, 44, 40, 38, 36, 36]
    }
  },

  returns: {
    '3Y': {
      labels: ['FY23', 'FY24', 'FY25'],
      roce: [30.4, 32.1, 34.2],
      roe: [28.6, 30.2, 31.8],
      roa: [19.8, 21.0, 22.1]
    },
    '5Y': {
      labels: ['FY21','FY22','FY23','FY24','FY25'],
      roce: [26.2, 28.4, 30.4, 32.1, 34.2],
      roe: [24.8, 26.2, 28.6, 30.2, 31.8],
      roa: [18.2, 19.0, 19.8, 21.0, 22.1]
    }
  },

  // ---- SECTION 5 CHARTS ----
  headcount: {
    '3Y': {
      labels: ['FY23', 'FY24', 'FY25'],
      employees: [343234, 317240, 309040],
      revGrowth: [21.4, 4.3, 5.4]
    },
    '5Y': {
      labels: ['FY21','FY22','FY23','FY24','FY25'],
      employees: [228123, 314015, 343234, 317240, 309040],
      revGrowth: [5.8, 21.1, 21.4, 4.3, 5.4]
    }
  },

  // ---- SECTION 6 CHARTS ----
  ownershipTrend: {
    '3Y': {
      labels: ['Q1FY23','Q2FY23','Q3FY23','Q4FY23','Q1FY24','Q2FY24','Q3FY24','Q4FY24','Q1FY25','Q2FY25','Q3FY25','Q4FY25'],
      fii: [30.2, 30.8, 31.4, 31.9, 32.1, 32.4, 32.8, 33.1, 33.4, 33.6, 33.7, 33.8],
      dii: [19.8, 19.4, 19.1, 18.9, 18.8, 18.7, 18.6, 18.5, 18.5, 18.4, 18.4, 18.4],
      promoter: [15.4, 15.3, 15.2, 15.1, 15.1, 15.0, 15.0, 14.9, 14.9, 14.9, 14.9, 14.9]
    },
    '5Y': {
      labels: ['FY21','FY22','FY23','FY24','FY25'],
      fii: [28.4, 29.1, 31.9, 33.1, 33.8],
      dii: [20.4, 20.1, 18.9, 18.5, 18.4],
      promoter: [17.2, 16.4, 15.4, 15.0, 14.9]
    }
  },

  valBand: {
    '3Y': {
      labels: ['Apr22','Oct22','Apr23','Oct23','Apr24','Oct24','Apr25'],
      price: [1480, 1180, 1380, 1640, 1720, 1890, 1847],
      pe10x: [760, 740, 790, 830, 870, 910, 950],
      pe20x: [1520, 1480, 1580, 1660, 1740, 1820, 1900],
      pe30x: [2280, 2220, 2370, 2490, 2610, 2730, 2850]
    },
    '5Y': {
      labels: ['Apr20','Apr21','Apr22','Apr23','Apr24','Apr25'],
      price: [680, 1340, 1480, 1380, 1720, 1847],
      pe10x: [580, 660, 760, 790, 870, 950],
      pe20x: [1160, 1320, 1520, 1580, 1740, 1900],
      pe30x: [1740, 1980, 2280, 2370, 2610, 2850]
    },
    '10Y': {
      labels: ['Apr15','Apr16','Apr17','Apr18','Apr19','Apr20','Apr21','Apr22','Apr23','Apr24','Apr25'],
      price: [420, 450, 480, 720, 790, 680, 1340, 1480, 1380, 1720, 1847],
      pe10x: [320, 340, 360, 400, 440, 580, 660, 760, 790, 870, 950],
      pe20x: [640, 680, 720, 800, 880, 1160, 1320, 1520, 1580, 1740, 1900],
      pe30x: [960, 1020, 1080, 1200, 1320, 1740, 1980, 2280, 2370, 2610, 2850]
    }
  }
};

// ============================================================
// LIVE DATA (populated by loadCompanyData from data/companies.json)
// ============================================================
// Per-company series derived from Screener.in. The chart helpers below
// prefer this over MOCK_DATA so any company in the dropdown shows real
// numbers; missing series silently fall back to mock so the dashboard
// keeps rendering even when scraping fails.
const LIVE_DERIVED = {
  revPat: {}, marginTrend: {}, cfoPat: {}, wc: {}, returns: {},
  promoterHolding: {}, ownershipTrend: {}
};
const LIVE_SUMMARY = {}; // summary[ticker] -> { marketCap, currentPrice, pe, ... }

// Pull a (kind, period) series for the active company, falling back to
// mock data if the live JSON didn't carry it.
function getSeries(kind, period) {
  const live = LIVE_DERIVED[kind]?.[activeCompanyKey]?.[period];
  if (live) return live;
  // try other periods if requested one is missing
  const liveAny = LIVE_DERIVED[kind]?.[activeCompanyKey];
  if (liveAny) {
    return liveAny[period] || liveAny['5Y'] || liveAny['3Y'] || liveAny['10Y'] || MOCK_DATA[kind]?.[period];
  }
  return MOCK_DATA[kind]?.[period];
}

// ============================================================
// CHART INSTANCES REGISTRY
// ============================================================
const charts = {};

// ============================================================
// CHART CONFIG HELPERS
// ============================================================
const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15,23,42,0.9)',
      titleFont: { family: 'Inter', size: 12, weight: '600' },
      bodyFont: { family: 'Inter', size: 11 },
      padding: 10,
      cornerRadius: 8,
      displayColors: true
    }
  }
};

function destroyChart(id) {
  if (charts[id]) {
    charts[id].destroy();
    delete charts[id];
  }
}

function getCtx(id) {
  return document.getElementById(id).getContext('2d');
}

// ============================================================
// SECTION 1 CHARTS
// ============================================================
// Currently-selected company (drives company-aware charts like Business / Service Mix).
// Updated by initCompanySearch when the user picks a company from the dropdown.
let activeCompanyKey = 'INFY';
let activeBizMixPeriod = 'FY25';
let activeGeoMixPeriod = 'FY25';

// Active period per trend chart, mutated by toggle-group clicks. Used so
// reinitCompanyAwareCharts() refreshes each chart at whichever period the
// user last selected.
const activePeriods = {
  promoterHolding: '5Y', revPat: '5Y', marginTrend: '5Y',
  cfoPat: '5Y', wc: '5Y', returns: '5Y', ownershipTrend: '5Y'
};

function getCompanyKeyFromTicker(ticker) {
  // ticker looks like "NSE: INFY" -> return "INFY"
  if (!ticker) return null;
  const m = ticker.match(/[:\s]([A-Z0-9]+)\s*$/);
  return m ? m[1] : ticker.trim().toUpperCase();
}

function initBizMixChart(period = activeBizMixPeriod, companyKey = activeCompanyKey) {
  activeBizMixPeriod = period;
  destroyChart('bizMixChart');
  const company = MOCK_DATA.bizMix[companyKey] || MOCK_DATA.bizMix.INFY;
  if (!company) return; // data/companies.json not loaded yet — loader will re-init
  const d = company[period] || company.FY25;
  if (!d) return;
  charts['bizMixChart'] = new Chart(getCtx('bizMixChart'), {
    type: 'doughnut',
    data: {
      labels: d.labels,
      datasets: [{
        data: d.data,
        backgroundColor: d.colors,
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 8
      }]
    },
    options: {
      ...chartDefaults,
      cutout: '62%',
      plugins: {
        ...chartDefaults.plugins,
        legend: { display: false }
      }
    }
  });
  renderLegend('bizMixLegend', d.labels, d.colors, d.data, '%');
}

function initGeoMixChart(period = activeGeoMixPeriod, companyKey = activeCompanyKey) {
  activeGeoMixPeriod = period;
  destroyChart('geoMixChart');
  const company = MOCK_DATA.geoMix[companyKey] || MOCK_DATA.geoMix.INFY;
  if (!company) return; // data/companies.json not loaded yet — loader will re-init
  const d = company[period] || company.FY25;
  if (!d) return;
  charts['geoMixChart'] = new Chart(getCtx('geoMixChart'), {
    type: 'doughnut',
    data: {
      labels: d.labels,
      datasets: [{
        data: d.data,
        backgroundColor: d.colors,
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 8
      }]
    },
    options: {
      ...chartDefaults,
      cutout: '62%'
    }
  });
  renderLegend('geoMixLegend', d.labels, d.colors, d.data, '%');
}

function initMktShareChart(period = '5Y') {
  destroyChart('mktShareChart');
  const d = MOCK_DATA.mktShare[period];
  charts['mktShareChart'] = new Chart(getCtx('mktShareChart'), {
    type: 'line',
    data: {
      labels: d.labels,
      datasets: [{
        label: 'Market Share (%)',
        data: d.data,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.08)',
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      ...chartDefaults,
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { family: 'Inter', size: 11 }, callback: v => v + '%' }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11 } }
        }
      },
      plugins: { ...chartDefaults.plugins, legend: { display: false } }
    }
  });
}

function renderLegend(containerId, labels, colors, data, suffix = '') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = labels.map((l, i) =>
    `<div class="chart-legend-item">
      <span class="legend-dot" style="background:${colors[i]}"></span>
      <span>${l} <strong>${data[i]}${suffix}</strong></span>
    </div>`
  ).join('');
}

// ============================================================
// SECTION 2 CHARTS
// ============================================================
function initPromoterHoldingChart(period = '5Y') {
  destroyChart('promoterHoldingChart');
  const d = getSeries('promoterHolding', period);
  if (!d) return;
  charts['promoterHoldingChart'] = new Chart(getCtx('promoterHoldingChart'), {
    type: 'line',
    data: {
      labels: d.labels,
      datasets: [{
        label: 'Promoter Holding (%)',
        data: d.data,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14,165,233,0.08)',
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#0ea5e9',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      ...chartDefaults,
      scales: {
        y: {
          min: 13, max: 24,
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { family: 'Inter', size: 11 }, callback: v => v + '%' }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 10 }, maxRotation: 45 }
        }
      },
      plugins: { ...chartDefaults.plugins, legend: { display: false } }
    }
  });
}

function initCapAllocChart() {
  destroyChart('capAllocChart');
  const d = MOCK_DATA.capAlloc;
  charts['capAllocChart'] = new Chart(getCtx('capAllocChart'), {
    type: 'bar',
    data: {
      labels: d.labels,
      datasets: [{
        data: d.data,
        backgroundColor: d.colors,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      ...chartDefaults,
      scales: {
        y: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { family: 'Inter', size: 11 }, callback: v => '₹' + (v/1000).toFixed(0) + 'K Cr' }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 10 } }
        }
      },
      plugins: { ...chartDefaults.plugins, legend: { display: false } }
    }
  });
}

// ============================================================
// SECTION 3 CHARTS
// ============================================================
function initRevPatChart(period = '5Y') {
  destroyChart('revPatChart');
  const d = getSeries('revPat', period);
  if (!d) return;
  charts['revPatChart'] = new Chart(getCtx('revPatChart'), {
    type: 'bar',
    data: {
      labels: d.labels,
      datasets: [
        {
          label: 'Revenue (₹ Cr)',
          data: d.revenue,
          backgroundColor: 'rgba(99,102,241,0.15)',
          borderColor: '#6366f1',
          borderWidth: 1.5,
          borderRadius: 5,
          borderSkipped: false,
          yAxisID: 'y'
        },
        {
          label: 'PAT (₹ Cr)',
          data: d.pat,
          backgroundColor: 'rgba(16,185,129,0.8)',
          borderColor: '#10b981',
          borderWidth: 1.5,
          borderRadius: 5,
          borderSkipped: false,
          yAxisID: 'y'
        }
      ]
    },
    options: {
      ...chartDefaults,
      scales: {
        y: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { family: 'Inter', size: 11 }, callback: v => '₹' + (v/1000).toFixed(0) + 'K' }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11 } }
        }
      },
      plugins: {
        ...chartDefaults.plugins,
        legend: {
          display: true,
          position: 'top',
          labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 12 }
        }
      }
    }
  });
}

function initMarginTrendChart(period = '5Y') {
  destroyChart('marginTrendChart');
  const d = getSeries('marginTrend', period);
  if (!d) return;
  charts['marginTrendChart'] = new Chart(getCtx('marginTrendChart'), {
    type: 'line',
    data: {
      labels: d.labels,
      datasets: [
        {
          label: 'EBITDA Margin %',
          data: d.ebitda,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.08)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          label: 'PAT Margin %',
          data: d.pat,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.06)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      ...chartDefaults,
      scales: {
        y: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { family: 'Inter', size: 11 }, callback: v => v + '%' }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11 } }
        }
      },
      plugins: {
        ...chartDefaults.plugins,
        legend: {
          display: true,
          position: 'top',
          labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 12 }
        }
      }
    }
  });
}

function initCfoPatChart(period = '5Y') {
  destroyChart('cfoPatChart');
  const d = getSeries('cfoPat', period);
  if (!d) return;
  charts['cfoPatChart'] = new Chart(getCtx('cfoPatChart'), {
    type: 'bar',
    data: {
      labels: d.labels,
      datasets: [
        {
          label: 'CFO (₹ Cr)',
          data: d.cfo,
          backgroundColor: 'rgba(99,102,241,0.7)',
          borderRadius: 5,
          borderSkipped: false
        },
        {
          label: 'PAT (₹ Cr)',
          data: d.pat,
          backgroundColor: 'rgba(16,185,129,0.7)',
          borderRadius: 5,
          borderSkipped: false
        }
      ]
    },
    options: {
      ...chartDefaults,
      scales: {
        y: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { family: 'Inter', size: 10 }, callback: v => '₹' + (v/1000).toFixed(0) + 'K' }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 10 } }
        }
      },
      plugins: {
        ...chartDefaults.plugins,
        legend: {
          display: true,
          position: 'top',
          labels: { font: { family: 'Inter', size: 11 }, boxWidth: 10, padding: 10 }
        }
      }
    }
  });
}

function initWcChart(period = '5Y') {
  destroyChart('wcChart');
  const d = getSeries('wc', period);
  if (!d) return;
  charts['wcChart'] = new Chart(getCtx('wcChart'), {
    type: 'line',
    data: {
      labels: d.labels,
      datasets: [
        {
          label: 'DSO',
          data: d.dso || [],
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.4
        },
        {
          label: 'DPO',
          data: d.dpo || [],
          borderColor: '#3b82f6',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.4
        },
        {
          label: 'NWC Days',
          data: d.nwc || [],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.08)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      ...chartDefaults,
      scales: {
        y: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { family: 'Inter', size: 10 }, callback: v => v + 'd' }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 10 } }
        }
      },
      plugins: {
        ...chartDefaults.plugins,
        legend: {
          display: true,
          position: 'top',
          labels: { font: { family: 'Inter', size: 10 }, boxWidth: 10, padding: 8 }
        }
      }
    }
  });
}

function initReturnsChart(period = '5Y') {
  destroyChart('returnsChart');
  const d = getSeries('returns', period);
  if (!d) return;
  charts['returnsChart'] = new Chart(getCtx('returnsChart'), {
    type: 'line',
    data: {
      labels: d.labels,
      datasets: [
        {
          label: 'ROCE',
          data: d.roce || [],
          borderColor: '#6366f1',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.4
        },
        {
          label: 'ROE',
          data: d.roe || [],
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.4
        },
        {
          label: 'ROA',
          data: d.roa || [],
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.4,
          borderDash: [4, 3]
        }
      ]
    },
    options: {
      ...chartDefaults,
      scales: {
        y: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { family: 'Inter', size: 10 }, callback: v => v + '%' }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 10 } }
        }
      },
      plugins: {
        ...chartDefaults.plugins,
        legend: {
          display: true,
          position: 'top',
          labels: { font: { family: 'Inter', size: 10 }, boxWidth: 10, padding: 8 }
        }
      }
    }
  });
}

// ============================================================
// SECTION 5 CHARTS
// ============================================================
function initHeadcountChart(period = '5Y') {
  destroyChart('headcountChart');
  const d = MOCK_DATA.headcount[period];
  charts['headcountChart'] = new Chart(getCtx('headcountChart'), {
    type: 'bar',
    data: {
      labels: d.labels,
      datasets: [
        {
          label: 'Headcount',
          data: d.employees,
          backgroundColor: 'rgba(99,102,241,0.15)',
          borderColor: '#6366f1',
          borderWidth: 1.5,
          borderRadius: 5,
          borderSkipped: false,
          yAxisID: 'y'
        },
        {
          label: 'Revenue Growth %',
          data: d.revGrowth,
          type: 'line',
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          pointRadius: 5,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      ...chartDefaults,
      scales: {
        y: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { family: 'Inter', size: 10 }, callback: v => (v/1000).toFixed(0) + 'K' }
        },
        y1: {
          position: 'right',
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 10 }, callback: v => v + '%' }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11 } }
        }
      },
      plugins: {
        ...chartDefaults.plugins,
        legend: {
          display: true,
          position: 'top',
          labels: { font: { family: 'Inter', size: 11 }, boxWidth: 10, padding: 10 }
        }
      }
    }
  });
}

// ============================================================
// SECTION 6 CHARTS
// ============================================================
function initOwnershipTrendChart(period = '5Y') {
  destroyChart('ownershipTrendChart');
  const d = getSeries('ownershipTrend', period);
  if (!d) return;
  charts['ownershipTrendChart'] = new Chart(getCtx('ownershipTrendChart'), {
    type: 'line',
    data: {
      labels: d.labels,
      datasets: [
        {
          label: 'FII %',
          data: d.fii,
          borderColor: '#ec4899',
          backgroundColor: 'rgba(236,72,153,0.08)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#ec4899',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: false,
          tension: 0.4
        },
        {
          label: 'DII %',
          data: d.dii,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.08)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: false,
          tension: 0.4
        },
        {
          label: 'Promoter %',
          data: d.promoter,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.08)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: false,
          tension: 0.4,
          borderDash: [5, 3]
        }
      ]
    },
    options: {
      ...chartDefaults,
      scales: {
        y: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { family: 'Inter', size: 11 }, callback: v => v + '%' }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 10 }, maxRotation: 45 }
        }
      },
      plugins: {
        ...chartDefaults.plugins,
        legend: {
          display: true,
          position: 'top',
          labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 12 }
        }
      }
    }
  });
}

function initValBandChart(period = '5Y') {
  destroyChart('valBandChart');
  const d = MOCK_DATA.valBand[period];
  charts['valBandChart'] = new Chart(getCtx('valBandChart'), {
    type: 'line',
    data: {
      labels: d.labels,
      datasets: [
        {
          label: 'CMP (₹)',
          data: d.price,
          borderColor: '#6366f1',
          backgroundColor: 'transparent',
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.4,
          order: 0
        },
        {
          label: '30x P/E Band',
          data: d.pe30x,
          borderColor: 'rgba(239,68,68,0.5)',
          backgroundColor: 'rgba(239,68,68,0.06)',
          borderWidth: 1.5,
          borderDash: [5,3],
          pointRadius: 0,
          fill: false,
          tension: 0.4
        },
        {
          label: '20x P/E Band',
          data: d.pe20x,
          borderColor: 'rgba(245,158,11,0.5)',
          backgroundColor: 'rgba(245,158,11,0.06)',
          borderWidth: 1.5,
          borderDash: [5,3],
          pointRadius: 0,
          fill: false,
          tension: 0.4
        },
        {
          label: '10x P/E Band',
          data: d.pe10x,
          borderColor: 'rgba(34,197,94,0.5)',
          backgroundColor: 'rgba(34,197,94,0.06)',
          borderWidth: 1.5,
          borderDash: [5,3],
          pointRadius: 0,
          fill: false,
          tension: 0.4
        }
      ]
    },
    options: {
      ...chartDefaults,
      scales: {
        y: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { family: 'Inter', size: 11 }, callback: v => '₹' + v }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11 } }
        }
      },
      plugins: {
        ...chartDefaults.plugins,
        legend: {
          display: true,
          position: 'top',
          labels: { font: { family: 'Inter', size: 10 }, boxWidth: 10, padding: 8 }
        }
      }
    }
  });
}

// ============================================================
// SECTION NAVIGATION
// ============================================================
function initSectionNav() {
  const btns = document.querySelectorAll('.snav-btn');
  const sections = document.querySelectorAll('.dash-section');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.section;

      // Update nav state
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Switch section
      sections.forEach(s => s.classList.remove('active'));
      const targetSection = document.getElementById(target);
      if (targetSection) targetSection.classList.add('active');

      // Scroll to top of section content
      window.scrollTo({ top: 180, behavior: 'smooth' });

      // Init charts for the section if not already done
      initSectionCharts(target);
    });
  });
}

// ============================================================
// SECTION-SPECIFIC CHART INIT
// ============================================================
const initializedSections = new Set(['s1']);

function initSectionCharts(sectionId) {
  if (initializedSections.has(sectionId)) return;
  initializedSections.add(sectionId);

  switch(sectionId) {
    case 's2':
      initPromoterHoldingChart(activePeriods.promoterHolding);
      initCapAllocChart();
      break;
    case 's3':
      initRevPatChart(activePeriods.revPat);
      initMarginTrendChart(activePeriods.marginTrend);
      initCfoPatChart(activePeriods.cfoPat);
      initWcChart(activePeriods.wc);
      initReturnsChart(activePeriods.returns);
      break;
    case 's5':
      initHeadcountChart('5Y');
      break;
    case 's6':
      initOwnershipTrendChart(activePeriods.ownershipTrend);
      initValBandChart('5Y');
      break;
  }
}

// ============================================================
// TOGGLE BUTTONS
// ============================================================
function initToggleGroups() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.tgl');
    if (!btn) return;

    const group = btn.closest('.toggle-group');
    if (!group) return;

    group.querySelectorAll('.tgl').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const chartId = btn.dataset.chart;
    const period = btn.dataset.period;

    if (!chartId || !period) return;
    if (chartId in activePeriods) activePeriods[chartId] = period;

    // Chart-specific update handlers
    switch(chartId) {
      case 'bizMix': initBizMixChart(period, activeCompanyKey); break;
      case 'geoMix': initGeoMixChart(period, activeCompanyKey); break;
      case 'mktShare': initMktShareChart(period); break;
      case 'promoterHolding': initPromoterHoldingChart(period); break;
      case 'revPat': initRevPatChart(period); break;
      case 'marginTrend': initMarginTrendChart(period); break;
      case 'cfoPat': initCfoPatChart(period); break;
      case 'wc': initWcChart(period); break;
      case 'returns': initReturnsChart(period); break;
      case 'headcount': initHeadcountChart(period); break;
      case 'ownershipTrend': initOwnershipTrendChart(period); break;
      case 'valBand': initValBandChart(period); break;
    }
  });
}

// ============================================================
// COMPANY SEARCH (backed by Muns)
// ============================================================
// POST {MUNS_API_BASE}/stock/search
//   headers: Authorization: Bearer ${MUNS_BEARER_TOKEN}
//   body:    { query }
//   reply:   { data: { results: { [ticker]: [country, name, industry] } } }

function getMunsConfig() {
  return {
    apiBase: (window.MUNS_API_BASE || '').replace(/\/$/, ''),
    token: (window.MUNS_BEARER_TOKEN || '').trim(),
  };
}

// Indian companies come back with country="India"; the dashboard treats them
// as NSE-listed (matches the "NSE: INFY" tag the rest of the UI expects).
function exchangeForCountry(country) {
  if (!country) return '';
  if (/india/i.test(country)) return 'NSE';
  if (/united states|^us$|usa/i.test(country)) return 'NASDAQ';
  return country.toUpperCase().slice(0, 4);
}

function mapSearchEntry(ticker, entry) {
  const [country, name, industry] = Array.isArray(entry) ? entry : [];
  return {
    ticker: String(ticker || '').toUpperCase(),
    name: name || ticker,
    industry: industry || '',
    country: country || '',
    exchange: exchangeForCountry(country),
  };
}

function rankSearchResults(rows, query) {
  const q = (query || '').trim().toUpperCase();
  if (!q) return rows;
  // Exact ticker > prefix ticker > prefix name > everything else.
  // Stable within each tier by original API order.
  const tier = (r) => {
    if (r.ticker === q) return 0;
    if (r.ticker.startsWith(q)) return 1;
    if (r.name.toUpperCase().startsWith(q)) return 2;
    return 3;
  };
  return rows
    .map((r, i) => ({ r, i, t: tier(r) }))
    .sort((a, b) => a.t - b.t || a.i - b.i)
    .map((x) => x.r);
}

async function searchStocks(query, signal) {
  const { apiBase, token } = getMunsConfig();
  if (!token) {
    const err = new Error('Missing MUNS_BEARER_TOKEN. Set it in js/config.js.');
    err.code = 'NO_TOKEN';
    throw err;
  }
  if (!apiBase) {
    const err = new Error('Missing MUNS_API_BASE. Set it in js/config.js.');
    err.code = 'NO_API_BASE';
    throw err;
  }
  const res = await fetch(`${apiBase}/stock/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
    signal,
  });
  if (!res.ok) {
    const err = new Error(`Stock search failed (${res.status})`);
    err.code = 'HTTP_' + res.status;
    throw err;
  }
  const json = await res.json();
  const results = json?.data?.results || {};
  const rows = Object.entries(results).map(([t, e]) => mapSearchEntry(t, e));
  return rankSearchResults(rows, query);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function renderSearchResults(container, rows) {
  if (!rows.length) {
    container.innerHTML = '<div class="search-empty">No matching companies.</div>';
    return;
  }
  container.innerHTML = rows.map((r) => `
    <div class="search-item" data-ticker="${escapeHtml(r.ticker)}" data-name="${escapeHtml(r.name)}" data-exchange="${escapeHtml(r.exchange)}">
      <div class="si-info">
        <div class="si-name">${escapeHtml(r.name)}</div>
        <div class="si-meta">${escapeHtml(r.industry || r.country || '')}</div>
      </div>
      <div class="si-pill">
        <span class="si-pill-ticker">${escapeHtml(r.ticker)}</span>
        ${r.exchange ? `<span class="si-pill-sep">·</span><span class="si-pill-exch">${escapeHtml(r.exchange)}</span>` : ''}
      </div>
    </div>
  `).join('');
}

function initCompanySearch() {
  const input = document.getElementById('companySearchInput');
  const dropdown = document.getElementById('searchDropdown');
  const header = document.getElementById('searchDropdownHeader');
  const results = document.getElementById('searchResults');
  const activeNameEl = document.getElementById('activeCompanyName');
  const heroNameEl = document.getElementById('heroCompanyName');
  const qualityScoreEl = document.getElementById('qualityScore');

  let debounceId = null;
  let inflight = null;
  let lastRows = [];

  function setHeader(text) {
    if (header) header.textContent = text;
  }

  function showHint(message) {
    setHeader('Search companies');
    results.innerHTML = `<div class="search-hint">${escapeHtml(message)}</div>`;
  }

  function showLoading() {
    setHeader('Searching…');
    results.innerHTML = '<div class="search-loading"><span class="spinner"></span> Searching…</div>';
  }

  function showError(err) {
    setHeader('Search error');
    const detail = err?.code === 'NO_TOKEN'
      ? 'Set window.MUNS_BEARER_TOKEN in js/config.js.'
      : (err?.message || 'Unknown error');
    results.innerHTML = `<div class="search-error">${escapeHtml(detail)}</div>`;
  }

  async function runSearch(query) {
    if (inflight) inflight.abort();
    const controller = new AbortController();
    inflight = controller;
    showLoading();
    try {
      const rows = await searchStocks(query, controller.signal);
      if (controller.signal.aborted) return;
      lastRows = rows;
      setHeader(`Results for "${query}"`);
      renderSearchResults(results, rows);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('[ForensIQ] Stock search failed:', err);
      lastRows = [];
      showError(err);
    } finally {
      if (inflight === controller) inflight = null;
    }
  }

  input.addEventListener('focus', () => {
    dropdown.classList.add('active');
    if (!input.value.trim() && !lastRows.length) {
      showHint('Type a company name or ticker to search.');
    }
  });

  input.addEventListener('input', () => {
    const query = input.value.trim();
    clearTimeout(debounceId);
    if (!query) {
      if (inflight) inflight.abort();
      lastRows = [];
      showHint('Type a company name or ticker to search.');
      return;
    }
    if (query.length < 2) {
      if (inflight) inflight.abort();
      showHint('Keep typing… (2+ characters)');
      return;
    }
    debounceId = setTimeout(() => runSearch(query), 220);
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!input.closest('.company-search-wrap')?.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });

  // Delegated click on result rows
  results.addEventListener('click', (e) => {
    const item = e.target.closest('.search-item');
    if (!item) return;
    const ticker = item.dataset.ticker;
    const name = item.dataset.name;
    const exchange = item.dataset.exchange || 'NSE';
    selectCompany({ ticker, name, exchange });
  });

  function selectCompany({ ticker, name, exchange }) {
    activeNameEl.textContent = name;
    document.querySelector('.tag-exchange').textContent = `${exchange}: ${ticker}`;
    heroNameEl.textContent = name;

    activeCompanyKey = (ticker || '').toUpperCase() || activeCompanyKey;
    reinitCompanyAwareCharts();
    renderLiveDataPanel(activeCompanyKey);

    animateScore(qualityScoreEl, parseInt(qualityScoreEl.textContent, 10), Math.floor(Math.random() * 20) + 70);

    dropdown.classList.remove('active');
    input.value = '';

    const hero = document.getElementById('companyHero');
    hero.style.animation = 'none';
    requestAnimationFrame(() => {
      hero.style.animation = 'heroFlash 0.5s ease';
    });

    showToast(`Switched to ${name}`);
  }
}

function animateScore(el, from, to) {
  const duration = 800;
  const start = performance.now();
  const update = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * ease);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);

  // Update color based on score
  const badge = el.closest('.score-badge');
  if (to >= 75) badge.style.background = 'linear-gradient(135deg, #10b981, #059669)';
  else if (to >= 55) badge.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
  else badge.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
}

// ============================================================
// REFRESH SECTION
// ============================================================
async function refreshSection(btn, sectionId) {
  btn.classList.add('loading');
  btn.disabled = true;

  // Actually re-fetch the JSON data from the server
  try {
    const res = await fetch('data/companies.json?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      LIVE_JSON = json;
      if (json.bizMix) MOCK_DATA.bizMix = json.bizMix;
      if (json.geoMix) MOCK_DATA.geoMix = json.geoMix;
      if (json.financialMetrics) MOCK_DATA.financialMetrics = json.financialMetrics;
      if (json.ownership) MOCK_DATA.ownership = json.ownership;
      ingestLiveJson(json);

      reinitCompanyAwareCharts();
      renderLiveDataPanel(activeCompanyKey);
    }
  } catch (e) {
    console.warn('[ForensIQ] Section refresh failed:', e);
  }

  btn.classList.remove('loading');
  btn.disabled = false;

  const now = new Date();
  const timeStr = now.toLocaleString('en-IN', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const refreshSpan = btn.closest('.sh-right').querySelector('.last-refreshed');
  if (refreshSpan) {
    refreshSpan.innerHTML = `<i class="fas fa-clock"></i> Refreshed: ${timeStr}`;
    refreshSpan.style.color = 'var(--green)';
    setTimeout(() => refreshSpan.style.color = '', 2000);
  }

  const status = LIVE_JSON?._meta?.status || 'ok';
  showToast(`Section refreshed (${status})`);
}

// ============================================================
// GUIDANCE TABS
// ============================================================
function initGuidanceTabs() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-type]');
    if (!btn) return;
    const type = btn.dataset.type;

    const group = btn.closest('.toggle-group');
    if (!group) return;
    group.querySelectorAll('.tgl').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const container = document.getElementById('guidanceContent');
    if (!container) return;

    if (type === 'margin-guidance') {
      container.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Quarter</th><th>Guidance (EBIT Margin)</th><th>Actual</th><th>Outcome</th></tr></thead>
          <tbody>
            <tr><td>Q4 FY25</td><td>20.0–22.0%</td><td>21.9%</td><td><span class="outcome-badge hit">✓ Hit</span></td></tr>
            <tr><td>Q3 FY25</td><td>20.0–22.0%</td><td>21.3%</td><td><span class="outcome-badge hit">✓ Hit</span></td></tr>
            <tr><td>Q2 FY25</td><td>20.0–22.0%</td><td>21.1%</td><td><span class="outcome-badge hit">✓ Hit</span></td></tr>
            <tr><td>Q1 FY25</td><td>20.0–22.0%</td><td>21.8%</td><td><span class="outcome-badge hit">✓ Hit</span></td></tr>
            <tr><td>Q4 FY24</td><td>20.0–22.0%</td><td>20.4%</td><td><span class="outcome-badge hit">✓ Hit</span></td></tr>
            <tr><td>Q3 FY24</td><td>20.0–22.0%</td><td>21.0%</td><td><span class="outcome-badge hit">✓ Hit</span></td></tr>
          </tbody>
        </table>
        <div class="guidance-summary">
          <span class="gs-pill green">6/6 Within Guidance Band</span>
        </div>`;
    } else {
      container.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Quarter</th><th>Guidance (Rev Growth)</th><th>Actual</th><th>Outcome</th></tr></thead>
          <tbody>
            <tr><td>Q4 FY25</td><td>4.0–7.0%</td><td>5.4%</td><td><span class="outcome-badge hit">✓ Hit</span></td></tr>
            <tr><td>Q3 FY25</td><td>3.5–6.5%</td><td>4.2%</td><td><span class="outcome-badge hit">✓ Hit</span></td></tr>
            <tr><td>Q2 FY25</td><td>3.0–5.0%</td><td>2.9%</td><td><span class="outcome-badge miss">✗ Miss</span></td></tr>
            <tr><td>Q1 FY25</td><td>1.0–3.0%</td><td>2.1%</td><td><span class="outcome-badge hit">✓ Hit</span></td></tr>
            <tr><td>Q4 FY24</td><td>1.0–3.5%</td><td>1.4%</td><td><span class="outcome-badge hit">✓ Hit</span></td></tr>
            <tr><td>Q3 FY24</td><td>1.0–3.5%</td><td>0.8%</td><td><span class="outcome-badge miss">✗ Miss</span></td></tr>
          </tbody>
        </table>
        <div class="guidance-summary">
          <span class="gs-pill green">4/6 Quarters: On Guidance</span>
          <span class="gs-pill amber">2/6 Slight Miss</span>
        </div>`;
    }
  });
}

// ============================================================
// SCROLL TOP BUTTON
// ============================================================
function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) btn.classList.add('visible');
    else btn.classList.remove('visible');
  });
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(message) {
  // Remove existing toast
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 28px;
    background: rgba(15,23,42,0.9);
    color: white;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 9999;
    animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.2s forwards;
    backdrop-filter: blur(8px);
  `;

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2700);
}

// ============================================================
// ADD CSS ANIMATIONS FOR TOAST
// ============================================================
const styleEl = document.createElement('style');
styleEl.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes fadeOut {
    to { opacity: 0; transform: translateY(10px); }
  }
  @keyframes heroFlash {
    0% { opacity: 0.7; }
    100% { opacity: 1; }
  }
`;
document.head.appendChild(styleEl);

// ============================================================
// STICKY NAV OFFSET — account for fixed headers
// ============================================================
function initStickyNav() {
  const nav = document.getElementById('sectionNav');
  if (!nav) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      nav.classList.toggle('stuck', !entry.isIntersecting);
    },
    { threshold: 1.0, rootMargin: '-1px 0px 0px 0px' }
  );
  // observe a sentinel element
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'height:1px;width:100%;position:absolute;top:144px;';
  document.body.prepend(sentinel);
  observer.observe(sentinel);
}

// ============================================================
// PROGRESS BAR ANIMATION ON SECTION LOAD
// ============================================================
function animateProgressBars() {
  const bars = document.querySelectorAll('.pb-fill, .risk-bar');
  bars.forEach(bar => {
    const targetWidth = bar.style.width;
    bar.style.width = '0';
    setTimeout(() => { bar.style.width = targetWidth; }, 100);
  });
}

// ============================================================
// LIVE DATA PANEL — show all fetched data
// ============================================================
let LIVE_JSON = null;

function renderLiveDataPanel(company) {
  if (!LIVE_JSON) return;

  const meta = LIVE_JSON._meta || {};
  const status = meta.status || 'unknown';
  const updated = meta.lastUpdated || '—';

  // Status badge
  const statusEl = document.getElementById('ldpStatus');
  if (statusEl) {
    statusEl.textContent = status;
    statusEl.className = 'ldp-status ' + status;
  }

  // Updated timestamp
  const updatedEl = document.getElementById('ldpUpdated');
  if (updatedEl) updatedEl.textContent = `Last updated: ${updated}`;

  // Business Mix
  const bizEl = document.getElementById('ldpBizMix');
  const biz = LIVE_JSON.bizMix?.[company]?.FY25;
  if (bizEl) {
    if (biz && biz.labels) {
      const rows = biz.labels.map((lbl, i) =>
        `<div class="ldp-row"><span class="ldp-row-label">${lbl}</span><span class="ldp-row-value">${biz.data[i]}%</span></div>`
      ).join('');
      const srcClass = biz.source === 'screener.in' ? 'live' : '';
      bizEl.innerHTML = rows + `<div class="ldp-source ${srcClass}">source: ${biz.source || 'seed'}</div>`;
    } else {
      bizEl.innerHTML = '<em>No data</em>';
    }
  }

  // Geographic Mix
  const geoEl = document.getElementById('ldpGeoMix');
  const geo = LIVE_JSON.geoMix?.[company]?.FY25;
  if (geoEl) {
    if (geo && geo.labels) {
      const rows = geo.labels.map((lbl, i) =>
        `<div class="ldp-row"><span class="ldp-row-label">${lbl}</span><span class="ldp-row-value">${geo.data[i]}%</span></div>`
      ).join('');
      const srcClass = geo.source === 'screener.in' ? 'live' : '';
      geoEl.innerHTML = rows + `<div class="ldp-source ${srcClass}">source: ${geo.source || 'seed'}</div>`;
    } else {
      geoEl.innerHTML = '<em>No data</em>';
    }
  }

  // Financial Metrics
  const finEl = document.getElementById('ldpFinMetrics');
  const fin = LIVE_JSON.financialMetrics?.[company];
  if (finEl) {
    if (fin) {
      const fmtCr = (n) => n >= 100000 ? `₹${(n/100000).toFixed(2)}L Cr` : `₹${n.toLocaleString('en-IN')} Cr`;
      let rows = '';
      if (fin.revenue) {
        rows += `<div class="ldp-row"><span class="ldp-row-label">Revenue (TTM)</span><span class="ldp-row-value">${fmtCr(fin.revenue[0])}</span></div>`;
        if (fin.revenue[1]) rows += `<div class="ldp-row"><span class="ldp-row-label">Revenue (Prev)</span><span class="ldp-row-value">${fmtCr(fin.revenue[1])}</span></div>`;
      }
      if (fin.netProfit) {
        rows += `<div class="ldp-row"><span class="ldp-row-label">Net Profit (TTM)</span><span class="ldp-row-value">${fmtCr(fin.netProfit[0])}</span></div>`;
        if (fin.netProfit[1]) rows += `<div class="ldp-row"><span class="ldp-row-label">Net Profit (Prev)</span><span class="ldp-row-value">${fmtCr(fin.netProfit[1])}</span></div>`;
      }
      const srcClass = fin.source === 'screener.in' ? 'live' : '';
      finEl.innerHTML = rows + `<div class="ldp-source ${srcClass}">source: ${fin.source || 'seed'}</div>`;
    } else {
      finEl.innerHTML = '<em>No data</em>';
    }
  }

  // Ownership
  const ownEl = document.getElementById('ldpOwnership');
  const own = LIVE_JSON.ownership?.[company];
  if (ownEl) {
    if (own) {
      let rows = '';
      if (own.promoter !== undefined) rows += `<div class="ldp-row"><span class="ldp-row-label">Promoter</span><span class="ldp-row-value">${own.promoter.toFixed(1)}%</span></div>`;
      if (own.fii !== undefined) rows += `<div class="ldp-row"><span class="ldp-row-label">FII</span><span class="ldp-row-value">${own.fii.toFixed(1)}%</span></div>`;
      if (own.dii !== undefined) rows += `<div class="ldp-row"><span class="ldp-row-label">DII</span><span class="ldp-row-value">${own.dii.toFixed(1)}%</span></div>`;
      if (own.mutualFund !== undefined) rows += `<div class="ldp-row"><span class="ldp-row-label">Mutual Fund</span><span class="ldp-row-value">${own.mutualFund.toFixed(1)}%</span></div>`;
      const srcClass = own.source === 'screener.in' ? 'live' : '';
      ownEl.innerHTML = rows + `<div class="ldp-source ${srcClass}">source: ${own.source || 'seed'}</div>`;
    } else {
      ownEl.innerHTML = '<em>No data</em>';
    }
  }
}

// ============================================================
// REFRESH ALL DATA — re-fetch JSON and update everything
// ============================================================
async function refreshAllData(btn) {
  if (btn) {
    btn.classList.add('loading');
    btn.disabled = true;
  }

  try {
    const res = await fetch('data/companies.json?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    LIVE_JSON = json;
    if (json.bizMix) MOCK_DATA.bizMix = json.bizMix;
    if (json.geoMix) MOCK_DATA.geoMix = json.geoMix;
    if (json.financialMetrics) MOCK_DATA.financialMetrics = json.financialMetrics;
    if (json.ownership) MOCK_DATA.ownership = json.ownership;
    ingestLiveJson(json);

    reinitCompanyAwareCharts();
    renderLiveDataPanel(activeCompanyKey);

    showToast(`Data refreshed (${json._meta?.status || 'ok'})`);
  } catch (err) {
    console.error('[ForensIQ] Refresh failed:', err);
    showToast('Refresh failed — check console');
  } finally {
    if (btn) {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }
}

// ============================================================
// DISPLAY FINANCIAL METRICS
// ============================================================
function displayFinancialMetrics(company) {
  const metrics = MOCK_DATA.financialMetrics?.[company];
  if (!metrics) return;

  const revEl = document.querySelector('[data-metric="revenue"]');
  const npEl = document.querySelector('[data-metric="netProfit"]');

  if (revEl && metrics.revenue) {
    const [current, prev1, prev2] = metrics.revenue;
    const change = ((current - prev1) / prev1 * 100).toFixed(1);
    const trend = change >= 0 ? '▲' : '▼';
    revEl.innerHTML = `${(current / 1000).toFixed(1)}K Cr <span style="font-size:0.85em; color:${change >= 0 ? '#10b981' : '#ef4444'}">${trend} ${Math.abs(change)}%</span>`;
  }

  if (npEl && metrics.netProfit) {
    const [current, prev1, prev2] = metrics.netProfit;
    const change = ((current - prev1) / prev1 * 100).toFixed(1);
    const trend = change >= 0 ? '▲' : '▼';
    npEl.innerHTML = `${(current / 1000).toFixed(1)}K Cr <span style="font-size:0.85em; color:${change >= 0 ? '#10b981' : '#ef4444'}">${trend} ${Math.abs(change)}%</span>`;
  }
}

// ============================================================
// DISPLAY OWNERSHIP DATA
// ============================================================
function displayOwnershipData(company) {
  const ownership = MOCK_DATA.ownership?.[company];
  if (!ownership) return;

  const promoterEl = document.querySelector('[data-ownership="promoter"]');
  const fiiEl = document.querySelector('[data-ownership="fii"]');
  const diiEl = document.querySelector('[data-ownership="dii"]');
  const mfEl = document.querySelector('[data-ownership="mutualFund"]');

  if (promoterEl) promoterEl.textContent = (ownership.promoter || 0).toFixed(1) + '%';
  if (fiiEl) fiiEl.textContent = (ownership.fii || 0).toFixed(1) + '%';
  if (diiEl) diiEl.textContent = (ownership.dii || 0).toFixed(1) + '%';
  if (mfEl) mfEl.textContent = (ownership.mutualFund || 0).toFixed(1) + '%';

  // Update ownership donut chart if it exists
  const ownershipDonut = document.getElementById('ownershipDonut');
  if (ownershipDonut && (ownership.promoter || ownership.fii || ownership.dii || ownership.mutualFund)) {
    destroyChart('ownershipDonut');
    const labels = [];
    const data = [];
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6'];
    let colorIdx = 0;

    if (ownership.promoter) { labels.push('Promoter'); data.push(ownership.promoter); }
    if (ownership.fii) { labels.push('FII'); data.push(ownership.fii); }
    if (ownership.dii) { labels.push('DII'); data.push(ownership.dii); }
    if (ownership.mutualFund) { labels.push('Mutual Fund'); data.push(ownership.mutualFund); }

    charts['ownershipDonut'] = new Chart(getCtx('ownershipDonut'), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 15, font: { size: 13 } } }
        }
      }
    });
  }
}

// ============================================================
// HERO STATS — populate from LIVE_SUMMARY[ticker]
// ============================================================
function fmtRupeeCr(n) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}T`;       // 1 lakh cr = ₹1T
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K Cr`;
  return `₹${n.toLocaleString('en-IN')} Cr`;
}
function fmtRupee(n) {
  if (n == null || isNaN(n)) return '—';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function applySummary(ticker) {
  const s = LIVE_SUMMARY[ticker];
  if (!s) return;

  // CMP + change pill
  const cmpEl = document.querySelector('.hero-cmp strong');
  if (cmpEl && s.currentPrice != null) cmpEl.textContent = `₹${s.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const chgEl = document.querySelector('.hero-change');
  if (chgEl && s.changePct != null) {
    const dir = s.changeDir || (s.changePct >= 0 ? 'up' : 'down');
    chgEl.classList.remove('up', 'down');
    chgEl.classList.add(dir);
    const arrow = dir === 'up' ? '▲' : '▼';
    chgEl.textContent = `${arrow} ${Math.abs(s.changePct).toFixed(2)}%`;
  }

  // Hero stat cards — match by .hs-label text
  document.querySelectorAll('.hero-stat').forEach((card) => {
    const label = (card.querySelector('.hs-label')?.textContent || '').toLowerCase();
    const valEl = card.querySelector('.hs-val');
    if (!valEl) return;
    if (/market\s*cap/.test(label) && s.marketCap != null) {
      valEl.textContent = fmtRupeeCr(s.marketCap);
    } else if (/p\/?e/.test(label) && s.pe != null) {
      valEl.textContent = `${s.pe.toFixed(1)}x`;
    }
    // Revenue TTM and PAT TTM are still owned by displayFinancialMetrics()
  });
}

// Re-render every chart that depends on the active company. Charts that
// haven't been initialized yet (their section was never opened) are
// skipped — they'll pick up live data when the user navigates to them.
function reinitCompanyAwareCharts() {
  initBizMixChart(activeBizMixPeriod, activeCompanyKey);
  initGeoMixChart(activeGeoMixPeriod, activeCompanyKey);
  if (charts['promoterHoldingChart']) initPromoterHoldingChart(activePeriods.promoterHolding);
  if (charts['revPatChart']) initRevPatChart(activePeriods.revPat);
  if (charts['marginTrendChart']) initMarginTrendChart(activePeriods.marginTrend);
  if (charts['cfoPatChart']) initCfoPatChart(activePeriods.cfoPat);
  if (charts['wcChart']) initWcChart(activePeriods.wc);
  if (charts['returnsChart']) initReturnsChart(activePeriods.returns);
  if (charts['ownershipTrendChart']) initOwnershipTrendChart(activePeriods.ownershipTrend);
  displayFinancialMetrics(activeCompanyKey);
  displayOwnershipData(activeCompanyKey);
  applySummary(activeCompanyKey);
}

// Pull derived series + summary from the JSON the loader/refresh fetched.
function ingestLiveJson(json) {
  for (const k of Object.keys(LIVE_DERIVED)) {
    if (json.derived?.[k]) Object.assign(LIVE_DERIVED[k], json.derived[k]);
  }
  if (json.summary) Object.assign(LIVE_SUMMARY, json.summary);
}

// ============================================================
// COMPANY DATA LOADER
// ============================================================
// Fetches data/companies.json (produced by scripts/fetch-company-data.mjs)
// and merges bizMix + geoMix into MOCK_DATA, then re-renders the donuts.
// On failure (e.g. opened via file:// without a server) the donuts will
// stay empty and a console warning is logged.
async function loadCompanyData() {
  try {
    const res = await fetch('data/companies.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    LIVE_JSON = json;
    if (json.bizMix) MOCK_DATA.bizMix = json.bizMix;
    if (json.geoMix) MOCK_DATA.geoMix = json.geoMix;
    if (json.financialMetrics) MOCK_DATA.financialMetrics = json.financialMetrics;
    if (json.ownership) MOCK_DATA.ownership = json.ownership;
    ingestLiveJson(json);

    // Re-render the company-aware charts now that data is available
    reinitCompanyAwareCharts();
    renderLiveDataPanel(activeCompanyKey);

    // Surface seed-vs-fetched status in the console so it's easy to verify
    const status = json._meta?.status || 'unknown';
    const updated = json._meta?.lastUpdated || '?';
    console.log(`[ForensIQ] companies.json loaded (status=${status}, lastUpdated=${updated})`);
    if (json._meta?.sources?.dataTypes) {
      console.log(`[ForensIQ] available data types: ${json._meta.sources.dataTypes.join(', ')}`);
    }
  } catch (err) {
    console.warn('[ForensIQ] Could not load data/companies.json — charts may fall back to mock data.', err);
    console.warn('[ForensIQ] Tip: serve the dashboard over http (e.g. `python3 -m http.server`) instead of opening index.html via file://.');
  }
}

// ============================================================
// MAIN INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Init non-company-specific charts immediately
  initMktShareChart('5Y');

  // Company-aware charts (bizMix, geoMix) wait for the JSON load
  loadCompanyData();

  // Init interaction handlers
  initSectionNav();
  initToggleGroups();
  initCompanySearch();
  initGuidanceTabs();
  initScrollTop();
  initStickyNav();
  animateProgressBars();

  // Set dashboard main top margin based on actual header heights
  function updateLayout() {
    const header = document.querySelector('.top-header');
    const hero = document.querySelector('.company-hero');
    if (header && hero) {
      const totalOffset = header.offsetHeight + hero.offsetHeight;
      document.querySelector('.dashboard-main').style.marginTop = totalOffset + 'px';
    }
  }

  updateLayout();
  window.addEventListener('resize', updateLayout);

  console.log('ForensIQ Dashboard initialized successfully ✓');
});
