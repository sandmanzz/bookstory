import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, useTrialEligible } from '../auth';
import { useProfiles } from '../profiles';
import { Avatar } from './ProfileDialog';
import { Mascot } from './ui';

const topLink =
  'rounded-full px-3.5 py-2 font-display text-base font-semibold text-ink hover:bg-white aria-[current=page]:bg-sun aria-[current=page]:shadow-[0_2px_0_var(--color-ink)] aria-[current=page]:ring-[2.5px] aria-[current=page]:ring-ink';
const tabLink =
  'flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 font-display text-xs font-semibold text-ink-soft aria-[current=page]:bg-sun aria-[current=page]:text-ink';

const firstName = (name: string) => name.split(' ')[0] ?? name;

function Tab({ to, icon, children }: { to: string; icon: string; children: ReactNode }) {
  return (
    <NavLink to={to} end={to === '/'} className={tabLink}>
      <span className="text-xl leading-none" aria-hidden>
        {icon}
      </span>
      {children}
    </NavLink>
  );
}

export function Layout() {
  const { me, logout } = useAuth();
  const navigate = useNavigate();
  const trialEligible = useTrialEligible();
  const { active, openPicker } = useProfiles();
  const subscribed = me?.subscription && me.subscription.state !== 'expired';
  const plansLabel = trialEligible ? 'Try free' : 'Subscribe';

  return (
    <div className="min-h-dvh pb-24 sm:pb-0">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-sky/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
          <Link to="/" className="mr-auto flex items-center gap-1.5 font-display text-2xl font-bold">
            <Mascot className="size-10" />
            <span>
              Main<span className="text-primary">Story</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
            <NavLink to="/" end className={topLink}>
              Library
            </NavLink>
            <NavLink to="/puzzles" className={topLink}>
              🧩 Puzzles
            </NavLink>
            {!subscribed && (
              <NavLink to="/plans" className={topLink}>
                {plansLabel}
              </NavLink>
            )}
            {me?.user.role === 'admin' && (
              <NavLink to="/admin" className={topLink}>
                Admin
              </NavLink>
            )}
            {me && (
              <NavLink to="/account" className={topLink}>
                {subscribed && <span aria-hidden>⭐ </span>}
                <span className="inline-block max-w-[9ch] truncate align-bottom">{firstName(me.user.name)}</span>
              </NavLink>
            )}
          </nav>

          <button
            type="button"
            onClick={openPicker}
            className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 font-display text-base font-semibold hover:bg-white"
            aria-label={active ? `Reading as ${active.name}. Change reader` : 'Add a reader'}
          >
            {active ? (
              <Avatar id={active.avatar} className="size-9 text-xl" />
            ) : (
              <span
                className="grid size-9 place-items-center rounded-full border-[3px] border-dashed border-ink bg-white/70 text-lg"
                aria-hidden
              >
                +
              </span>
            )}
            <span className="hidden max-w-[9ch] truncate sm:inline">{active ? active.name : 'Add reader'}</span>
          </button>

          {me ? (
            <button
              className={`${topLink} hidden sm:block`}
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Log out
            </button>
          ) : (
            <Link to="/login" className="btn btn-primary !min-h-10 !px-4 sm:!px-5">
              Log in
            </Link>
          )}
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-center text-sm text-ink-soft">
        MainStory demo · payments are simulated, no real money moves.
      </footer>

      {/* Phones: the main places live under the thumb. The reader is full-screen and covers this bar. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex gap-1 border-t-[3px] border-ink bg-cream/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:hidden"
      >
        <Tab to="/" icon="📚">
          Library
        </Tab>
        <Tab to="/puzzles" icon="🧩">
          Puzzles
        </Tab>
        {!subscribed && (
          <Tab to="/plans" icon={trialEligible ? '🎁' : '⭐'}>
            {plansLabel}
          </Tab>
        )}
        {me?.user.role === 'admin' && (
          <Tab to="/admin" icon="🛠️">
            Admin
          </Tab>
        )}
        <Tab to={me ? '/account' : '/login'} icon="👤">
          {me ? 'Account' : 'Log in'}
        </Tab>
      </nav>
    </div>
  );
}
