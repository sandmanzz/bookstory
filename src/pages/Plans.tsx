import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, money, type Plan } from '../api';
import { useAuth, useTrialEligible } from '../auth';
import { CheckoutDialog } from '../components/Checkout';
import { CheckIcon, ErrorPanel, Spinner } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { PromoBanner } from '../components/PromoBanner';
import { effectivePrice, hasOffer, monthlyEquivalent, regularMonthlyEquivalent, savingsPercent } from '../lib/pricing';

const PERKS = ['Every story, unlocked', 'New books as they’re added', 'Cancel anytime in two taps', 'Books you buy stay yours, always'];

export function Plans() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(() => api.plans());
  const [picked, setPicked] = useState<Plan | null>(null);
  const state = me?.subscription?.state;
  const trialEligible = useTrialEligible();
  const trialDays = me?.trialDays ?? 7;

  if (loading && !data) return <Spinner />;
  if (error || !data) return <ErrorPanel message={error?.message ?? 'Could not load plans'} onRetry={reload} />;
  const saving = savingsPercent(data.plans);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold sm:text-5xl">One plan, every story.</h1>
        <p className="mt-2 text-lg text-ink-soft">Or skip the subscription and just buy the books you love.</p>
        {trialEligible && !state && (
          <p className="mx-auto mt-4 inline-block rounded-full border-[3px] border-ink bg-sun px-4 py-2 font-display font-bold shadow-[0_3px_0_var(--color-ink)]">
            🎁 Try everything free for {trialDays} days. Cancel any time and pay nothing.
          </p>
        )}
      </header>

      {(state === 'active' || state === 'ending') && (
        <p className="rounded-card bg-mint-soft p-4 text-center font-bold text-mint">
          You’re already subscribed.{' '}
          <Link to="/account" className="underline">
            Manage plan
          </Link>
        </p>
      )}

      {data.promo && !(state === 'active' || state === 'ending') && (
        <div className="space-y-2">
          <PromoBanner promo={data.promo} serverNow={data.now} onExpire={reload} />
          <p className="text-center text-sm text-ink-soft">
            The offer applies to your first payment only. After that your plan renews at the regular price, and you can cancel any time.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {data.plans.map((p) => {
          const best = p.interval === 'year';
          const offer = hasOffer(p);
          return (
            <section key={p.id} className={`sticker relative rounded-card p-6 ${best ? '!bg-[#efeaff]' : ''}`}>
              {best && (
                <span className="absolute -top-3 left-5 rounded-full border-[2.5px] border-ink bg-sun px-3 py-1 text-xs font-extrabold uppercase">
                  {saving ? `Save ${saving}%` : 'Best value'}
                </span>
              )}
              <h2 className="text-2xl font-bold">{p.name}</h2>
              <p className="text-sm text-ink-soft">{p.tagline}</p>
              <p className="mt-4 font-display text-4xl font-bold">
                {money(monthlyEquivalent(p))}
                <span className="text-base font-medium text-ink-soft"> /month</span>
              </p>
              {offer && (
                <p className="text-sm text-ink-soft">
                  <s>{money(regularMonthlyEquivalent(p))}</s> /month regular price
                </p>
              )}
              <p className="min-h-5 text-sm text-ink-soft">
                {trialEligible && 'Free for the first week, then '}
                {offer
                  ? `${money(effectivePrice(p))} for your first ${best ? 'year' : 'month'}, then ${money(p.price)}`
                  : best
                    ? `${money(p.price)} per year`
                    : 'billed monthly'}
              </p>
              <ul className="my-5 space-y-2">
                {PERKS.map((t) => (
                  <li key={t} className="flex gap-2 text-[15px]">
                    <CheckIcon className="mt-1 size-4 shrink-0 text-mint" />
                    {t}
                  </li>
                ))}
              </ul>
              <button
                className={`btn w-full ${best ? 'btn-primary' : 'btn-ghost'}`}
                disabled={state === 'active' || state === 'ending'}
                onClick={() => (me ? setPicked(p) : navigate('/login', { state: { next: '/plans' } }))}
              >
                {trialEligible ? `Start ${trialDays}-day free trial` : `Choose ${p.name.toLowerCase()}`}
              </button>
            </section>
          );
        })}
      </div>

      <section aria-labelledby="which" className="sticker rounded-card p-5 sm:p-6">
        <h2 id="which" className="text-2xl font-bold">
          Not sure which is right for you?
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold">🌙 Subscribe</h3>
            <p className="text-ink-soft">
              Best if you read most nights. Every book is unlocked, including new ones, and you can cancel any time.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">📕 Buy one book</h3>
            <p className="text-ink-soft">
              Best for a favourite you’ll read again and again. It’s yours forever, even if you never subscribe.
            </p>
          </div>
        </div>
      </section>

      {picked && <CheckoutDialog target={{ kind: 'plan', plan: picked }} onClose={() => setPicked(null)} onSuccess={() => navigate('/')} />}
    </div>
  );
}
