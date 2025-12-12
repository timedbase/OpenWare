# TokenWare v2.0 - Installation Guide

## Quick Install (5 minutes)

### Chrome / Brave / Edge

1. **Open Extensions Page**
   - Chrome: Navigate to `chrome://extensions/`
   - Brave: Navigate to `brave://extensions/`
   - Edge: Navigate to `edge://extensions/`

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to and select the `TokenWare` folder
   - The extension should now appear in your list

4. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in your browser toolbar
   - Find "TokenWare - Web3 Security Suite"
   - Click the pin icon to keep it visible

5. **Grant Permissions**
   - Click the extension icon
   - Accept any permission requests
   - The extension is now active!

### Firefox

1. **Open Debugging Page**
   - Navigate to `about:debugging#/runtime/this-firefox`

2. **Load Temporary Add-on**
   - Click "Load Temporary Add-on..." button
   - Navigate to the TokenWare folder
   - Select the `manifest.json` file

3. **Note**: In Firefox, temporary add-ons are removed when you close the browser. For permanent installation, the extension needs to be packaged and signed.

---

## Verify Installation

### Check 1: Extension is Active
- Look for the TokenWare icon in your browser toolbar
- It should show a shield/badge icon

### Check 2: Visit a Website
- Navigate to any website (e.g., `https://ethereum.org`)
- You should see a floating badge in the bottom-right corner
- The badge will show a security status indicator

### Check 3: Open the Popup
- Click the TokenWare extension icon
- You should see the main interface with multiple tabs
- The "Scanner" tab should show the current site's security analysis

### Check 4: Test Contract Analyzer
- Click the "Contract" tab
- Select "Ethereum" as the chain
- Enter any valid Ethereum address
- Click "Analyze Contract"
- You should see results (even if it says "no data available")

---

## First-Time Setup

### 1. Review Settings
- Click the extension icon
- Go to the "Settings" tab
- Configure your preferences:
  - ✅ Auto-Scan Websites (recommended)
  - ✅ Show Floating Badge (recommended)
  - ✅ Show Security Warnings (recommended)
  - ⚪ Notification Sound (optional)

### 2. Test on Safe Site
- Visit `https://ethereum.org`
- Check that the floating badge appears
- Click the badge to view security analysis
- It should show "SAFE" threat level

### 3. Add Trusted Sites
If TokenWare flags a site you trust:
- Open the extension popup
- Go to "Whitelist" tab
- Or click "Trust this site" on the warning overlay

---

## Troubleshooting

### Extension Doesn't Load
**Solution:**
- Make sure all files are in the same folder
- Check that `manifest.json` is in the root folder
- Try reloading the extension from `chrome://extensions/`

### No Floating Badge Appears
**Solution:**
- Open extension popup → Settings
- Make sure "Show Floating Badge" is enabled (green)
- Refresh the webpage
- Check browser console for errors (F12)

### "Failed to analyze" Errors
**Solution:**
- Check your internet connection (APIs need to be reachable)
- Try a different website or contract address
- Some very new tokens may not have data yet

### Popup Won't Open
**Solution:**
- Right-click the extension icon → Inspect popup
- Check console for errors
- Try removing and reinstalling the extension

### Warnings on Legitimate Sites
**Solution:**
- TokenWare may be overly cautious - this is intentional for security
- Add the site to your whitelist if you trust it
- Report false positives so we can improve detection

---

## Uninstallation

### Chrome / Brave / Edge
1. Go to `chrome://extensions/`
2. Find "TokenWare - Web3 Security Suite"
3. Click "Remove"
4. Confirm removal

### Firefox
1. Go to `about:addons`
2. Find TokenWare
3. Click the three dots menu
4. Select "Remove"

**Note:** All local data (scan history, whitelist, settings) will be deleted upon uninstallation.

---

## Updating

### Manual Update
1. Download/pull the latest version
2. Go to `chrome://extensions/`
3. Click the refresh icon on the TokenWare card
4. Or remove the old version and load the new one

### Version Check
- Open the extension popup
- Look at the header or Settings tab
- Current version: **v2.0.0**

---

## Permissions Explained

TokenWare requests these permissions:

| Permission | Why We Need It |
|------------|----------------|
| `storage` | Save your settings, scan history, and whitelist locally |
| `activeTab` | Analyze the security of the current page |
| `tabs` | Monitor page navigation for auto-scanning |
| `notifications` | Alert you to detected threats |
| `scripting` | Inject the floating security badge |
| `alarms` | Schedule background security checks |
| `<all_urls>` | Scan any website you visit for threats |

**Privacy Note:** All data stays on your device. We don't collect or transmit any information.

---

## Getting Help

### Common Questions

**Q: Is TokenWare free?**
A: Yes, completely free and open source.

**Q: Does it work on mobile?**
A: Not yet. Currently desktop browsers only.

**Q: Can I use it with hardware wallets?**
A: Yes, TokenWare doesn't interact with your wallets - it only analyzes websites and contracts.

**Q: Will it slow down my browser?**
A: No, TokenWare is lightweight and only scans when needed.

**Q: Does it work offline?**
A: Partially. URL analysis works offline, but contract data requires internet for API calls.

### Report Issues

Found a bug or false positive?
1. Check the browser console for errors (F12)
2. Note the URL or contract address involved
3. Report on GitHub or contact @Snipeware

---

## Next Steps

After installation:
1. ✅ Browse your usual crypto sites and see the security badges
2. ✅ Try analyzing a few smart contracts
3. ✅ Check your statistics after a day of browsing
4. ✅ Customize settings to your preference
5. ✅ Add your trusted sites to the whitelist

**Stay safe in Web3!** 🛡️

---

## System Requirements

- **Browser:** Chrome 88+, Brave 1.19+, Edge 88+, Firefox 78+
- **OS:** Windows, macOS, or Linux
- **Internet:** Required for contract analysis
- **Disk Space:** < 5 MB

---

**Installation complete! TokenWare is now protecting you.** 🎉
