import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PasswordEntry } from '../data';
import type { PasswordStorage } from './index';

const STORAGE_KEY = '@tijori_passwords';

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
