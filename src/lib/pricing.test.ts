import { describe, expect, it } from 'vitest';
import type { Plan } from '../api';
import { monthlyEquivalent, savingsPercent, trialEndDate } from './pricing';

const monthly: Plan = { id: 'monthly', name: 'Monthly', interval: 'month', price: 49_000, days: 30, tagline: '' };
const yearly: Plan = { id: 'yearly', name: 'Yearly', interval: 'year', price: 399_000, days: 365, tagline: '' };

describe('pricing helpers', () => {
  it('turns a yearly price into a per-month figure', () => {
    expect(monthlyEquivalent(monthly)).toBe(49_000);
    expect(monthlyEquivalent(yearly)).toBe(33_250);
  });
  it('computes the yearly saving against twelve monthly payments', () => {
    expect(savingsPercent([monthly, yearly])).toBe(32);
  });
  it('reports no saving when a plan is missing or the yearly plan is not cheaper', () => {
    expect(savingsPercent([monthly])).toBeNull();
    expect(savingsPercent([monthly, { ...yearly, price: 700_000 }])).toBeNull();
  });
  it('ends a trial the right number of days later', () => {
    const end = trialEndDate(7, new Date('2026-01-01T00:00:00Z'));
    expect(end.toISOString()).toBe('2026-01-08T00:00:00.000Z');
  });
});
