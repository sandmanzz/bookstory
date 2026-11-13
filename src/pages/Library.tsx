import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Book } from '../api';
import { useAuth, useTrialEligible } from '../auth';
import { Avatar } from '../components/ProfileDialog';
import { AccessBadge, Cover, ErrorNote, Mascot, Spinner } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { listProgress } from '../lib/progress';
import { avatarOf } from '../lib/profiles';
import { useLanguage } from '../language';
import { bookTitle, LANG_CODE } from '../lib/i18n';
import { useProfiles } from '../profiles';

type Filter = 'all' | 'open' | 'locked';
const FILTERS: { id: Filter; label: string; icon: string }[] = [
  { id: 'all', label: 'All stories', icon: '📚' },
  { id: 'open', label: 'Ready to read', icon: '✅' },
  { id: 'locked', label: 'Locked', icon: '🔒' },
];
const AGE_BANDS = [
  { id: 'any', label: 'Any age', icon: '🌈', test: () => true },
  { id: 'tiny', label: '0–2', icon: '🍼', test: (b: Book) => b.ageMin <= 2 },
  { id: 'little', label: '3–4', icon: '🧸', test: (b: Book) => b.ageMin <= 4 && b.ageMax >= 3 },
  { id: 'big', label: '5+', icon: '🎒', test: (b: Book) => b.ageMax >= 5 },
] as const;
const TILT = ['-rotate-1', 'rotate-1', 'rotate-[.5deg]', '-rotate-[.5deg]'];

function BookCard({ book, i, note }: { book: Book; i: number; note?: string }) {
  const { lang } = useLanguage();
  const locked = !book.access.canRead;
  return (
    <li>
      <Link to={`/books/${book.slug}`} className="wiggle group block focus-visible:outline-offset-4">
        <div className={`relative transition duration-200 group-hover:-translate-y-1.5 ${TILT[i % TILT.length]}`}>
          <Cover book={book} className="shadow-[0_6px_0_var(--color-ink)]" />
          {locked && <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] bg-ink/10" aria-hidden />}
          <div className="absolute left-2.5 top-2.5">
            <AccessBadge book={book} currency="IDR" />
          </div>
          {book.status !== 'published' && (
            <span className="absolute right-2.5 top-2.5 rounded-full bg-ink px-2 py-1 text-[11px] font-extrabold uppercase text-white">
              {book.status}
            </span>
          )}
        </div>
        <h3 className="mt-4 text-xl font-semibold leading-tight">{bookTitle(book, lang)}</h3>
        <p className="text-sm font-bold text-ink-soft">
          {note ?? `Ages ${book.ageMin}–${book.ageMax} · ${book.readingMinutes} min`}
          {!note && book.languages.length > 1 && ` · ${book.languages.map((l) => LANG_CODE[l]).join('/')}`}
        </p>
      </Link>
    </li>
  );
}

function Hero({ freeSlug }: { freeSlug?: string }) {
  const trialEligible = useTrialEligible();
  return (
    <section className="sticker relative overflow-hidden rounded-[2.5rem] !bg-primary p-7 text-white sm:p-12">
      {/* night-sky scene: stars + clouds, purely decorative */}
      <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden preserveAspectRatio="none" viewBox="0 0 800 300">
        {[
          [60, 40],
          [190, 90],
          [330, 30],
          [470, 70],
          [560, 25],
          [700, 110],
          [120, 220],
          [640, 230],
        ].map(([x, y], n) => (
          <text key={n} x={x} y={y} fontSize={n % 2 ? 18 : 26} fill="#FFC93C" className="twinkle" style={{ animationDelay: `${n * 0.3}s` }}>
            ✦
          </text>
        ))}
        <g className="cloud" opacity=".95">
          <ellipse cx="640" cy="270" rx="120" ry="34" />
          <ellipse cx="700" cy="250" rx="70" ry="38" />
          <ellipse cx="560" cy="256" rx="60" ry="30" />
        </g>
      </svg>
      <div className="relative z-10 max-w-xl">
        <p className="inline-block rounded-full bg-sun px-3 py-1 font-display text-sm font-bold uppercase tracking-wider text-ink">
          Bedtime, sorted
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-[1.05] sm:text-6xl">Stories for little dreamers.</h1>
        <p className="mt-3 max-w-md text-lg text-white/90">
          Stories your child can touch, listen to and answer. Start with a free one, no sign-up needed.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={freeSlug ? `/read/${freeSlug}` : '#library'} className="btn btn-sun">
            📖 Read a free story
          </Link>
          <Link to="/plans" className="btn btn-ghost">
            {trialEligible ? 'Try 7 days free' : 'See plans'}
          </Link>
        </div>
      </div>
      <Mascot className="bob absolute -right-2 top-3 z-10 size-32 sm:right-10 sm:top-8 sm:size-52" mood="cheer" />
    </section>
  );
}

