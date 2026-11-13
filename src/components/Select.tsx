import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon } from './ui';

export type SelectOption<T extends string | number> = { value: T; label: string; hint?: string };

type Props<T extends string | number> = {
  id?: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  /** Needed when there is no <label htmlFor={id}> pointing at the trigger. */
  'aria-label'?: string;
  /** Classes for the trigger button. Defaults to the shared form-field look. */
  className?: string;
};

type Pos = { left: number; width: number; top?: number; bottom?: number; maxHeight: number };

const MENU_MAX = 256;
const GAP = 6;

/**
 * A custom, accessible replacement for the native <select> (WAI-ARIA select-only combobox).
 * Focus stays on the trigger; the list is a listbox rendered in a portal so dialogs and scroll
 * containers can't clip it. Keyboard: arrows, Home/End, Enter/Space, Escape, Tab, type-to-find.
 */
export function Select<T extends string | number>({ id, value, options, onChange, className = 'field', ...rest }: Props<T>) {
  const autoId = useId();
  const triggerId = id ?? `select-${autoId}`;
  const listId = `${triggerId}-list`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<Pos | null>(null);

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options.find((o) => o.value === value);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - GAP - 8;
    const above = r.top - GAP - 8;
    const flip = below < Math.min(MENU_MAX, 160) && above > below;
    const room = Math.max(120, Math.min(MENU_MAX, flip ? above : below));
    setPos(
      flip
        ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + GAP, maxHeight: room }
        : { left: r.left, width: r.width, top: r.bottom + GAP, maxHeight: room },
    );
  }, []);

  const openMenu = (index = selectedIndex) => {
    place();
    setActive(index);
    setOpen(true);
  };
  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);
  const choose = (i: number) => {
    const o = options[i];
    if (o) onChange(o.value);
    close();
  };

  // While open: follow the trigger on scroll/resize and close on an outside press.
  useEffect(() => {
    if (!open) return;
    const reposition = () => place();
    const outside = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !menuRef.current?.contains(t)) close(false);
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    document.addEventListener('pointerdown', outside);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open, place, close]);

  // Keep the highlighted option visible while arrowing through a long list.
  useEffect(() => {
    if (open) menuRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active, pos]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    // Stop here so e.g. a surrounding dialog does not also treat Escape as "close me".
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(last, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(last);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Tab') {
      close(false);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // type-to-find: "re" jumps to the first label starting with "re"
      const now = Date.now();
      const text = (now - typed.current.at > 700 ? '' : typed.current.text) + e.key.toLowerCase();
      typed.current = { text, at: now };
      const hit = options.findIndex((o) => o.label.toLowerCase().startsWith(text));
      if (hit >= 0) setActive(hit);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${triggerId}-opt-${active}` : undefined}
        aria-label={rest['aria-label']}
        className={`${className} flex cursor-pointer items-center justify-between gap-2 text-left`}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className="truncate">{selected?.label ?? ''}</span>
        <svg
          viewBox="0 0 24 24"
          className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open &&
        pos &&
        createPortal(
          <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={rest['aria-label']}
            className="pop fixed z-[80] overflow-auto rounded-2xl border-[3px] border-ink bg-paper p-1.5 shadow-[0_5px_0_var(--color-ink)]"
            style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
          >
            {options.map((o, i) => (
              <li
                key={o.value}
                id={`${triggerId}-opt-${i}`}
                role="option"
                aria-selected={o.value === value}
                // keep focus on the trigger so keyboard handling keeps working
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-base ${
                  i === active ? 'bg-sun/60' : ''
                } ${o.value === value ? 'font-bold' : ''}`}
              >
                <span className="grid size-4 shrink-0 place-items-center text-primary">{o.value === value && <CheckIcon />}</span>
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint && <span className="shrink-0 text-sm font-semibold text-ink-soft">{o.hint}</span>}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}
