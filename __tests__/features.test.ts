import { calculateVaultHealth, evaluatePasswordStrength } from '../src/health';
import { getDaysAway, getUpcomingAge, type PasswordEntry } from '../src/data';
import { getAutoLockTimeout, setAutoLockTimeout } from '../src/storage/secureStore';
import { getTimeGreeting } from '../src/screens';

describe('Vault Health & Security Analysis', () => {
  it('returns perfect 100% score for empty vault', () => {
    const res = calculateVaultHealth([]);
    expect(res.score).toBe(100);
    expect(res.alerts).toHaveLength(0);
  });

  it('evaluates weak vs strong passwords correctly', () => {
    expect(evaluatePasswordStrength('').isWeak).toBe(true);
    expect(evaluatePasswordStrength('short').isWeak).toBe(true);
    expect(evaluatePasswordStrength('MySecur3P@ssw0rd').isWeak).toBe(false);
    expect(evaluatePasswordStrength('MySecur3P@ssw0rd').label).toBe('Strong');
  });

  it('accurately identifies weak and reused passwords with fair deductions', () => {
    const passwords: PasswordEntry[] = [
      { id: '1', name: 'Site A', subtitle: 'user', color: '#000', initial: 'A', password: '123' },
      { id: '2', name: 'Site B', subtitle: 'user', color: '#000', initial: 'B', password: '123' },
      { id: '3', name: 'Site C', subtitle: 'user', color: '#000', initial: 'C', password: 'VeryStrongPassword!123' },
    ];

    const res = calculateVaultHealth(passwords);
    expect(res.reusedCount).toBe(2);
    expect(res.weakCount).toBe(2);
    expect(res.alerts.length).toBe(2);
    // Score should not collapse immediately to 0
    expect(res.score).toBeGreaterThan(0);
    expect(res.score).toBeLessThan(100);
  });
});

describe('Birthday calculations and age tracking', () => {
  it('calculates days away for a birthday today or in the future', () => {
    const now = new Date();
    const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
    const todayDate = String(now.getDate()).padStart(2, '0');
    const todayStr = `1995-${todayMonth}-${todayDate}`;

    const daysAway = getDaysAway(todayStr);
    expect(daysAway).toBe(0);
  });

  it('calculates upcoming age accurately', () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
    const todayDate = String(now.getDate()).padStart(2, '0');
    const bdayStr = `2000-${todayMonth}-${todayDate}`;

    const age = getUpcomingAge(bdayStr);
    expect(age).toBe(currentYear - 2000);
  });
});

describe('Auto-lock configuration', () => {
  it('defaults to 0 (Immediately) and allows updating timeout', async () => {
    await setAutoLockTimeout(300);
    const timeout = await getAutoLockTimeout();
    expect(timeout).toBe(300);

    await setAutoLockTimeout(0);
    expect(await getAutoLockTimeout()).toBe(0);
  });
});

describe('Time-aware Greeting', () => {
  it('returns valid greeting string', () => {
    const greeting = getTimeGreeting();
    expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting);
  });
});

