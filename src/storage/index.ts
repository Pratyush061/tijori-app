import type { PasswordEntry } from '../data';

export interface PasswordStorage {
  list(): Promise<PasswordEntry[]>;
  get(id: string): Promise<PasswordEntry | null>;
  create(entry: Omit<PasswordEntry, 'id'>): Promise<PasswordEntry>;
  update(id: string, entry: Partial<PasswordEntry>): Promise<PasswordEntry>;
  delete(id: string): Promise<void>;
}

import type { Birthday, NoteEntry, CardEntry } from '../data';

export interface BirthdayStorage {
  list(): Promise<Birthday[]>;
  get(id: string): Promise<Birthday | null>;
  create(entry: Omit<Birthday, 'id'>): Promise<Birthday>;
  update(id: string, entry: Partial<Birthday>): Promise<Birthday>;
  delete(id: string): Promise<void>;
}

export interface NoteStorage {
  list(): Promise<NoteEntry[]>;
  get(id: string): Promise<NoteEntry | null>;
  create(entry: Omit<NoteEntry, 'id'>): Promise<NoteEntry>;
  update(id: string, entry: Partial<NoteEntry>): Promise<NoteEntry>;
  delete(id: string): Promise<void>;
}

export interface CardStorage {
  list(): Promise<CardEntry[]>;
  get(id: string): Promise<CardEntry | null>;
  create(entry: Omit<CardEntry, 'id'>): Promise<CardEntry>;
  update(id: string, entry: Partial<CardEntry>): Promise<CardEntry>;
  delete(id: string): Promise<void>;
}

import type { DocumentEntry } from '../data';

export interface DocumentStorage {
  list(): Promise<DocumentEntry[]>;
  get(id: string): Promise<DocumentEntry | null>;
  create(entry: Omit<DocumentEntry, 'id'>): Promise<DocumentEntry>;
  update(id: string, entry: Partial<DocumentEntry>): Promise<DocumentEntry>;
  delete(id: string): Promise<void>;
}
