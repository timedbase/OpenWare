// TokenWare DEX Content Script
// Handles token detection on Dexscreener, Dextools, and Geckoterminal

// Extract token ID from URL or page content
function extractTokenIdFromUrl() {
  const url = window.location.href;
  const patterns = [
    /0\.0\.\d+/,                           // Direct token ID in URL
    /token[=/]+(0\.0\.\d+)/i,              // token=0.0.xxxxx
    /[?&]token[=/]+(0\.0\.\d+)/i,          // ?token=0.0.xxxxx
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1] || match[0];
  }

  return null;
}

// Detect Hedera token on DEX pages
function detectTokenOnDex() {
  const tokenId = extractTokenIdFromUrl();
  
  if (!tokenId) return null;

  // Verify it's a valid Hedera token ID format
  if (!/^0\.0\.\d+$/.test(tokenId)) return null;

  return tokenId;
}

// Send notification to background script
function notifyTokenDetected(tokenId) {
  chrome.runtime.sendMessage({
    action: 'analyzeToken',
    tokenId: tokenId,
  }, (response) => {
    if (response.success) {
      console.log('TokenWare: Token detected on DEX', response.data);
      // Could add badge or notification here
    }
  });
}

// Wait for page load and detect
function initDexDetection() {
  const tokenId = detectTokenOnDex();
  
  if (tokenId) {
    console.log('TokenWare: Detected Hedera token on DEX:', tokenId);
    notifyTokenDetected(tokenId);
  }
}

// Initialize based on current site
if (window.location.hostname.includes('dexscreener.com')) {
  console.log('TokenWare: Running on Dexscreener');
  
  // Dexscreener specific detection
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDexDetection);
  } else {
    initDexDetection();
  }

} else if (window.location.hostname.includes('dextools.io')) {
  console.log('TokenWare: Running on Dextools');
  
  // Dextools specific detection
  setTimeout(initDexDetection, 1000);

} else if (window.location.hostname.includes('geckoterminal.com')) {
  console.log('TokenWare: Running on Geckoterminal');
  
  // Geckoterminal specific detection
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDexDetection);
  } else {
    initDexDetection();
  }
}

// Listen for navigation changes (for SPA sites)
let lastUrl = window.location.href;

new MutationObserver(() => {
  if (lastUrl !== window.location.href) {
    lastUrl = window.location.href;
    console.log('TokenWare: URL changed, re-detecting...');
    initDexDetection();
  }
}).observe(document, { subtree: true, childList: true });