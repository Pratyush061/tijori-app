
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve('true')),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  getSupportedBiometryType: jest.fn(),
}));
jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn(() => Promise.resolve('')),
}));
