import type { Choice, PageActivity, Reaction, Sticker } from '../../api';

const REACTIONS: Reaction[] = ['hop', 'wiggle', 'grow', 'spin', 'float'];
const MAX_STICKERS = 4;
const MAX_CHOICES = 4;

const EMPTY_STICKER: Sticker = { emoji: '⭐', x: 50, y: 50, sound: '', reaction: 'hop' };
const EMPTY_CHOICES: Choice[] = [
  { emoji: '🙂', label: '', correct: true },
  { emoji: '🙃', label: '', correct: false },
];

interface Props {
  value: PageActivity | null;
  onChange: (next: PageActivity | null) => void;
  /** First validation message for this page's activity, if any. */
  error?: string;
}

const small = 'field !px-2 !py-1.5 text-sm';

/** Edits one page's interactive layer: up to 4 touchable stickers and one multiple-choice question. */
export function ActivityEditor({ value, onChange, error }: Props) {
  const activity: PageActivity = value ?? { stickers: [], question: null };
  const { stickers, question } = activity;
  const emit = (next: PageActivity) => onChange(next.stickers.length === 0 && !next.question ? null : next);

  const patchSticker = (i: number, patch: Partial<Sticker>) =>
    emit({ ...activity, stickers: stickers.map((s, n) => (n === i ? { ...s, ...patch } : s)) });
  const patchChoice = (i: number, patch: Partial<Choice>) =>
    question &&
    emit({ ...activity, question: { ...question, choices: question.choices.map((c, n) => (n === i ? { ...c, ...patch } : c)) } });
  const markCorrect = (i: number) =>
    question && emit({ ...activity, question: { ...question, choices: question.choices.map((c, n) => ({ ...c, correct: n === i })) } });

  const summary = [stickers.length > 0 && `${stickers.length} sticker${stickers.length > 1 ? 's' : ''}`, question && 'question']
    .filter(Boolean)
    .join(' + ');

  return (
    <details className="rounded-2xl border-[3px] border-line bg-cream/60 p-2" open={Boolean(error)}>
      <summary className="cursor-pointer select-none px-1 font-display font-semibold">
        ✨ Interactive{' '}
        {summary ? (
          <span className="text-sm font-medium text-ink-soft">({summary})</span>
        ) : (
          <span className="text-sm font-medium text-ink-soft">(none)</span>
        )}
      </summary>
      <div className="mt-3 space-y-4 px-1 pb-1">
        {error && <p className="text-sm font-bold text-[#a5311a]">{error}</p>}

        <fieldset className="space-y-2">
          <legend className="label">Stickers children can touch (emoji, position in %, sound word)</legend>
          {stickers.map((s, i) => (
            <div key={i} className="grid grid-cols-[3.5rem_4rem_4rem_1fr_5.5rem_auto] items-center gap-1.5">
              <input
                aria-label={`Sticker ${i + 1} emoji`}
                className={`${small} text-center text-lg`}
                value={s.emoji}
                onChange={(e) => patchSticker(i, { emoji: e.target.value })}
              />
              <input
                aria-label={`Sticker ${i + 1} x`}
                type="number"
                min={5}
                max={95}
                className={small}
                value={s.x}
                onChange={(e) => patchSticker(i, { x: Number(e.target.value) })}
              />
              <input
                aria-label={`Sticker ${i + 1} y`}
                type="number"
                min={5}
                max={95}
                className={small}
                value={s.y}
                onChange={(e) => patchSticker(i, { y: Number(e.target.value) })}
              />
              <input
                aria-label={`Sticker ${i + 1} sound`}
                className={small}
                placeholder="Sound, e.g. Quack!"
                value={s.sound}
                onChange={(e) => patchSticker(i, { sound: e.target.value })}
              />
              <select
                aria-label={`Sticker ${i + 1} reaction`}
                className={small}
                value={s.reaction}
                onChange={(e) => patchSticker(i, { reaction: e.target.value as Reaction })}
              >
                {REACTIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-ghost !min-h-9 !px-2.5 !py-0"
                aria-label={`Remove sticker ${i + 1}`}
                onClick={() => emit({ ...activity, stickers: stickers.filter((_, n) => n !== i) })}
              >
                ✕
              </button>
            </div>
          ))}
          {stickers.length < MAX_STICKERS && (
            <button
              type="button"
              className="btn btn-ghost !min-h-9 !px-3 !text-sm"
              onClick={() => emit({ ...activity, stickers: [...stickers, EMPTY_STICKER] })}
            >
              + Add sticker
            </button>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="label">Question</legend>
          {question ? (
            <>
              <input
                aria-label="Question prompt"
                className={small}
                placeholder="e.g. Who got lost in the waves?"
                value={question.prompt}
                onChange={(e) => emit({ ...activity, question: { ...question, prompt: e.target.value } })}
              />
              {question.choices.map((c, i) => (
                <div key={i} className="grid grid-cols-[3.5rem_1fr_auto_auto] items-center gap-1.5">
                  <input
                    aria-label={`Choice ${i + 1} emoji`}
                    className={`${small} text-center text-lg`}
                    value={c.emoji}
                    onChange={(e) => patchChoice(i, { emoji: e.target.value })}
                  />
                  <input
                    aria-label={`Choice ${i + 1} label`}
                    className={small}
                    placeholder="Answer"
                    value={c.label}
                    onChange={(e) => patchChoice(i, { label: e.target.value })}
                  />
                  <label className="flex items-center gap-1 text-sm font-bold">
                    <input type="radio" name="correct" checked={c.correct} onChange={() => markCorrect(i)} /> Correct
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost !min-h-9 !px-2.5 !py-0"
                    aria-label={`Remove choice ${i + 1}`}
                    disabled={question.choices.length <= 2}
                    onClick={() => emit({ ...activity, question: { ...question, choices: question.choices.filter((_, n) => n !== i) } })}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                {question.choices.length < MAX_CHOICES && (
                  <button
                    type="button"
                    className="btn btn-ghost !min-h-9 !px-3 !text-sm"
                    onClick={() =>
                      emit({
                        ...activity,
                        question: { ...question, choices: [...question.choices, { emoji: '🙂', label: '', correct: false }] },
                      })
                    }
                  >
                    + Add answer
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost !min-h-9 !px-3 !text-sm"
                  onClick={() => emit({ ...activity, question: null })}
                >
                  Remove question
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-ghost !min-h-9 !px-3 !text-sm"
              onClick={() => emit({ ...activity, question: { prompt: '', choices: EMPTY_CHOICES } })}
            >
              + Add question
            </button>
          )}
        </fieldset>
      </div>
    </details>
  );
}
