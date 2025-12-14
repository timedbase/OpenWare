// OpenWare Price Tracking Module
// Real-time cryptocurrency price monitoring and alerts

interface PriceData {
  address: string;
  chain: string;
  symbol: string;
  name: string;
  price: number;
  priceChange: {
    '5m'?: number;
    '1h'?: number;
    '6h'?: number;
    '24h'?: number;
    '7d'?: number;
    '30d'?: number;
  };
  volume: {
    '5m'?: number;
    '1h'?: number;
    '6h'?: number;
    '24h'?: number;
  };
  liquidity: number;
  marketCap: number;
  fdv: number;
  pairAddress?: string;
  dexName?: string;
  url?: string;
  ath?: number;
  atl?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  timestamp: number;
  source: string;
}

interface TokenRequest {
  address: string;
  chain: string;
}

interface Alert {
  id: string;
  address: string;
  chain: string;
  symbol: string;
  type: 'above' | 'below' | 'percent_change';
  targetPrice: number;
  basePrice: number;
  percentThreshold: number;
  triggered: boolean;
  createdAt: string;
}

interface Holding {
  address: string;
  chain: string;
  symbol: string;
  amount: number;
  avgPrice: number;
}

interface Position extends Holding {
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  pnl: number;
  pnlPercent: number;
  priceChange24h: number;
}

interface PortfolioValue {
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPercent: number;
  positions: Position[];
  lastUpdated: number;
}

class PriceTracker {
  private priceCache: Map<string, PriceData>;
  private cacheExpiry: number;
  private alertsEnabled: boolean;
  private apis: any;

  constructor() {
    this.priceCache = new Map();
    this.cacheExpiry = 30000; // 30 seconds
    this.alertsEnabled = true;
    this.apis = this.initializeAPIs();
  }

  // Initialize price API endpoints
  private initializeAPIs() {
    return {
      dexscreener: {
        base: 'https://api.dexscreener.com/latest',
        endpoints: {
          token: '/dex/tokens/',
          pairs: '/dex/pairs/',
          search: '/dex/search'
        },
        priority: 1
      },
      geckoterminal: {
        base: 'https://api.geckoterminal.com/api/v2',
        endpoints: {
          networks: '/networks',
          pools: '/networks/{network}/pools/{address}',
          tokens: '/networks/{network}/tokens/{address}'
        },
        priority: 2
      },
      coingecko: {
        base: 'https://api.coingecko.com/api/v3',
        endpoints: {
          price: '/simple/price',
          token: '/coins/ethereum/contract/',
          trending: '/search/trending',
          global: '/global'
        },
        rateLimit: 50,
        priority: 3 // Fallback only
      }
    };
  }

  // Fetch token price from multiple sources with rotation
  async getTokenPrice(address: string, chain: string = 'ethereum'): Promise<PriceData | null> {
    const cacheKey = `${chain}:${address}`;

    // Check cache first
    const cached = this.getCachedPrice(cacheKey);
    if (cached) return cached;

    // API rotation order: Dexscreener -> GeckoTerminal -> CoinGecko
    const sources = [
      { name: 'dexscreener', fetch: () => this.fetchFromDexscreener(address, chain) },
      { name: 'geckoterminal', fetch: () => this.fetchFromGeckoTerminal(address, chain) },
      { name: 'coingecko', fetch: () => this.fetchFromCoinGecko(address, chain) }
    ];

    for (const source of sources) {
      try {
        const data = await source.fetch();
        if (data) {
          this.cachePrice(cacheKey, data);
          console.log(`Price fetched from ${source.name}`);
          return data;
        }
      } catch (error: any) {
        console.warn(`${source.name} failed:`, error.message);
        // Continue to next source
      }
    }

    console.error('All price sources failed for', address, chain);
    return null;
  }

  // Fetch from Dexscreener
  private async fetchFromDexscreener(address: string, chain: string): Promise<PriceData | null> {
    try {
      const url = `${this.apis.dexscreener.base}/dex/tokens/${address}`;
      const response = await fetch(url);

      if (!response.ok) return null;

      const data = await response.json();
      if (!data.pairs || data.pairs.length === 0) return null;

      // Get the most liquid pair
      const pair = data.pairs
        .filter((p: any) => p.chainId === this.getChainId(chain))
        .sort((a: any, b: any) => (parseFloat(b.liquidity?.usd) || 0) - (parseFloat(a.liquidity?.usd) || 0))[0];

      if (!pair) return null;

      return {
        address: address,
        chain: chain,
        symbol: pair.baseToken?.symbol || 'UNKNOWN',
        name: pair.baseToken?.name || 'Unknown Token',
        price: parseFloat(pair.priceUsd) || 0,
        priceChange: {
          '5m': parseFloat(pair.priceChange?.m5) || 0,
          '1h': parseFloat(pair.priceChange?.h1) || 0,
          '6h': parseFloat(pair.priceChange?.h6) || 0,
          '24h': parseFloat(pair.priceChange?.h24) || 0
        },
        volume: {
          '5m': parseFloat(pair.volume?.m5) || 0,
          '1h': parseFloat(pair.volume?.h1) || 0,
          '6h': parseFloat(pair.volume?.h6) || 0,
          '24h': parseFloat(pair.volume?.h24) || 0
        },
        liquidity: parseFloat(pair.liquidity?.usd) || 0,
        marketCap: parseFloat(pair.marketCap) || 0,
        fdv: parseFloat(pair.fdv) || 0,
        pairAddress: pair.pairAddress,
        dexName: pair.dexId,
        url: pair.url,
        timestamp: Date.now(),
        source: 'dexscreener'
      };
    } catch (error) {
      console.error('Dexscreener fetch error:', error);
      return null;
    }
  }

