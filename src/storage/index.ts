import type { PasswordEntry } from '../data';

export interface PasswordStorage {
  list(): Promise<PasswordEntry[]>;
  get(id: string): Promise<PasswordEntry | null>;
  create(entry: Omit<PasswordEntry, 'id'>): Promise<PasswordEntry>;
  update(id: string, entry: Partial<PasswordEntry>): Promise<PasswordEntry>;
  delete(id: string): Promise<void>;
}

import type { Birthday } from '../data';

export interface BirthdayStorage {
  list(): Promise<Birthday[]>;
  get(id: string): Promise<Birthday | null>;
  create(entry: Omit<Birthday, 'id'>): Promise<Birthday>;
  update(id: string, entry: Partial<Birthday>): Promise<Birthday>;
  delete(id: string): Promise<void>;
}
