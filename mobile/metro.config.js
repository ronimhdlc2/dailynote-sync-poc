const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Get the default Expo config
const config = getDefaultConfig(__dirname);

// Add the shared folder to watchFolders
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

config.watchFolders = [workspaceRoot];

// Configure resolver to handle shared folder
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Add extra node modules to resolve
config.resolver.extraNodeModules = {
  shared: path.resolve(workspaceRoot, 'shared'),
};

module.exports = withNativeWind(config, { input: './global.css' });
