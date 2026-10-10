import type { PasswordEntry } from '../data';

export interface PasswordStorage {
  list(): Promise<PasswordEntry[]>;
  get(id: string): Promise<PasswordEntry | null>;
  create(entry: Omit<PasswordEntry, 'id'>): Promise<PasswordEntry>;
  update(id: string, entry: Partial<PasswordEntry>): Promise<PasswordEntry>;
  delete(id: string): Promise<void>;
}
