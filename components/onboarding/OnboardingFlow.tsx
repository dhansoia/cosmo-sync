'use client';

/**
 * OnboardingFlow — 4-step wizard with Framer Motion slide transitions.
 *
 * Steps:
 *   0 — BirthDateStep
 *   1 — BirthTimeStep
 *   2 — BirthCityStep
 *   3 — ConfirmationStep
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BirthDateStep }     from './steps/BirthDateStep';
import { BirthTimeStep }     from './steps/BirthTimeStep';
import { BirthCityStep }     from './steps/BirthCityStep';
import { ConfirmationStep }  from './steps/ConfirmationStep';
import { INITIAL_FORM }      from './types';
import type { OnboardingFormState } from './types';

const TOTAL_STEPS = 4;

// Slide variants: direction > 0 means going forward, < 0 means going back
const variants = {
  enter:  (d: number) => ({ x: d > 0 ? '60%' : '-60%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? '-60%' : '60%', opacity: 0 }),
};

const transition = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };

export function OnboardingFlow() {
  const [step,      setStep]  = useState(0);
  const [direction, setDir]   = useState(1);
  const [form,      setForm]  = useState<OnboardingFormState>(INITIAL_FORM);

  function patch(partial: Partial<OnboardingFormState>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function goNext() {
    setDir(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function goBack() {
    setDir(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  const commonProps = { step, total: TOTAL_STEPS, form, onChange: patch };

  const stepEl = (() => {
    switch (step) {
      case 0: return <BirthDateStep    key="date" {...commonProps} onNext={goNext} />;
      case 1: return <BirthTimeStep    key="time" {...commonProps} onNext={goNext} onBack={goBack} />;
      case 2: return <BirthCityStep    key="city" {...commonProps} onNext={goNext} onBack={goBack} />;
      case 3: return <ConfirmationStep key="confirm" form={form} onBack={goBack} step={step} total={TOTAL_STEPS} />;
      default: return null;
    }
  })();

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Overflow hidden clips the sliding cards */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-sm p-8 shadow-2xl">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            {stepEl}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
