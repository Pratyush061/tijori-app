import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  passwordStorage,
  birthdayStorage,
  noteStorage,
  cardStorage,
} from '../src/storage/asyncStorage';
import { initializeVault, lock } from '../src/storage/secureStore';
import { ENC_MARKER } from '../src/storage/crypto';

jest.mock('@react-native-async-storage/async-storage', () => {
  const cache: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => Promise.resolve(cache[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      cache[key] = value;
      return Promise.resolve(null);
    }),
    removeItem: jest.fn((key: string) => {
      delete cache[key];
      return Promise.resolve(null);
    }),
    clear: jest.fn(() => {
      Object.keys(cache).forEach(k => delete cache[k]);
      return Promise.resolve(null);
    }),
  };
});

beforeEach(async () => {
  await AsyncStorage.clear();
  lock();
  await initializeVault('1234');
});

describe('AsyncStoragePasswordStorage', () => {
  it('lists empty when no data exists', async () => {
    expect(await passwordStorage.list()).toEqual([]);
  });

  it('creates an entry and reads it back', async () => {
    const created = await passwordStorage.create({
      name: 'Google',
      subtitle: 'test@g.com',
      color: '#000',
      initial: 'G',
      category: 'Email',
    });

    expect(created.id).toBeTruthy();
    const list = await passwordStorage.list();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Google');
  });

  it('stores ciphertext, never the plaintext', async () => {
    await passwordStorage.create({
      name: 'SecretBank',
      subtitle: 'x',
      color: '#000',
      initial: 'S',
      category: 'Finance',
    });

    const raw = (await AsyncStorage.getItem('@tijori_passwords')) as string;
    expect(raw.startsWith(ENC_MARKER)).toBe(true);
    expect(raw.includes('SecretBank')).toBe(false);
  });

  it('updates an existing entry', async () => {
    const created = await passwordStorage.create({
      name: 'Test',
      subtitle: 'old',
      color: '#000',
      initial: 'T',
      category: 'Work',
    });

    const updated = await passwordStorage.update(created.id, {
      subtitle: 'new',
      category: 'Social',
    });
    expect(updated.subtitle).toBe('new');

    const list = await passwordStorage.list();
    expect(list[0].subtitle).toBe('new');
  });

  it('deletes an entry', async () => {
    const a = await passwordStorage.create({
      name: 'Test1', subtitle: '', color: '#000', initial: 'T', category: 'Work',
    });
    await passwordStorage.create({
      name: 'Test2', subtitle: '', color: '#000', initial: 'T', category: 'Work',
    });

    await passwordStorage.delete(a.id);

    const list = await passwordStorage.list();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Test2');
  });

  it('reads legacy plaintext and keeps it readable', async () => {
    await AsyncStorage.setItem(
      '@tijori_passwords',
      JSON.stringify([{ id: '1', name: 'Legacy', subtitle: '', color: '#000', initial: 'L', category: 'Work' }])
    );
    const list = await passwordStorage.list();
    expect(list[0].name).toBe('Legacy');
  });
});

describe('AsyncStorageNoteStorage', () => {
  it('lists empty when no data exists', async () => {
    expect(await noteStorage.list()).toEqual([]);
  });

  it('creates and updates a note', async () => {
    const created = await noteStorage.create({
      title: 'A Note', body: '<b>hi</b>', color: '#000', initial: 'A',
    });
    expect(created.id).toBeTruthy();

    const updated = await noteStorage.update(created.id, { title: 'New Title' });
    expect(updated.title).toBe('New Title');

    const list = await noteStorage.list();
    expect(list[0].title).toBe('New Title');
    expect(list[0].body).toBe('<b>hi</b>');
  });

  it('deletes a note', async () => {
    const a = await noteStorage.create({ title: 'Test1', body: 'b', color: '#000', initial: 'T' });
    await noteStorage.create({ title: 'Test2', body: 'b', color: '#000', initial: 'T' });
    await noteStorage.delete(a.id);
    const list = await noteStorage.list();
    expect(list.map(n => n.title)).toEqual(['Test2']);
  });
});

describe('AsyncStorageCardStorage', () => {
  it('creates and lists a card', async () => {
    await cardStorage.create({ name: 'A Card', last4: '1234', expiry: '12/24', color: '#000', initial: 'A' });
    const list = await cardStorage.list();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('A Card');
  });
});

describe('AsyncStorageBirthdayStorage', () => {
  it('creates and lists a birthday', async () => {
    await birthdayStorage.create({
      name: 'Aarav', date: '2000-10-13', includeYear: true, color: '#000', initial: 'A',
    });
    const list = await birthdayStorage.list();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Aarav');
  });
});
