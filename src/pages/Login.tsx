import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api';
import { useAuth } from '../auth';
import { ErrorNote, Mascot } from '../components/ui';

const DEMO = [
  { email: 'parent@mainstory.test', title: 'Parent', note: 'No subscription — see locked & buy flows' },
  { email: 'subscriber@mainstory.test', title: 'Subscriber', note: 'Everything unlocked' },
  { email: 'admin@mainstory.test', title: 'Admin', note: 'Manage books' },
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const next = (useLocation().state as { next?: string } | null)?.next ?? '/';
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(addr: string) {
    setBusy(true);
    setError(null);
    try {
      await login(addr);
      navigate(next, { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? (e.details?.[0]?.message ?? e.message) : 'Could not log in');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-4">
      <header className="text-center">
        <Mascot className="bob mx-auto size-24" mood="cheer" />
        <h1 className="mt-2 text-3xl font-bold">Welcome to MainStory</h1>
        <p className="text-ink-soft">Log in with any email. New emails create an account.</p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(email);
        }}
        className="space-y-3 sticker rounded-card p-5"
      >
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <ErrorNote message={error} />
        <button className="btn btn-primary w-full" disabled={busy || !email}>
          {busy ? 'Logging in…' : 'Continue'}
        </button>
      </form>

      <section aria-labelledby="demo">
        <h2 id="demo" className="mb-2 text-center text-sm font-bold uppercase tracking-wide text-ink-soft">
          Or try a demo account
        </h2>
        <ul className="space-y-2">
          {DEMO.map((d) => (
            <li key={d.email}>
              <button
                disabled={busy}
                onClick={() => void submit(d.email)}
                className="flex w-full items-center justify-between sticker rounded-2xl px-4 py-3 text-left transition hover:-translate-y-0.5"
              >
                <span>
                  <span className="block font-display text-lg font-semibold">{d.title}</span>
                  <span className="text-sm text-ink-soft">{d.note}</span>
                </span>
                <span aria-hidden className="text-xl">
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
