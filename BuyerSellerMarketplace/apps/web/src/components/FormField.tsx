'use client';

import { useId, useState } from 'react';

/**
 * Small form primitives shared by the role-application forms.
 * Mobile-first: inputs and controls stay at least 44px tall for touch.
 */

const inputBase =
  'w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm ' +
  'text-slate-900 outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/20';

export function Field({
  label,
  hint,
  required,
  error,
  group = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  /**
   * Set when the field holds several controls rather than one — a chip
   * multi-select, a row of toggles.
   *
   * A wrapping <label> with no `for` is associated with the first labelable
   * control inside it, and the accessible name it hands over is the label's
   * entire text content. With one input that is exactly right. With a set of
   * chips it is a disaster: the first chip ends up announced as the label plus
   * every other option's text ("Industries of interest Leave empty to see
   * everything. HealthTech Climate AI / ML …"), while its own text is lost.
   *
   * A labelled group has the same visual result and names each control by its
   * own text, so use it whenever `children` is not a single control.
   */
  group?: boolean;
  children: React.ReactNode;
}) {
  const id = useId();
  const caption = (
    <>
      <span id={id} className="text-sm font-semibold text-slate-800">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </span>
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </>
  );

  if (group) {
    return (
      <div role="group" aria-labelledby={id} className="grid gap-1.5">
        {caption}
        {children}
        {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <label className="grid gap-1.5">
      {caption}
      {children}
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputBase} />;
}

/**
 * A website field that accepts what people actually type.
 *
 * `example.com`, `www.example.com` and either scheme are all
 * meant to be accepted, and `normalizeWebsite` in packages/shared does exactly
 * that — but every one of these fields was still marked up `type="url"`, and
 * the browser rejects a bare domain before the form is ever submitted. So the
 * lenient validation was there and unreachable: somebody typing their own
 * domain into an application form was told it was invalid.
 *
 * `inputMode="url"` keeps the right keyboard on a phone without the constraint.
 * Validation stays with the zod schema, which is the only place it belongs.
 */
export function WebsiteInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      inputMode="url"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      placeholder="example.com"
      {...props}
      type="text"
      className={inputBase}
    />
  );
}

/**
 * A textarea that says how much room is left.
 *
 * Every long-form field on the platform is capped — by a zod `.max()`, and by a
 * `char_length` CHECK behind that — but none of them said so. Someone writing a
 * long bio found out at save time, from a database error, with no clue which
 * field was too long. The counter renders whenever `maxLength` is set, so the
 * cap is visible while it can still be acted on.
 *
 * Uncontrolled by default, because nearly every call site passes `defaultValue`
 * and reads the value back off the form. The count is therefore tracked here
 * and seeded from whichever of `value` / `defaultValue` the caller gave; a
 * caller's own `onChange` still runs.
 */
export function TextArea({
  maxLength,
  onChange,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [typed, setTyped] = useState(() => String(props.defaultValue ?? '').length);
  const used = props.value === undefined ? typed : String(props.value).length;

  const field = (
    <textarea
      {...props}
      maxLength={maxLength}
      onChange={(e) => {
        setTyped(e.target.value.length);
        onChange?.(e);
      }}
      className={`${inputBase} min-h-[120px] resize-y`}
    />
  );

  if (!maxLength) return field;

  const remaining = maxLength - used;
  return (
    <span className="grid gap-1">
      {field}
      <span
        // Announced politely rather than assertively: a screen reader reading
        // out a number after every keystroke would drown the typing.
        aria-live="polite"
        className={`justify-self-end text-xs tabular-nums ${
          remaining === 0
            ? 'font-semibold text-red-600'
            : remaining <= maxLength / 10
              ? 'font-semibold text-amber-700'
              : 'text-slate-500'
        }`}
      >
        {used.toLocaleString()} / {maxLength.toLocaleString()}
      </span>
    </span>
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputBase} />;
}

/** Multi-select rendered as a wrapping set of toggle chips. */
export function ChipMultiSelect<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: readonly T[];
  labels?: Record<T, string>;
  value: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const selected = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? value.filter((v) => v !== o) : [...value, o])}
            className={`min-h-[44px] rounded-full px-3.5 text-sm font-semibold transition ${
              selected
                ? 'bg-brand-dark text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {labels?.[o] ?? o}
          </button>
        );
      })}
    </div>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[44px] rounded-lg bg-brand-dark px-5 text-sm font-bold text-white disabled:opacity-50"
    >
      {pending ? 'Submitting…' : children}
    </button>
  );
}

/** Wrapper giving every application form the same page chrome. */
export function ApplyShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-2xl gap-6 px-4 py-8 sm:px-6">
      <header className="grid gap-2">
        <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">{title}</h1>
        <p className="text-sm text-slate-600">{intro}</p>
      </header>
      {children}
    </div>
  );
}
