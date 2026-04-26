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
  // Business / Service Mix is keyed by company ticker so the donut updates
  // live whenever the user picks a different company from the search.
  bizMix: {
    INFY: {
      FY25: {
        labels: ['Financial Services', 'Retail & CPG', 'Manufacturing', 'Energy & Utilities', 'Hi-Tech', 'Life Sciences', 'Others'],
        data: [31.2, 15.4, 14.8, 12.1, 11.3, 8.6, 6.6],
        colors: ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#14b8a6','#94a3b8']
      },
      FY23: {
        labels: ['Financial Services', 'Retail & CPG', 'Manufacturing', 'Energy & Utilities', 'Hi-Tech', 'Life Sciences', 'Others'],
        data: [32.8, 15.1, 12.4, 11.8, 12.1, 7.2, 8.6],
        colors: ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#14b8a6','#94a3b8']
      }
    },
    TCS: {
      FY25: {
        labels: ['BFSI', 'Retail & CPG', 'Manufacturing', 'Communications & Media', 'Technology & Services', 'Life Sciences & Healthcare', 'Others'],
        data: [31.6, 15.8, 10.2, 16.4, 8.9, 11.0, 6.1],
        colors: ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#14b8a6','#94a3b8']
      },
      FY23: {
        labels: ['BFSI', 'Retail & CPG', 'Manufacturing', 'Communications & Media', 'Technology & Services', 'Life Sciences & Healthcare', 'Others'],
        data: [31.5, 16.5, 9.6, 17.7, 9.0, 10.6, 5.1],
        colors: ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#14b8a6','#94a3b8']
      }
    },
    HDFCBANK: {
      FY25: {
        labels: ['Retail Banking', 'Wholesale Banking', 'Treasury', 'Other Banking Operations', 'Insurance & Subsidiaries'],
        data: [54.6, 26.8, 9.2, 5.4, 4.0],
        colors: ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899']
      },
      FY23: {
        labels: ['Retail Banking', 'Wholesale Banking', 'Treasury', 'Other Banking Operations', 'Insurance & Subsidiaries'],
        data: [51.2, 28.4, 10.6, 6.3, 3.5],
        colors: ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899']
      }
    },
    RELIANCE: {
      FY25: {
        labels: ['Oil-to-Chemicals (O2C)', 'Retail', 'Digital Services (Jio)', 'Oil & Gas (E&P)', 'Others'],
        data: [56.3, 24.1, 12.8, 1.6, 5.2],
        colors: ['#6366f1','#10b981','#f59e0b','#3b82f6','#94a3b8']
      },
      FY23: {
        labels: ['Oil-to-Chemicals (O2C)', 'Retail', 'Digital Services (Jio)', 'Oil & Gas (E&P)', 'Others'],
        data: [62.4, 19.8, 11.5, 1.9, 4.4],
        colors: ['#6366f1','#10b981','#f59e0b','#3b82f6','#94a3b8']
      }
    },
    ASIANPAINT: {
      FY25: {
        labels: ['Decorative — India', 'Industrial Coatings', 'Home Improvement (Bath & Kitchen)', 'International (Asia, MEA, SA)', 'Others'],
        data: [72.8, 8.4, 4.6, 12.3, 1.9],
        colors: ['#6366f1','#10b981','#f59e0b','#3b82f6','#94a3b8']
      },
      FY23: {
        labels: ['Decorative — India', 'Industrial Coatings', 'Home Improvement (Bath & Kitchen)', 'International (Asia, MEA, SA)', 'Others'],
        data: [74.5, 7.6, 3.9, 12.2, 1.8],
        colors: ['#6366f1','#10b981','#f59e0b','#3b82f6','#94a3b8']
      }
    },
    BAJFINANCE: {
      FY25: {
        labels: ['Consumer B2C (Personal & Auto)', 'Consumer B2B (Sales Finance)', 'SME Lending', 'Commercial Lending', 'Rural Finance', 'Mortgages'],
        data: [27.4, 18.6, 14.8, 11.2, 9.5, 18.5],
        colors: ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#14b8a6']
      },
      FY23: {
        labels: ['Consumer B2C (Personal & Auto)', 'Consumer B2B (Sales Finance)', 'SME Lending', 'Commercial Lending', 'Rural Finance', 'Mortgages'],
        data: [25.8, 21.2, 13.6, 10.4, 8.7, 20.3],
        colors: ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#14b8a6']
      }
    }
  },

  // Geography Mix is also keyed by company so the donut updates live on
  // company select.
  geoMix: {
    INFY: {
      FY25: {
        labels: ['North America', 'Europe', 'India', 'Rest of World'],
        data: [58.1, 25.4, 9.2, 7.3],
        colors: ['#6366f1','#3b82f6','#10b981','#f59e0b']
      },
      FY23: {
        labels: ['North America', 'Europe', 'India', 'Rest of World'],
        data: [60.2, 23.1, 9.8, 6.9],
        colors: ['#6366f1','#3b82f6','#10b981','#f59e0b']
      }
    },
    TCS: {
      FY25: {
        labels: ['North America', 'Europe (UK + Cont.)', 'India', 'Rest of World'],
        data: [51.4, 31.2, 5.6, 11.8],
        colors: ['#6366f1','#3b82f6','#10b981','#f59e0b']
      },
      FY23: {
        labels: ['North America', 'Europe (UK + Cont.)', 'India', 'Rest of World'],
        data: [52.6, 30.0, 5.4, 12.0],
        colors: ['#6366f1','#3b82f6','#10b981','#f59e0b']
      }
    },
    HDFCBANK: {
      FY25: {
        labels: ['India', 'GIFT City / IBU', 'International Branches (Bahrain, HK, Dubai)', 'Representative Offices'],
        data: [96.4, 1.8, 1.6, 0.2],
        colors: ['#10b981','#6366f1','#3b82f6','#f59e0b']
      },
      FY23: {
        labels: ['India', 'GIFT City / IBU', 'International Branches (Bahrain, HK, Dubai)', 'Representative Offices'],
        data: [95.6, 1.5, 2.6, 0.3],
        colors: ['#10b981','#6366f1','#3b82f6','#f59e0b']
      }
    },
    RELIANCE: {
      FY25: {
        labels: ['India (Domestic)', 'Exports — Asia', 'Exports — Americas', 'Exports — Europe', 'Exports — Africa & RoW'],
        data: [68.4, 14.2, 7.6, 6.8, 3.0],
        colors: ['#10b981','#6366f1','#3b82f6','#f59e0b','#ec4899']
      },
      FY23: {
        labels: ['India (Domestic)', 'Exports — Asia', 'Exports — Americas', 'Exports — Europe', 'Exports — Africa & RoW'],
        data: [64.8, 15.6, 8.4, 7.9, 3.3],
        colors: ['#10b981','#6366f1','#3b82f6','#f59e0b','#ec4899']
      }
    },
    ASIANPAINT: {
      FY25: {
        labels: ['India', 'Asia (Bangladesh, Nepal, Sri Lanka, Indonesia)', 'Middle East', 'Africa', 'South Asia & Others'],
        data: [86.2, 6.4, 3.1, 2.9, 1.4],
        colors: ['#10b981','#6366f1','#3b82f6','#f59e0b','#ec4899']
      },
      FY23: {
        labels: ['India', 'Asia (Bangladesh, Nepal, Sri Lanka, Indonesia)', 'Middle East', 'Africa', 'South Asia & Others'],
        data: [87.0, 6.0, 2.8, 2.9, 1.3],
        colors: ['#10b981','#6366f1','#3b82f6','#f59e0b','#ec4899']
      }
    },
    BAJFINANCE: {
      FY25: {
        labels: ['India — Urban', 'India — Rural', 'India — Metro/Tier-1'],
        data: [48.6, 18.4, 33.0],
        colors: ['#6366f1','#10b981','#3b82f6']
      },
      FY23: {
        labels: ['India — Urban', 'India — Rural', 'India — Metro/Tier-1'],
        data: [47.2, 17.1, 35.7],
        colors: ['#6366f1','#10b981','#3b82f6']
      }
    }
  },

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
  const d = company[period] || company.FY25;
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
  const d = company[period] || company.FY25;
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
  const d = MOCK_DATA.promoterHolding[period];
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
  const d = MOCK_DATA.revPat[period];
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
  const d = MOCK_DATA.marginTrend[period];
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
  const d = MOCK_DATA.cfoPat[period];
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
  const d = MOCK_DATA.wc[period];
  charts['wcChart'] = new Chart(getCtx('wcChart'), {
    type: 'line',
    data: {
      labels: d.labels,
      datasets: [
        {
          label: 'DSO',
          data: d.dso,
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
          data: d.dpo,
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
          data: d.nwc,
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
  const d = MOCK_DATA.returns[period];
  charts['returnsChart'] = new Chart(getCtx('returnsChart'), {
    type: 'line',
    data: {
      labels: d.labels,
      datasets: [
        {
          label: 'ROCE',
          data: d.roce,
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
          data: d.roe,
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
          data: d.roa,
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
  const d = MOCK_DATA.ownershipTrend[period];
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
      initPromoterHoldingChart('5Y');
      initCapAllocChart();
      break;
    case 's3':
      initRevPatChart('5Y');
      initMarginTrendChart('5Y');
      initCfoPatChart('5Y');
      initWcChart('5Y');
      initReturnsChart('5Y');
      break;
    case 's5':
      initHeadcountChart('5Y');
      break;
    case 's6':
      initOwnershipTrendChart('5Y');
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
// COMPANY SEARCH
// ============================================================
function initCompanySearch() {
  const input = document.getElementById('companySearchInput');
  const dropdown = document.getElementById('searchDropdown');
  const items = document.querySelectorAll('.search-item');
  const activeNameEl = document.getElementById('activeCompanyName');
  const heroNameEl = document.getElementById('heroCompanyName');
  const qualityScoreEl = document.getElementById('qualityScore');

  input.addEventListener('focus', () => {
    dropdown.classList.add('active');
    input.value = '';
  });

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase();
    items.forEach(item => {
      const name = item.querySelector('.si-name').textContent.toLowerCase();
      const ticker = item.querySelector('.si-ticker').textContent.toLowerCase();
      item.style.display = (name.includes(query) || ticker.includes(query)) ? 'flex' : 'none';
    });
  });

  document.addEventListener('click', (e) => {
    if (!input.closest('.company-search-wrap')?.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });

  items.forEach(item => {
    item.addEventListener('click', () => {
      const name = item.dataset.name;
      const ticker = item.dataset.ticker;

      // Update UI
      activeNameEl.textContent = name;
      document.querySelector('.tag-exchange').textContent = ticker;
      heroNameEl.textContent = name;

      // Re-render company-aware charts with the newly selected company
      activeCompanyKey = getCompanyKeyFromTicker(ticker) || activeCompanyKey;
      initBizMixChart(activeBizMixPeriod, activeCompanyKey);
      initGeoMixChart(activeGeoMixPeriod, activeCompanyKey);

      // Animate quality score change
      animateScore(qualityScoreEl, parseInt(qualityScoreEl.textContent), Math.floor(Math.random() * 20) + 70);

      // Close dropdown
      dropdown.classList.remove('active');
      input.value = '';

      // Trigger hero bar flash
      const hero = document.getElementById('companyHero');
      hero.style.animation = 'none';
      requestAnimationFrame(() => {
        hero.style.animation = 'heroFlash 0.5s ease';
      });

      showToast(`Switched to ${name}`);
    });
  });
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
function refreshSection(btn, sectionId) {
  btn.classList.add('loading');
  btn.disabled = true;

  setTimeout(() => {
    btn.classList.remove('loading');
    btn.disabled = false;

    // Update timestamp
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

    showToast('Section data refreshed');
  }, 1500);
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
// MAIN INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Init all section 1 charts (active by default)
  initBizMixChart('FY25');
  initGeoMixChart('FY25');
  initMktShareChart('5Y');

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
