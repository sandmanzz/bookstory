import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError, type BookDraft } from '../../api';
import { Cover, ErrorNote, Spinner } from '../../components/ui';
import { ActivityEditor } from './ActivityEditor';

type DraftPage = BookDraft['pages'][number];
type NumberField = 'ageMin' | 'ageMax' | 'price' | 'previewPages' | 'readingMinutes';

const EMPTY_PAGE: DraftPage = { text: '', emoji: '✨', imageUrl: null, activity: null };
const EMPTY_BOOK: BookDraft = {
  title: '',
  author: 'Main Story Studio',
  summary: '',
  ageMin: 2,
  ageMax: 5,
  price: 35000,
  status: 'draft',
  previewPages: 2,
  coverEmoji: '📘',
  coverUrl: null,
  coverFrom: '#4B3FCB',
  coverTo: '#9B8CFF',
  readingMinutes: 3,
  pages: [EMPTY_PAGE],
};

function Field({
  id,
  label,
  error,
  className = '',
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-sm font-bold text-[#a5311a]">{error}</p>}
    </div>
  );
}

export function AdminForm() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<BookDraft | null>(slug ? null : EMPTY_BOOK);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let live = true;
    api.adminBook(slug).then(
      // The API echoes id/slug too; they are not editable fields.
      ({ book: { id: _id, slug: _slug, ...rest } }) => live && setDraft(rest),
      (e: ApiError) => live && setError(e.message),
    );
    return () => {
      live = false;
    };
  }, [slug]);

  if (!draft) return error ? <ErrorNote message={error} /> : <Spinner />;

  const set = <K extends keyof BookDraft>(key: K, value: BookDraft[K]) => setDraft({ ...draft, [key]: value });
  const setNumber = (key: NumberField) => (e: ChangeEvent<HTMLInputElement>) => set(key, Number(e.target.value));
  const setPages = (pages: DraftPage[]) => set('pages', pages);
  const patchPage = (i: number, patch: Partial<DraftPage>) => setPages(draft.pages.map((p, n) => (n === i ? { ...p, ...patch } : p)));
  const movePage = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= draft.pages.length) return;
    const pages = [...draft.pages];
    [pages[i], pages[j]] = [pages[j]!, pages[i]!];
    setPages(pages);
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      if (slug) await api.updateBook(slug, draft);
      else await api.createBook(draft);
      navigate('/admin');
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setFieldErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
        setError('Please fix the highlighted fields.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Could not save');
      }
    } finally {
      setBusy(false);
    }
  }

  const err = (field: string) => fieldErrors[field];
  /** The first validation message anywhere inside page `i`'s activity (stickers or question). */
  const activityError = (i: number) => Object.entries(fieldErrors).find(([field]) => field.startsWith(`pages.${i}.activity`))?.[1];

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin" className="text-sm font-bold text-ink-soft hover:text-primary">
          ← Books
        </Link>
        <h1 className="text-3xl font-bold">{slug ? 'Edit book' : 'New book'}</h1>
      </div>

      <section className="sticker grid gap-4 rounded-card p-5 sm:grid-cols-2">
        <Field id="title" label="Title" error={err('title')} className="sm:col-span-2">
          <input id="title" className="field" required value={draft.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field id="author" label="Author" error={err('author')}>
          <input id="author" className="field" required value={draft.author} onChange={(e) => set('author', e.target.value)} />
        </Field>
        <Field id="status" label="Status">
          <select id="status" className="field" value={draft.status} onChange={(e) => set('status', e.target.value as BookDraft['status'])}>
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <Field id="summary" label="Summary" error={err('summary')} className="sm:col-span-2">
          <textarea
            id="summary"
            rows={3}
            className="field"
            required
            value={draft.summary}
            onChange={(e) => set('summary', e.target.value)}
          />
        </Field>
        <Field id="price" label="Price (IDR, 0 = free)" error={err('price')}>
          <input id="price" type="number" min={0} step={1000} className="field" value={draft.price} onChange={setNumber('price')} />
        </Field>
        <Field id="preview" label="Free preview pages" error={err('previewPages')}>
          <input id="preview" type="number" min={0} className="field" value={draft.previewPages} onChange={setNumber('previewPages')} />
        </Field>
        <Field id="ageMin" label="Age from">
          <input id="ageMin" type="number" min={0} max={12} className="field" value={draft.ageMin} onChange={setNumber('ageMin')} />
        </Field>
        <Field id="ageMax" label="Age to" error={err('ageMax')}>
          <input id="ageMax" type="number" min={0} max={12} className="field" value={draft.ageMax} onChange={setNumber('ageMax')} />
        </Field>
        <Field id="minutes" label="Read-aloud minutes">
          <input id="minutes" type="number" min={1} className="field" value={draft.readingMinutes} onChange={setNumber('readingMinutes')} />
        </Field>
        <Field id="coverUrl" label="Cover image (path or https URL, optional)" error={err('coverUrl')}>
          <input
            id="coverUrl"
            className="field"
            placeholder="/stories/my-book/cover.jpg"
            value={draft.coverUrl ?? ''}
            onChange={(e) => set('coverUrl', e.target.value || null)}
          />
        </Field>
        <div className="flex items-end gap-3 sm:col-span-2">
          <Field id="emoji" label="Fallback emoji" className="w-28">
            <input
              id="emoji"
              className="field text-center text-xl"
              value={draft.coverEmoji}
              onChange={(e) => set('coverEmoji', e.target.value)}
            />
          </Field>
          <Field id="from" label="From">
            <input
              id="from"
              type="color"
              className="h-12 w-14 rounded-lg border-2 border-line"
              value={draft.coverFrom}
              onChange={(e) => set('coverFrom', e.target.value)}
            />
          </Field>
          <Field id="to" label="To">
            <input
              id="to"
              type="color"
              className="h-12 w-14 rounded-lg border-2 border-line"
              value={draft.coverTo}
              onChange={(e) => set('coverTo', e.target.value)}
            />
          </Field>
          <Cover book={{ ...draft }} className="!aspect-square w-14 !rounded-xl [&>span]:!text-3xl" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">
          Pages <span className="text-base font-medium text-ink-soft">({draft.pages.length})</span>
        </h2>
        {err('pages') && <p className="text-sm font-bold text-[#a5311a]">{err('pages')}</p>}
        {draft.pages.map((p, i) => (
          <div key={i} className="sticker flex gap-2 rounded-card p-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cream font-display font-bold">{i + 1}</span>
            <input
              aria-label={`Page ${i + 1} emoji`}
              className="field !w-16 text-center text-xl"
              value={p.emoji}
              onChange={(e) => patchPage(i, { emoji: e.target.value })}
            />
            <div className="flex flex-1 flex-col gap-1.5">
              <textarea
                aria-label={`Page ${i + 1} text`}
                rows={2}
                className="field"
                value={p.text}
                onChange={(e) => patchPage(i, { text: e.target.value })}
              />
              <input
                aria-label={`Page ${i + 1} image`}
                className="field !py-1.5 text-sm"
                placeholder="Image path (optional) /stories/my-book/p1.jpg"
                value={p.imageUrl ?? ''}
                onChange={(e) => patchPage(i, { imageUrl: e.target.value || null })}
              />
              {err(`pages.${i}.imageUrl`) && <p className="text-sm font-bold text-[#a5311a]">{err(`pages.${i}.imageUrl`)}</p>}
              <ActivityEditor value={p.activity} onChange={(activity) => patchPage(i, { activity })} error={activityError(i)} />
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                className="btn btn-ghost !min-h-8 !px-2.5 !py-0"
                onClick={() => movePage(i, -1)}
                aria-label={`Move page ${i + 1} up`}
              >
                ↑
              </button>
              <button
                type="button"
                className="btn btn-ghost !min-h-8 !px-2.5 !py-0"
                onClick={() => movePage(i, 1)}
                aria-label={`Move page ${i + 1} down`}
              >
                ↓
              </button>
            </div>
            <button
              type="button"
              className="btn btn-ghost !min-h-10 !px-3"
              onClick={() => setPages(draft.pages.filter((_, n) => n !== i))}
              aria-label={`Remove page ${i + 1}`}
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost" onClick={() => setPages([...draft.pages, EMPTY_PAGE])}>
          + Add page
        </button>
      </section>

      <ErrorNote message={error} />
      <div className="sticky bottom-3 flex gap-3 rounded-full bg-cream/90 p-2 backdrop-blur">
        <Link to="/admin" className="btn btn-ghost flex-1">
          Cancel
        </Link>
        <button className="btn btn-primary flex-[2]" disabled={busy}>
          {busy ? 'Saving…' : 'Save book'}
        </button>
      </div>
    </form>
  );
}
