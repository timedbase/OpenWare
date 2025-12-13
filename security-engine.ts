// OpenWare Security Detection Engine
// Multi-chain threat detection and analysis

interface Risk {
  type: string;
  severity: string;
  message: string;
}

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

interface ContractData {
  verified: boolean;
  liquidity: number;
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  createdDaysAgo: number | null;
  topHolderPercentage: number | null;
  isHoneypot: boolean;
  ownershipRenounced: boolean | null;
  dexName?: string;
  pairAddress?: string;
}

interface ChainAPI {
  rpc?: string;
  explorer?: string;
  dexscreener?: string;
  mirror?: string;
}

class SecurityEngine {
  private phishingDomains: Set<string>;
  private scamPatterns: RegExp[];
  private suspiciousKeywords: string[];
  private chainAPIs: Record<string, ChainAPI>;

  constructor() {
    this.phishingDomains = new Set();
    this.scamPatterns = this.initializeScamPatterns();
    this.suspiciousKeywords = this.initializeSuspiciousKeywords();
    this.chainAPIs = this.initializeChainAPIs();
  }

  // Initialize known scam patterns
  private initializeScamPatterns(): RegExp[] {
    return [
      // Phishing patterns
      /claim.*airdrop/i,
      /free.*crypto/i,
      /double.*ethereum/i,
      /giveaway.*btc/i,
      /elon.*musk.*giveaway/i,
      /connect.*wallet.*verify/i,
      /urgent.*security.*update/i,
      /wallet.*compromised/i,
      /verify.*kyc/i,

      // Common crypto scam domains
      /binance.*support/i,
      /coinbase.*verify/i,
      /metamask.*support/i,
      /opensea.*nft/i,
      /uniswap.*app/i,

      // Suspicious patterns
      /seed.*phrase/i,
      /private.*key/i,
      /recovery.*phrase/i,
    ];
  }

  // Initialize suspicious keywords
  private initializeSuspiciousKeywords(): string[] {
    return [
      'airdrop', 'giveaway', 'free tokens', 'claim now',
      'limited time', 'urgent action', 'verify wallet',
      'connect wallet', 'approve transaction', 'seed phrase',
      'private key', 'recovery phrase', 'metamask support',
      'trust wallet support', 'double your crypto',
      'guaranteed profit', 'risk-free', '100x token',
      'moon shot', 'rug pull proof', 'honeypot free'
    ];
  }

  // Initialize blockchain API endpoints
  private initializeChainAPIs(): Record<string, ChainAPI> {
    return {
      ethereum: {
        rpc: 'https://eth.llamarpc.com',
        explorer: 'https://api.etherscan.io/api',
        dexscreener: 'https://api.dexscreener.com/latest/dex/tokens/'
      },
      bsc: {
        rpc: 'https://bsc-dataseed.binance.org',
        explorer: 'https://api.bscscan.com/api',
        dexscreener: 'https://api.dexscreener.com/latest/dex/tokens/'
      },
      polygon: {
        rpc: 'https://polygon-rpc.com',
        explorer: 'https://api.polygonscan.com/api',
        dexscreener: 'https://api.dexscreener.com/latest/dex/tokens/'
      },
      arbitrum: {
        rpc: 'https://arb1.arbitrum.io/rpc',
        explorer: 'https://api.arbiscan.io/api',
        dexscreener: 'https://api.dexscreener.com/latest/dex/tokens/'
      },
      avalanche: {
        rpc: 'https://api.avax.network/ext/bc/C/rpc',
        explorer: 'https://api.snowtrace.io/api',
        dexscreener: 'https://api.dexscreener.com/latest/dex/tokens/'
      },
      hedera: {
        mirror: 'https://mainnet-public.mirrornode.hedera.com/api/v1',
        dexscreener: 'https://api.dexscreener.com/latest/dex/tokens/'
      },
      solana: {
        rpc: 'https://api.mainnet-beta.solana.com',
        dexscreener: 'https://api.dexscreener.com/latest/dex/tokens/'
      }
    };
  }