  // Fetch from GeckoTerminal
  private async fetchFromGeckoTerminal(address: string, chain: string): Promise<PriceData | null> {
    try {
      const networkMap: Record<string, string> = {
        'ethereum': 'eth',
        'bsc': 'bsc',
        'polygon': 'polygon_pos',
        'arbitrum': 'arbitrum',
        'avalanche': 'avax',
        'solana': 'solana'
      };

      const network = networkMap[chain];
      if (!network) return null;

      const url = `${this.apis.geckoterminal.base}/networks/${network}/tokens/${address}`;
      const response = await fetch(url);

      if (!response.ok) return null;

      const data = await response.json();
      const token = data.data;

      if (!token) return null;

      return {
        address: address,
        chain: chain,
        symbol: token.attributes?.symbol || 'UNKNOWN',
        name: token.attributes?.name || 'Unknown Token',
        price: parseFloat(token.attributes?.price_usd) || 0,
        priceChange: {
          '5m': parseFloat(token.attributes?.price_change_percentage?.m5) || 0,
          '1h': parseFloat(token.attributes?.price_change_percentage?.h1) || 0,
          '6h': parseFloat(token.attributes?.price_change_percentage?.h6) || 0,
          '24h': parseFloat(token.attributes?.price_change_percentage?.h24) || 0
        },
        volume: {
          '24h': parseFloat(token.attributes?.volume_usd?.h24) || 0
        },
        liquidity: parseFloat(token.attributes?.reserve_in_usd) || 0,
        marketCap: parseFloat(token.attributes?.market_cap_usd) || 0,
        fdv: parseFloat(token.attributes?.fdv_usd) || 0,
        timestamp: Date.now(),
        source: 'geckoterminal'
      };
    } catch (error) {
      console.error('GeckoTerminal fetch error:', error);
      return null;
    }
  }

  // Fetch from CoinGecko
  private async fetchFromCoinGecko(address: string, chain: string): Promise<PriceData | null> {
    try {
      const platformId = this.getCoinGeckoPlatformId(chain);
      if (!platformId) return null;

      const url = `${this.apis.coingecko.base}/coins/${platformId}/contract/${address}`;
      const response = await fetch(url);

      if (!response.ok) return null;

      const data = await response.json();

      return {
        address: address,
        chain: chain,
        symbol: data.symbol?.toUpperCase() || 'UNKNOWN',
        name: data.name || 'Unknown Token',
        price: data.market_data?.current_price?.usd || 0,
        priceChange: {
          '1h': data.market_data?.price_change_percentage_1h_in_currency?.usd || 0,
          '24h': data.market_data?.price_change_percentage_24h_in_currency?.usd || 0,
          '7d': data.market_data?.price_change_percentage_7d_in_currency?.usd || 0,
          '30d': data.market_data?.price_change_percentage_30d_in_currency?.usd || 0
        },
        volume: {
          '24h': data.market_data?.total_volume?.usd || 0
        },
        liquidity: data.market_data?.total_value_locked?.usd || 0,
        marketCap: data.market_data?.market_cap?.usd || 0,
        fdv: data.market_data?.fully_diluted_valuation?.usd || 0,
        ath: data.market_data?.ath?.usd || 0,
        atl: data.market_data?.atl?.usd || 0,
        circulatingSupply: data.market_data?.circulating_supply || 0,
        totalSupply: data.market_data?.total_supply || 0,
        timestamp: Date.now(),
        source: 'coingecko'
      };
    } catch (error) {
      console.error('CoinGecko fetch error:', error);
      return null;
    }
  }

