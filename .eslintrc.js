module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // The shared config grants the jest environment to test files
      // (*.test.*, **/__tests__/**) but not to setup/config files,
      // so declare it here for jest.setup.js.
      files: ['jest.setup.js', 'jest.config.js'],
      env: { jest: true, 'jest/globals': true },
    },
  ],
};
