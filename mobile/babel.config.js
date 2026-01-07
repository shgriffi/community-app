module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@store': './src/store',
          '@database': './src/database',
          '@navigation': './src/navigation',
          '@hooks': './src/hooks',
          '@types': './src/types',
          '@utils': './src/utils',
          '@assets': './src/assets',
          '@styles': './src/styles',
        },
      },
    ],
  ],
};
