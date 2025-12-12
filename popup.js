// TokenWare Popup Script v2.0
// Multi-chain security suite interface

// Navigation dropdown handling
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const currentSection = document.getElementById('currentSection');

// Section icons mapping
const sectionIcons = {
  'prices': '💰 Token Prices',
  'portfolio': '📊 Portfolio',
  'scanner': '🛡️ URL Scanner',
  'contract': '📝 Contract Analyzer',
  'alerts': '🔔 Price Alerts',
  'stats': '📈 Statistics',
  'settings': '⚙️ Settings'
};

// Toggle dropdown menu
navToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  navToggle.classList.toggle('open');
  navMenu.classList.toggle('open');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!navMenu.contains(e.target) && e.target !== navToggle) {
    navToggle.classList.remove('open');
    navMenu.classList.remove('open');
  }
});

// Navigation item click handler
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const sectionName = item.dataset.section;

    // Remove active from all nav items and sections
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

    // Add active to clicked item and corresponding section
    item.classList.add('active');
    document.getElementById(sectionName).classList.add('active');

    // Update current section display
    currentSection.textContent = sectionIcons[sectionName] || sectionName;

    // Close dropdown
    navToggle.classList.remove('open');
    navMenu.classList.remove('open');

    // Load section-specific data
    if (sectionName === 'scanner') loadCurrentSiteSecurity();
    if (sectionName === 'stats') loadStats();
    if (sectionName === 'settings') loadSettings();
    if (sectionName === 'portfolio') loadPortfolio();
    if (sectionName === 'alerts') loadAlerts();
  });
});

// Load current site security
async function loadCurrentSiteSecurity() {
  const container = document.getElementById('currentSiteSecurity');

  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
      container.innerHTML = '<div class="empty-state"><p>Not available for this page</p></div>';
      return;
    }

    container.innerHTML = '<div class="loading">Analyzing...</div>';

    // Request analysis
    const response = await chrome.runtime.sendMessage({
      action: 'analyzeURL',
      url: tab.url
    });

    if (response && response.success) {
      displaySiteSecurityCard(response.data, container);
    } else {
      container.innerHTML = '<div class="error">Failed to analyze site</div>';
    }
  } catch (error) {
    console.error('Error loading site security:', error);
    container.innerHTML = '<div class="error">Error analyzing site</div>';
  }
}

