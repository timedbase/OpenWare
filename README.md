# TokenWare v2.0 - Web3 Security Suite

![Version](https://img.shields.io/badge/version-2.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**Multi-chain cryptocurrency security analyzer** that protects you from scams, phishing, and malicious smart contracts across all major blockchains.

## 🛡️ Features

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

### Risk Scoring System
Each site and contract receives a **0-100 risk score** with threat levels:
- ✅ **SAFE** (0-20) - No security issues detected
- ⚠️ **LOW** (20-40) - Minor concerns, proceed with caution
- 🟠 **MEDIUM** (40-70) - Moderate risks detected
- 🚨 **HIGH** (70-90) - Serious threats identified
- ☠️ **CRITICAL** (90-100) - Extremely dangerous, avoid

### Advanced Security Features
- **Pattern Recognition** - Detects common scam keywords and tactics
- **Domain Analysis** - Identifies impersonation and typosquatting
- **SSL Verification** - Warns about unencrypted connections
- **Whitelist Management** - Trust verified sites to avoid false positives
- **Scan History** - Track all analyzed sites and contracts
- **Statistics Dashboard** - Monitor threats detected today

## 📦 Installation

### Chrome/Brave/Edge
1. Download or clone this repository
2. Open `chrome://extensions/` in your browser
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `TokenWare` folder
6. The extension is now active!

### Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Navigate to the `TokenWare` folder and select `manifest.json`

## 🚀 Usage

### Automatic Protection
TokenWare automatically scans every website you visit. The floating security badge shows:
- 🛡️ Scanning in progress
- ✅ Safe site
- ⚠️ Caution advised
- 🚨 Threats detected
- ☠️ Critical danger

Click the badge to view detailed security analysis.

### Manual URL Scanning
1. Click the TokenWare extension icon
2. Go to the **Scanner** tab
3. Enter any URL to analyze
4. Review the detailed threat assessment

### Smart Contract Analysis
1. Open the extension popup
2. Navigate to the **Contract** tab
3. Select the blockchain network
4. Enter the contract address or token ID
5. Click "Analyze Contract"
6. Review security findings including:
   - Risk score and threat level
   - Liquidity and market data
   - Security warnings
   - Contract age and verification status

### Managing Whitelisted Sites
If TokenWare flags a legitimate site:
1. Click "Trust this site" on the warning overlay, OR
2. Go to the **Whitelist** tab in the popup
3. Whitelisted sites won't trigger warnings

To remove from whitelist:
1. Open the **Whitelist** tab
2. Click "Remove" next to the domain

### Viewing Statistics
Track your protection stats:
- Total scans performed today
- Threats detected today
- Sites whitelisted
- Contracts analyzed

## ⚙️ Settings

Access settings from the extension popup:

- **Auto-Scan Websites** - Automatically analyze every page you visit
- **Show Floating Badge** - Display the security indicator on websites
- **Show Security Warnings** - Enable full-screen warnings for dangerous sites
- **Notification Sound** - Play alerts for detected threats

## 🔍 What TokenWare Detects

### Phishing & Scam Patterns
- Fake airdrops and giveaways
- Cryptocurrency doubling scams
- Fake wallet connection requests
- Impersonation of legitimate platforms (MetaMask, OpenSea, Uniswap, etc.)
- Urgency tactics and social engineering
- Requests for seed phrases or private keys

### Domain Red Flags
- Typosquatting (e.g., "metmask.io" instead of "metamask.io")
- Suspicious TLDs (.tk, .ml, .ga, .xyz, etc.)
- Excessive hyphens or random character sequences
- Known phishing domains

### Smart Contract Risks
- Unverified contract code
- Low liquidity (< $10K)
- High holder concentration (> 50%)
- Very new contracts (< 7 days)
- Honeypot indicators
- Non-renounced ownership

## 🛠️ Technical Details

### Architecture
- **Manifest V3** - Latest Chrome extension standard
- **Security Engine** - Modular threat detection system
- **Multi-Chain APIs** - Dexscreener integration for all chains
- **Local Storage** - Privacy-first, no data leaves your browser
- **Content Scripts** - Real-time page monitoring

### Permissions Required
- `storage` - Save settings and scan history locally
- `activeTab` - Analyze the current page
- `tabs` - Monitor navigation for auto-scanning
- `notifications` - Alert you to detected threats
- `scripting` - Inject security overlays
- `alarms` - Scheduled background tasks

### Privacy
TokenWare is **privacy-focused**:
- All analysis happens locally in your browser
- No user data is collected or transmitted
- No external tracking or analytics
- Open source - audit the code yourself

## 🔐 Detected Threat Examples

| Threat Type | Example | Risk Level |
|-------------|---------|------------|
| Phishing | metamask-verify.com | CRITICAL |
| Scam Pattern | "Free ETH airdrop - claim now!" | HIGH |
| Typosquatting | opnsea.io (vs opensea.io) | CRITICAL |
| Low Liquidity | Token with $500 liquidity | HIGH |
| New Contract | Deployed 2 days ago | MEDIUM |
| No SSL | http:// instead of https:// | MEDIUM |

## 📊 API Integrations

TokenWare uses these free APIs for enhanced detection:
- **Dexscreener API** - Multi-chain DEX data
- **Hedera Mirror Node** - Hedera token information
- **Public RPC Endpoints** - Blockchain data access

## 🤝 Contributing

Contributions are welcome! To add new features:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/tokenware.git

# No build process needed - pure JavaScript!
# Just load the extension in your browser
```

## 🐛 Known Limitations

- Solana address detection may have false positives (base58 encoding)
- Honeypot detection requires external API (not yet integrated)
- Some contract data unavailable for very new tokens
- Browser notifications require permission grant

## 📝 Version History

### v2.0.0 (Current)
- ✨ Multi-chain support (7 blockchains)
- 🛡️ Real-time phishing detection
- 📊 Smart contract security analysis
- 🎯 Risk scoring system
- 🔔 Browser notifications
- 📈 Statistics dashboard
- ⚪ Whitelist management

### v1.0.0
- Basic Hedera token analysis
- Twitter integration for token detection
- DEX platform monitoring

## ⚠️ Disclaimer

TokenWare is a security tool designed to help identify potential threats. It should NOT be your only security measure:

- Always verify URLs manually before connecting wallets
- Never share your seed phrase or private keys
- Double-check contract addresses before transactions
- Do your own research (DYOR) before investing
- No security tool is 100% accurate - stay vigilant

**TokenWare cannot prevent all scams.** Use it as one layer of a comprehensive security strategy.

## 📄 License

MIT License - feel free to use, modify, and distribute.

## 👤 Author

**@Snipeware**

## 🌟 Support

If TokenWare helped protect you, consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs or suggesting features
- 📢 Sharing with others in the crypto community

---

**Stay safe in Web3!** 🛡️
