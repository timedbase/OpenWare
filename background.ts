// OpenWare Background Service Worker - v2.0
// Multi-chain security and threat detection

import type { SecurityEngine } from './security-engine';
import type { PriceTracker } from './price-tracker';

// Types
interface Analysis {
  url?: string;
  domain?: string;
  address?: string;
  chain?: string;
  threatLevel: string;
  riskScore: number;
  risks: Risk[];
  timestamp: string;
  contractData?: ContractData;
}

interface Risk {
  type: string;
  severity: string;
  message: string;
}

interface ContractData {
  verified?: boolean;
  liquidity?: number;
  price?: number;
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
  createdDaysAgo?: number | null;
  topHolderPercentage?: number | null;
  isHoneypot?: boolean;
  ownershipRenounced?: boolean | null;
  dexName?: string;
  pairAddress?: string;
}

interface Message {
  action: string;
  [key: string]: any;
}

interface TokenInfo {
  tokenId: string;
  name: string;
  symbol: string;
  decimals: string;
  totalSupply: string;
  initialSupply: string;
  treasury: string;
  memo: string;
  evm_address?: string;
}

interface MarketData {
  price: string;
  priceChange24h: number;
  liquidity: string;
  volume24h: string;
  marketCap: string;
  fdv: string;
  pairAddress: string;
  dexName: string;
}

// Import security engine and price tracker (using importScripts for service worker)
declare const SecurityEngine: new () => any;
declare const PriceTracker: new () => any;
importScripts('security-engine.js');
importScripts('price-tracker.js');

const securityEngine = new SecurityEngine();
const priceTracker = new PriceTracker();

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = 10000): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Analyze URL for threats
async function analyzeURL(url: string): Promise<Analysis> {
  try {
    const analysis = await securityEngine.analyzeURL(url);

    // Update stats
    await updateStats('scan');

    if (analysis.threatLevel === 'CRITICAL' || analysis.threatLevel === 'HIGH') {
      await updateStats('threat');

      // Show browser notification
      await showNotification({
        title: `${analysis.threatLevel} Threat Detected`,
        message: `${analysis.domain} may be dangerous`,
        iconUrl: 'images/icon-128.png'
      });
    }

    // Save to scan history
    await saveScanHistory(analysis);

    return analysis;
  } catch (error) {
    console.error('URL Analysis Error:', error);
    throw error;
  }
}

// Analyze smart contract
async function analyzeContract(address: string, chain: string = 'ethereum'): Promise<Analysis> {
  try {
    const analysis = await securityEngine.analyzeContract(address, chain);

    await updateStats('scan');

    if (analysis.threatLevel === 'CRITICAL' || analysis.threatLevel === 'HIGH') {
      await updateStats('threat');
    }

    await saveScanHistory(analysis);

    return analysis;
  } catch (error) {
    console.error('Contract Analysis Error:', error);
    throw error;
  }
}

// Scan page for crypto addresses
async function scanPageForAddresses(text: string, url: string): Promise<any> {
  try {
    const addresses = securityEngine.extractAddresses(text);

    // Store found addresses
    const { foundAddresses = {} } = await chrome.storage.local.get('foundAddresses');

    foundAddresses[url] = {
      ...addresses,
      timestamp: new Date().toISOString()
    };

    await chrome.storage.local.set({ foundAddresses });

    return addresses;
  } catch (error) {
    console.error('Address Scan Error:', error);
    return null;
  }
}

// Save scan to history
async function saveScanHistory(analysis: Analysis): Promise<void> {
  const { scanHistory = [] } = await chrome.storage.local.get('scanHistory');

  const newScan = {
    ...analysis,
    scanned_at: new Date().toISOString()
  };

  const updated = [newScan, ...scanHistory].slice(0, 50); // Keep last 50 scans
  await chrome.storage.local.set({ scanHistory: updated });
}

// Update stats
async function updateStats(statKey: string): Promise<void> {
  const { stats = {} } = await chrome.storage.local.get('stats');

  const today = new Date().toISOString().split('T')[0];
  stats[today] = stats[today] || {
    scansPerformed: 0,
    threatsDetected: 0,
    sitesWhitelisted: 0,
    contractsAnalyzed: 0,
  };

  if (statKey === 'scan') stats[today].scansPerformed++;
  if (statKey === 'threat') stats[today].threatsDetected++;
  if (statKey === 'whitelisted') stats[today].sitesWhitelisted++;
  if (statKey === 'contract') stats[today].contractsAnalyzed++;

  await chrome.storage.local.set({ stats });

  // Update badge
  updateBadge(stats[today].threatsDetected);
}