// Display site security card
function displaySiteSecurityCard(analysis, container) {
  const threatColors = {
    'SAFE': '#22c55e',
    'LOW': '#fbbf24',
    'MEDIUM': '#fb923c',
    'HIGH': '#ef4444',
    'CRITICAL': '#dc2626',
    'UNKNOWN': '#6b7280'
  };

  const borderColor = threatColors[analysis.threatLevel] || '#22c55e';

  let html = `
    <div class="site-security-card" style="border-color: ${borderColor};">
      <div class="threat-indicator">
        <div>
          <div style="font-size: 11px; color: #999; margin-bottom: 4px;">THREAT LEVEL</div>
          <div class="threat-level ${analysis.threatLevel}">${analysis.threatLevel}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; color: #999; margin-bottom: 4px;">RISK SCORE</div>
          <div class="risk-score" style="color: ${borderColor};">${analysis.riskScore}/100</div>
        </div>
      </div>

      <div style="background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 6px; margin-bottom: 12px;">
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">DOMAIN</div>
        <div style="font-size: 13px; word-break: break-all;">${analysis.domain}</div>
      </div>
  `;

  if (analysis.risks && analysis.risks.length > 0) {
    html += '<div style="font-size: 12px; color: #999; margin-bottom: 8px;">Detected Issues:</div>';
    html += '<ul class="risk-list">';
    analysis.risks.forEach(risk => {
      html += `
        <li class="${risk.severity}">
          <strong>${risk.type}:</strong> ${risk.message}
        </li>
      `;
    });
    html += '</ul>';
  } else {
    html += '<div style="text-align: center; padding: 12px; color: #22c55e;">✓ No security issues detected</div>';
  }

  html += `
      <div style="font-size: 10px; color: #666; text-align: center; margin-top: 12px;">
        Scanned: ${new Date(analysis.timestamp).toLocaleTimeString()}
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// Scan URL button
document.getElementById('scanUrlBtn').addEventListener('click', async () => {
  const url = document.getElementById('urlInput').value.trim();
  const resultDiv = document.getElementById('urlScanResult');
  const btn = document.getElementById('scanUrlBtn');

  if (!url) {
    resultDiv.innerHTML = '<div class="error">Please enter a URL</div>';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Scanning...';
  resultDiv.innerHTML = '<div class="loading">Analyzing URL...</div>';

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'analyzeURL',
      url: url
    });

    if (response && response.success) {
      displaySiteSecurityCard(response.data, resultDiv);
    } else {
      resultDiv.innerHTML = `<div class="error">Error: ${response.error || 'Unknown error'}</div>`;
    }
  } catch (error) {
    resultDiv.innerHTML = '<div class="error">Failed to scan URL</div>';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Scan URL';
  }
});

// Analyze contract button
document.getElementById('analyzeContractBtn').addEventListener('click', async () => {
  const address = document.getElementById('contractInput').value.trim();
  const chain = document.getElementById('chainSelect').value;
  const resultDiv = document.getElementById('contractResult');
  const btn = document.getElementById('analyzeContractBtn');

  if (!address) {
    resultDiv.innerHTML = '<div class="error">Please enter a contract address or token ID</div>';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Analyzing...';
  resultDiv.innerHTML = '<div class="loading">Analyzing contract...</div>';

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'analyzeContract',
      address: address,
      chain: chain
    });

    if (response && response.success) {
      displayContractAnalysis(response.data, resultDiv);
    } else {
      resultDiv.innerHTML = `<div class="error">Error: ${response.error || 'Unknown error'}</div>`;
    }
  } catch (error) {
    resultDiv.innerHTML = '<div class="error">Failed to analyze contract</div>';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Analyze Contract';
  }
});

// Display contract analysis
function displayContractAnalysis(analysis, container) {
  const threatColors = {
    'SAFE': '#22c55e',
    'LOW': '#fbbf24',
    'MEDIUM': '#fb923c',
    'HIGH': '#ef4444',
    'CRITICAL': '#dc2626',
    'UNKNOWN': '#6b7280'
  };

  const borderColor = threatColors[analysis.threatLevel] || '#22c55e';

  let html = `
    <div class="site-security-card" style="border-color: ${borderColor};">
      <div class="threat-indicator">
        <div>
          <div style="font-size: 11px; color: #999; margin-bottom: 4px;">THREAT LEVEL</div>
          <div class="threat-level ${analysis.threatLevel}">${analysis.threatLevel}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; color: #999; margin-bottom: 4px;">RISK SCORE</div>
          <div class="risk-score" style="color: ${borderColor};">${analysis.riskScore}/100</div>
        </div>
      </div>

      <div style="background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 6px; margin-bottom: 12px;">
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">ADDRESS</div>
        <div style="font-size: 11px; word-break: break-all; font-family: monospace;">${analysis.address}</div>
        <div style="font-size: 11px; color: #999; margin-top: 8px;">CHAIN: ${analysis.chain.toUpperCase()}</div>
      </div>
  `;

  if (analysis.contractData) {
    const data = analysis.contractData;
    html += '<div style="font-size: 12px; color: #999; margin-bottom: 8px;">Contract Data:</div>';
    html += '<div style="background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 6px; margin-bottom: 12px;">';

    if (data.price) html += `<div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1);"><span>Price:</span><span>$${parseFloat(data.price).toFixed(8)}</span></div>`;
    if (data.liquidity) html += `<div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1);"><span>Liquidity:</span><span>$${formatNumber(data.liquidity)}</span></div>`;
    if (data.marketCap) html += `<div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1);"><span>Market Cap:</span><span>$${formatNumber(data.marketCap)}</span></div>`;
    if (data.volume24h) html += `<div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1);"><span>24h Volume:</span><span>$${formatNumber(data.volume24h)}</span></div>`;
    if (data.createdDaysAgo !== null) html += `<div style="display: flex; justify-content: space-between; padding: 6px 0;"><span>Contract Age:</span><span>${data.createdDaysAgo} days</span></div>`;

    html += '</div>';
  }

  if (analysis.risks && analysis.risks.length > 0) {
    html += '<div style="font-size: 12px; color: #999; margin-bottom: 8px;">Security Risks:</div>';
    html += '<ul class="risk-list">';
    analysis.risks.forEach(risk => {
      html += `
        <li class="${risk.severity}">
          <strong>${risk.type}:</strong> ${risk.message}
        </li>
      `;
    });
    html += '</ul>';
  } else {
    html += '<div style="text-align: center; padding: 12px; color: #22c55e;">✓ No major security risks detected</div>';
  }

  html += '</div>';

  container.innerHTML = html;
}

