import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PasswordEntry, Birthday, NoteEntry, CardEntry, DocumentEntry } from '../data';
import type { PasswordStorage, BirthdayStorage, NoteStorage, CardStorage, DocumentStorage } from './index';

const STORAGE_KEY = '@tijori_passwords';
const BIRTHDAY_STORAGE_KEY = '@tijori_birthdays';
const NOTE_STORAGE_KEY = '@tijori_notes';
const CARD_STORAGE_KEY = '@tijori_cards';
const DOCUMENT_STORAGE_KEY = '@tijori_documents';

export class AsyncStoragePasswordStorage implements PasswordStorage {
  async list(): Promise<PasswordEntry[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error('Failed to load passwords', e);
      return [];
    }
  }

  async get(id: string): Promise<PasswordEntry | null> {
    const list = await this.list();
    return list.find((p) => p.id === id) || null;
  }

  async create(entry: Omit<PasswordEntry, 'id'>): Promise<PasswordEntry> {
    const list = await this.list();
    const newEntry: PasswordEntry = {
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    };
    list.push(newEntry);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
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
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return updatedEntry;
  }

  async delete(id: string): Promise<void> {
    const list = await this.list();
    const filteredList = list.filter((p) => p.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredList));
  }
}

export const passwordStorage = new AsyncStoragePasswordStorage();

export class AsyncStorageBirthdayStorage implements BirthdayStorage {
  async list(): Promise<Birthday[]> {
    try {
      const json = await AsyncStorage.getItem(BIRTHDAY_STORAGE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error('Failed to load birthdays', e);
      return [];
    }
  }

  async get(id: string): Promise<Birthday | null> {
    const list = await this.list();
    return list.find((b) => b.id === id) || null;
  }

  async create(entry: Omit<Birthday, 'id'>): Promise<Birthday> {
    const list = await this.list();
    const newEntry: Birthday = {
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    };
    list.push(newEntry);
    await AsyncStorage.setItem(BIRTHDAY_STORAGE_KEY, JSON.stringify(list));
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
    await AsyncStorage.setItem(BIRTHDAY_STORAGE_KEY, JSON.stringify(list));
    return updatedEntry;
  }

  async delete(id: string): Promise<void> {
    const list = await this.list();
    const filteredList = list.filter((b) => b.id !== id);
    await AsyncStorage.setItem(BIRTHDAY_STORAGE_KEY, JSON.stringify(filteredList));
  }
}

export const birthdayStorage = new AsyncStorageBirthdayStorage();

export class AsyncStorageNoteStorage implements NoteStorage {
  async list(): Promise<NoteEntry[]> {
    try {
      const json = await AsyncStorage.getItem(NOTE_STORAGE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error('Failed to load notes', e);
      return [];
    }
  }

  async get(id: string): Promise<NoteEntry | null> {
    const list = await this.list();
    return list.find((n) => n.id === id) || null;
  }

  async create(entry: Omit<NoteEntry, 'id'>): Promise<NoteEntry> {
    const list = await this.list();
    const newEntry: NoteEntry = {
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    };
    list.push(newEntry);
    await AsyncStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(list));
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
    await AsyncStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(list));
    return updatedEntry;
  }

  async delete(id: string): Promise<void> {
    const list = await this.list();
    const filteredList = list.filter((n) => n.id !== id);
    await AsyncStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(filteredList));
  }
}

export const noteStorage = new AsyncStorageNoteStorage();

export class AsyncStorageCardStorage implements CardStorage {
  async list(): Promise<CardEntry[]> {
    try {
      const json = await AsyncStorage.getItem(CARD_STORAGE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error('Failed to load cards', e);
      return [];
    }
  }

  async get(id: string): Promise<CardEntry | null> {
    const list = await this.list();
    return list.find((c) => c.id === id) || null;
  }

  async create(entry: Omit<CardEntry, 'id'>): Promise<CardEntry> {
    const list = await this.list();
    const newEntry: CardEntry = {
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    };
    list.push(newEntry);
    await AsyncStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(list));
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
    await AsyncStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(list));
    return updatedEntry;
  }

  async delete(id: string): Promise<void> {
    const list = await this.list();
    const filteredList = list.filter((c) => c.id !== id);
    await AsyncStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(filteredList));
  }
}

export const cardStorage = new AsyncStorageCardStorage();

export class AsyncStorageDocumentStorage implements DocumentStorage {
  async list(): Promise<DocumentEntry[]> {
    try {
      const json = await AsyncStorage.getItem(DOCUMENT_STORAGE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error('Failed to load documents', e);
      return [];
    }
  }

  async get(id: string): Promise<DocumentEntry | null> {
    const list = await this.list();
    return list.find((d) => d.id === id) || null;
  }

  async create(entry: Omit<DocumentEntry, 'id'>): Promise<DocumentEntry> {
    const list = await this.list();
    const newEntry: DocumentEntry = {
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    };
    list.push(newEntry);
    await AsyncStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(list));
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
    await AsyncStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(list));
    return updatedEntry;
  }

  async delete(id: string): Promise<void> {
    const list = await this.list();
    const filteredList = list.filter((d) => d.id !== id);
    await AsyncStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(filteredList));
  }
}

export const documentStorage = new AsyncStorageDocumentStorage();
