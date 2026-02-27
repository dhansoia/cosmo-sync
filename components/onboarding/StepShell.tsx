/**
 * StepShell — reusable card wrapper for each onboarding step.
 *
 * Renders the step title, optional subtitle, a content slot, and
 * a back/next navigation row at the bottom.
 */

'use client';

interface StepShellProps {
  title:      string;
  subtitle?:  string;
  children:   React.ReactNode;
  /** Step index 0-based, total count */
  step:       number;
  totalSteps: number;
  onBack?:    () => void;
  onNext?:    () => void;
  /** Label for the forward button (default: "Next") */
  nextLabel?: string;
  /** Disable the next button */
  nextDisabled?: boolean;
  /** Show a spinner on the next button (submit state) */
  nextLoading?: boolean;
}

export function StepShell({
  title,
  subtitle,
  children,
  step,
  totalSteps,
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  nextLoading = false,
}: StepShellProps) {
  return (
    <div className="flex flex-col gap-6">

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={`block rounded-full transition-all duration-300 ${
              i === step
                ? 'w-6 h-1.5 bg-white'
                : i < step
                ? 'w-1.5 h-1.5 bg-white/40'
                : 'w-1.5 h-1.5 bg-white/15'
            }`}
          />
        ))}
      </div>

      {/* Heading */}
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
        {subtitle && (
          <p className="text-white/50 text-sm leading-relaxed">{subtitle}</p>
        )}
      </div>

      {/* Step content */}
      <div>{children}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className={`px-4 py-2 text-sm rounded-lg text-white/50 hover:text-white/80 transition-colors ${
            !onBack ? 'invisible' : ''
          }`}
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled || nextLoading}
          className="px-6 py-2.5 rounded-lg text-sm font-medium bg-white text-black
                     hover:bg-white/90 active:bg-white/80 transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed
                     flex items-center gap-2"
        >
          {nextLoading && (
            <span className="inline-block w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          )}
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