  // Analyze URL for threats
  async analyzeURL(url: string): Promise<Analysis> {
    const risks: Risk[] = [];
    let riskScore = 0;
    let threatLevel = 'SAFE';

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      const fullUrl = url.toLowerCase();

      // Check against known phishing domains
      if (this.isKnownPhishingDomain(domain)) {
        risks.push({ type: 'PHISHING', severity: 'CRITICAL', message: 'Known phishing domain detected' });
        riskScore += 90;
      }

      // Check for suspicious domain patterns
      const domainRisks = this.checkDomainPatterns(domain);
      risks.push(...domainRisks);
      riskScore += domainRisks.reduce((sum, r) => sum + (r.severity === 'HIGH' ? 30 : 15), 0);

      // Check for scam patterns in URL
      for (const pattern of this.scamPatterns) {
        if (pattern.test(fullUrl)) {
          risks.push({ type: 'SCAM_PATTERN', severity: 'HIGH', message: `Suspicious pattern detected: ${pattern.source}` });
          riskScore += 25;
        }
      }

      // Check for suspicious TLDs
      const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.work'];
      if (suspiciousTLDs.some(tld => domain.endsWith(tld))) {
        risks.push({ type: 'SUSPICIOUS_TLD', severity: 'MEDIUM', message: 'Domain uses suspicious TLD' });
        riskScore += 20;
      }

      // Check for typosquatting
      const typosquatRisks = this.checkTyposquatting(domain);
      risks.push(...typosquatRisks);
      riskScore += typosquatRisks.length * 35;

      // Check SSL/HTTPS
      if (urlObj.protocol === 'http:') {
        risks.push({ type: 'NO_SSL', severity: 'MEDIUM', message: 'No SSL/HTTPS encryption' });
        riskScore += 15;
      }

      // Determine threat level
      if (riskScore >= 70) {
        threatLevel = 'CRITICAL';
      } else if (riskScore >= 40) {
        threatLevel = 'HIGH';
      } else if (riskScore >= 20) {
        threatLevel = 'MEDIUM';
      } else if (riskScore > 0) {
        threatLevel = 'LOW';
      }

      return {
        url,
        domain,
        threatLevel,
        riskScore: Math.min(riskScore, 100),
        risks,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('URL Analysis Error:', error);
      return {
        url,
        threatLevel: 'UNKNOWN',
        riskScore: 0,
        risks: [{ type: 'ERROR', severity: 'LOW', message: 'Unable to analyze URL' }],
        timestamp: new Date().toISOString()
      };
    }
  }

  // Check if domain is known phishing site
  private isKnownPhishingDomain(domain: string): boolean {
    // This would ideally integrate with a real phishing database API
    const knownPhishing = [
      'metamask-verify.com', 'opensea-claim.com', 'binance-secure.com',
      'uniswap-app.com', 'coinbase-verify.com', 'wallet-connect.xyz',
      'trust-wallet-verify.com', 'ledger-support.com'
    ];

    return knownPhishing.some(phishing => domain.includes(phishing));
  }

  // Check for domain pattern anomalies
  private checkDomainPatterns(domain: string): Risk[] {
    const risks: Risk[] = [];

    // Excessive hyphens
    if ((domain.match(/-/g) || []).length > 2) {
      risks.push({ type: 'SUSPICIOUS_DOMAIN', severity: 'MEDIUM', message: 'Domain contains excessive hyphens' });
    }

    // Random character patterns
    if (/[0-9]{4,}/.test(domain)) {
      risks.push({ type: 'SUSPICIOUS_DOMAIN', severity: 'LOW', message: 'Domain contains long number sequences' });
    }

    // Suspicious crypto-related domains
    const cryptoKeywords = ['metamask', 'opensea', 'uniswap', 'pancakeswap', 'binance', 'coinbase', 'crypto', 'wallet'];
    for (const keyword of cryptoKeywords) {
      if (domain.includes(keyword)) {
        const officialDomains: Record<string, string[]> = {
          'metamask': ['metamask.io'],
          'opensea': ['opensea.io'],
          'uniswap': ['uniswap.org', 'app.uniswap.org'],
          'pancakeswap': ['pancakeswap.finance'],
          'binance': ['binance.com', 'binance.us'],
          'coinbase': ['coinbase.com'],
        };

        if (officialDomains[keyword] && !officialDomains[keyword].some(official => domain === official)) {
          risks.push({ type: 'IMPERSONATION', severity: 'HIGH', message: `Possible ${keyword} impersonation` });
        }
      }
    }

    return risks;
  }