// Update extension badge
function updateBadge(count: number): void {
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Show browser notification
async function showNotification({ title, message, iconUrl }: { title: string; message: string; iconUrl: string }): Promise<void> {
  const { settings = {} } = await chrome.storage.local.get('settings');

  if (settings.notificationSound === false) return;

  try {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: iconUrl || 'images/icon-128.png',
      title: title,
      message: message,
      priority: 2
    });
  } catch (error) {
    console.error('Notification Error:', error);
  }
}

// Legacy Hedera support functions (kept for backwards compatibility)
const MIRROR_NODE_API = 'https://mainnet-public.mirrornode.hedera.com/api/v1';
const DEXSCREENER_API = 'https://api.dexscreener.com/latest';

async function getTokenFromMirrorNode(tokenId: string): Promise<TokenInfo> {
  try {
    const url = `${MIRROR_NODE_API}/tokens/${tokenId}`;
    const data = await fetchWithTimeout(url);

    return {
      tokenId: data.token_id,
      name: data.name,
      symbol: data.symbol,
      decimals: data.decimals,
      totalSupply: data.total_supply,
      initialSupply: data.initial_supply,
      treasury: data.treasury_account_id,
      memo: data.memo,
      evm_address: data.evm_address,
    };
  } catch (error) {
    console.error('Mirror Node Error:', error);
    throw error;
  }
}

async function getTokenFromDexscreener(evmAddress: string): Promise<MarketData | null> {
  try {
    const url = `${DEXSCREENER_API}/dex/tokens/${evmAddress}`;
    const data = await fetchWithTimeout(url);

    if (!data.pairs || data.pairs.length === 0) {
      return null;
    }

    const pair = data.pairs.sort((a: any, b: any) =>
      (parseFloat(b.liquidity?.usd) || 0) - (parseFloat(a.liquidity?.usd) || 0)
    )[0];

    return {
      price: pair.priceUsd,
      priceChange24h: pair.priceChange?.h24,
      liquidity: pair.liquidity?.usd,
      volume24h: pair.volume?.h24,
      marketCap: pair.marketCap,
      fdv: pair.fdv,
      pairAddress: pair.pairAddress,
      dexName: pair.dexId,
    };
  } catch (error) {
    console.error('Dexscreener Error:', error);
    return null;
  }
}

async function analyzeToken(tokenId: string): Promise<any> {
  try {
    const tokenInfo = await getTokenFromMirrorNode(tokenId);

    let marketData = null;
    if (tokenInfo.evm_address) {
      marketData = await getTokenFromDexscreener(tokenInfo.evm_address);
    }

    const analysis = {
      ...tokenInfo,
      ...marketData,
      analyzed_at: new Date().toISOString(),
    };

    await saveRecentCheck(analysis);
    await updateStats('scan');

    return analysis;
  } catch (error) {
    console.error('Token Analysis Error:', error);
    throw error;
  }
}

async function saveRecentCheck(tokenData: any): Promise<void> {
  const { recentChecks = [] } = await chrome.storage.local.get('recentChecks');

  const newCheck = {
    tokenId: tokenData.tokenId,
    name: tokenData.name,
    symbol: tokenData.symbol,
    checked_at: new Date().toISOString(),
  };

  const updated = [newCheck, ...recentChecks].slice(0, 10);
  await chrome.storage.local.set({ recentChecks: updated });
}

