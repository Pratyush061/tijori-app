import { colors } from './theme';

export type PasswordEntry = {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  initial: string;
};

export type Birthday = {
  id: string;
  name: string;
  date: string;
  daysAway: number;
  color: string;
  initial: string;
};

export const passwords: PasswordEntry[] = [
  {
    id: 'google',
    name: 'Google',
    subtitle: 'pratyushjj02@gmail.com',
    color: colors.blue,
    initial: 'G',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    subtitle: 'pratyush.jain',
    color: colors.pink,
    initial: 'N',
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    subtitle: '•••• 4821',
    color: colors.green,
    initial: 'H',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    subtitle: '@pratyush.jain',
    color: colors.indigo,
    initial: 'I',
  },
  {
    id: 'github',
    name: 'GitHub',
    subtitle: 'pratyush-dev',
    color: colors.ink,
    initial: 'Gh',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    subtitle: 'pratyushjj02@gmail.com',
    color: colors.orange,
    initial: 'A',
  },
];

export const birthdays: Birthday[] = [
  {
    id: 'aarav',
    name: 'Aarav Sharma',
    date: '13 October · Monday',
    daysAway: 3,
    color: colors.pink,
    initial: 'AS',
  },
  {
    id: 'meera',
    name: 'Meera Iyer',
    date: '18 October · Saturday',
    daysAway: 8,
    color: colors.teal,
    initial: 'M',
  },
  {
    id: 'rohan',
    name: 'Rohan Gupta',
    date: '25 October · Saturday',
    daysAway: 15,
    color: colors.green,
    initial: 'R',
  },
  {
    id: 'sara',
    name: 'Sara Khan',
    date: '28 October · Tuesday',
    daysAway: 18,
    color: colors.blue,
    initial: 'S',
  },
  {
    id: 'kabir',
    name: 'Kabir Nair',
    date: '2 November · Sunday',
    daysAway: 23,
    color: colors.indigo,
    initial: 'K',
  },
  {
    id: 'priya',
    name: 'Priya Desai',
    date: '9 November · Sunday',
    daysAway: 30,
    color: colors.orange,
    initial: 'P',
  },
];
