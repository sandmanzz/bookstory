import { useMemo, useState } from 'react';
import { createChallenge, isCorrect } from '../lib/parentalGate';
import { perInterval, trialEndDate } from '../lib/pricing';
import { api, ApiError, money, type Book, type Card, type Plan } from '../api';
import { useAuth } from '../auth';
import { CheckIcon, Dialog, ErrorNote } from './ui';

export type CheckoutTarget = { kind: 'book'; book: Book } | { kind: 'plan'; plan: Plan };

const TEST_CARDS: { label: string; number: string }[] = [
  { label: 'Works', number: '4242 4242 4242 4242' },
  { label: 'Declined', number: '4000 0000 0000 0002' },
  { label: 'No funds', number: '4000 0000 0000 9995' },
];

/** Parental gate: a quick grown-up check before any money screen (standard for kids' products). */
function ParentalGate({ onPass }: { onPass: () => void }) {
  const [{ a, b }] = useState(() => createChallenge());
  const [v, setV] = useState('');
  const [wrong, setWrong] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isCorrect({ a, b }, v)) return onPass();
    setWrong(true);
    setV('');
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-center">
        <div className="text-5xl" aria-hidden>
          🔐
        </div>
        <h2 className="mt-2 text-2xl font-bold">Grown-ups only</h2>
        <p className="mt-1 text-ink-soft">Please solve this to continue to checkout.</p>
      </div>
      <div>
        <label htmlFor="gate" className="label text-center text-lg">
          What is {a} × {b}?
        </label>
        <input
          id="gate"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          className="field text-center font-display text-2xl"
          value={v}
          onChange={(e) => {
            setV(e.target.value.replace(/\D/g, ''));
            setWrong(false);
          }}
        />
      </div>
      {wrong && <ErrorNote message="Not quite. Try again." />}
      <button className="btn btn-primary w-full" disabled={!v}>
        Continue
      </button>
    </form>
  );
}

export function CheckoutDialog({ target, onClose, onSuccess }: { target: CheckoutTarget; onClose: () => void; onSuccess: () => void }) {
  const { me, setMe } = useAuth();
  const [step, setStep] = useState<'gate' | 'pay' | 'done'>('gate');
  const [card, setCard] = useState<Card>({ number: '4242 4242 4242 4242', exp: '12/39', cvc: '123' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // One idempotency key per dialog: a double-click or retry can never charge twice.
  const idemKey = useMemo(() => crypto.randomUUID(), []);

  // Decided once when the dialog opens: after a successful signup `trialEligible` flips to false, but this dialog must keep saying "trial".
  const [trial] = useState(() => target.kind === 'plan' && Boolean(me?.trialEligible));
  const trialDays = me?.trialDays ?? 7;
  const firstCharge = trialEndDate(trialDays).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  const plan = target.kind === 'plan' ? target.plan : null;
  const title = target.kind === 'book' ? target.book.title : trial ? `Start your ${trialDays}-day free trial` : `${target.plan.name} plan`;
  const due = trial ? 0 : target.kind === 'book' ? target.book.price : target.plan.price;
  const sub =
    target.kind === 'book'
      ? 'One-time purchase · yours to keep forever'
      : trial
        ? `Then ${money(target.plan.price)} ${perInterval(target.plan)} from ${firstCharge}. Cancel before then and you pay nothing.`
        : `Unlimited stories · ${target.plan.interval === 'month' ? 'renews monthly' : 'renews yearly'}, cancel anytime`;

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const me =
        target.kind === 'book' ? await api.buy(target.book.slug, card, idemKey) : await api.subscribe(target.plan.id, card, idemKey);
      setMe(me);
      setStep('done');
    } catch (err) {
      setError(err instanceof ApiError ? (err.details?.[0] ? `${err.details[0].message}` : err.message) : 'Payment failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title="Checkout" onClose={onClose}>
      {step === 'gate' && <ParentalGate onPass={() => setStep('pay')} />}

      {step === 'pay' && (
        <form onSubmit={pay} className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-sm text-ink-soft">{sub}</p>
            <p className="mt-2 font-display text-3xl font-bold text-primary">{trial ? 'Rp 0 today' : money(due)}</p>
            {trial && plan && <p className="text-sm font-bold text-ink-soft">Your card is checked now, not charged.</p>}
          </div>
          <div className="rounded-2xl bg-lock-soft p-3 text-sm">
            <p className="font-bold">Demo mode — no real payment</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TEST_CARDS.map((t) => (
                <button
                  type="button"
                  key={t.label}
                  className="rounded-full border-2 border-[#f0d9a8] bg-white px-3 py-1 text-xs font-bold hover:border-primary"
                  onClick={() => setCard({ ...card, number: t.number })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="cn">
              Card number
            </label>
            <input
              id="cn"
              className="field"
              inputMode="numeric"
              autoComplete="off"
              value={card.number}
              onChange={(e) => setCard({ ...card, number: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="ce">
                Expiry (MM/YY)
              </label>
              <input
                id="ce"
                className="field"
                placeholder="MM/YY"
                autoComplete="off"
                value={card.exp}
                onChange={(e) => setCard({ ...card, exp: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="cc">
                CVC
              </label>
              <input
                id="cc"
                className="field"
                inputMode="numeric"
                autoComplete="off"
                value={card.cvc}
                onChange={(e) => setCard({ ...card, cvc: e.target.value })}
              />
            </div>
          </div>
          <ErrorNote message={error} />
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? 'Processing…' : trial ? 'Start free trial' : `Pay ${money(due)}`}
          </button>
          <button type="button" className="btn btn-ghost w-full" onClick={onClose}>
            Cancel
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="space-y-4 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-mint-soft text-mint">
            <CheckIcon className="size-8" />
          </div>
          <h2 className="text-2xl font-bold">
            {target.kind === 'book' ? 'It’s yours!' : trial ? 'Your trial has started!' : 'Welcome aboard!'}
          </h2>
          <p className="text-ink-soft">
            {target.kind === 'book'
              ? `“${title}” is now in your library.`
              : trial
                ? `Every story is unlocked. You won’t be charged until ${firstCharge}, and you can cancel any time before.`
                : 'Every story is now unlocked.'}
          </p>
          <button className="btn btn-sun w-full" onClick={onSuccess}>
            {target.kind === 'book' ? 'Start reading' : 'Explore the library'}
          </button>
        </div>
      )}
    </Dialog>
  );
}
