import AsyncStorage from '@react-native-async-storage/async-storage';
import { passwordStorage, birthdayStorage, noteStorage, cardStorage } from '../src/storage/asyncStorage';

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

describe('AsyncStorageNoteStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists empty when no data exists', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await noteStorage.list();
    expect(result).toEqual([]);
  });

  it('lists parsed entries', async () => {
    const mockData = [{ id: '1', title: 'Test', body: 'body', color: '#000', initial: 'T' }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
    const result = await noteStorage.list();
    expect(result).toEqual(mockData);
  });

  it('creates an entry and saves it', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await noteStorage.create({
      title: 'A Note',
      body: 'Note body',
      color: '#000',
      initial: 'A'
    });

    expect(result.id).toBeDefined();
    expect(result.title).toBe('A Note');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_notes',
      expect.stringContaining('A Note')
    );
  });

  it('updates an existing entry', async () => {
    const mockData = [{ id: '1', title: 'Test', body: 'body', color: '#000', initial: 'T' }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    const result = await noteStorage.update('1', { title: 'New Title' });
    expect(result.title).toBe('New Title');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_notes',
      expect.stringContaining('New Title')
    );
  });

  it('deletes an entry', async () => {
    const mockData = [
      { id: '1', title: 'Test1', body: 'body', color: '#000', initial: 'T' },
      { id: '2', title: 'Test2', body: 'body', color: '#000', initial: 'T' }
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    await noteStorage.delete('1');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_notes',
      expect.stringContaining('Test2')
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_notes',
      expect.not.stringContaining('Test1')
    );
  });
});

describe('AsyncStorageCardStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists empty when no data exists', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await cardStorage.list();
    expect(result).toEqual([]);
  });

  it('lists parsed entries', async () => {
    const mockData = [{ id: '1', name: 'Test', last4: '1234', expiry: '12/24', color: '#000', initial: 'T' }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
    const result = await cardStorage.list();
    expect(result).toEqual(mockData);
  });

  it('creates an entry and saves it', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await cardStorage.create({
      name: 'A Card',
      last4: '1234',
      expiry: '12/24',
      color: '#000',
      initial: 'A'
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('A Card');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_cards',
      expect.stringContaining('A Card')
    );
  });

  it('updates an existing entry', async () => {
    const mockData = [{ id: '1', name: 'Test', last4: '1234', expiry: '12/24', color: '#000', initial: 'T' }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    const result = await cardStorage.update('1', { name: 'New Name' });
    expect(result.name).toBe('New Name');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_cards',
      expect.stringContaining('New Name')
    );
  });

  it('deletes an entry', async () => {
    const mockData = [
      { id: '1', name: 'Test1', last4: '1234', expiry: '12/24', color: '#000', initial: 'T' },
      { id: '2', name: 'Test2', last4: '1234', expiry: '12/24', color: '#000', initial: 'T' }
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    await cardStorage.delete('1');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_cards',
      expect.stringContaining('Test2')
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tijori_cards',
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
