# Changelog

## [2.0.0] - 2025-12-13

### Changed
- **BREAKING**: Complete TypeScript conversion
  - Renamed all references from "TokenWare" to "OpenWare" across the codebase
  - Converted all JavaScript files to TypeScript (.js → .ts)
  - Added proper TypeScript type definitions and interfaces
  - Configured TypeScript compiler with strict mode enabled

### Added
- `tsconfig.json` - TypeScript configuration
- `package.json` - NPM package configuration with build scripts
- `.gitignore` - Git ignore file for node_modules and build artifacts
- Type-safe interfaces for all major components:
  - Security analysis types (Risk, Analysis, ContractData)
  - Price tracking types (PriceData, Alert, Portfolio)
  - Chrome extension message types

### Removed
- All JavaScript (.js) files - replaced with TypeScript equivalents
- Old markdown documentation files (replaced with updated README.md)

### Migration Guide
To build the extension after this update:

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# The compiled files will be in the dist/ folder
```

### Files Changed
- `background.js` → `background.ts` (with proper typing)
- `security-engine.js` → `security-engine.ts` (with interfaces)
- `price-tracker.js` → `price-tracker.ts` (with type safety)
- `popup.js` → `popup.ts` (with DOM type safety)
- Updated `manifest.json` to reference compiled files in dist/
- Updated `popup.html` to reference compiled popup.js
