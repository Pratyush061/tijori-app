import AsyncStorage from '@react-native-async-storage/async-storage';
import { passwordStorage } from '../src/storage/asyncStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('AsyncStoragePasswordStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists empty when no data exists', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await passwordStorage.list();
    expect(result).toEqual([]);
  });

  it('lists parsed entries', async () => {
    const mockData = [{ id: '1', name: 'Test' }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
    const result = await passwordStorage.list();
    expect(result).toEqual(mockData);
  });

  it('creates an entry and saves it', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await passwordStorage.create({
      name: 'Google',
      subtitle: 'test@g.com',
      color: '#000',
      initial: 'G'
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Google');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_passwords',
      expect.stringContaining('Google')
    );
  });

  it('updates an existing entry', async () => {
    const mockData = [{ id: '1', name: 'Test', subtitle: 'old', color: '#000', initial: 'T' }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    const result = await passwordStorage.update('1', { subtitle: 'new' });
    expect(result.subtitle).toBe('new');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_passwords',
      expect.stringContaining('new')
    );
  });

  it('deletes an entry', async () => {
    const mockData = [
      { id: '1', name: 'Test1', color: '#000', initial: 'T', subtitle: '' },
      { id: '2', name: 'Test2', color: '#000', initial: 'T', subtitle: '' }
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    await passwordStorage.delete('1');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_passwords',
      expect.stringContaining('Test2')
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_passwords',
      expect.not.stringContaining('Test1')
    );
  });
});
