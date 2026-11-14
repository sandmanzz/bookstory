import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError, money } from '../../api';
import { Cover, Dialog, ErrorNote, Spinner, StatusPill } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';

interface Target {
  slug: string;
  title: string;
}

export function AdminList() {
  const { data, error, loading, reload } = useAsync(() => api.books());
  const [toDelete, setToDelete] = useState<Target | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      const { archived } = await api.deleteBook(toDelete.slug);
      setNotice(
        archived ? `“${toDelete.title}” has paying readers, so it was archived instead of deleted.` : `“${toDelete.title}” was deleted.`,
      );
      reload();
    } catch (e) {
      setFailure(e instanceof ApiError ? e.message : 'Delete failed');
    }
    setToDelete(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-3xl font-bold">Manage books</h1>
        <Link to="/admin/new" className="btn btn-primary">
          + New book
        </Link>
      </div>

      {notice && (
        <p role="status" className="rounded-xl bg-mint-soft px-4 py-3 font-bold text-mint">
          {notice}
        </p>
      )}
      <ErrorNote message={failure ?? error?.message ?? null} />
      {loading && !data && <Spinner />}

      <ul className="sticker divide-y divide-line overflow-hidden rounded-card">
        {data?.books.map((b) => (
          // On a phone the title row and the actions row stack; from `sm` up they sit on one line.
          <li key={b.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
            <Cover book={b} className="!aspect-square w-14 shrink-0 !rounded-xl [&>span]:!text-3xl" />
            <div className="min-w-0 flex-1 basis-40">
              <p className="truncate font-display text-lg font-semibold">{b.title}</p>
              <p className="text-sm text-ink-soft">
                {money(b.price)} · {b.pageCount} pages · ages {b.ageMin}–{b.ageMax}
              </p>
              {/* On a phone the status sits under the title so the three buttons can share one row. */}
              <div className="mt-1.5 sm:hidden">
                <StatusPill status={b.status} />
              </div>
            </div>
            <div className="grid w-full grid-cols-3 items-center gap-2 sm:flex sm:w-auto sm:gap-3">
              <span className="hidden sm:block">
                <StatusPill status={b.status} />
              </span>
              {/* A new tab keeps this list where it is. Admins can read drafts, so this works before a book is published. */}
              <Link
                to={`/read/${b.slug}`}
                target="_blank"
                rel="noopener"
                className="btn btn-ghost !min-h-10 !px-2 sm:!px-4"
                aria-label={`Preview ${b.title} (opens in a new tab)`}
              >
                Preview
              </Link>
              <Link to={`/admin/${b.slug}`} className="btn btn-ghost !min-h-10 !px-2 sm:!px-4">
                Edit
              </Link>
              <button
                className="btn btn-ghost !min-h-10 !px-2 sm:!px-4"
                aria-label={`Delete ${b.title}`}
                onClick={() => {
                  setNotice(null);
                  setFailure(null);
                  setToDelete({ slug: b.slug, title: b.title });
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {toDelete && (
        <Dialog title="Delete book" onClose={() => setToDelete(null)}>
          <h2 className="text-2xl font-bold">Delete “{toDelete.title}”?</h2>
          <p className="mt-2 text-ink-soft">
            If anyone has bought it, we’ll archive it instead so they keep access. Otherwise it’s removed for good.
          </p>
          <div className="mt-5 flex gap-3">
            <button className="btn btn-ghost flex-1" onClick={() => setToDelete(null)}>
              Keep
            </button>
            <button className="btn btn-danger flex-1" onClick={confirmDelete}>
              Delete
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
