import type { Plan } from '../api';

const DAY_MS = 86_400_000;

/** Is a launch-offer price in effect for this plan right now? */
export const hasOffer = (plan: Plan): boolean => typeof plan.promoPrice === 'number';

/** The price of the first payment right now: the launch-offer price while the offer runs, else the regular price. */
export const effectivePrice = (plan: Plan): number => plan.promoPrice ?? plan.price;

const perMonth = (plan: Plan, price: number): number => (plan.interval === 'year' ? Math.round(price / 12) : price);

/** What a plan costs per month at today's price, so monthly and yearly plans can be compared on one line. */
export const monthlyEquivalent = (plan: Plan): number => perMonth(plan, effectivePrice(plan));

/** The same at the regular price (shown struck through next to an offer price). */
export const regularMonthlyEquivalent = (plan: Plan): number => perMonth(plan, plan.price);

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
