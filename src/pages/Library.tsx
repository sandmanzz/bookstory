import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Book } from '../api';
import { useAuth, useTrialEligible } from '../auth';
import { Avatar } from '../components/ProfileDialog';
import { PromoBanner } from '../components/PromoBanner';
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
    <section className="sticker relative overflow-hidden rounded-[2.5rem] !bg-primary text-white sm:min-h-[30rem]">
      {/* Artwork: on phones it sits under the text, from sm up it fills the card and the text rides on the calm left side. */}
      <img
        src="/landing/hero.jpg"
        alt="Moon, Little Star, a boy and a sleepy dragon on a hill, and a little red boat on the sea, in a purple night sky."
        width={1920}
        height={1086}
        fetchPriority="high"
        className="order-2 block aspect-[16/9] w-full object-cover object-right sm:absolute sm:inset-0 sm:aspect-auto sm:size-full"
      />
      {/* Soft purple fade so the headline stays readable over the artwork (desktop only). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[62%] bg-gradient-to-r from-primary via-primary/80 to-transparent sm:block"
      />
      <div className="relative z-10 flex flex-col p-7 sm:max-w-[52%] sm:p-12">
        <p className="inline-block self-start rounded-full bg-sun px-3 py-1 font-display text-sm font-bold uppercase tracking-wider text-ink">
          Bedtime, sorted
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-[1.05] sm:text-6xl">Stories for little dreamers.</h1>
        <p className="mt-3 max-w-md text-lg text-white/90">
          Stories your child can touch, listen to and answer, in English and Indonesian. Start with a free one, no sign-up needed.
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
    </section>
  );
}

const FEATURES = [
  {
    img: '/landing/touch.jpg',
    title: 'Touch, tap, answer',
    text: 'Stickers hop and say “Quack!”, and every page can ask a gentle question. There is no failing, only another try.',
    alt: 'A girl in a yellow raincoat tapping a glowing star sticker on an open storybook.',
  },
  {
    img: '/landing/bedtime.jpg',
    title: 'Made for bedtime',
    text: 'Auto read turns the pages for you in a calm voice. Tap any word to hear it, in English or Indonesian.',
    alt: 'A boy in bed with a glowing picture book and a sleepy dragon peeking from the pillow.',
  },
  {
    img: '/landing/puzzle.jpg',
    title: 'Finish a story, find a puzzle',
    text: 'Every finished book gives the story’s own picture as a puzzle. No points, no timers, no pressure.',
    alt: 'A smiling star holding a half-finished moon jigsaw puzzle.',
  },
];

function Features() {
  return (
    <section aria-labelledby="why" className="space-y-5">
      <h2 id="why" className="text-3xl font-bold sm:text-4xl">
        Why little ones love it
      </h2>
      <ul className="grid gap-5 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <li key={f.title} className="sticker flex flex-col overflow-hidden rounded-card">
            <img
              src={f.img}
              alt={f.alt}
              width={640}
              height={640}
              loading="lazy"
              className="aspect-square w-full border-b-[3px] border-ink object-cover"
            />
            <div className="p-5">
              <h3 className="font-display text-xl font-semibold leading-tight">{f.title}</h3>
              <p className="mt-1.5 text-ink-soft">{f.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Library() {
  const { me } = useAuth();
  const { active, profileId, openPicker } = useProfiles();
  const { data, error, loading, reload } = useAsync(() => api.books());
  const plans = useAsync(() => api.plans()); // only for the launch offer; a failure here just hides the banner
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
      {!subscribed && plans.data?.promo && <PromoBanner promo={plans.data.promo} serverNow={plans.data.now} onExpire={plans.reload} cta />}
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

      {!subscribed && <Features />}
    </div>
  );
}
