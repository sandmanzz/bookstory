import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api, ApiError, dateFmt, money } from '../api';
import { useAuth } from '../auth';
import { Cover, ErrorNote, Spinner } from '../components/ui';
import { useAsync } from '../hooks/useAsync';

export function Account() {
  const { me, loading, setMe, logout } = useAuth();
  const navigate = useNavigate();
  const books = useAsync(() => api.books());
  const history = useAsync(() => api.history());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <Spinner />;
  if (!me) return <Navigate to="/login" state={{ next: '/account' }} replace />;

  const sub = me.subscription;
  const owned = (books.data?.books ?? []).filter((b) => me.purchasedBookIds.includes(b.id));

  async function act(fn: () => Promise<typeof me>) {
    setBusy(true);
    setError(null);
    try {
      setMe((await fn())!);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-4xl font-bold">Hi, {me.user.name.split(' ')[0]}</h1>
        <p className="text-ink-soft">
          {me.user.email}
          {me.user.role === 'admin' && ' · Admin'}
        </p>
      </header>

      <section aria-labelledby="sub" className="sticker rounded-card p-5">
        <h2 id="sub" className="text-2xl font-bold">
          Subscription
        </h2>
        {(!sub || sub.state === 'expired') && (
          <div className="mt-2 space-y-3">
            <p className="text-ink-soft">
              {sub
                ? `Your ${sub.plan?.name.toLowerCase()} plan ended on ${dateFmt(sub.currentPeriodEnd)}. Books you bought are still yours.`
                : 'You’re on the free plan: free books plus previews.'}
            </p>
            <Link to="/plans" className="btn btn-primary">
              {sub ? 'Resubscribe' : 'See plans'}
            </Link>
          </div>
        )}
        {sub?.state === 'active' && (
          <div className="mt-2 space-y-3">
            {sub.trial ? (
              <p>
                <span className="rounded-full bg-sun px-2.5 py-1 text-xs font-extrabold">FREE TRIAL</span> Every story is unlocked until{' '}
                <b>{dateFmt(sub.currentPeriodEnd)}</b>. After that your <b>{sub.plan?.name.toLowerCase()}</b> plan starts at{' '}
                <b>{money(sub.nextAmount ?? sub.plan?.price ?? 0)}</b>
                {sub.nextAmount !== null && sub.plan && sub.nextAmount < sub.plan.price && ' (your launch-offer price, locked in)'}. Cancel
                before then and you pay nothing.
              </p>
            ) : (
              <p>
                <span className="rounded-full bg-mint-soft px-2.5 py-1 text-xs font-extrabold text-mint">ACTIVE</span>{' '}
                <b>{sub.plan?.name}</b> · renews {dateFmt(sub.currentPeriodEnd)}
              </p>
            )}
            <button className="btn btn-ghost" disabled={busy} onClick={() => act(api.cancel)}>
              {sub.trial ? 'Cancel trial' : 'Cancel subscription'}
            </button>
          </div>
        )}
        {sub?.state === 'ending' && (
          <div className="mt-2 space-y-3">
            <p>
              <span className="rounded-full bg-lock-soft px-2.5 py-1 text-xs font-extrabold text-[#9a5b00]">ENDING</span> You keep full
              access until <b>{dateFmt(sub.currentPeriodEnd)}</b>.{sub.trial && ' You won’t be charged.'}
            </p>
            <button className="btn btn-primary" disabled={busy} onClick={() => act(api.resume)}>
              Keep my subscription
            </button>
          </div>
        )}
        <div className="mt-3">
          <ErrorNote message={error} />
        </div>
      </section>

      <section aria-labelledby="owned">
        <h2 id="owned" className="mb-3 text-2xl font-bold">
          Books you own
        </h2>
        {owned.length === 0 ? (
          <p className="sticker rounded-card p-5 text-ink-soft">Nothing purchased yet.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4">
            {owned.map((b) => (
              <li key={b.id}>
                <Link to={`/books/${b.slug}`}>
                  <Cover book={b} />
                  <p className="mt-2 text-sm font-bold leading-tight">{b.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="pay">
        <h2 id="pay" className="mb-3 text-2xl font-bold">
          Payment history
        </h2>
        {history.data && history.data.payments.length === 0 && <p className="sticker rounded-card p-5 text-ink-soft">No payments yet.</p>}
        <ul className="divide-y divide-line overflow-hidden sticker rounded-card">
          {history.data?.payments.map((p) => {
            const title =
              p.kind === 'subscription' ? `Subscription (${p.refId})` : (books.data?.books.find((b) => b.id === p.refId)?.title ?? 'Book');
            return (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="text-sm text-ink-soft">
                    {dateFmt(p.createdAt)} · {p.last4 ? `card •••• ${p.last4}` : 'auto-renewal'}
                    {p.failureReason && ` · ${p.failureReason}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display font-semibold">{money(p.amount)}</p>
                  <p className={`text-xs font-extrabold uppercase ${p.status === 'succeeded' ? 'text-mint' : 'text-coral'}`}>{p.status}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <button
        className="btn btn-ghost w-full sm:w-auto"
        onClick={() => {
          logout();
          navigate('/');
        }}
      >
        Log out
      </button>
    </div>
  );
}
