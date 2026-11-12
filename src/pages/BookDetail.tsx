import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, money, type Book } from '../api';
import { useAuth, useTrialEligible } from '../auth';
import { CheckoutDialog, type CheckoutTarget } from '../components/Checkout';
import { AccessBadge, CheckIcon, Cover, ErrorPanel, LockIcon, Mascot, Spinner } from '../components/ui';
import { useAsync } from '../hooks/useAsync';

const REASON_COPY: Record<string, string> = {
  free: 'This story is free for everyone.',
  purchased: 'In your library. Yours to keep forever.',
  subscription: 'Included with your subscription.',
  admin: 'Staff access.',
};

export function BookDetail() {
  const { slug = '' } = useParams();
  const { me } = useAuth();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(() => api.book(slug), [slug]);
  const plans = useAsync(() => api.plans());
  const [checkout, setCheckout] = useState<CheckoutTarget | null>(null);
  const trialEligible = useTrialEligible();

  if (loading && !data) return <Spinner />;
  if (error?.status === 404) return <NotFound />;
  if (error || !data) return <ErrorPanel message={error?.message ?? 'Could not load this book'} onRetry={reload} />;
  const book: Book = data.book;
  const { access } = book;
  const yearly = plans.data?.plans.find((p) => p.id === 'yearly');

  /** Checkout needs an account; remember where to come back to. */
  const requireLogin = (then: () => void) => (me ? then() : navigate('/login', { state: { next: `/books/${book.slug}` } }));

  return (
    <article className="grid gap-8 md:grid-cols-[minmax(0,320px)_1fr] md:gap-12">
      <div className="mx-auto w-full max-w-xs md:max-w-none">
        <Cover book={book} className="shadow-[0_8px_0_var(--color-ink)]" />
      </div>

      <div>
        <Link to="/" className="text-sm font-bold text-ink-soft hover:text-primary">
          ← Library
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <AccessBadge book={book} currency="IDR" />
          {book.status !== 'published' && (
            <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-extrabold uppercase text-white">{book.status}</span>
          )}
        </div>
        <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">{book.title}</h1>
        <p className="mt-1 text-ink-soft">
          by {book.author} · Ages {book.ageMin}–{book.ageMax} · {book.pageCount} pages · {book.readingMinutes} min read-aloud
        </p>
        <p className="mt-5 max-w-prose text-lg leading-relaxed">{book.summary}</p>

        <div className="sticker mt-7 max-w-md space-y-3.5 rounded-[1.75rem] p-5">
          {access.canRead ? (
            <>
              <p className="flex items-center gap-2 font-bold text-mint">
                <CheckIcon /> {REASON_COPY[access.reason]}
              </p>
              <Link to={`/read/${book.slug}`} className="btn btn-sun w-full">
                Read now
              </Link>
              {access.reason === 'subscription' && access.canPurchase && (
                <button
                  className="w-full text-center text-sm font-bold text-primary underline-offset-2 hover:underline"
                  onClick={() => setCheckout({ kind: 'book', book })}
                >
                  Buy to keep forever · {money(book.price)}
                </button>
              )}
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 font-bold text-[#9a5b00]">
                <LockIcon /> Locked. Read {access.previewPages} pages free first.
              </p>
              <Link to={`/read/${book.slug}`} className="btn btn-ghost w-full">
                Read free preview
              </Link>
              <button className="btn btn-primary w-full" onClick={() => requireLogin(() => setCheckout({ kind: 'book', book }))}>
                Buy this book · {money(book.price)}
              </button>
              {yearly && (
                <button className="btn btn-sun w-full" onClick={() => navigate('/plans')}>
                  {trialEligible ? 'Try everything free for 7 days' : `Unlock everything from ${money(Math.round(yearly.price / 12))}/mo`}
                </button>
              )}
              <p className="text-center text-sm text-ink-soft">Buy it to keep it forever, or subscribe to read every book.</p>
            </>
          )}
        </div>
      </div>

      {checkout && (
        <CheckoutDialog
          target={checkout}
          onClose={() => setCheckout(null)}
          onSuccess={() => {
            setCheckout(null);
            navigate(`/read/${book.slug}`);
          }}
        />
      )}
    </article>
  );
}

export function NotFound() {
  return (
    <div className="py-20 text-center">
      <Mascot className="mx-auto size-28" mood="sleepy" />
      <h1 className="mt-3 text-3xl font-bold">We can’t find that page</h1>
      <p className="mt-1 text-ink-soft">The story may have moved or isn’t available.</p>
      <Link to="/" className="btn btn-primary mt-5">
        Back to the library
      </Link>
    </div>
  );
}
