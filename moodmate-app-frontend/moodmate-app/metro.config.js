const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const zustandAliases = {
  zustand: path.resolve(__dirname, 'node_modules/zustand/index.js'),
  'zustand/middleware': path.resolve(__dirname, 'node_modules/zustand/middleware.js'),
  'zustand/shallow': path.resolve(__dirname, 'node_modules/zustand/shallow.js'),
  'zustand/vanilla': path.resolve(__dirname, 'node_modules/zustand/vanilla.js'),
  'zustand/react/shallow': path.resolve(__dirname, 'node_modules/zustand/react/shallow.js'),
  'zustand/vanilla/shallow': path.resolve(__dirname, 'node_modules/zustand/vanilla/shallow.js'),
};

config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  ...zustandAliases,
};

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const alias = zustandAliases[moduleName];
  if (alias) {
    return { type: 'sourceFile', filePath: alias };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
