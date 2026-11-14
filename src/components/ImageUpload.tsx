import { useId, useRef, useState, type DragEvent } from 'react';
import { api, ApiError, imageUrl } from '../api';
import { ImageError, shrinkImage } from '../lib/shrinkImage';

type Status = { kind: 'idle' } | { kind: 'busy'; text: string } | { kind: 'error'; text: string };

/**
 * Pick a picture from the computer (or drop one on the box), see it at once, and replace or remove it later.
 * The file is shrunk in the browser, uploaded to the API, and `onChange` receives the stored path (or null).
 */
export function ImageUpload({
  label,
  value,
  onChange,
  shape,
  error,
}: {
  label: string;
  value: string | null;
  onChange: (path: string | null) => void;
  /** The frame the picture is shown in, so the preview matches what readers see. */
  shape: 'cover' | 'page';
  error?: string;
}) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [dragging, setDragging] = useState(false);
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const busy = status.kind === 'busy';
  const src = imageUrl(value);
  const showBroken = Boolean(src) && brokenSrc === src;
  const hasPicture = Boolean(src) && !showBroken;

  async function handle(file: File | undefined) {
    if (!file || busy) return;
    try {
      setStatus({ kind: 'busy', text: 'Preparing the picture…' });
      const small = await shrinkImage(file);
      setStatus({ kind: 'busy', text: 'Uploading…' });
      const { url } = await api.uploadImage(small);
      onChange(url);
      setStatus({ kind: 'idle' });
    } catch (e) {
      const text = e instanceof ImageError || e instanceof ApiError ? e.message : 'The upload failed. Try again.';
      setStatus({ kind: 'error', text });
    } finally {
      if (input.current) input.current.value = ''; // picking the same file again must still fire
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void handle(e.dataTransfer.files[0]);
  }

  const frame = shape === 'cover' ? 'aspect-[4/5] w-24' : 'aspect-[4/3] w-32';
  const problem = status.kind === 'error' ? status.text : error;

  return (
    <div className="space-y-1.5">
      <p className="label" id={`${inputId}-label`}>
        {label}
      </p>
      <div className="flex items-center gap-3">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl border-[3px] text-center ${frame} ${
            hasPicture ? 'border-ink' : dragging ? 'border-dashed border-primary bg-primary/10' : 'border-dashed border-line bg-white'
          }`}
        >
          {hasPicture ? (
            <img
              src={src}
              alt={`Preview: ${label}`}
              className="absolute inset-0 size-full object-cover"
              onError={() => setBrokenSrc(src ?? null)}
            />
          ) : (
            <span className="px-1.5 text-xs font-bold leading-tight text-ink-soft">
              {showBroken ? 'Picture could not load' : dragging ? 'Drop it here' : 'No picture yet'}
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 grid place-items-center bg-white/80 text-xl font-bold" aria-hidden>
              …
            </span>
          )}
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <input
            ref={input}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="peer sr-only"
            aria-labelledby={`${inputId}-label ${inputId}-action`}
            disabled={busy}
            onChange={(e) => void handle(e.target.files?.[0])}
          />
          <label
            id={`${inputId}-action`}
            htmlFor={inputId}
            className={`btn btn-ghost !min-h-10 !px-4 peer-focus-visible:ring-4 peer-focus-visible:ring-primary/40 ${
              busy ? 'pointer-events-none opacity-60' : 'cursor-pointer'
            }`}
          >
            {value ? 'Replace picture' : 'Upload picture'}
          </label>
          {value && (
            <button
              type="button"
              className="text-sm font-bold text-ink-soft underline hover:text-primary disabled:opacity-60"
              disabled={busy}
              onClick={() => {
                onChange(null);
                setStatus({ kind: 'idle' });
              }}
            >
              Remove
            </button>
          )}
          <p className="text-xs text-ink-soft">JPEG, PNG or WebP. Shown cropped to fit. You can also drop a file on the box.</p>
        </div>
      </div>
      <p role="status" aria-live="polite" className={`min-h-5 text-sm font-bold ${problem ? 'text-[#a5311a]' : 'text-ink-soft'}`}>
        {busy ? status.text : (problem ?? '')}
      </p>
    </div>
  );
}
