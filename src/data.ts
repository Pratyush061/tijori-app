import { colors } from './theme';

export type PasswordEntry = {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  initial: string;
  password?: string;
  category?: string;
  favorite?: boolean;
};

export type Birthday = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  includeYear: boolean;
  color: string;
  initial: string;
  note?: string;
};

export function getDaysAway(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = dateStr.split('-');
  const bdayMonth = parseInt(parts[1], 10) - 1;
  const bdayDate = parseInt(parts[2], 10);

  let nextBday = new Date(today.getFullYear(), bdayMonth, bdayDate);

  if (nextBday < today) {
    nextBday.setFullYear(today.getFullYear() + 1);
  }

  const diffTime = Math.abs(nextBday.getTime() - today.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatBirthdayDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = dateStr.split('-');
  const bdayMonth = parseInt(parts[1], 10) - 1;
  const bdayDate = parseInt(parts[2], 10);

  let nextBday = new Date(today.getFullYear(), bdayMonth, bdayDate);

  if (nextBday < today) {
    nextBday.setFullYear(today.getFullYear() + 1);
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayName = days[nextBday.getDay()];
  const monthName = months[nextBday.getMonth()];
  const date = nextBday.getDate();

  return `${date} ${monthName} · ${dayName}`;
}

export const passwords: PasswordEntry[] = [
  {
    id: 'google',
    name: 'Google',
    subtitle: 'pratyushjj02@gmail.com',
    color: colors.blue,
    initial: 'G',
    category: 'Email',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    subtitle: 'pratyush.jain',
    color: colors.pink,
    initial: 'N',
    category: 'Other',
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    subtitle: '•••• 4821',
    color: colors.green,
    initial: 'H',
    category: 'Banking',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    subtitle: '@pratyush.jain',
    color: colors.indigo,
    initial: 'I',
    category: 'Social',
  },
  {
    id: 'github',
    name: 'GitHub',
    subtitle: 'pratyush-dev',
    color: colors.ink,
    initial: 'Gh',
    category: 'Work',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    subtitle: 'pratyushjj02@gmail.com',
    color: colors.orange,
    initial: 'A',
    category: 'Shopping',
  },
];

export const birthdays: Birthday[] = [
  {
    id: 'aarav',
    name: 'Aarav Sharma',
    date: '1995-10-13',
    includeYear: true,
    color: colors.pink,
    initial: 'AS',
  },
  {
    id: 'meera',
    name: 'Meera Iyer',
    date: '1998-10-18',
    includeYear: false,
    color: colors.teal,
    initial: 'M',
  },
  {
    id: 'rohan',
    name: 'Rohan Gupta',
    date: '1990-10-25',
    includeYear: true,
    color: colors.green,
    initial: 'R',
  },
  {
    id: 'sara',
    name: 'Sara Khan',
    date: '2000-10-28',
    includeYear: true,
    color: colors.blue,
    initial: 'S',
  },
  {
    id: 'kabir',
    name: 'Kabir Nair',
    date: '1985-11-02',
    includeYear: false,
    color: colors.indigo,
    initial: 'K',
  },
  {
    id: 'priya',
    name: 'Priya Desai',
    date: '1992-11-09',
    includeYear: true,
    color: colors.orange,
    initial: 'P',
  },
];
