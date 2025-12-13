# OpenWare v2.0 - Web3 Security Suite

![Version](https://img.shields.io/badge/version-2.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)

**Multi-chain cryptocurrency security analyzer** that protects you from scams, phishing, and malicious smart contracts across all major blockchains.

## Features

### Real-Time Threat Detection
- **Automatic Website Scanning** - Analyzes every website you visit for crypto-related threats
- **Phishing Detection** - Identifies fake crypto sites and typosquatting domains
- **Visual Security Indicators** - Floating badge shows site safety in real-time
- **Full-Screen Warnings** - Blocks dangerous sites with prominent alerts

### Multi-Chain Smart Contract Analysis
Supports analysis across:
- Ethereum (ETH)
- Binance Smart Chain (BSC)
- Polygon (MATIC)
- Arbitrum
- Avalanche
- Solana (SOL)
- Hedera (HBAR)

### Contract Security Checks
- **Honeypot Detection** - Identifies tokens you can buy but not sell
- **Liquidity Analysis** - Warns about low liquidity pools
- **Holder Concentration** - Detects whale manipulation risks
- **Contract Verification** - Checks if source code is verified
- **Ownership Analysis** - Flags centralized control risks
- **Age Verification** - Warns about brand new contracts

## Installation

### Prerequisites
- Node.js 18+ and npm
- TypeScript 5.3+

### Build from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/openware.git
cd openware

# Install dependencies
npm install

# Build TypeScript files
npm run build

# Load extension in Chrome/Brave/Edge
1. Open chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the OpenWare folder
```

### Development

```bash
# Watch mode for development
npm run watch

# Clean build artifacts
npm run clean
```

## Project Structure

```
OpenWare/
├── background.ts           # Service worker (background script)
├── security-engine.ts      # Multi-chain threat detection engine
├── price-tracker.ts        # Real-time price monitoring
├── popup.ts               # Extension popup UI logic
├── popup.html             # Popup UI structure
├── manifest.json          # Extension manifest
├── tsconfig.json          # TypeScript configuration
├── package.json           # NPM dependencies
└── images/                # Extension icons
```

## Technology Stack

- **TypeScript 5.3** - Type-safe development
- **Manifest V3** - Latest Chrome extension standard
- **Multi-Chain APIs** - Dexscreener, CoinGecko, GeckoTerminal
- **Chrome Extension API** - Browser integration

## Privacy

OpenWare is **privacy-focused**:
- All analysis happens locally in your browser
- No user data is collected or transmitted
- No external tracking or analytics
- Open source - audit the code yourself

## License

MIT License - feel free to use, modify, and distribute.

## Author

**@Snipeware**

## Support

If OpenWare helped protect you, consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs or suggesting features
- 📢 Sharing with others in the crypto community

---

**Stay safe in Web3!** 🛡️
