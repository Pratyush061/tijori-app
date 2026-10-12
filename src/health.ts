import type { PasswordEntry } from './data';

export type PasswordHealthIssue = 'weak' | 'reused' | 'old';

export type PasswordAlert = {
  entry: PasswordEntry;
  issues: PasswordHealthIssue[];
  issueLabels: string[];
};

export type VaultHealthResult = {
  score: number;
  alerts: PasswordAlert[];
  alertEntries: PasswordEntry[];
  weakCount: number;
  reusedCount: number;
  oldCount: number;
};

export function evaluatePasswordStrength(password?: string): {
  score: number;
  isWeak: boolean;
  label: 'Weak' | 'Fair' | 'Strong';
} {
  if (!password) {
    return { score: 0, isWeak: true, label: 'Weak' };
  }
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score < 3) return { score, isWeak: true, label: 'Weak' };
  if (score < 5) return { score, isWeak: false, label: 'Fair' };
  return { score, isWeak: false, label: 'Strong' };
}

export function calculateVaultHealth(passwords: PasswordEntry[]): VaultHealthResult {
  if (passwords.length === 0) {
    return {
      score: 100,
      alerts: [],
      alertEntries: [],
      weakCount: 0,
      reusedCount: 0,
      oldCount: 0,
    };
  }

  const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const passCounts = new Map<string, number>();

  passwords.forEach(p => {
    if (p.password) {
      passCounts.set(p.password, (passCounts.get(p.password) || 0) + 1);
    }
  });

  const extractTs = (id: string): number => {
    const firstPart = id.split('-')[0];
    const b36 = parseInt(firstPart, 36);
    if (!isNaN(b36) && b36 > 1500000000000) {
      return b36;
    }
    const dec = parseInt(firstPart, 10);
    if (!isNaN(dec) && dec > 1500000000000) {
      return dec;
    }
    return 0;
  };

  const alerts: PasswordAlert[] = [];
  let weakCount = 0;
  let reusedCount = 0;
  let oldCount = 0;
  let totalItemScore = 0;

  passwords.forEach(p => {
    const issues: PasswordHealthIssue[] = [];
    const issueLabels: string[] = [];
    let itemScore = 100;

    const strength = evaluatePasswordStrength(p.password);
    if (strength.isWeak) {
      issues.push('weak');
      issueLabels.push('Weak password');
      weakCount++;
      itemScore -= 45;
    }

    if (p.password && (passCounts.get(p.password) || 0) > 1) {
      issues.push('reused');
      issueLabels.push('Reused password');
      reusedCount++;
      itemScore -= 35;
    }

    const ts = extractTs(p.id);
    if (ts > 0 && ts < oneYearAgo) {
      issues.push('old');
      issueLabels.push('Older than 1 year');
      oldCount++;
      itemScore -= 20;
    }

    itemScore = Math.max(0, itemScore);
    totalItemScore += itemScore;

    if (issues.length > 0) {
      alerts.push({
        entry: p,
        issues,
        issueLabels,
      });
    }
  });

  const avgScore = Math.round(totalItemScore / passwords.length);

  return {
    score: avgScore,
    alerts,
    alertEntries: alerts.map(a => a.entry),
    weakCount,
    reusedCount,
    oldCount,
  };
}