// Load scan history
async function loadScanHistory() {
  const container = document.getElementById('scanHistoryContent');

  try {
    const response = await chrome.runtime.sendMessage({ action: 'getScanHistory' });

    if (!response || !response.success || !response.data || response.data.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No scan history yet</p></div>';
      return;
    }

    let html = '';
    response.data.slice(0, 20).forEach(scan => {
      const time = new Date(scan.scanned_at || scan.timestamp).toLocaleString();
      const domain = scan.domain || scan.url || scan.address || 'Unknown';

      html += `
        <div class="history-item">
          <div class="history-item-header">
            <div class="history-domain">${domain}</div>
            <div class="history-threat ${scan.threatLevel}">${scan.threatLevel}</div>
          </div>
          <div class="history-time">${time}</div>
          ${scan.riskScore !== undefined ? `<div style="font-size: 11px; color: #999; margin-top: 4px;">Risk Score: ${scan.riskScore}/100</div>` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading scan history:', error);
    container.innerHTML = '<div class="error">Failed to load scan history</div>';
  }
}

// Load whitelist
async function loadWhitelist() {
  const container = document.getElementById('whitelistContent');

  try {
    const response = await chrome.runtime.sendMessage({ action: 'getWhitelist' });

    if (!response || !response.success || !response.data || response.data.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No whitelisted sites</p></div>';
      return;
    }

    let html = '';
    response.data.forEach(domain => {
      html += `
        <div class="whitelist-item">
          <div class="whitelist-domain">${domain}</div>
          <button class="btn-remove" data-domain="${domain}">Remove</button>
        </div>
      `;
    });

    container.innerHTML = html;

    // Add remove handlers
    container.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        const domain = btn.dataset.domain;
        await chrome.runtime.sendMessage({
          action: 'removeFromWhitelist',
          domain: domain
        });
        loadWhitelist(); // Refresh
      });
    });
  } catch (error) {
    console.error('Error loading whitelist:', error);
    container.innerHTML = '<div class="error">Failed to load whitelist</div>';
  }
}

// Load stats
async function loadStats() {
  const container = document.getElementById('statsGrid');

  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStats' });

    const today = new Date().toISOString().split('T')[0];
    const stats = (response && response.data && response.data[today]) || {
      scansPerformed: 0,
      threatsDetected: 0,
      sitesWhitelisted: 0,
      contractsAnalyzed: 0
    };

    container.innerHTML = `
      <div class="stat-card">
        <h3>${stats.scansPerformed || 0}</h3>
        <p>Scans Today</p>
      </div>
      <div class="stat-card danger">
        <h3>${stats.threatsDetected || 0}</h3>
        <p>Threats Detected</p>
      </div>
      <div class="stat-card">
        <h3>${stats.sitesWhitelisted || 0}</h3>
        <p>Sites Whitelisted</p>
      </div>
      <div class="stat-card">
        <h3>${stats.contractsAnalyzed || 0}</h3>
        <p>Contracts Analyzed</p>
      </div>
    `;
  } catch (error) {
    console.error('Error loading stats:', error);
    container.innerHTML = '<div class="error">Failed to load stats</div>';
  }
}

// Load settings
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    const settings = (response && response.data) || {};

    // Set toggle states
    document.getElementById('scanToggle').classList.toggle('on', settings.autoScan !== false);
    document.getElementById('badgeToggle').classList.toggle('on', settings.showBadge !== false);
    document.getElementById('warningsToggle').classList.toggle('on', settings.showWarnings !== false);
    document.getElementById('soundToggle').classList.toggle('on', settings.notificationSound !== false);
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Setting toggle handlers
const toggles = {
  'scanToggle': 'autoScan',
  'badgeToggle': 'showBadge',
  'warningsToggle': 'showWarnings',
  'soundToggle': 'notificationSound',
};

Object.entries(toggles).forEach(([elementId, settingKey]) => {
  const element = document.getElementById(elementId);
  element.addEventListener('click', async () => {
    element.classList.toggle('on');

    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    const settings = (response && response.data) || {};
    settings[settingKey] = element.classList.contains('on');

    await chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: settings
    });
  });
});

// Clear data button
document.getElementById('clearDataBtn').addEventListener('click', async () => {
  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    await chrome.storage.local.clear();
    alert('All data cleared');
    location.reload();
  }
});

// Format number helper
function formatNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return parseFloat(num).toFixed(2);
}

// ===== PRICE TRACKING FEATURES =====

// Get token price
document.getElementById('getPriceBtn').addEventListener('click', async () => {
  const address = document.getElementById('priceAddressInput').value.trim();
  const chain = document.getElementById('priceChainSelect').value;
  const resultDiv = document.getElementById('priceResult');
  const btn = document.getElementById('getPriceBtn');

  if (!address) {
    resultDiv.innerHTML = '<div class="error">Please enter a contract address</div>';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Loading...';
  resultDiv.innerHTML = '<div class="loading">Fetching price data...</div>';

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getTokenPrice',
      address: address,
      chain: chain
    });

    if (response && response.success && response.data) {
      displayPriceData(response.data, resultDiv);
    } else {
      resultDiv.innerHTML = '<div class="error">No price data found for this token</div>';
    }
  } catch (error) {
    resultDiv.innerHTML = '<div class="error">Failed to fetch price data</div>';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Get Price';
  }
});

// Display price data
function displayPriceData(data, container) {
  const change24h = data.priceChange?.['24h'] || data.priceChange?.h24 || 0;
  const changeClass = change24h >= 0 ? 'price-change-positive' : 'price-change-negative';

  let html = `
    <div class="price-card">
      <div class="price-header">
        <span class="token-name">${data.name}</span>
        <span class="token-symbol">${data.symbol}</span>
      </div>
      <div class="price-big">${formatPrice(data.price)}</div>
      <div class="${changeClass}" style="margin-bottom: 12px;">
        ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}% (24h)
      </div>
  `;

  if (data.marketCap) {
    html += `<div class="price-row"><span class="price-label">Market Cap:</span><span class="price-value">${formatMarketCap(data.marketCap)}</span></div>`;
  }

  if (data.liquidity) {
    html += `<div class="price-row"><span class="price-label">Liquidity:</span><span class="price-value">${formatMarketCap(data.liquidity)}</span></div>`;
  }

  if (data.volume?.['24h'] || data.volume?.h24) {
    const vol = data.volume?.['24h'] || data.volume.h24;
    html += `<div class="price-row"><span class="price-label">24h Volume:</span><span class="price-value">${formatMarketCap(vol)}</span></div>`;
  }

  if (data.fdv) {
    html += `<div class="price-row"><span class="price-label">FDV:</span><span class="price-value">${formatMarketCap(data.fdv)}</span></div>`;
  }

  if (data.dexName) {
    html += `<div class="price-row"><span class="price-label">DEX:</span><span class="price-value">${data.dexName}</span></div>`;
  }

  html += `
      <div style="margin-top: 12px; display: flex; gap: 8px;">
        <button class="btn" style="flex: 1;" onclick="addPriceAlertFromPrice('${data.address}', '${data.chain}', '${data.symbol}', ${data.price})">
          Set Alert
        </button>
        <button class="btn btn-secondary" style="flex: 1;" onclick="addToPortfolioFromPrice('${data.address}', '${data.chain}', '${data.symbol}', ${data.price})">
          Add to Portfolio
        </button>
      </div>
      <div style="text-align: center; font-size: 9px; color: #666; margin-top: 8px;">
        Source: ${data.source || 'unknown'}
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// Helper: Add to portfolio from price display
window.addToPortfolioFromPrice = function(address, chain, symbol, price) {
  document.querySelector('[data-tab="portfolio"]').click();
  document.getElementById('portfolioChainSelect').value = chain;
  document.getElementById('portfolioAddressInput').value = address;
  document.getElementById('portfolioSymbolInput').value = symbol;
  document.getElementById('portfolioAvgPriceInput').value = price;
};

// Helper: Set alert from price display
window.addPriceAlertFromPrice = function(address, chain, symbol, price) {
  document.querySelector('[data-tab="alerts"]').click();
  document.getElementById('alertChainSelect').value = chain;
  document.getElementById('alertAddressInput').value = address;
  document.getElementById('alertSymbolInput').value = symbol;
  document.getElementById('alertTargetInput').value = price;
};

// Load trending tokens
async function loadTrendingTokens() {
  const container = document.getElementById('trendingTokens');

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getTrendingTokens'
    });

    if (!response || !response.success || !response.data || response.data.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No trending tokens available</p></div>';
      return;
    }

    let html = '';
    response.data.slice(0, 8).forEach((token) => {
      const changeClass = token.priceChange24h >= 0 ? 'price-change-positive' : 'price-change-negative';
      html += `
        <div class="trending-item">
          <img src="${token.image}" class="trending-icon" onerror="this.style.display='none'">
          <div class="trending-info">
            <div class="trending-name">${token.name}</div>
            <div class="trending-symbol">${token.symbol}</div>
          </div>
          <div class="trending-price">
            <div style="font-size: 13px; font-weight: 600; color: #fff;">${formatPrice(token.price)}</div>
            <div class="${changeClass}" style="font-size: 11px;">
              ${token.priceChange24h >= 0 ? '+' : ''}${token.priceChange24h.toFixed(1)}%
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading trending tokens:', error);
    container.innerHTML = '<div class="error">Failed to load trending tokens</div>';
  }
}

// ===== PORTFOLIO FEATURES =====

// Load portfolio
async function loadPortfolio() {
  const summaryDiv = document.getElementById('portfolioSummary');
  const positionsDiv = document.getElementById('portfolioPositions');

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getPortfolioValue'
    });

    if (!response || !response.success) {
      summaryDiv.innerHTML = '<div class="error">Failed to load portfolio</div>';
      return;
    }

    const data = response.data;

    if (!data || !data.positions || data.positions.length === 0) {
      summaryDiv.innerHTML = '<div class="empty-state"><p>Your portfolio is empty</p></div>';
      positionsDiv.innerHTML = '';
      return;
    }

    // Display summary
    const pnlClass = data.totalPnl >= 0 ? 'price-change-positive' : 'price-change-negative';
    summaryDiv.innerHTML = `
      <div class="portfolio-summary">
        <div style="font-size: 12px; color: #999; margin-bottom: 4px;">Total Portfolio Value</div>
        <div class="portfolio-total">${formatMarketCap(data.totalValue)}</div>
        <div class="portfolio-pnl ${pnlClass}">
          ${data.totalPnl >= 0 ? '+' : ''}${formatMarketCap(data.totalPnl)} (${data.totalPnlPercent.toFixed(2)}%)
        </div>
      </div>
    `;

    // Display positions
    let positionsHtml = '<h3 class="section-title" style="margin-top: 16px;">Positions</h3>';
    data.positions.forEach(pos => {
      const pnlClass = pos.pnl >= 0 ? 'price-change-positive' : 'price-change-negative';
      positionsHtml += `
        <div class="position-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div>
              <span style="font-size: 15px; font-weight: 600; color: #fff;">${pos.symbol}</span>
              <span style="font-size: 11px; color: #999; margin-left: 8px;">${pos.chain.toUpperCase()}</span>
            </div>
            <button class="btn-remove" onclick="removeFromPortfolio('${pos.address}', '${pos.chain}')">Remove</button>
          </div>
          <div class="price-row">
            <span class="price-label">Amount:</span>
            <span class="price-value">${pos.amount}</span>
          </div>
          <div class="price-row">
            <span class="price-label">Current Price:</span>
            <span class="price-value">${formatPrice(pos.currentPrice)}</span>
          </div>
          <div class="price-row">
            <span class="price-label">Avg Buy Price:</span>
            <span class="price-value">${formatPrice(pos.avgPrice)}</span>
          </div>
          <div class="price-row">
            <span class="price-label">Value:</span>
            <span class="price-value">${formatMarketCap(pos.currentValue)}</span>
          </div>
          <div class="price-row">
            <span class="price-label">P&L:</span>
            <span class="price-value ${pnlClass}">
              ${pos.pnl >= 0 ? '+' : ''}${formatMarketCap(pos.pnl)} (${pos.pnlPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      `;
    });

    positionsDiv.innerHTML = positionsHtml;
  } catch (error) {
    console.error('Error loading portfolio:', error);
    summaryDiv.innerHTML = '<div class="error">Failed to load portfolio</div>';
  }
}

// Add to portfolio
document.getElementById('addToPortfolioBtn').addEventListener('click', async () => {
  const address = document.getElementById('portfolioAddressInput').value.trim();
  const chain = document.getElementById('portfolioChainSelect').value;
  const symbol = document.getElementById('portfolioSymbolInput').value.trim();
  const amount = parseFloat(document.getElementById('portfolioAmountInput').value);
  const avgPrice = parseFloat(document.getElementById('portfolioAvgPriceInput').value);

  if (!address || !symbol || !amount || !avgPrice) {
    alert('Please fill in all fields');
    return;
  }

  try {
    await chrome.runtime.sendMessage({
      action: 'addToPortfolio',
      address,
      chain,
      symbol,
      amount,
      avgPrice
    });

    // Clear inputs
    document.getElementById('portfolioAddressInput').value = '';
    document.getElementById('portfolioSymbolInput').value = '';
    document.getElementById('portfolioAmountInput').value = '';
    document.getElementById('portfolioAvgPriceInput').value = '';

    // Reload portfolio
    loadPortfolio();
  } catch (error) {
    alert('Failed to add to portfolio');
  }
});

// Remove from portfolio
window.removeFromPortfolio = async function(address, chain) {
  if (!confirm('Remove this position from your portfolio?')) return;

  try {
    await chrome.runtime.sendMessage({
      action: 'removeFromPortfolio',
      address,
      chain
    });

    loadPortfolio();
  } catch (error) {
    alert('Failed to remove from portfolio');
  }
};

// ===== PRICE ALERTS =====

// Load price alerts
async function loadPriceAlerts() {
  const container = document.getElementById('alertsList');

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getPriceAlerts'
    });

    if (!response || !response.success || !response.data || response.data.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No price alerts set</p></div>';
      return;
    }

    let html = '';
    response.data.forEach(alert => {
      const triggeredClass = alert.triggered ? 'alert-triggered' : '';
      const typeText = alert.type === 'above' ? 'Above' : alert.type === 'below' ? 'Below' : 'Change';

      html += `
        <div class="alert-item ${triggeredClass}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div>
              <span style="font-size: 14px; font-weight: 600; color: #fff;">${alert.symbol}</span>
              <span style="font-size: 11px; color: #999; margin-left: 8px;">${alert.chain.toUpperCase()}</span>
            </div>
            <button class="btn-remove" onclick="removePriceAlert('${alert.id}')">Remove</button>
          </div>
          <div style="font-size: 12px; color: #999;">
            Alert when price ${typeText.toLowerCase()} ${formatPrice(alert.targetPrice)}
          </div>
          ${alert.triggered ? `<div style="font-size: 12px; color: #fbbf24; margin-top: 4px;">✓ Triggered</div>` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading price alerts:', error);
    container.innerHTML = '<div class="error">Failed to load price alerts</div>';
  }
}

// Create price alert
document.getElementById('createAlertBtn').addEventListener('click', async () => {
  const address = document.getElementById('alertAddressInput').value.trim();
  const chain = document.getElementById('alertChainSelect').value;
  const symbol = document.getElementById('alertSymbolInput').value.trim();
  const type = document.getElementById('alertTypeSelect').value;
  const targetPrice = parseFloat(document.getElementById('alertTargetInput').value);

  if (!address || !symbol || !targetPrice) {
    alert('Please fill in all fields');
    return;
  }

  try {
    await chrome.runtime.sendMessage({
      action: 'addPriceAlert',
      address,
      chain,
      symbol,
      type,
      targetPrice,
      basePrice: targetPrice,
      percentThreshold: type === 'percent_change' ? targetPrice : 0
    });

    // Clear inputs
    document.getElementById('alertAddressInput').value = '';
    document.getElementById('alertSymbolInput').value = '';
    document.getElementById('alertTargetInput').value = '';

    // Reload alerts
    loadPriceAlerts();
    alert('Price alert created!');
  } catch (error) {
    alert('Failed to create price alert');
  }
});

// Remove price alert
window.removePriceAlert = async function(alertId) {
  if (!confirm('Remove this price alert?')) return;

  try {
    await chrome.runtime.sendMessage({
      action: 'removePriceAlert',
      alertId
    });

    loadPriceAlerts();
  } catch (error) {
    alert('Failed to remove price alert');
  }
};

// Helper: Format price
function formatPrice(price) {
  if (!price) return '$0.00';
  if (price >= 1000) return '$' + price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (price >= 1) return '$' + price.toFixed(2);
  if (price >= 0.01) return '$' + price.toFixed(4);
  if (price >= 0.0001) return '$' + price.toFixed(6);
  return '$' + price.toFixed(8);
}

// Helper: Format market cap
function formatMarketCap(value) {
  if (!value) return '$0';
  if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M';
  if (value >= 1e3) return '$' + (value / 1e3).toFixed(2) + 'K';
  return '$' + value.toFixed(2);
}

// Update tab loading to include price features
const originalTabBtnHandler = document.querySelectorAll('.tab-btn')[0];
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    if (tabName === 'prices') loadTrendingTokens();
    if (tabName === 'portfolio') loadPortfolio();
    if (tabName === 'alerts') loadPriceAlerts();
  });
});

// Initialize
loadCurrentSiteSecurity();
loadTrendingTokens(); // Load trending tokens on startup
