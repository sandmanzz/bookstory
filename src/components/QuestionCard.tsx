import { useState } from 'react';
import type { Question } from '../api';
import type { Sound } from '../hooks/useSfx';
import { correctIndex, shouldHint } from '../lib/activity';
import { Mascot } from './ui';

interface Props {
  question: Question;
  /** Already answered earlier (the card is revisited): show it solved instead of asking again. */
  solved: boolean;
  onCorrect: () => void;
  play: (sound: Sound, variant?: number) => void;
}

/**
 * A question for a small child. Big picture answers, no timer, no score for mistakes: a wrong tap just shakes
 * and invites another try, and after a couple of misses the right answer glows.
 */
export function QuestionCard({ question, solved, onCorrect, play }: Props) {
  const [wrong, setWrong] = useState(0);
  const [lastWrong, setLastWrong] = useState<number | null>(null);
  const [done, setDone] = useState(solved);
  const answer = correctIndex(question);
  const hint = !done && shouldHint(wrong);

  function choose(index: number) {
    if (done) return;
    if (index === answer) {
      setDone(true);
      play('correct');
      onCorrect();
    } else {
      setWrong((n) => n + 1);
      setLastWrong(index);
      play('wrong');
    }
  }

  const message = done ? 'Yes! Great job!' : wrong > 0 ? 'Not quite. Try again!' : '';

  return (
    <section
      aria-labelledby="question-prompt"
      className="sticker mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-[1.5rem] p-3 sm:flex-row sm:items-center sm:p-4"
    >
      <div className="flex items-center gap-3 sm:w-[38%]">
        <Mascot className="size-12 shrink-0 sm:size-14" mood={done ? 'cheer' : 'happy'} />
        <div>
          <p id="question-prompt" className="font-display text-lg font-semibold leading-tight">
            {question.prompt}
          </p>
          <p role="status" aria-live="polite" className={`min-h-5 text-sm font-bold ${done ? 'text-mint' : 'text-ink-soft'}`}>
            {message}
          </p>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-3 gap-2">
        {question.choices.map((choice, i) => {
          const isAnswer = i === answer;
          const shaking = lastWrong === i && !done;
          const state =
            done && isAnswer
              ? 'border-mint bg-mint-soft'
              : hint && isAnswer
                ? 'animate-pulse border-sun bg-lock-soft'
                : 'border-ink bg-white';
          return (
            <button
              key={`${i}:${wrong}`}
              type="button"
              disabled={done && !isAnswer}
              onClick={() => choose(i)}
              className={`grid min-h-16 touch-manipulation place-items-center gap-0.5 rounded-2xl border-[3px] px-2 py-2 font-display text-sm font-semibold shadow-[0_3px_0_var(--color-ink)] transition active:translate-y-0.5 active:shadow-none disabled:opacity-40 ${state} ${shaking ? 'shake' : ''}`}
            >
              <span className="text-2xl leading-none sm:text-3xl" aria-hidden>
                {choice.emoji}
              </span>
              <span>{choice.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
