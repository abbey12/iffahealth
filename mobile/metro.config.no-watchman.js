const { getDefaultConfig } = require('@react-native/metro-config');

/**
 * Metro configuration without Watchman
 * Forces Metro to use file system watcher
 */

const config = {
  // Force Metro to use file system watcher instead of Watchman
  watchFolders: [],
  resolver: {
    platforms: ['ios', 'android', 'native', 'web'],
  },
  // Completely disable Watchman
  watcher: {
    watchman: {
      deferStates: ['hg.update'],
    },
  },
  // Force file system watcher
  server: {
    useGlobalHotkey: false,
  },
  // Disable Watchman completely
  watchman: false,
  // Use file system watcher
  watchman: false,
  // Force Metro to not wait for Watchman
  maxWorkers: 2,
  resetCache: true,
};

module.exports = config;