// Message listener
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  (async () => {
    try {
      // Price tracking features
      if (message.action === 'getTokenPrice') {
        const priceData = await priceTracker.getTokenPrice(message.address, message.chain);
        sendResponse({ success: true, data: priceData });
      }
      else if (message.action === 'getBatchPrices') {
        const prices = await priceTracker.getBatchPrices(message.tokens);
        sendResponse({ success: true, data: prices });
      }
      else if (message.action === 'getTrendingTokens') {
        const trending = await priceTracker.getTrendingTokens();
        sendResponse({ success: true, data: trending });
      }
      else if (message.action === 'getPortfolioValue') {
        const { portfolio = [] } = await chrome.storage.local.get('portfolio');
        if (portfolio.length === 0) {
          sendResponse({ success: true, data: { totalValue: 0, positions: [] } });
        } else {
          const tokens = portfolio.map((p: any) => ({ address: p.address, chain: p.chain }));
          const prices = await priceTracker.getBatchPrices(tokens);
          const portfolioValue = priceTracker.calculatePortfolioValue(portfolio, prices);
          sendResponse({ success: true, data: portfolioValue });
        }
      }
      else if (message.action === 'addToPortfolio') {
        const { portfolio = [] } = await chrome.storage.local.get('portfolio');
        portfolio.push({
          address: message.address,
          chain: message.chain,
          symbol: message.symbol,
          amount: message.amount,
          avgPrice: message.avgPrice,
          addedAt: new Date().toISOString()
        });
        await chrome.storage.local.set({ portfolio });
        sendResponse({ success: true });
      }
      else if (message.action === 'removeFromPortfolio') {
        const { portfolio = [] } = await chrome.storage.local.get('portfolio');
        const updated = portfolio.filter((p: any) =>
          !(p.address === message.address && p.chain === message.chain)
        );
        await chrome.storage.local.set({ portfolio: updated });
        sendResponse({ success: true });
      }
      else if (message.action === 'updatePortfolioPosition') {
        const { portfolio = [] } = await chrome.storage.local.get('portfolio');
        const index = portfolio.findIndex((p: any) =>
          p.address === message.address && p.chain === message.chain
        );
        if (index !== -1) {
          portfolio[index] = { ...portfolio[index], ...message.updates };
          await chrome.storage.local.set({ portfolio });
        }
        sendResponse({ success: true });
      }
      else if (message.action === 'getPriceAlerts') {
        const { priceAlerts = [] } = await chrome.storage.local.get('priceAlerts');
        sendResponse({ success: true, data: priceAlerts });
      }
      else if (message.action === 'addPriceAlert') {
        const { priceAlerts = [] } = await chrome.storage.local.get('priceAlerts');
        priceAlerts.push({
          id: Date.now().toString(),
          address: message.address,
          chain: message.chain,
          symbol: message.symbol,
          type: message.type,
          targetPrice: message.targetPrice,
          basePrice: message.basePrice,
          percentThreshold: message.percentThreshold,
          triggered: false,
          createdAt: new Date().toISOString()
        });
        await chrome.storage.local.set({ priceAlerts });
        sendResponse({ success: true });
      }
      else if (message.action === 'removePriceAlert') {
        const { priceAlerts = [] } = await chrome.storage.local.get('priceAlerts');
        const updated = priceAlerts.filter((a: any) => a.id !== message.alertId);
        await chrome.storage.local.set({ priceAlerts: updated });
        sendResponse({ success: true });
      }
      // Security features
      else if (message.action === 'analyzeURL') {
        const analysis = await analyzeURL(message.url);
        sendResponse({ success: true, data: analysis });
      }
      else if (message.action === 'analyzeContract') {
        const analysis = await analyzeContract(message.address, message.chain);
        sendResponse({ success: true, data: analysis });
      }
      else if (message.action === 'scanPageForAddresses') {
        const addresses = await scanPageForAddresses(message.text, message.url);
        sendResponse({ success: true, data: addresses });
      }
      else if (message.action === 'getScanHistory') {
        const { scanHistory = [] } = await chrome.storage.local.get('scanHistory');
        sendResponse({ success: true, data: scanHistory });
      }
      else if (message.action === 'getWhitelist') {
        const { whitelist = [] } = await chrome.storage.local.get('whitelist');
        sendResponse({ success: true, data: whitelist });
      }
      else if (message.action === 'addToWhitelist') {
        const { whitelist = [] } = await chrome.storage.local.get('whitelist');
        if (!whitelist.includes(message.domain)) {
          whitelist.push(message.domain);
          await chrome.storage.local.set({ whitelist });
          await updateStats('whitelisted');
        }
        sendResponse({ success: true });
      }
      else if (message.action === 'removeFromWhitelist') {
        const { whitelist = [] } = await chrome.storage.local.get('whitelist');
        const updated = whitelist.filter((d: string) => d !== message.domain);
        await chrome.storage.local.set({ whitelist: updated });
        sendResponse({ success: true });
      }

      // Legacy Hedera support
      else if (message.action === 'analyzeToken') {
        const analysis = await analyzeToken(message.tokenId);
        sendResponse({ success: true, data: analysis });
      }
      else if (message.action === 'getRecentChecks') {
        const { recentChecks = [] } = await chrome.storage.local.get('recentChecks');
        sendResponse({ success: true, data: recentChecks });
      }
      else if (message.action === 'getStats') {
        const { stats = {} } = await chrome.storage.local.get('stats');
        sendResponse({ success: true, data: stats });
      }
      else if (message.action === 'updateStats') {
        await updateStats(message.statKey);
        sendResponse({ success: true });
      }
      else if (message.action === 'getWatchlist') {
        const { watchlist = [] } = await chrome.storage.local.get('watchlist');
        sendResponse({ success: true, data: watchlist });
      }
      else if (message.action === 'addToWatchlist') {
        const { watchlist = [] } = await chrome.storage.local.get('watchlist');
        if (!watchlist.find((t: any) => t.tokenId === message.tokenId)) {
          watchlist.push({
            tokenId: message.tokenId,
            name: message.name,
            symbol: message.symbol,
            added_at: new Date().toISOString(),
          });
          await chrome.storage.local.set({ watchlist });
        }
        sendResponse({ success: true });
      }
      else if (message.action === 'removeFromWatchlist') {
        const { watchlist = [] } = await chrome.storage.local.get('watchlist');
        const updated = watchlist.filter((t: any) => t.tokenId !== message.tokenId);
        await chrome.storage.local.set({ watchlist: updated });
        sendResponse({ success: true });
      }
      else if (message.action === 'getSettings') {
        const { settings = {} } = await chrome.storage.local.get('settings');
        sendResponse({ success: true, data: settings });
      }
      else if (message.action === 'updateSettings') {
        await chrome.storage.local.set({ settings: message.settings });
        sendResponse({ success: true });
      }
      else {
        sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error: any) {
      console.error('Background Error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true;
});

// Tab update listener - scan new pages
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Auto-analyze the URL
    try {
      await analyzeURL(tab.url);
    } catch (error) {
      console.error('Auto-analyze error:', error);
    }
  }
});

