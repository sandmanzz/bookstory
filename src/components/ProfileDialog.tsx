import { useState } from 'react';
import { useProfiles } from '../profiles';
import { AVATARS, MAX_AGE, MAX_NAME_LENGTH, MAX_PROFILES, avatarOf } from '../lib/profiles';
import { Dialog, ErrorNote } from './ui';

export function Avatar({ id, className = 'size-12 text-2xl' }: { id: string; className?: string }) {
  const a = avatarOf(id);
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border-[3px] border-ink ${className}`}
      style={{ background: a.color }}
      aria-hidden
    >
      {a.emoji}
    </span>
  );
}

/** "Who's reading?": pick a reader, or add one. Progress and stars are kept per reader, on this device only. */
export function ProfileDialog({ onClose }: { onClose: () => void }) {
  const { profiles, active, add, remove, select } = useProfiles();
  const [adding, setAdding] = useState(profiles.length === 0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string>(AVATARS[0].id);
  const [age, setAge] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = add({ name, avatar, age });
    if (problem) return setError(problem);
    setName('');
    setError(null);
    setAdding(false);
    onClose();
  }

  return (
    <Dialog title="Who's reading?" onClose={onClose}>
      <h2 className="text-center text-2xl font-bold">Who’s reading?</h2>

      {profiles.length > 0 && (
        <ul className="mt-4 space-y-2">
          {profiles.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => select(p.id)}
                aria-pressed={active?.id === p.id}
                className={`sticker flex flex-1 items-center gap-3 rounded-2xl p-2 pr-4 text-left transition hover:-translate-y-0.5 ${active?.id === p.id ? '!bg-sun' : ''}`}
              >
                <Avatar id={p.avatar} />
                <span>
                  <span className="block font-display text-lg font-semibold leading-tight">{p.name}</span>
                  <span className="text-sm font-bold text-ink-soft">Age {p.age}</span>
                </span>
              </button>
              {removing === p.id ? (
                <button
                  type="button"
                  className="btn btn-danger !min-h-11 !px-3 !text-sm"
                  onClick={() => {
                    remove(p.id);
                    setRemoving(null);
                  }}
                >
                  Remove?
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost !min-h-11 !px-3"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => setRemoving(p.id)}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="reader-name" className="label">
              Name
            </label>
            <input
              id="reader-name"
              className="field"
              maxLength={MAX_NAME_LENGTH + 5}
              autoFocus
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <fieldset>
            <legend className="label">Pick a picture</legend>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-label={a.id}
                  aria-pressed={avatar === a.id}
                  onClick={() => setAvatar(a.id)}
                  className={`rounded-full ${avatar === a.id ? 'ring-4 ring-primary ring-offset-2' : ''}`}
                >
                  <Avatar id={a.id} />
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="reader-age" className="label">
              Age (we use it to suggest the right stories)
            </label>
            <select id="reader-age" className="field" value={age} onChange={(e) => setAge(Number(e.target.value))}>
              {Array.from({ length: MAX_AGE + 1 }, (_, n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <ErrorNote message={error} />
          <button className="btn btn-primary w-full">Add reader</button>
        </form>
      ) : (
        profiles.length < MAX_PROFILES && (
          <button type="button" className="btn btn-ghost mt-4 w-full" onClick={() => setAdding(true)}>
            + Add a reader
          </button>
        )
      )}

      <p className="mt-4 text-center text-sm text-ink-soft">
        🔒 Names and progress stay on this device. We never send your child’s details to our servers.
      </p>
    </Dialog>
  );
}
