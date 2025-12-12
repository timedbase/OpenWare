// TokenWare Twitter/X Content Script
// Detect and analyze Hedera tokens in tweets

// Common Hedera token ID pattern (0.0.xxxxx)
const HEDERA_TOKEN_PATTERN = /0\.0\.\d+/g;

// Known whitelisted Hedera projects (add more as needed)
const WHITELISTED_TOKENS = {
  '0.0.398121': { name: 'SAUCE', symbol: 'SAUCE' },
  '0.0.29670': { name: 'Karate Combat', symbol: 'KARATE' },
  // Add more whitelisted tokens
};

// Store analyzed tokens to avoid duplicate overlays
const analyzedTokens = new Set();

// Fetch token analysis from background
async function analyzeTokenId(tokenId) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: 'analyzeToken',
      tokenId: tokenId,
    }, (response) => {
      if (response.success) {
        resolve(response.data);
      } else {
        console.error('Analysis failed:', response.error);
        resolve(null);
      }
    });
  });
}

// Create overlay for token info
function createTokenOverlay(tokenData, position) {
  const overlay = document.createElement('div');
  overlay.className = 'tokenware-overlay';
  overlay.innerHTML = `
    <div class="tokenware-card">
      <button class="tokenware-close">×</button>
      <div class="tokenware-header">
        <h3>${tokenData.name}</h3>
        <span class="tokenware-symbol">${tokenData.symbol}</span>
      </div>
      <div class="tokenware-body">
        <div class="tokenware-row">
          <span>Token ID:</span>
          <span class="mono">${tokenData.tokenId}</span>
        </div>
        ${tokenData.price ? `
          <div class="tokenware-row">
            <span>Price:</span>
            <span>$${parseFloat(tokenData.price).toFixed(8)}</span>
          </div>
        ` : ''}
        ${tokenData.marketCap ? `
          <div class="tokenware-row">
            <span>Market Cap:</span>
            <span>$${(tokenData.marketCap / 1e6).toFixed(2)}M</span>
          </div>
        ` : ''}
        ${tokenData.liquidity ? `
          <div class="tokenware-row">
            <span>Liquidity:</span>
            <span>$${(tokenData.liquidity / 1e6).toFixed(2)}M</span>
          </div>
        ` : ''}
        ${tokenData.volume24h ? `
          <div class="tokenware-row">
            <span>24h Volume:</span>
            <span>$${(tokenData.volume24h / 1e6).toFixed(2)}M</span>
          </div>
        ` : ''}
        ${tokenData.priceChange24h ? `
          <div class="tokenware-row">
            <span>24h Change:</span>
            <span class="${parseFloat(tokenData.priceChange24h) >= 0 ? 'positive' : 'negative'}">
              ${parseFloat(tokenData.priceChange24h).toFixed(2)}%
            </span>
          </div>
        ` : ''}
        ${tokenData.totalSupply ? `
          <div class="tokenware-row">
            <span>Total Supply:</span>
            <span>${(tokenData.totalSupply / Math.pow(10, tokenData.decimals || 0)).toLocaleString()}</span>
          </div>
        ` : ''}
      </div>
      <div class="tokenware-footer">
        <button class="tokenware-btn btn-primary">Watch</button>
        <button class="tokenware-btn btn-secondary">More Info</button>
      </div>
    </div>
  `;

  overlay.style.position = 'fixed';
  overlay.style.top = '100px';
  overlay.style.right = '20px';
  overlay.style.zIndex = '999999';

  document.body.appendChild(overlay);

  // Close button
  overlay.querySelector('.tokenware-close').addEventListener('click', () => {
    overlay.remove();
  });

  // Watch button
  overlay.querySelector('.btn-primary').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'addToWatchlist',
      tokenId: tokenData.tokenId,
      name: tokenData.name,
      symbol: tokenData.symbol,
    });
    alert('Added to watchlist!');
  });

  // Auto-hide after 15 seconds
  setTimeout(() => overlay.remove(), 15000);
}

// Detect tokens in element text
async function scanElement(element) {
  const text = element.textContent;
  const matches = text.match(HEDERA_TOKEN_PATTERN) || [];

  for (const match of matches) {
    if (!analyzedTokens.has(match)) {
      analyzedTokens.add(match);
      console.log('TokenWare: Detected token', match);
      
      const tokenData = await analyzeTokenId(match);
      if (tokenData) {
        createTokenOverlay(tokenData, element.getBoundingClientRect());
      }
    }
  }
}

// Scan for whitelisted tokens in element
async function scanWhitelisted(element) {
  const text = element.textContent.toLowerCase();
  
  for (const [tokenId, info] of Object.entries(WHITELISTED_TOKENS)) {
    if (!analyzedTokens.has(tokenId) && 
        (text.includes(info.name.toLowerCase()) || text.includes(info.symbol.toLowerCase()))) {
      analyzedTokens.add(tokenId);
      console.log('TokenWare: Detected whitelisted token', tokenId);
      
      const tokenData = await analyzeTokenId(tokenId);
      if (tokenData) {
        createTokenOverlay(tokenData, element.getBoundingClientRect());
      }
    }
  }
}

// Observer for new tweets
function initObserver() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          scanElement(node);
          scanWhitelisted(node);
          
          node.querySelectorAll('[data-testid="tweet"]')?.forEach(tweet => {
            scanElement(tweet);
            scanWhitelisted(tweet);
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Scan initial tweets on page load
function scanInitialPage() {
  document.querySelectorAll('[data-testid="tweet"]').forEach(tweet => {
    scanElement(tweet);
    scanWhitelisted(tweet);
  });
}

// Inject styles
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .tokenware-overlay {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    .tokenware-card {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border: 2px solid #22c55e;
      border-radius: 12px;
      padding: 16px;
      color: #fff;
      box-shadow: 0 10px 40px rgba(34, 197, 94, 0.3);
      min-width: 300px;
      max-width: 380px;
    }

    .tokenware-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid #22c55e;
      padding-bottom: 8px;
    }

    .tokenware-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: #22c55e;
    }

    .tokenware-symbol {
      background: #22c55e;
      color: #000;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
    }

    .tokenware-body {
      margin-bottom: 12px;
    }

    .tokenware-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      border-bottom: 1px solid rgba(34, 197, 94, 0.1);
    }

    .tokenware-row span:first-child {
      color: #999;
    }

    .tokenware-row .mono {
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 12px;
    }

    .tokenware-row .positive {
      color: #22c55e;
      font-weight: 700;
    }

    .tokenware-row .negative {
      color: #ef4444;
      font-weight: 700;
    }

    .tokenware-footer {
      display: flex;
      gap: 8px;
    }

    .tokenware-btn {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #22c55e;
      color: #000;
    }

    .btn-primary:hover {
      background: #16a34a;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: transparent;
      color: #22c55e;
      border: 1px solid #22c55e;
    }

    .btn-secondary:hover {
      background: rgba(34, 197, 94, 0.1);
    }

    .tokenware-close {
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      color: #22c55e;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tokenware-close:hover {
      color: #16a34a;
    }
  `;
  document.head.appendChild(style);
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    scanInitialPage();
    initObserver();
  });
} else {
  injectStyles();
  scanInitialPage();
  initObserver();
}