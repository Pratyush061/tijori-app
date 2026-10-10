import AsyncStorage from '@react-native-async-storage/async-storage';
import { passwordStorage, birthdayStorage } from '../src/storage/asyncStorage';

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
      initial: 'G',
      category: 'Email'
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Google');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_passwords',
      expect.stringContaining('Google')
    );
  });

  it('updates an existing entry', async () => {
    const mockData = [{ id: '1', name: 'Test', subtitle: 'old', color: '#000', initial: 'T', category: 'Work' }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    const result = await passwordStorage.update('1', { subtitle: 'new', category: 'Social' });
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

describe('AsyncStorageBirthdayStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists empty when no data exists', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await birthdayStorage.list();
    expect(result).toEqual([]);
  });

  it('lists parsed entries', async () => {
    const mockData = [{ id: '1', name: 'Test' }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
    const result = await birthdayStorage.list();
    expect(result).toEqual(mockData);
  });

  it('creates an entry and saves it', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await birthdayStorage.create({
      name: 'Aarav',
      date: '2000-10-13',
      includeYear: true,
      color: '#000',
      initial: 'A'
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Aarav');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_birthdays',
      expect.stringContaining('Aarav')
    );
  });

  it('updates an existing entry', async () => {
    const mockData = [{ id: '1', name: 'Test', date: '2000-01-01', includeYear: true, color: '#000', initial: 'T' }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    const result = await birthdayStorage.update('1', { name: 'New Name' });
    expect(result.name).toBe('New Name');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_birthdays',
      expect.stringContaining('New Name')
    );
  });

  it('deletes an entry', async () => {
    const mockData = [
      { id: '1', name: 'Test1', date: '2000-01-01', includeYear: true, color: '#000', initial: 'T' },
      { id: '2', name: 'Test2', date: '2000-01-01', includeYear: true, color: '#000', initial: 'T' }
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    await birthdayStorage.delete('1');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_birthdays',
      expect.stringContaining('Test2')
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_birthdays',
      expect.not.stringContaining('Test1')
    );
  });
});
