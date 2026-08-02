const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web build loads wa-sqlite via a .wasm asset. Register the
// extension so Metro can resolve it when bundling the web target. (On native,
// SQLite is used directly; the local-first bootstrap is native-only.)
config.resolver.assetExts.push('wasm');

// This project lives on an exFAT external drive, where macOS constantly
// recreates AppleDouble metadata files (._foo.tsx). Block them so Metro and
// expo-router never treat them as source files or routes.
const appleDoublePattern = /(^|[\\/])\._[^\\/]*$/;
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList)
    ? existingBlockList
    : existingBlockList
      ? [existingBlockList]
      : []),
  appleDoublePattern,
];

module.exports = withNativeWind(config, { input: './global.css' });
