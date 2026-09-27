import { clsx } from "clsx";
import type { HabitAnswer } from "~/domain/habits";

/**
 * The three journal states, told apart by **shape**, in neutral ink only:
 *
 * - yes: a filled square
 * - no: a hollow square (a real, recorded answer)
 * - no answer: a small faint dot (nothing was recorded)
 *
 * No green/red, and no brand hue either. `answeredYes` is literal ("yes" to
 * "Experienced a headache?" records the symptom), so colouring yes as good
 * would be wrong for half the questions. Shape also survives colour-vision
 * differences and greyscale.
 *
 * A `mixed` day (two cycles that disagree) is drawn half filled.
 */
export function AnswerMark({
  answer,
  mixed = false,
  size = 14,
}: {
  answer: HabitAnswer | null;
  mixed?: boolean;
  size?: number;
}) {
  if (answer === null) {
    return (
      <span
        aria-hidden
        className="bg-ink-200/45 block size-[3px] rounded-full"
      />
    );
  }
  return (
    <span
      aria-hidden
      className={clsx(
        "block border-[1.5px]",
        answer === "yes" && !mixed
          ? "border-ink-50 bg-ink-50"
          : "border-ink-100 bg-transparent",
      )}
      style={{
        width: size,
        height: size,
        ...(mixed
          ? {
              background:
                "linear-gradient(135deg, var(--color-ink-50) 50%, transparent 50%)",
            }
          : undefined),
      }}
    />
  );
}

export function AnswerLegend({ className }: { className?: string }) {
  const item = "flex items-center gap-1.5";
  return (
    <div
      className={clsx(
        "text-ink-100 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] tracking-[.08em]",
        className,
      )}
    >
      <span className={item}>
        <AnswerMark answer="yes" size={11} /> YES
      </span>
      <span className={item}>
        <AnswerMark answer="no" size={11} /> NO
      </span>
      <span className={item}>
        <span className="flex size-[11px] items-center justify-center">
          <AnswerMark answer={null} />
        </span>
        NO ANSWER
      </span>
      <span className={item}>
        <AnswerMark answer="yes" mixed size={11} /> TWO CYCLES, MIXED
      </span>
      <span className={item}>
        <NoteTick static /> NOTE
      </span>
    </div>
  );
}

/** Corner tick for a day with a journal note. */
export function NoteTick({ static: inline = false }: { static?: boolean }) {
  return (
    <span
      aria-hidden
      className={clsx(
        "border-t-brand-text-dim block size-0 border-t-[6px] border-l-[6px] border-l-transparent",
        !inline && "absolute top-0 right-0",
      )}
    />
  );
}
