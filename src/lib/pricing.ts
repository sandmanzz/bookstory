import type { Plan } from '../api';

const DAY_MS = 86_400_000;

/** What a plan costs per month, so monthly and yearly plans can be compared on one line. */
export const monthlyEquivalent = (plan: Plan): number => (plan.interval === 'year' ? Math.round(plan.price / 12) : plan.price);

/** How much cheaper the yearly plan is than twelve monthly payments, as a whole percent. Null if it cannot be computed. */
export function savingsPercent(plans: readonly Plan[]): number | null {
  const monthly = plans.find((p) => p.interval === 'month');
  const yearly = plans.find((p) => p.interval === 'year');
  if (!monthly || !yearly || monthly.price <= 0) return null;
  const saving = 1 - yearly.price / (monthly.price * 12);
  return saving > 0 ? Math.round(saving * 100) : null;
}

/** The date a trial that starts now will end (and the first charge happens). */
export const trialEndDate = (trialDays: number, now: Date = new Date()): Date => new Date(now.getTime() + trialDays * DAY_MS);

export const perInterval = (plan: Plan): string => (plan.interval === 'month' ? 'per month' : 'per year');
