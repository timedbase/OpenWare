#!/bin/bash
# Build OpenWare as a CRX package

set -e

echo "Building OpenWare CRX package..."

# Step 1: Build TypeScript
echo "1. Compiling TypeScript..."
npm run build

# Step 2: Create a zip file
echo "2. Creating zip archive..."
rm -f openware.zip openware.crx

zip -r openware.zip \
  manifest.json \
  popup.html \
  dist/*.js \
  images/*.png \
  -x "*.map" -x "*.d.ts*"

echo ""
echo "✓ Build complete!"
echo ""
echo "To install:"
echo "1. Go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Drag and drop 'openware.zip' onto the page"
echo ""
echo "Or rename openware.zip to openware.crx and install it"
