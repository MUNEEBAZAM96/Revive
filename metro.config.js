const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

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

module.exports = config;
