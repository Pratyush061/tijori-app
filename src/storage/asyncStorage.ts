import type { PasswordEntry, Birthday, NoteEntry, CardEntry, DocumentEntry } from '../data';
import type { PasswordStorage, BirthdayStorage, NoteStorage, CardStorage, DocumentStorage } from './index';
import { randomId } from './crypto';
import { secureGet, secureSet } from './secureStore';

const STORAGE_KEY = '@tijori_passwords';
const BIRTHDAY_STORAGE_KEY = '@tijori_birthdays';
const NOTE_STORAGE_KEY = '@tijori_notes';
const CARD_STORAGE_KEY = '@tijori_cards';
const DOCUMENT_STORAGE_KEY = '@tijori_documents';

// Every value goes through the encrypted store. Reads of legacy plaintext are
// upgraded to ciphertext the next time the record is written.

export class AsyncStoragePasswordStorage implements PasswordStorage {
  async list(): Promise<PasswordEntry[]> {
    const json = await secureGet(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  }

  async get(id: string): Promise<PasswordEntry | null> {
    const list = await this.list();
    return list.find((p) => p.id === id) || null;
  }

  async create(entry: Omit<PasswordEntry, 'id'>): Promise<PasswordEntry> {
    const list = await this.list();
    const newEntry: PasswordEntry = { ...entry, id: randomId() };
    list.push(newEntry);
    await secureSet(STORAGE_KEY, JSON.stringify(list));
    return newEntry;
  }

  async update(id: string, updates: Partial<PasswordEntry>): Promise<PasswordEntry> {
    const list = await this.list();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Password entry with id ${id} not found`);
    }
    const updatedEntry = { ...list[index], ...updates };
    list[index] = updatedEntry;
    await secureSet(STORAGE_KEY, JSON.stringify(list));
    return updatedEntry;
  }

  async delete(id: string): Promise<void> {
    const list = await this.list();
    const filteredList = list.filter((p) => p.id !== id);
    await secureSet(STORAGE_KEY, JSON.stringify(filteredList));
  }
}

export const passwordStorage = new AsyncStoragePasswordStorage();

export class AsyncStorageBirthdayStorage implements BirthdayStorage {
  async list(): Promise<Birthday[]> {
    const json = await secureGet(BIRTHDAY_STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  }

  async get(id: string): Promise<Birthday | null> {
    const list = await this.list();
    return list.find((b) => b.id === id) || null;
  }

  async create(entry: Omit<Birthday, 'id'>): Promise<Birthday> {
    const list = await this.list();
    const newEntry: Birthday = { ...entry, id: randomId() };
    list.push(newEntry);
    await secureSet(BIRTHDAY_STORAGE_KEY, JSON.stringify(list));
    return newEntry;
  }

  async update(id: string, updates: Partial<Birthday>): Promise<Birthday> {
    const list = await this.list();
    const index = list.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error(`Birthday entry with id ${id} not found`);
    }
    const updatedEntry = { ...list[index], ...updates };
    list[index] = updatedEntry;
    await secureSet(BIRTHDAY_STORAGE_KEY, JSON.stringify(list));
    return updatedEntry;
  }

  async delete(id: string): Promise<void> {
    const list = await this.list();
    const filteredList = list.filter((b) => b.id !== id);
    await secureSet(BIRTHDAY_STORAGE_KEY, JSON.stringify(filteredList));
  }
}

export const birthdayStorage = new AsyncStorageBirthdayStorage();

export class AsyncStorageNoteStorage implements NoteStorage {
  async list(): Promise<NoteEntry[]> {
    const json = await secureGet(NOTE_STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  }

  async get(id: string): Promise<NoteEntry | null> {
    const list = await this.list();
    return list.find((n) => n.id === id) || null;
  }

  async create(entry: Omit<NoteEntry, 'id'>): Promise<NoteEntry> {
    const list = await this.list();
    const newEntry: NoteEntry = { ...entry, id: randomId() };
    list.push(newEntry);
    await secureSet(NOTE_STORAGE_KEY, JSON.stringify(list));
    return newEntry;
  }

  async update(id: string, updates: Partial<NoteEntry>): Promise<NoteEntry> {
    const list = await this.list();
    const index = list.findIndex((n) => n.id === id);
    if (index === -1) {
      throw new Error(`Note entry with id ${id} not found`);
    }
    const updatedEntry = { ...list[index], ...updates };
    list[index] = updatedEntry;
    await secureSet(NOTE_STORAGE_KEY, JSON.stringify(list));
    return updatedEntry;
  }

  async delete(id: string): Promise<void> {
    const list = await this.list();
    const filteredList = list.filter((n) => n.id !== id);
    await secureSet(NOTE_STORAGE_KEY, JSON.stringify(filteredList));
  }
}

export const noteStorage = new AsyncStorageNoteStorage();

export class AsyncStorageCardStorage implements CardStorage {
  async list(): Promise<CardEntry[]> {
    const json = await secureGet(CARD_STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  }

  async get(id: string): Promise<CardEntry | null> {
    const list = await this.list();
    return list.find((c) => c.id === id) || null;
  }

  async create(entry: Omit<CardEntry, 'id'>): Promise<CardEntry> {
    const list = await this.list();
    const newEntry: CardEntry = { ...entry, id: randomId() };
    list.push(newEntry);
    await secureSet(CARD_STORAGE_KEY, JSON.stringify(list));
    return newEntry;
  }

  async update(id: string, updates: Partial<CardEntry>): Promise<CardEntry> {
    const list = await this.list();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Card entry with id ${id} not found`);
    }
    const updatedEntry = { ...list[index], ...updates };
    list[index] = updatedEntry;
    await secureSet(CARD_STORAGE_KEY, JSON.stringify(list));
    return updatedEntry;
  }

  async delete(id: string): Promise<void> {
    const list = await this.list();
    const filteredList = list.filter((c) => c.id !== id);
    await secureSet(CARD_STORAGE_KEY, JSON.stringify(filteredList));
  }
}

export const cardStorage = new AsyncStorageCardStorage();

export class AsyncStorageDocumentStorage implements DocumentStorage {
  async list(): Promise<DocumentEntry[]> {
    const json = await secureGet(DOCUMENT_STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  }

  async get(id: string): Promise<DocumentEntry | null> {
    const list = await this.list();
    return list.find((d) => d.id === id) || null;
  }

  async create(entry: Omit<DocumentEntry, 'id'>): Promise<DocumentEntry> {
    const list = await this.list();
    const newEntry: DocumentEntry = { ...entry, id: randomId() };
    list.push(newEntry);
    await secureSet(DOCUMENT_STORAGE_KEY, JSON.stringify(list));
    return newEntry;
  }

  async update(id: string, updates: Partial<DocumentEntry>): Promise<DocumentEntry> {
    const list = await this.list();
    const index = list.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error(`Document entry with id ${id} not found`);
    }
    const updatedEntry = { ...list[index], ...updates };
    list[index] = updatedEntry;
    await secureSet(DOCUMENT_STORAGE_KEY, JSON.stringify(list));
    return updatedEntry;
  }

  async delete(id: string): Promise<void> {
    const list = await this.list();
    const filteredList = list.filter((d) => d.id !== id);
    await secureSet(DOCUMENT_STORAGE_KEY, JSON.stringify(filteredList));
  }
}

export const documentStorage = new AsyncStorageDocumentStorage();