export function Library() {
  const { me } = useAuth();
  const { active, profileId, openPicker } = useProfiles();
  const { data, error, loading, reload } = useAsync(() => api.books());
  const [filter, setFilter] = useState<Filter>('all');
  const [ageChoice, setAgeChoice] = useState<string | null>(null);
  const [q, setQ] = useState('');

  // With a reader selected, "For <name>" is the default view; otherwise everything.
  const bands = useMemo(
    () => [
      ...(active
        ? [
            {
              id: 'mine',
              label: `For ${active.name}`,
              icon: avatarOf(active.avatar).emoji,
              test: (b: Book) => b.ageMin <= active.age && active.age <= b.ageMax,
            },
          ]
        : []),
      ...AGE_BANDS,
    ],
    [active],
  );
  const ageId = ageChoice && bands.some((b) => b.id === ageChoice) ? ageChoice : active ? 'mine' : 'any';

  const books = useMemo(() => {
    const ageTest = bands.find((b) => b.id === ageId)?.test ?? (() => true);
    return (data?.books ?? [])
      .filter((b) => filter === 'all' || (filter === 'open') === b.access.canRead)
      .filter(ageTest)
      .filter((b) => !q.trim() || `${b.title} ${b.summary}`.toLowerCase().includes(q.trim().toLowerCase()));
  }, [data, filter, ageId, bands, q]);

  // Books this reader started but has not finished. Read once per render of the shelf: cheap and always fresh.
  const continueReading = useMemo(() => {
    const progress = new Map(listProgress(profileId).map((p) => [p.slug, p.page]));
    return (data?.books ?? [])
      .filter((b) => b.access.canRead && (progress.get(b.slug) ?? 0) > 0 && (progress.get(b.slug) ?? 0) <= b.pageCount)
      .map((b) => ({ book: b, page: progress.get(b.slug) ?? 0 }));
  }, [data, profileId]);

  const freeSlug = data?.books.find((b) => b.price === 0 && b.access.canRead)?.slug;
  const subscribed = me?.subscription && me.subscription.state !== 'expired';
  const chip = (on: boolean) => `btn !min-h-11 shrink-0 !px-4 !text-base ${on ? 'btn-sun' : 'btn-ghost'}`;
  const greeting = active ? `Hi, ${active.name}!` : subscribed ? `Welcome back, ${me?.user.name.split(' ')[0]}!` : 'Pick a story';

  return (
    <div className="space-y-9">
      {!subscribed && <Hero freeSlug={freeSlug} />}

      {!active && (
        <section className="sticker flex flex-wrap items-center gap-4 rounded-card p-4 sm:p-5">
          <Mascot className="size-14 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold leading-tight">Who’s reading tonight?</p>
            <p className="text-sm text-ink-soft">
              Add your little one to get story suggestions for their age and keep their place and stars.
            </p>
          </div>
          <button className="btn btn-primary" onClick={openPicker}>
            Add a reader
          </button>
        </section>
      )}

      {continueReading.length > 0 && (
        <section aria-labelledby="continue">
          <h2 id="continue" className="mb-4 text-3xl font-bold">
            Keep reading
          </h2>
          <ul className="grid grid-cols-2 gap-x-5 gap-y-9 px-1 sm:grid-cols-3 lg:grid-cols-4">
            {continueReading.map(({ book, page }, i) => (
              <BookCard key={book.id} book={book} i={i} note={`Page ${page} of ${book.pageCount}`} />
            ))}
          </ul>
        </section>
      )}

      <section id="library" className="scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="mr-auto flex items-center gap-3 text-3xl font-bold sm:text-4xl">
            {active && <Avatar id={active.avatar} className="size-11 text-2xl" />}
            {greeting}
          </h2>
          <input
            type="search"
            aria-label="Search stories"
            placeholder="🔍 Search stories"
            className="field !w-56"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="mb-3 flex gap-2.5 overflow-x-auto px-1 pb-2" role="group" aria-label="Filter by age">
          {bands.map((a) => (
            <button key={a.id} aria-pressed={ageId === a.id} onClick={() => setAgeChoice(a.id)} className={chip(ageId === a.id)}>
              {a.icon && <span aria-hidden>{a.icon}</span>}
              {a.label}
            </button>
          ))}
        </div>
        <div className="mb-7 flex gap-2.5 overflow-x-auto px-1 pb-2" role="group" aria-label="Filter by access">
          {FILTERS.map((f) => (
            <button key={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={chip(filter === f.id)}>
              <span aria-hidden>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        {loading && !data && <Spinner label="Opening the library" />}
        {error && (
          <div className="space-y-3">
            <ErrorNote message={error.message} />
            <button className="btn btn-ghost" onClick={reload}>
              Try again
            </button>
          </div>
        )}
        {data && books.length === 0 && (
          <div className="sticker grid place-items-center gap-2 rounded-card p-8 text-center">
            <Mascot className="size-20" mood="sleepy" />
            <p className="font-display text-xl font-semibold">Nothing here yet</p>
            <p className="text-ink-soft">
              {filter === 'open' ? 'Subscribe or buy a book to fill this shelf.' : 'Try another age or search.'}
            </p>
          </div>
        )}
        <ul className="grid grid-cols-2 gap-x-5 gap-y-9 px-1 sm:grid-cols-3 lg:grid-cols-4">
          {books.map((b, i) => (
            <BookCard key={b.id} book={b} i={i} />
          ))}
        </ul>
      </section>
    </div>
  );
}
