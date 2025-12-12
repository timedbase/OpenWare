# TokenWare - Testing Guide

## 🧪 How to Test Token Address Detection

### Step 1: Load the Extension

1. Open Chrome/Brave/Edge
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `TokenWare` folder
6. The extension should load successfully

### Step 2: Test on a Sample Page

Create a simple HTML test page or use this content:

```html
<!DOCTYPE html>
<html>
<head>
  <title>TokenWare Test Page</title>
</head>
<body>
  <h1>Token Address Detection Test</h1>

  <h2>Ethereum Addresses</h2>
  <p>Uniswap: 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984</p>
  <p>USDC: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48</p>
  <p>WETH: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2</p>

  <h2>Hedera Addresses</h2>
  <p>Token 1: 0.0.12345</p>
  <p>Token 2: 0.0.456789</p>

  <h2>Mixed Content</h2>
  <p>Check out this new token: 0x6B175474E89094C44Da98b954EedeAC495271d0F (DAI)</p>
  <p>Trading on Ethereum at 0x514910771AF9Ca656af840dff83E8264EcF986CA (LINK)</p>
</body>
</html>
```

### Step 3: Verify Detection

1. Open the test page
2. Open browser console (F12)
3. Look for TokenWare log messages:
   - `[TokenWare] Content script loaded`
   - `[TokenWare] Starting address scan`
   - `[TokenWare] Found X text nodes to scan`
   - `[TokenWare] Found Ethereum address in: ...`
   - `[TokenWare] Scan complete. Found and highlighted X addresses`

### Step 4: Visual Verification

**Addresses should be:**
- Highlighted with light green background
- Underlined with green border
- Using monospace font
- Cursor changes to pointer on hover

### Step 5: Test Price Overlay

1. Hover over a highlighted address
2. Wait 500ms
3. Price overlay should appear showing:
   - Loading indicator (💰)
   - Then price data (if available)
   - Or error message (if unavailable)

### Step 6: Check Browser Console

The console should show detailed logs:

```
[TokenWare] Content script loaded, readyState: interactive
[TokenWare] Initializing on: file:///path/to/test.html
[TokenWare] Running scans...
[TokenWare] Starting address scan on: file:///path/to/test.html
[TokenWare] Found 15 text nodes to scan
[TokenWare] Found Ethereum address in: Uniswap: 0x1f9840a85d5aF5bf1D1762F925BDADdC4201
[TokenWare] Wrapping 1 addresses with overlay
[TokenWare] Successfully wrapped addresses
[TokenWare] Scan complete. Found and highlighted 5 addresses
```

---

## 🔍 Real-World Testing

### Test on Twitter/X

1. Go to Twitter.com
2. Search for: `crypto token address`
3. Look for tweets with Ethereum addresses
4. Addresses should be highlighted
5. Hover to see price overlay

### Test on Etherscan

1. Go to etherscan.io
2. Browse any token page
3. Addresses should be highlighted throughout
4. Hover to see price data

### Test on Reddit

1. Go to r/CryptoCurrency
2. Look for posts mentioning token addresses
3. Verify highlighting works

---

## 🐛 Troubleshooting

### Addresses Not Highlighted

**Check Console Logs:**
```javascript
// Should see:
[TokenWare] Content script loaded
[TokenWare] Starting address scan

// If you see this, detection is working but no addresses found:
[TokenWare] Scan complete. Found and highlighted 0 addresses

// If nothing appears, extension may not be loaded
```

**Fixes:**
1. Reload extension: `chrome://extensions/` → Click reload
2. Reload page: Press F5
3. Check if content script is injected: Look for TokenWare logs in console
4. Verify manifest.json permissions are correct

### Price Overlay Not Appearing

**Check:**
1. Hover for full 500ms
2. Check console for errors
3. Verify background script is running
4. Test with known token: `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984` (UNI)

### Console Errors

**Common Issues:**

1. **"Cannot read property of undefined"**
   - Extension not fully loaded
   - Solution: Reload extension

2. **"chrome.runtime.sendMessage error"**
   - Background script issue
   - Solution: Check background.js is loaded

3. **"Failed to fetch price"**
   - API issue or rate limit
   - Solution: Wait and try again

---

## ✅ Expected Behavior Checklist

- [ ] Extension loads without errors
- [ ] Content script injects on page load
- [ ] Console shows initialization logs
- [ ] Ethereum addresses are highlighted
- [ ] Hedera addresses are highlighted
- [ ] Hovering shows loading indicator
- [ ] Price data appears (for known tokens)
- [ ] Overlay closes when mouse leaves
- [ ] Multiple addresses on one page all work
- [ ] Floating security badge appears (bottom right)

---

## 🧪 Test Cases

### Test Case 1: Valid Ethereum Address
**Input:** `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984`
**Expected:**
- Green highlight ✅
- Price overlay shows UNI data ✅
- Market cap, liquidity visible ✅

### Test Case 2: Invalid Address
**Input:** `0x1f9840` (too short)
**Expected:**
- No highlight ❌
- No detection ❌

### Test Case 3: Hedera Address
**Input:** `0.0.12345`
**Expected:**
- Green highlight ✅
- Price overlay (if token exists) ✅

### Test Case 4: Multiple Addresses
**Input:**
```
Token 1: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
Token 2: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
```
**Expected:**
- Both highlighted ✅
- Both have independent overlays ✅

### Test Case 5: Dynamic Content
**Input:** Page loads more content via JavaScript
**Expected:**
- Initial addresses highlighted ✅
- New addresses NOT highlighted (requires rescan)
- Window load event triggers rescan after 2s ✅

---

## 📊 Performance Testing

### Memory Usage
1. Open Chrome Task Manager (Shift+Esc)
2. Find "Extension: TokenWare"
3. Normal usage: 5-15 MB
4. With overlays: 10-20 MB

### CPU Usage
- Initial scan: <1% CPU spike
- Idle: 0% CPU
- Hovering: <1% CPU

### Network
- Only when hovering addresses
- ~1-3 KB per price fetch
- Cached for 30 seconds

---

## 🔧 Debug Mode

To enable verbose logging, modify content-security.js:

```javascript
const DEBUG = true; // Set to true for detailed logs

if (DEBUG) {
  console.log('[TokenWare] Debug info:', ...);
}
```

---

## 📝 Test Report Template

```
Date: ___________
Browser: ___________
TokenWare Version: 2.0.0

Test Results:
[ ] Extension loads successfully
[ ] Content script injects
[ ] Addresses detected and highlighted
[ ] Price overlays appear on hover
[ ] API rotation working (check console logs)
[ ] No console errors
[ ] Performance acceptable

Issues Found:
-
-

Notes:
-
```

---

## 🎯 Quick Test Command

Open any page and run this in console:

```javascript
// Test if TokenWare is loaded
if (document.querySelector('.tokenware-address-wrapper')) {
  console.log('✅ TokenWare detected addresses!');
  console.log('Found:', document.querySelectorAll('.tokenware-address').length, 'addresses');
} else {
  console.log('❌ No addresses detected or TokenWare not loaded');
}
```

---

## 🚀 Production Testing

Before release, test on:

1. **Twitter/X** - Crypto tweets
2. **Reddit** - r/CryptoCurrency, r/ethereum
3. **Etherscan** - Token pages
4. **Uniswap** - Swap interface
5. **CoinGecko** - Token pages
6. **Medium** - Crypto articles
7. **Discord** (web) - Crypto servers
8. **Telegram** (web) - Crypto channels

All should show highlighted addresses with working overlays.
