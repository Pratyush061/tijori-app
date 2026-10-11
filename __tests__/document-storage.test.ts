import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageDocumentStorage } from '../src/storage/asyncStorage';

describe('documentStorage', () => {
  let storage: AsyncStorageDocumentStorage;

  beforeEach(async () => {
    storage = new AsyncStorageDocumentStorage();
    await AsyncStorage.clear();
  });

  it('creates and lists documents', async () => {
    await storage.create({
      title: 'My Passport',
      type: 'Passport',
      color: '#000',
      initial: 'MP',
    });

    const docs = await storage.list();
    expect(docs.length).toBe(1);
    expect(docs[0].title).toBe('My Passport');
    expect(docs[0].type).toBe('Passport');
  });

  it('gets a document by id', async () => {
    const created = await storage.create({
      title: 'Aadhaar Card',
      type: 'Aadhaar',
      color: '#111',
      initial: 'AC',
    });

    const doc = await storage.get(created.id);
    expect(doc).not.toBeNull();
    expect(doc?.id).toBe(created.id);
    expect(doc?.title).toBe('Aadhaar Card');
  });

  it('updates a document', async () => {
    const created = await storage.create({
      title: 'Old Title',
      type: 'Other',
      color: '#222',
      initial: 'OT',
    });

    await storage.update(created.id, { title: 'New Title' });

    const updated = await storage.get(created.id);
    expect(updated?.title).toBe('New Title');
    expect(updated?.type).toBe('Other');
  });

  it('deletes a document', async () => {
    const created = await storage.create({
      title: 'To Be Deleted',
      type: 'Other',
      color: '#333',
      initial: 'TD',
    });

    let docs = await storage.list();
    expect(docs.length).toBe(1);

    await storage.delete(created.id);

    docs = await storage.list();
    expect(docs.length).toBe(0);
  });
});
