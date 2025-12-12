// TokenWare Universal Security Content Script
// Runs on all websites to detect threats

(async function() {
  'use strict';

  // Configuration
  const CONFIG = {
    enableAutoScan: true,
    enableWarnings: true,
    enableFloatingBadge: true,
    scanDelay: 1000
  };

  let currentSiteAnalysis = null;
  let floatingBadge = null;

  // Load settings from storage
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get('settings', (result) => {
        const settings = result.settings || {};
        CONFIG.enableAutoScan = settings.autoScan !== false;
        CONFIG.enableWarnings = settings.showWarnings !== false;
        CONFIG.enableFloatingBadge = settings.showBadge !== false;
        resolve(CONFIG);
      });
    });
  }

  // Analyze current site
  async function analyzeCurrentSite() {
    const url = window.location.href;

    try {
      // Send analysis request to background
      const response = await chrome.runtime.sendMessage({
        action: 'analyzeURL',
        url: url
      });

      if (response && response.success) {
        currentSiteAnalysis = response.data;
        updateFloatingBadge(currentSiteAnalysis);

        // Show warning if site is dangerous
        if (currentSiteAnalysis.threatLevel === 'CRITICAL' || currentSiteAnalysis.threatLevel === 'HIGH') {
          showWarningOverlay(currentSiteAnalysis);
        }

        return currentSiteAnalysis;
      }
    } catch (error) {
      console.error('TokenWare: Analysis failed', error);
    }

    return null;
  }

  // Create floating security badge
  function createFloatingBadge() {
    if (!CONFIG.enableFloatingBadge) return;

    const badge = document.createElement('div');
    badge.id = 'tokenware-floating-badge';
    badge.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border: 3px solid #22c55e;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 999998;
      transition: all 0.3s ease;
      font-size: 24px;
    `;

    badge.innerHTML = '🛡️';
    badge.title = 'TokenWare Security';

    // Click to show details
    badge.addEventListener('click', () => {
      showSiteAnalysisPopup();
    });

    // Hover effect
    badge.addEventListener('mouseenter', () => {
      badge.style.transform = 'scale(1.1)';
    });

    badge.addEventListener('mouseleave', () => {
      badge.style.transform = 'scale(1)';
    });

    document.body.appendChild(badge);
    floatingBadge = badge;

    return badge;
  }

  // Update floating badge based on threat level
  function updateFloatingBadge(analysis) {
    if (!floatingBadge) return;

    const colors = {
      'SAFE': '#22c55e',
      'LOW': '#fbbf24',
      'MEDIUM': '#fb923c',
      'HIGH': '#ef4444',
      'CRITICAL': '#991b1b',
      'UNKNOWN': '#6b7280'
    };

    const emojis = {
      'SAFE': '✅',
      'LOW': '⚠️',
      'MEDIUM': '⚠️',
      'HIGH': '🚨',
      'CRITICAL': '☠️',
      'UNKNOWN': '🛡️'
    };

    const threatLevel = analysis?.threatLevel || 'UNKNOWN';
    floatingBadge.style.borderColor = colors[threatLevel];
    floatingBadge.innerHTML = emojis[threatLevel];
    floatingBadge.title = `TokenWare: ${threatLevel} Risk`;

    // Pulse animation for dangerous sites
    if (threatLevel === 'CRITICAL' || threatLevel === 'HIGH') {
      floatingBadge.style.animation = 'tokenware-pulse 2s infinite';
    } else {
      floatingBadge.style.animation = 'none';
    }
  }

  // Show warning overlay for dangerous sites
  function showWarningOverlay(analysis) {
    if (!CONFIG.enableWarnings) return;

    // Don't show warning on whitelisted sites
    chrome.storage.local.get('whitelist', (result) => {
      const whitelist = result.whitelist || [];
      if (whitelist.includes(analysis.domain)) return;

      createWarningOverlay(analysis);
    });
  }

  // Create warning overlay
  function createWarningOverlay(analysis) {
    // Remove existing overlay if any
    const existing = document.getElementById('tokenware-warning-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'tokenware-warning-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const warningBox = document.createElement('div');
    warningBox.style.cssText = `
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border: 3px solid ${analysis.threatLevel === 'CRITICAL' ? '#dc2626' : '#fb923c'};
      border-radius: 16px;
      padding: 32px;
      max-width: 600px;
      color: #fff;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;

    warningBox.innerHTML = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 64px; margin-bottom: 16px;">${analysis.threatLevel === 'CRITICAL' ? '☠️' : '⚠️'}</div>
        <h1 style="margin: 0; font-size: 28px; color: ${analysis.threatLevel === 'CRITICAL' ? '#dc2626' : '#fb923c'};">
          ${analysis.threatLevel} THREAT DETECTED
        </h1>
      </div>

      <div style="background: rgba(0, 0, 0, 0.3); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0 0 8px 0; color: #999; font-size: 13px;">WEBSITE:</p>
        <p style="margin: 0; font-family: monospace; font-size: 14px; word-break: break-all;">${analysis.domain}</p>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="color: #22c55e; font-size: 16px; margin-bottom: 12px;">Detected Risks:</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
          ${analysis.risks.map(risk => `
            <li style="color: ${risk.severity === 'CRITICAL' ? '#dc2626' : risk.severity === 'HIGH' ? '#fb923c' : '#fbbf24'};">
              <strong>${risk.type}:</strong> ${risk.message}
            </li>
          `).join('')}
        </ul>
      </div>

      <div style="background: rgba(220, 38, 38, 0.1); border: 1px solid #dc2626; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 13px; line-height: 1.6;">
          ⚠️ <strong>Warning:</strong> This site may be attempting to steal your crypto assets, private keys, or personal information.
          Do NOT connect your wallet or enter sensitive information.
        </p>
      </div>

      <div style="display: flex; gap: 12px;">
        <button id="tokenware-go-back" style="
          flex: 1;
          padding: 14px 24px;
          background: #dc2626;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">
          ← Go Back (Recommended)
        </button>
        <button id="tokenware-proceed" style="
          flex: 1;
          padding: 14px 24px;
          background: transparent;
          color: #999;
          border: 1px solid #444;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">
          Proceed Anyway
        </button>
      </div>

      <div style="text-align: center; margin-top: 16px;">
        <button id="tokenware-whitelist" style="
          background: none;
          border: none;
          color: #666;
          font-size: 12px;
          cursor: pointer;
          text-decoration: underline;
        ">
          Trust this site (Add to whitelist)
        </button>
      </div>
    `;

    overlay.appendChild(warningBox);
    document.body.appendChild(overlay);

    // Event listeners
    document.getElementById('tokenware-go-back').addEventListener('click', () => {
      window.history.back();
    });

    document.getElementById('tokenware-proceed').addEventListener('click', () => {
      overlay.remove();
    });

    document.getElementById('tokenware-whitelist').addEventListener('click', async () => {
      await addToWhitelist(analysis.domain);
      overlay.remove();
    });
  }

  // Show site analysis popup
  function showSiteAnalysisPopup() {
    if (!currentSiteAnalysis) {
      alert('Analyzing site... Please wait.');
      analyzeCurrentSite();
      return;
    }

    const popup = document.createElement('div');
    popup.id = 'tokenware-analysis-popup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border: 2px solid #22c55e;
      border-radius: 12px;
      padding: 24px;
      z-index: 999999;
      max-width: 500px;
      color: #fff;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const threatColors = {
      'SAFE': '#22c55e',
      'LOW': '#fbbf24',
      'MEDIUM': '#fb923c',
      'HIGH': '#ef4444',
      'CRITICAL': '#dc2626'
    };

    popup.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #22c55e;">Site Security Report</h2>
        <button id="tokenware-close-popup" style="
          background: none;
          border: none;
          color: #999;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
        ">×</button>
      </div>

      <div style="background: rgba(0, 0, 0, 0.3); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="margin: 0 0 4px 0; color: #999; font-size: 12px;">THREAT LEVEL</p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${threatColors[currentSiteAnalysis.threatLevel]};">
              ${currentSiteAnalysis.threatLevel}
            </p>
          </div>
          <div>
            <p style="margin: 0 0 4px 0; color: #999; font-size: 12px;">RISK SCORE</p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${threatColors[currentSiteAnalysis.threatLevel]};">
              ${currentSiteAnalysis.riskScore}/100
            </p>
          </div>
        </div>
      </div>

      ${currentSiteAnalysis.risks.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <h3 style="color: #22c55e; font-size: 14px; margin-bottom: 8px;">Detected Issues:</h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8;">
            ${currentSiteAnalysis.risks.map(risk => `
              <li style="color: #ccc;">
                <strong style="color: ${risk.severity === 'CRITICAL' ? '#dc2626' : risk.severity === 'HIGH' ? '#fb923c' : '#fbbf24'};">
                  ${risk.type}:
                </strong> ${risk.message}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : `
        <div style="text-align: center; padding: 20px; color: #22c55e;">
          ✅ No security issues detected
        </div>
      `}

      <div style="font-size: 11px; color: #666; text-align: center; margin-top: 12px;">
        Scanned: ${new Date(currentSiteAnalysis.timestamp).toLocaleString()}
      </div>
    `;

    document.body.appendChild(popup);

    // Close button
    document.getElementById('tokenware-close-popup').addEventListener('click', () => {
      popup.remove();
    });

    // Close on outside click
    setTimeout(() => {
      const closeOnOutsideClick = (e) => {
        if (!popup.contains(e.target)) {
          popup.remove();
          document.removeEventListener('click', closeOnOutsideClick);
        }
      };
      document.addEventListener('click', closeOnOutsideClick);
    }, 100);
  }

  // Add domain to whitelist
  async function addToWhitelist(domain) {
    return new Promise((resolve) => {
      chrome.storage.local.get('whitelist', (result) => {
        const whitelist = result.whitelist || [];
        if (!whitelist.includes(domain)) {
          whitelist.push(domain);
          chrome.storage.local.set({ whitelist }, () => {
            chrome.runtime.sendMessage({
              action: 'updateStats',
              statKey: 'whitelisted'
            });
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }

  // Inject CSS animations
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes tokenware-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);
  }

  // Scan for crypto addresses on page and add hover overlays
  function scanForAddresses() {
    try {
      console.log('[TokenWare] Starting address scan on:', window.location.href);

      if (!document.body) {
        console.log('[TokenWare] Document body not ready, skipping scan');
        return;
      }

      // Regex patterns for different address formats
      const patterns = {
        ethereum: /0x[a-fA-F0-9]{40}/g,
        solana: /[1-9A-HJ-NP-Za-km-z]{32,44}/g,
        hedera: /0\.0\.\d{4,8}/g
      };

      // Find all text nodes in the document
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            // Skip script, style, and already processed nodes
            if (!node.parentElement) return NodeFilter.FILTER_REJECT;

            const tagName = node.parentElement.tagName;
            if (tagName === 'SCRIPT' ||
                tagName === 'STYLE' ||
                tagName === 'NOSCRIPT' ||
                node.parentElement.classList.contains('tokenware-address-wrapper') ||
                node.parentElement.classList.contains('tokenware-price-overlay')) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }

      console.log('[TokenWare] Found', textNodes.length, 'text nodes to scan');

      let addressesFound = 0;

      // Process each text node
      textNodes.forEach(textNode => {
        try {
          const text = textNode.textContent;
          if (!text || text.trim().length === 0) return;

          let hasMatch = false;
          let chain = null;

          // Check for Ethereum addresses (most common)
          if (patterns.ethereum.test(text)) {
            hasMatch = true;
            chain = 'ethereum';
            console.log('[TokenWare] Found Ethereum address in:', text.substring(0, 50));
          }
          // Check for Hedera addresses
          else if (patterns.hedera.test(text)) {
            hasMatch = true;
            chain = 'hedera';
            console.log('[TokenWare] Found Hedera address in:', text.substring(0, 50));
          }
          // Check for Solana addresses (be more careful with false positives)
          else {
            const solanaMatches = text.match(patterns.solana);
            if (solanaMatches && solanaMatches.some(match => match.length >= 32 && match.length <= 44)) {
              hasMatch = true;
              chain = 'solana';
              console.log('[TokenWare] Found Solana address in:', text.substring(0, 50));
            }
          }

          if (hasMatch && chain) {
            wrapAddressWithOverlay(textNode, chain);
            addressesFound++;
          }
        } catch (error) {
          console.error('[TokenWare] Error processing text node:', error);
        }
      });

      console.log('[TokenWare] Scan complete. Found and highlighted', addressesFound, 'addresses');

      // Send scan results to background
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          action: 'scanPageForAddresses',
          text: document.body.innerText,
          url: window.location.href
        }).catch(err => {
          console.log('[TokenWare] Could not send scan results:', err.message);
        });
      }
    } catch (error) {
      console.error('[TokenWare] Error in scanForAddresses:', error);
    }
  }

  // Wrap detected address with interactive overlay
  function wrapAddressWithOverlay(textNode, chain) {
    try {
      if (!textNode || !textNode.parentNode || !textNode.textContent) {
        console.log('[TokenWare] Invalid text node, skipping');
        return;
      }

      const text = textNode.textContent;
      const patterns = {
        ethereum: /0x[a-fA-F0-9]{40}/g,
        solana: /[1-9A-HJ-NP-Za-km-z]{32,44}/g,
        hedera: /0\.0\.\d{4,8}/g
      };

      const pattern = patterns[chain];
      const matches = text.match(pattern);

      if (!matches || matches.length === 0) {
        console.log('[TokenWare] No matches found for pattern');
        return;
      }

      console.log('[TokenWare] Wrapping', matches.length, 'addresses with overlay');

      // Create a wrapper with highlighted addresses
      const wrapper = document.createElement('span');
      wrapper.className = 'tokenware-address-wrapper';
      let lastIndex = 0;
      let html = '';

      matches.forEach(address => {
        const index = text.indexOf(address, lastIndex);
        if (index === -1) return;

        // Add text before address (escape HTML)
        const beforeText = text.substring(lastIndex, index);
        html += escapeHtml(beforeText);

        // Add highlighted address
        html += `<span class="tokenware-address" data-address="${escapeHtml(address)}" data-chain="${chain}" style="
          background: rgba(34, 197, 94, 0.15);
          border-bottom: 2px solid #22c55e;
          padding: 2px 4px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: monospace;
        ">${escapeHtml(address)}</span>`;

        lastIndex = index + address.length;
      });

      // Add remaining text (escape HTML)
      const remainingText = text.substring(lastIndex);
      html += escapeHtml(remainingText);

      wrapper.innerHTML = html;

      // Replace text node with wrapper
      if (textNode.parentNode) {
        textNode.parentNode.replaceChild(wrapper, textNode);
        console.log('[TokenWare] Successfully wrapped addresses');

        // Add hover listeners to all address spans
        wrapper.querySelectorAll('.tokenware-address').forEach(addressSpan => {
          let priceOverlay = null;
          let hoverTimeout = null;

          addressSpan.addEventListener('mouseenter', async (e) => {
            // Wait 500ms before showing overlay
            hoverTimeout = setTimeout(async () => {
              priceOverlay = await showPriceOverlay(e.target);
            }, 500);
          });

          addressSpan.addEventListener('mouseleave', () => {
            // Cancel pending overlay
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
              hoverTimeout = null;
            }

            // Remove overlay after a delay
            if (priceOverlay) {
              setTimeout(() => {
                if (priceOverlay && !priceOverlay.matches(':hover')) {
                  priceOverlay.remove();
                  priceOverlay = null;
                }
              }, 200);
            }
          });

          // Highlight on hover
          addressSpan.addEventListener('mouseenter', () => {
            addressSpan.style.background = 'rgba(34, 197, 94, 0.3)';
          });

          addressSpan.addEventListener('mouseleave', () => {
            addressSpan.style.background = 'rgba(34, 197, 94, 0.15)';
          });
        });
      }
    } catch (error) {
      console.error('[TokenWare] Error wrapping addresses:', error);
    }
  }

  // Show price overlay for detected address
  async function showPriceOverlay(addressElement) {
    const address = addressElement.getAttribute('data-address');
    const chain = addressElement.getAttribute('data-chain');

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'tokenware-price-overlay';
    overlay.style.cssText = `
      position: absolute;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border: 2px solid #22c55e;
      border-radius: 8px;
      padding: 16px;
      z-index: 999999;
      min-width: 280px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #fff;
      font-size: 13px;
    `;

    overlay.innerHTML = `
      <div style="text-align: center; padding: 12px; color: #22c55e;">
        <div style="font-size: 24px; margin-bottom: 8px;">💰</div>
        <div>Loading price data...</div>
      </div>
    `;

    // Position overlay near the address
    const rect = addressElement.getBoundingClientRect();
    overlay.style.position = 'fixed';
    overlay.style.left = (rect.left + window.scrollX) + 'px';
    overlay.style.top = (rect.bottom + window.scrollY + 8) + 'px';

    document.body.appendChild(overlay);

    // Keep overlay visible on hover
    overlay.addEventListener('mouseenter', () => {
      overlay.dataset.hovering = 'true';
    });

    overlay.addEventListener('mouseleave', () => {
      overlay.remove();
    });

    // Fetch price data
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getTokenPrice',
        address: address,
        chain: chain
      });

      if (response && response.success && response.data) {
        const data = response.data;
        const change24h = data.priceChange?.['24h'] || data.priceChange?.h24 || 0;
        const changeClass = change24h >= 0 ? '#22c55e' : '#ef4444';

        overlay.innerHTML = `
          <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 12px;">
            <div style="font-size: 15px; font-weight: 600; margin-bottom: 4px;">${data.name}</div>
            <div style="font-size: 11px; color: #999;">${data.symbol}</div>
          </div>

          <div style="margin-bottom: 12px;">
            <div style="font-size: 20px; font-weight: 700; margin-bottom: 4px;">
              ${formatPrice(data.price)}
            </div>
            <div style="font-size: 13px; font-weight: 600; color: ${changeClass};">
              ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}% (24h)
            </div>
          </div>

          ${data.marketCap ? `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span style="color: #999;">Market Cap:</span>
              <span style="font-weight: 500;">${formatMarketCap(data.marketCap)}</span>
            </div>
          ` : ''}

          ${data.liquidity ? `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span style="color: #999;">Liquidity:</span>
              <span style="font-weight: 500;">${formatMarketCap(data.liquidity)}</span>
            </div>
          ` : ''}

          ${data.volume?.['24h'] || data.volume?.h24 ? `
            <div style="display: flex; justify-content: space-between; padding: 6px 0;">
              <span style="color: #999;">24h Volume:</span>
              <span style="font-weight: 500;">${formatMarketCap(data.volume?.['24h'] || data.volume.h24)}</span>
            </div>
          ` : ''}

          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
            <div style="font-size: 10px; color: #666; margin-bottom: 8px;">
              Source: ${data.source || 'unknown'}
            </div>
            <button onclick="window.open('https://dexscreener.com/search?q=${address}', '_blank')" style="
              padding: 8px 16px;
              background: #22c55e;
              color: #000;
              border: none;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
              width: 100%;
            ">
              View on DEXScreener
            </button>
          </div>
        `;
      } else {
        overlay.innerHTML = `
          <div style="text-align: center; padding: 12px; color: #999;">
            <div style="font-size: 24px; margin-bottom: 8px;">❌</div>
            <div>No price data found</div>
            <div style="font-size: 11px; margin-top: 8px; color: #666;">
              ${address.substring(0, 10)}...${address.substring(address.length - 8)}
            </div>
          </div>
        `;
      }
    } catch (error) {
      overlay.innerHTML = `
        <div style="text-align: center; padding: 12px; color: #ef4444;">
          <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
          <div>Failed to load price</div>
        </div>
      `;
    }

    return overlay;
  }

  // Format price helper
  function formatPrice(price) {
    if (!price) return '$0.00';
    if (price >= 1000) return '$' + price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (price >= 1) return '$' + price.toFixed(2);
    if (price >= 0.01) return '$' + price.toFixed(4);
    if (price >= 0.0001) return '$' + price.toFixed(6);
    return '$' + price.toFixed(8);
  }

  // Format market cap helper
  function formatMarketCap(value) {
    if (!value) return '$0';
    if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return '$' + (value / 1e3).toFixed(2) + 'K';
    return '$' + value.toFixed(2);
  }

  // Escape HTML helper
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize
  async function init() {
    console.log('[TokenWare] Initializing on:', window.location.href);

    await loadSettings();

    if (CONFIG.enableAutoScan) {
      // Wait a bit for page to load
      setTimeout(async () => {
        console.log('[TokenWare] Running scans...');
        injectStyles();
        createFloatingBadge();
        await analyzeCurrentSite();
        scanForAddresses();
      }, CONFIG.scanDelay);
    } else {
      console.log('[TokenWare] Auto-scan disabled');
    }
  }

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'rescanPage') {
      console.log('[TokenWare] Rescanning page...');
      analyzeCurrentSite();
      scanForAddresses();
      sendResponse({ success: true });
    }
    return true;
  });

  // Start
  console.log('[TokenWare] Content script loaded, readyState:', document.readyState);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[TokenWare] DOMContentLoaded event fired');
      init();
    });
  } else {
    console.log('[TokenWare] Document already loaded, initializing now');
    init();
  }

  // Also scan on window load for dynamic content
  window.addEventListener('load', () => {
    console.log('[TokenWare] Window load event - rescanning for addresses');
    setTimeout(() => {
      scanForAddresses();
    }, 2000);
  });

})();
