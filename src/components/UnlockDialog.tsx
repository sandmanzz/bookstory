import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, money, type Book } from '../api';
import { useAuth, useTrialEligible } from '../auth';
import { useAsync } from '../hooks/useAsync';
import { bookTitle, t, type Lang } from '../lib/i18n';
import { CheckoutDialog, type CheckoutTarget } from './Checkout';
import { Cover, Dialog, LockIcon } from './ui';

interface Props {
  book: Book;
  /** Language for the title and labels. */
  lang: Lang;
  onClose: () => void;
}

/**
 * The payment pop-up for a locked book that someone tapped: buy just this book, or start the subscription. Payment itself
 * (parental gate, card) is the normal checkout dialog. Nothing here is automatic: it opens only when the book is tapped.
 */
export function UnlockDialog({ book, lang, onClose }: Props) {
  const { me } = useAuth();
  const navigate = useNavigate();
  const trialEligible = useTrialEligible();
  const plans = useAsync(() => api.plans());
  const [checkout, setCheckout] = useState<CheckoutTarget | null>(null);
  const plan = plans.data?.plans.find((p) => p.id === 'monthly') ?? plans.data?.plans[0];

  const logIn = () => navigate('/login', { state: { next: `/books/${book.slug}` } });
  const startReading = () => navigate(`/read/${book.slug}`);

  // One dialog at a time: while the checkout is open it replaces this one.
  if (checkout) {
    return (
      <CheckoutDialog
        target={checkout}
        onClose={() => setCheckout(null)}
        onSuccess={() => {
          onClose();
          startReading();
        }}
      />
    );
  }

  return (
    <Dialog title={`Unlock ${bookTitle(book, lang)}`} onClose={onClose}>
      <div className="flex items-center gap-4">
        <Cover book={book} className="w-20 shrink-0 !rounded-2xl" />
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1 rounded-full bg-lock-soft px-2.5 py-0.5 text-xs font-extrabold text-[#9a5b00]">
            <LockIcon className="size-3.5" /> {t(lang, 'unlockToRead')}
          </p>
          <h2 className="mt-1 text-2xl font-bold leading-tight">{bookTitle(book, lang)}</h2>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {!me ? (
          <>
            <p className="text-ink-soft">Log in (or sign up) first, then you can unlock this story.</p>
            <button className="btn btn-primary w-full" onClick={logIn}>
              Log in to continue
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-primary w-full" onClick={() => setCheckout({ kind: 'book', book })}>
              Buy this book · {money(book.price)}
            </button>
            <p className="-mt-1 text-center text-sm text-ink-soft">Yours to keep forever.</p>
            {plan && (
              <button className="btn btn-sun w-full" onClick={() => setCheckout({ kind: 'plan', plan })}>
                {trialEligible ? 'Try everything free for 7 days' : 'Subscribe for every story'}
              </button>
            )}
          </>
        )}
        <button className="btn btn-ghost w-full" onClick={onClose}>
          Not now
        </button>
      </div>
    </Dialog>
  );
}