  // Get multiple token prices at once
  async getBatchPrices(tokens: TokenRequest[]): Promise<any[]> {
    const promises = tokens.map(({ address, chain }) =>
      this.getTokenPrice(address, chain)
    );

    const results = await Promise.allSettled(promises);

    return results.map((result, index) => ({
      ...tokens[index],
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  // Get trending tokens
  async getTrendingTokens(): Promise<any[]> {
    try {
      const url = `${this.apis.coingecko.base}/search/trending`;
      const response = await fetch(url);

      if (!response.ok) return [];

      const data = await response.json();

      return data.coins?.slice(0, 10).map((item: any) => ({
        id: item.item.id,
        symbol: item.item.symbol,
        name: item.item.name,
        rank: item.item.market_cap_rank,
        price: item.item.data?.price || 0,
        priceChange24h: item.item.data?.price_change_percentage_24h?.usd || 0,
        marketCap: item.item.data?.market_cap || 0,
        volume: item.item.data?.total_volume || 0,
        image: item.item.thumb
      })) || [];
    } catch (error) {
      console.error('Trending tokens fetch error:', error);
      return [];
    }
  }

  // Calculate price alerts
  checkPriceAlerts(currentPrice: number, alerts: Alert[]): Alert[] {
    const triggered: Alert[] = [];

    for (const alert of alerts) {
      let shouldTrigger = false;

      switch (alert.type) {
        case 'above':
          shouldTrigger = currentPrice >= alert.targetPrice;
          break;
        case 'below':
          shouldTrigger = currentPrice <= alert.targetPrice;
          break;
        case 'percent_change':
          const percentChange = ((currentPrice - alert.basePrice) / alert.basePrice) * 100;
          shouldTrigger = Math.abs(percentChange) >= alert.percentThreshold;
          break;
      }

      if (shouldTrigger && !alert.triggered) {
        triggered.push(alert);
      }
    }

    return triggered;
  }

  // Calculate portfolio value
  calculatePortfolioValue(holdings: Holding[], prices: any[]): PortfolioValue {
    let totalValue = 0;
    let totalCost = 0;
    const positions: Position[] = [];

    for (const holding of holdings) {
      const priceData = prices.find(p =>
        p.address === holding.address && p.chain === holding.chain
      );

      if (priceData && priceData.data) {
        const currentValue = holding.amount * priceData.data.price;
        const costBasis = holding.amount * holding.avgPrice;
        const pnl = currentValue - costBasis;
        const pnlPercent = (pnl / costBasis) * 100;

        totalValue += currentValue;
        totalCost += costBasis;

        positions.push({
          ...holding,
          currentPrice: priceData.data.price,
          currentValue: currentValue,
          costBasis: costBasis,
          pnl: pnl,
          pnlPercent: pnlPercent,
          priceChange24h: priceData.data.priceChange?.['24h'] || 0
        });
      }
    }

    return {
      totalValue: totalValue,
      totalCost: totalCost,
      totalPnl: totalValue - totalCost,
      totalPnlPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      positions: positions,
      lastUpdated: Date.now()
    };
  }

  // Cache management
  private getCachedPrice(key: string): PriceData | null {
    const cached = this.priceCache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheExpiry) {
      this.priceCache.delete(key);
      return null;
    }

    return cached;
  }

  private cachePrice(key: string, data: PriceData): void {
    this.priceCache.set(key, data);

    // Cleanup old cache entries
    if (this.priceCache.size > 100) {
      const oldestKey = this.priceCache.keys().next().value;
      if (oldestKey) this.priceCache.delete(oldestKey);
    }
  }

  clearCache(): void {
    this.priceCache.clear();
  }

  // Helper: Get Dexscreener chain ID
  private getChainId(chain: string): string {
    const chainIds: Record<string, string> = {
      'ethereum': 'ethereum',
      'bsc': 'bsc',
      'polygon': 'polygon',
      'arbitrum': 'arbitrum',
      'avalanche': 'avalanche',
      'solana': 'solana',
      'hedera': 'hedera'
    };
    return chainIds[chain] || chain;
  }

  // Helper: Get CoinGecko platform ID
  private getCoinGeckoPlatformId(chain: string): string | null {
    const platforms: Record<string, string> = {
      'ethereum': 'ethereum',
      'bsc': 'binance-smart-chain',
      'polygon': 'polygon-pos',
      'arbitrum': 'arbitrum-one',
      'avalanche': 'avalanche',
      'solana': 'solana'
    };
    return platforms[chain] || null;
  }

  // Format price for display
  formatPrice(price: number): string {
    if (price >= 1000) return '$' + price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (price >= 1) return '$' + price.toFixed(2);
    if (price >= 0.01) return '$' + price.toFixed(4);
    if (price >= 0.0001) return '$' + price.toFixed(6);
    return '$' + price.toFixed(8);
  }

  // Format market cap
  formatMarketCap(value: number): string {
    if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return '$' + (value / 1e3).toFixed(2) + 'K';
    return '$' + value.toFixed(2);
  }

  // Format percentage change with color
  formatPriceChange(percent: number): { text: string; color: string } {
    const sign = percent >= 0 ? '+' : '';
    return {
      text: sign + percent.toFixed(2) + '%',
      color: percent >= 0 ? '#22c55e' : '#ef4444'
    };
  }
}

// Export for browser extension use
export { PriceTracker, PriceData, Alert, Holding, Position, PortfolioValue };