// Installation handler
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default settings
    await chrome.storage.local.set({
      settings: {
        autoScan: true,
        showBadge: true,
        showWarnings: true,
        notificationSound: true,
        priceAlertsEnabled: true
      },
      whitelist: [],
      scanHistory: [],
      stats: {},
      portfolio: [],
      priceAlerts: []
    });

    // Setup price monitoring alarm
    chrome.alarms.create('priceMonitor', { periodInMinutes: 1 });

    // Open welcome page
    chrome.tabs.create({
      url: 'https://github.com/openware/welcome'
    });
  }
});

// Price alert monitoring (runs every minute)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'priceMonitor') {
    await checkPriceAlerts();
  }
});

// Check all price alerts
async function checkPriceAlerts(): Promise<void> {
  try {
    const { priceAlerts = [], settings = {} } = await chrome.storage.local.get(['priceAlerts', 'settings']);

    if (!settings.priceAlertsEnabled || priceAlerts.length === 0) return;

    // Get unique tokens
    const tokens = [...new Set(priceAlerts.map((a: any) => `${a.chain}:${a.address}`))];
    const tokensToFetch = tokens.map(t => {
      const [chain, address] = t.split(':');
      return { chain, address };
    });

    // Fetch current prices
    const prices = await priceTracker.getBatchPrices(tokensToFetch);

    // Check each alert
    const triggeredAlerts = [];

    for (const alert of priceAlerts) {
      if (alert.triggered) continue;

      const priceData = prices.find((p: any) =>
        p.address === alert.address && p.chain === alert.chain && p.data
      );

      if (!priceData || !priceData.data) continue;

      const currentPrice = priceData.data.price;
      const triggered = priceTracker.checkPriceAlerts(currentPrice, [alert]);

      if (triggered.length > 0) {
        triggeredAlerts.push({ ...alert, currentPrice });
      }
    }

    // Send notifications for triggered alerts
    if (triggeredAlerts.length > 0) {
      for (const alert of triggeredAlerts) {
        await showNotification({
          title: `Price Alert: ${alert.symbol}`,
          message: `${alert.symbol} is now ${priceTracker.formatPrice(alert.currentPrice)}`,
          iconUrl: 'images/icon-128.png'
        });

        // Mark alert as triggered
        const index = priceAlerts.findIndex((a: any) => a.id === alert.id);
        if (index !== -1) {
          priceAlerts[index].triggered = true;
          priceAlerts[index].triggeredAt = new Date().toISOString();
        }
      }

      // Save updated alerts
      await chrome.storage.local.set({ priceAlerts });
    }
  } catch (error) {
    console.error('Price alert check error:', error);
  }
}

console.log('OpenWare v2.0 - Security Suite Loaded');