  // Check for typosquatting of popular crypto sites
  private checkTyposquatting(domain: string): Risk[] {
    const risks: Risk[] = [];
    const popularSites = [
      { name: 'metamask.io', variations: ['metamask.com', 'metmask.io', 'metamsk.io', 'metamask.app'] },
      { name: 'opensea.io', variations: ['opensea.com', 'opnsea.io', 'opensae.io', 'open-sea.io'] },
      { name: 'uniswap.org', variations: ['uniswap.com', 'unswap.org', 'uniswp.org', 'uni-swap.org'] },
      { name: 'binance.com', variations: ['binance.net', 'binnance.com', 'binanse.com', 'binance.org'] },
      { name: 'coinbase.com', variations: ['coinbase.net', 'coinbse.com', 'conbase.com', 'coin-base.com'] },
    ];

    for (const site of popularSites) {
      if (domain !== site.name && site.variations.some(v => domain.includes(v.split('.')[0]))) {
        risks.push({ type: 'TYPOSQUATTING', severity: 'CRITICAL', message: `Possible typosquatting of ${site.name}` });
      }
    }

    return risks;
  }

  // Analyze smart contract
  async analyzeContract(address: string, chain: string = 'ethereum'): Promise<Analysis> {
    const risks: Risk[] = [];
    let riskScore = 0;

    try {
      // Validate address format
      if (!this.isValidAddress(address, chain)) {
        return {
          address,
          chain,
          threatLevel: 'UNKNOWN',
          riskScore: 0,
          risks: [{ type: 'INVALID_ADDRESS', severity: 'LOW', message: 'Invalid contract address format' }],
          timestamp: new Date().toISOString()
        };
      }

      // Get contract data from chain
      const contractData = await this.fetchContractData(address, chain);

      if (!contractData) {
        risks.push({ type: 'NO_DATA', severity: 'MEDIUM', message: 'Unable to fetch contract data' });
        riskScore += 20;
      } else {
        // Check contract verification
        if (!contractData.verified) {
          risks.push({ type: 'UNVERIFIED', severity: 'HIGH', message: 'Contract source code not verified' });
          riskScore += 30;
        }

        // Check liquidity
        if (contractData.liquidity && contractData.liquidity < 10000) {
          risks.push({ type: 'LOW_LIQUIDITY', severity: 'HIGH', message: `Low liquidity: $${contractData.liquidity}` });
          riskScore += 35;
        }

        // Check holder concentration
        if (contractData.topHolderPercentage && contractData.topHolderPercentage > 50) {
          risks.push({ type: 'WHALE_CONCENTRATION', severity: 'HIGH', message: `Top holder owns ${contractData.topHolderPercentage}%` });
          riskScore += 30;
        }

        // Check contract age
        if (contractData.createdDaysAgo && contractData.createdDaysAgo < 7) {
          risks.push({ type: 'NEW_CONTRACT', severity: 'MEDIUM', message: `Contract is only ${contractData.createdDaysAgo} days old` });
          riskScore += 20;
        }

        // Check for honeypot indicators
        if (contractData.isHoneypot) {
          risks.push({ type: 'HONEYPOT', severity: 'CRITICAL', message: 'Honeypot detected - cannot sell tokens' });
          riskScore += 100;
        }

        // Check ownership
        if (contractData.ownershipRenounced === false) {
          risks.push({ type: 'OWNER_CONTROL', severity: 'MEDIUM', message: 'Ownership not renounced - owner has control' });
          riskScore += 25;
        }
      }

      // Determine threat level
      let threatLevel = 'SAFE';
      if (riskScore >= 70) {
        threatLevel = 'CRITICAL';
      } else if (riskScore >= 40) {
        threatLevel = 'HIGH';
      } else if (riskScore >= 20) {
        threatLevel = 'MEDIUM';
      } else if (riskScore > 0) {
        threatLevel = 'LOW';
      }

      return {
        address,
        chain,
        threatLevel,
        riskScore: Math.min(riskScore, 100),
        risks,
        contractData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Contract Analysis Error:', error);
      return {
        address,
        chain,
        threatLevel: 'UNKNOWN',
        riskScore: 0,
        risks: [{ type: 'ERROR', severity: 'LOW', message: 'Unable to analyze contract' }],
        timestamp: new Date().toISOString()
      };
    }
  }

  // Validate address format for different chains
  private isValidAddress(address: string, chain: string): boolean {
    switch (chain) {
      case 'ethereum':
      case 'bsc':
      case 'polygon':
      case 'arbitrum':
      case 'avalanche':
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case 'solana':
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      case 'hedera':
        return /^0\.0\.\d+$/.test(address);
      default:
        return false;
    }
  }

  // Fetch contract data from blockchain
  private async fetchContractData(address: string, chain: string): Promise<ContractData | null> {
    try {
      // Try to get data from Dexscreener first (works for most chains)
      const dexData = await this.fetchDexscreenerData(address, chain);

      return dexData;
    } catch (error) {
      console.error('Failed to fetch contract data:', error);
      return null;
    }
  }

  // Fetch data from Dexscreener
  private async fetchDexscreenerData(address: string, chain: string): Promise<ContractData | null> {
    try {
      const chainIds: Record<string, string> = {
        'ethereum': 'ethereum',
        'bsc': 'bsc',
        'polygon': 'polygon',
        'arbitrum': 'arbitrum',
        'avalanche': 'avalanche',
        'solana': 'solana',
        'hedera': 'hedera'
      };

      const chainId = chainIds[chain] || chain;
      const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`;

      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json();

      if (!data.pairs || data.pairs.length === 0) return null;

      // Get the most liquid pair
      const pair = data.pairs.sort((a: any, b: any) =>
        (parseFloat(b.liquidity?.usd) || 0) - (parseFloat(a.liquidity?.usd) || 0)
      )[0];

      return {
        verified: true, // Dexscreener lists somewhat verified tokens
        liquidity: parseFloat(pair.liquidity?.usd) || 0,
        price: parseFloat(pair.priceUsd) || 0,
        marketCap: parseFloat(pair.marketCap) || 0,
        volume24h: parseFloat(pair.volume?.h24) || 0,
        priceChange24h: parseFloat(pair.priceChange?.h24) || 0,
        createdDaysAgo: pair.pairCreatedAt ? Math.floor((Date.now() - pair.pairCreatedAt) / (1000 * 60 * 60 * 24)) : null,
        topHolderPercentage: null, // Not available from Dexscreener
        isHoneypot: false, // Would need separate API
        ownershipRenounced: null, // Not available from Dexscreener
        dexName: pair.dexId,
        pairAddress: pair.pairAddress
      };
    } catch (error) {
      console.error('Dexscreener fetch error:', error);
      return null;
    }
  }

  // Analyze page content for threats
  analyzePageContent(content: string): { risks: Risk[]; riskScore: number } {
    const risks: Risk[] = [];
    let riskScore = 0;

    const lowerContent = content.toLowerCase();

    // Check for suspicious keywords
    let keywordCount = 0;
    for (const keyword of this.suspiciousKeywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        keywordCount++;
      }
    }

    if (keywordCount >= 5) {
      risks.push({ type: 'SCAM_KEYWORDS', severity: 'HIGH', message: `Found ${keywordCount} suspicious keywords` });
      riskScore += 40;
    } else if (keywordCount >= 3) {
      risks.push({ type: 'SCAM_KEYWORDS', severity: 'MEDIUM', message: `Found ${keywordCount} suspicious keywords` });
      riskScore += 20;
    }

    // Check for wallet connection requests
    if (/connect.*wallet/i.test(content)) {
      risks.push({ type: 'WALLET_REQUEST', severity: 'MEDIUM', message: 'Page requests wallet connection' });
      riskScore += 15;
    }

    // Check for urgency tactics
    const urgencyPatterns = [/limited.*time/i, /act.*now/i, /urgent/i, /expires.*soon/i];
    if (urgencyPatterns.some(p => p.test(content))) {
      risks.push({ type: 'URGENCY_TACTIC', severity: 'MEDIUM', message: 'Uses urgency tactics' });
      riskScore += 15;
    }

    return { risks, riskScore };
  }

  // Extract crypto addresses from text
  extractAddresses(text: string): { ethereum: string[]; solana: string[]; hedera: string[] } {
    const addresses = {
      ethereum: [] as string[],
      solana: [] as string[],
      hedera: [] as string[]
    };

    // Ethereum/EVM addresses
    const ethAddresses = text.match(/0x[a-fA-F0-9]{40}/g);
    if (ethAddresses) {
      addresses.ethereum = [...new Set(ethAddresses)];
    }

    // Solana addresses
    const solAddresses = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g);
    if (solAddresses) {
      addresses.solana = [...new Set(solAddresses)].filter(addr =>
        addr.length >= 32 && addr.length <= 44
      );
    }

    // Hedera token IDs
    const hederaIds = text.match(/0\.0\.\d+/g);
    if (hederaIds) {
      addresses.hedera = [...new Set(hederaIds)];
    }

    return addresses;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityEngine;
}

export { SecurityEngine, Risk, Analysis, ContractData };
