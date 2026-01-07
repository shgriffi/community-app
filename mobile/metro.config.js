const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    assetExts: [
      // Video formats
      'mp4',
      'm4v',
      'mov',
      'avi',
      'mkv',
      'webm',
      // Audio formats
      'mp3',
      'wav',
      'aac',
      'm4a',
      'ogg',
      // Image formats (already included by default, but explicit here)
      'png',
      'jpg',
      'jpeg',
      'gif',
      'webp',
      'bmp',
      'svg',
      // Document formats
      'pdf',
      'doc',
      'docx',
    ].concat(getDefaultConfig(__dirname).resolver.assetExts),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
